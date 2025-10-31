import { EMBEDDING_PROVIDER, VOYAGE_API_KEY, OPENAI_API_KEY, OPENAI_MODEL, EMBEDDING_SERVICE_URL } from '@/settings'
import { VoyageAIClient } from 'voyageai'
import OpenAI from 'openai'

const VOYAGE_RERANK_MODEL = process.env.VOYAGE_RERANK_MODEL || 'rerank-2-lite'
const POST_RERANK_TOP_K = parseInt(process.env.POST_RERANK_TOP_K || '10')

const RERANK_PROMPT = `You are a strict reranking function.

INPUTS YOU WILL RECEIVE (JSON):
- "query": string
- "documents": array of strings (candidate documents)

TASK:
For each document, assign a relevance score in the closed interval [0.0, 1.0] indicating how relevant it is to the query.
Higher is more relevant. Consider semantic meaning, factual alignment with the query, and usefulness to answer the query.

RULES:
- Return a single JSON object with this EXACT schema:
  {
    "results": [
      {"index": <int, original index in input array>,
       "document": <string, the original document text verbatim>,
       "relevance_score": <float between 0.0 and 1.0> }
    ],
    "total_tokens": null
  }
- The "results" array MUST be sorted by "relevance_score" in descending order.
- Use only the keys shown above; DO NOT include any extra keys.
- "index" MUST map to the original position of the document in the input list.
- "document" MUST be returned verbatim (do not edit).
- "relevance_score" MUST be a float in [0.0, 1.0] (use up to 6 decimal places as needed).
- "total_tokens" must be set to null. (A calling wrapper will replace it with an actual integer.)
- Output ONLY valid JSON. No comments, no trailing text.`

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
}

export class RerankService {
    /**
     * Service for reranking results using various providers.
     */

    static async rerank(query: string, results: any[]): Promise<RerankResult[]> {
        if (EMBEDDING_PROVIDER === 'voyage') {
            return this.rerankVoyage(query, results)
        } else if (EMBEDDING_PROVIDER === 'openai') {
            return this.rerankOpenAI(query, results)
        } else if (EMBEDDING_PROVIDER === 'local') {
            // when EMBEDDING_PROVIDER=local, we use the so-called "local embedding service" to rerank the results
            // via its /rerank endpoint. this uses the sentence_transformers library and is meant for advanced usage
            // when those self-hosting don't want to send data to any third-party providers.
            return this.rerankLocal(query, results)
        }

        throw new Error(`Unsupported embedding provider: ${EMBEDDING_PROVIDER}`)
    }

    private static async rerankVoyage(query: string, results: any[]): Promise<RerankResult[]> {
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

            return {
                index,
                document: results[index],
                relevance_score: relevanceScore,
            }
        })
    }

    private static async rerankOpenAI(query: string, results: any[]): Promise<RerankResult[]> {
        const client = new OpenAI({ apiKey: OPENAI_API_KEY })

        const payload = { query, documents: results }
        const payloadJson = JSON.stringify(payload)

        const response = await client.chat.completions.create({
            model: OPENAI_MODEL,
            temperature: 0,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: RERANK_PROMPT },
                { role: 'user', content: `Here are the inputs as JSON:\n\n${payloadJson}` },
            ],
        })

        const content = response.choices[0]?.message?.content
        if (!content) {
            throw new Error('No response from OpenAI')
        }

        const rerankOutput: RerankOutput = JSON.parse(content)
        return this.normalizeRerankResults(rerankOutput, results)
    }

    private static async rerankLocal(query: string, results: any[]): Promise<RerankResult[]> {
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
        const parsedResults = data.results.map((result) => ({
            index: result.index,
            document: result.document,
            relevance_score: result.relevance_score,
        }))

        parsedResults.sort((a, b) => b.relevance_score - a.relevance_score)
        return parsedResults
    }

    private static normalizeRerankResults(rerankOutput: RerankOutput, originalResults: any[]): RerankResult[] {
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
            normalized.push({
                index: idx,
                document: originalResults[idx],
                relevance_score: parseFloat(score.toFixed(6)),
            })
        }

        normalized.sort((a, b) => b.relevance_score - a.relevance_score)

        if (POST_RERANK_TOP_K > 0) {
            return normalized.slice(0, POST_RERANK_TOP_K)
        }

        return normalized
    }
}
