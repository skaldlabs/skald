import { EMBEDDING_PROVIDER, VOYAGE_API_KEY, EMBEDDING_SERVICE_URL } from '@/settings'
import { VoyageAIClient } from 'voyageai'
import { z } from 'zod'
import { LLMService } from '@/services/llmService'

const VOYAGE_RERANK_MODEL = process.env.VOYAGE_RERANK_MODEL || 'rerank-2-lite'
const POST_RERANK_TOP_K = parseInt(process.env.POST_RERANK_TOP_K || '10')

// Zod schema for rerank item
const RerankItemSchema = z.object({
    index: z.number().int().describe('Original index in input array'),
    document: z.string().describe('The original document text verbatim'),
    relevance_score: z.number().min(0.0).max(1.0).describe('Relevance score between 0.0 and 1.0'),
})

// Zod schema for rerank output
const RerankOutputSchema = z.object({
    results: z
        .array(RerankItemSchema)
        .describe('Array of reranked results sorted by relevance_score in descending order'),
})

const RERANK_PROMPT = `You are a strict reranking function.

INPUTS YOU WILL RECEIVE:
- "query": string
- "documents": array of strings (candidate documents)

TASK:
For each document, assign a relevance score in the closed interval [0.0, 1.0] indicating how relevant it is to the query.
Higher is more relevant. Consider semantic meaning, factual alignment with the query, and usefulness to answer the query.

RULES:
- The "results" array MUST be sorted by "relevance_score" in descending order.
- "index" MUST map to the original position of the document in the input list (0-indexed).
- "document" MUST be returned verbatim (do not edit).
- "relevance_score" MUST be a float in [0.0, 1.0] (use up to 2 decimal places as needed).`

interface RerankItem {
    index: number
    document: string
    relevance_score: number
}

interface RerankOutput {
    results: RerankItem[]
}

interface RerankResult {
    index: number
    document: any
    relevance_score: number
    memo_uuid?: string
    memo_title?: string
}

interface RerankMetadata {
    memo_uuid: string
    memo_title: string
}

const _buildOpenAIRerankPrompt = (query: string, results: any[]): string => {
    const documents = results
        .map((doc, idx) => `[${idx}] ${typeof doc === 'string' ? doc : JSON.stringify(doc)}`)
        .join('\n\n')

    return `${RERANK_PROMPT}\n\nQuery: ${query}\n\nDocuments:\n${documents}`
}

export class RerankService {
    /**
     * Service for reranking results using various providers.
     */

    static async rerank(query: string, results: any[], metadata?: RerankMetadata[]): Promise<RerankResult[]> {
        if (EMBEDDING_PROVIDER === 'voyage') {
            return this.rerankVoyage(query, results, metadata)
        } else if (EMBEDDING_PROVIDER === 'openai') {
            return this.rerankOpenAI(query, results, metadata)
        } else if (EMBEDDING_PROVIDER === 'local') {
            // when EMBEDDING_PROVIDER=local, we use the so-called "local embedding service" to rerank the results
            // via its /rerank endpoint. this uses the sentence_transformers library and is meant for advanced usage
            // when those self-hosting don't want to send data to any third-party providers.
            return this.rerankLocal(query, results, metadata)
        }

        throw new Error(`Unsupported embedding provider: ${EMBEDDING_PROVIDER}`)
    }

    private static async rerankVoyage(
        query: string,
        results: any[],
        metadata?: RerankMetadata[]
    ): Promise<RerankResult[]> {
        const client = new VoyageAIClient({ apiKey: VOYAGE_API_KEY })

        const result = await client.rerank({
            query,
            documents: results.map((r) => (typeof r === 'string' ? r : JSON.stringify(r))),
            model: VOYAGE_RERANK_MODEL,
            topK: POST_RERANK_TOP_K,
        })

        if (!result.data) {
            throw new Error('No data returned from Voyage rerank')
        }

        return result.data.map((item) => {
            const index = item.index
            const relevanceScore = item.relevanceScore

            if (index === undefined || relevanceScore === undefined) {
                throw new Error('Invalid rerank result from Voyage')
            }

            const rerankResult: RerankResult = {
                index,
                document: results[index],
                relevance_score: relevanceScore,
            }

            if (metadata && metadata[index]) {
                rerankResult.memo_uuid = metadata[index].memo_uuid
                rerankResult.memo_title = metadata[index].memo_title
            }

            return rerankResult
        })
    }

    private static async rerankOpenAI(
        query: string,
        results: any[],
        metadata?: RerankMetadata[]
    ): Promise<RerankResult[]> {
        const llm = LLMService.getLLM({ purpose: 'classification', providerOverride: 'openai' })
        const structuredLlm = llm.withStructuredOutput(RerankOutputSchema, {
            name: 'RerankAgent',
        })

        const prompt = _buildOpenAIRerankPrompt(query, results)

        const result = await structuredLlm.invoke(
            [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            {
                callbacks: [], // Disable LangSmith tracing
            }
        )

        const rerankOutput = result as z.infer<typeof RerankOutputSchema>
        return this.normalizeRerankResults(rerankOutput, results, metadata)
    }

    private static async rerankLocal(
        query: string,
        results: any[],
        metadata?: RerankMetadata[]
    ): Promise<RerankResult[]> {
        if (!results || results.length === 0) {
            return []
        }

        const response = await fetch(`${EMBEDDING_SERVICE_URL}/rerank`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                documents: results,
                top_k: POST_RERANK_TOP_K,
            }),
            signal: AbortSignal.timeout(30000),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Rerank service error: ${response.status} - ${errorText}`)
        }

        const data = (await response.json()) as { results: RerankResult[] }
        const parsedResults = data.results.map((result) => {
            const rerankResult: RerankResult = {
                index: result.index,
                document: result.document,
                relevance_score: result.relevance_score,
            }

            if (metadata && metadata[result.index]) {
                rerankResult.memo_uuid = metadata[result.index].memo_uuid
                rerankResult.memo_title = metadata[result.index].memo_title
            }

            return rerankResult
        })

        parsedResults.sort((a, b) => b.relevance_score - a.relevance_score)
        return parsedResults
    }

    private static normalizeRerankResults(
        rerankOutput: RerankOutput,
        originalResults: any[],
        metadata?: RerankMetadata[]
    ): RerankResult[] {
        /**
         * Normalizes rerank output to consistent format with top-k filtering.
         */
        const normalized: RerankResult[] = []

        for (const item of rerankOutput.results) {
            const idx = Math.floor(item.index)
            if (idx < 0 || idx >= originalResults.length) {
                continue
            }

            const score = Math.max(0.0, Math.min(1.0, item.relevance_score))
            const rerankResult: RerankResult = {
                index: idx,
                document: originalResults[idx],
                relevance_score: parseFloat(score.toFixed(6)),
            }

            if (metadata && metadata[idx]) {
                rerankResult.memo_uuid = metadata[idx].memo_uuid
                rerankResult.memo_title = metadata[idx].memo_title
            }

            normalized.push(rerankResult)
        }

        normalized.sort((a, b) => b.relevance_score - a.relevance_score)

        if (POST_RERANK_TOP_K > 0) {
            return normalized.slice(0, POST_RERANK_TOP_K)
        }

        return normalized
    }
}
