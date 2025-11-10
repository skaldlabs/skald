import { Project } from '@/entities/Project'
import { MemoFilter } from '@/lib/filterUtils'
import { EmbeddingService } from '@/services/embeddingService'
import { RerankService } from '@/services/rerankService'
import { QueryRewriteService } from '@/services/queryRewriteService'
import { memoChunkVectorSearch } from '@/embeddings/vectorSearch'
import { VECTOR_SEARCH_TOP_K, POST_RERANK_TOP_K } from '@/settings'
import { getTitleAndSummaryAndContentForMemoList } from '@/queries/memo'
import { logger } from '@/lib/logger'

interface RerankResult {
    index: number
    document: string
    relevance_score: number
}

async function chunkVectorSearch(
    query: string,
    project: Project,
    filters?: MemoFilter[],
    conversationHistory: Array<[string, string]> = []
): Promise<string[]> {
    let processedQuery = query
    if (project.query_rewrite_enabled) {
        try {
            const conversationMessages = conversationHistory
                .map(([userMsg, assistantMsg]) => [
                    { role: 'user' as const, content: userMsg },
                    { role: 'assistant' as const, content: assistantMsg },
                ])
                .flat()

            const rewrittenQuery = await QueryRewriteService.rewrite(query, conversationMessages)

            if (rewrittenQuery !== query) {
                logger.info({ originalQuery: query, rewrittenQuery, projectId: project.uuid }, 'Query rewritten')
                processedQuery = rewrittenQuery
            }
        } catch (error) {
            logger.warn({ err: error, query, projectId: project.uuid }, 'Query rewriting failed, using original query')
        }
    }

    const embeddingVector = await EmbeddingService.generateEmbedding(processedQuery, 'search')
    const chunkResults = await memoChunkVectorSearch(project, embeddingVector, VECTOR_SEARCH_TOP_K, 0.95, filters)
    const relevantMemoUuids = Array.from(new Set(chunkResults.map((c) => c.chunk.memo_uuid)))

    const memoPropertiesMap = await getTitleAndSummaryAndContentForMemoList(project.uuid, relevantMemoUuids)

    const rerankData: string[] = []
    for (const chunkResult of chunkResults) {
        const chunk = chunkResult.chunk

        const memo = memoPropertiesMap.get(chunk.memo_uuid)

        const rerankSnippet = `Title: ${memo?.title}\n\nFull content summary: ${memo?.summary}\n\nChunk content: ${chunk.chunk_content}\n\n`
        rerankData.push(rerankSnippet)
    }

    // split into batches of 25 to ensure we're under token limits for the reranker
    // KLUDGE: this is hardcoded right now based on ~1k tokens per chunk and 32k token limit for the voyage reranker
    const rerankDataBatches: string[][] = []
    for (let i = 0; i < rerankData.length; i += 25) {
        rerankDataBatches.push(rerankData.slice(i, i + 25))
    }

    // rerank all batches concurrently using the processed query
    const results = (
        await Promise.all(rerankDataBatches.map((batch) => RerankService.rerank(processedQuery, batch)))
    ).flat()

    return results.map((r) => r.document)
}

export async function prepareContextForChatAgent(
    query: string,
    project: Project,
    filters?: MemoFilter[]
): Promise<RerankResult[]> {
    const results = await chunkVectorSearch(query, project, filters)

    // convert strings back to rerank results with scores
    const rerankResults: RerankResult[] = results.map((doc, index) => ({
        index,
        document: doc,
        relevance_score: 1.0 - index * 0.01, // Simple decreasing score
    }))

    // sort by relevance score
    rerankResults.sort((a, b) => b.relevance_score - a.relevance_score)

    // return top K
    return rerankResults.slice(0, POST_RERANK_TOP_K)
}
