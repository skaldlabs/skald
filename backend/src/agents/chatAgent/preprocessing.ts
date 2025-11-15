import { Project } from '@/entities/Project'
import { MemoFilter } from '@/lib/filterUtils'
import { EmbeddingService } from '@/services/embeddingService'
import { RerankService } from '@/services/rerankService'
import { rewrite } from '@/agents/chatAgent/queryRewrite'
import { memoChunkVectorSearch } from '@/embeddings/vectorSearch'
import { VECTOR_SEARCH_TOP_K, POST_RERANK_TOP_K } from '@/settings'
import { getTitleAndSummaryAndContentForMemoList } from '@/queries/memo'
import { logger } from '@/lib/logger'

interface RerankResult {
    index: number
    document: string
    relevance_score: number
    memo_uuid?: string
    memo_title?: string
}

async function chunkVectorSearch(
    query: string,
    project: Project,
    filters?: MemoFilter[],
    conversationHistory: Array<[string, string]> = []
): Promise<RerankResult[]> {
    let processedQuery = query
    if (project.query_rewrite_enabled) {
        try {
            const conversationMessages = conversationHistory
                .map(([userMsg, assistantMsg]) => [
                    { role: 'user' as const, content: userMsg },
                    { role: 'assistant' as const, content: assistantMsg },
                ])
                .flat()

            const rewrittenQuery = await rewrite(query, conversationMessages)

            if (rewrittenQuery !== query) {
                processedQuery = rewrittenQuery
            }
        } catch (error) {
            logger.warn({ err: error, query }, 'Query rewriting failed, using original query')
        }
    }

    const embeddingVector = await EmbeddingService.generateEmbedding(processedQuery, 'search')
    const chunkResults = await memoChunkVectorSearch(project, embeddingVector, VECTOR_SEARCH_TOP_K, 0.95, filters)
    const relevantMemoUuids = Array.from(new Set(chunkResults.map((c) => c.chunk.memo_uuid)))

    const memoPropertiesMap = await getTitleAndSummaryAndContentForMemoList(project.uuid, relevantMemoUuids)

    const rerankData: string[] = []
    const rerankMetadata: Array<{ memo_uuid: string; memo_title: string }> = []

    for (const chunkResult of chunkResults) {
        const chunk = chunkResult.chunk

        const memo = memoPropertiesMap.get(chunk.memo_uuid)

        const rerankSnippet = `Title: ${memo?.title}\n\nFull content summary: ${memo?.summary}\n\nChunk content: ${chunk.chunk_content}\n\n`
        rerankData.push(rerankSnippet)
        rerankMetadata.push({ memo_uuid: chunk.memo_uuid, memo_title: memo?.title || '' })
    }

    // split into batches of 25 to ensure we're under token limits for the reranker
    // KLUDGE: this is hardcoded right now based on ~1k tokens per chunk and 32k token limit for the voyage reranker
    const rerankDataBatches: string[][] = []
    const rerankMetadataBatches: Array<Array<{ memo_uuid: string; memo_title: string }>> = []

    for (let i = 0; i < rerankData.length; i += 25) {
        rerankDataBatches.push(rerankData.slice(i, i + 25))
        rerankMetadataBatches.push(rerankMetadata.slice(i, i + 25))
    }

    // rerank all batches concurrently using the processed query
    const results = (
        await Promise.all(
            rerankDataBatches.map((batch, idx) =>
                RerankService.rerank(processedQuery, batch, rerankMetadataBatches[idx])
            )
        )
    ).flat()

    return results
}

export async function prepareContextForChatAgent(
    query: string,
    project: Project,
    filters?: MemoFilter[]
): Promise<RerankResult[]> {
    const results = await chunkVectorSearch(query, project, filters)

    return results.sort((a, b) => b.relevance_score - a.relevance_score).slice(0, POST_RERANK_TOP_K)
}
