import { Project } from '../../entities/Project'
import { MemoFilter } from '../../lib/filterUtils'
import { EmbeddingService } from '../../services/embeddingService'
import { RerankService } from '../../services/rerankService'
import { memoChunkVectorSearch } from '../../embeddings/vectorSearch'
import { VECTOR_SEARCH_TOP_K, POST_RERANK_TOP_K } from '../../settings'
import { DI } from '../../index'

interface RerankResult {
    index: number
    document: string
    relevance_score: number
}

async function chunkVectorSearch(query: string, project: Project, filters?: MemoFilter[]): Promise<string[]> {
    // Generate embedding for the query
    const embeddingVector = await EmbeddingService.generateEmbedding(query, 'search')

    // Perform vector search
    const chunkResults = await memoChunkVectorSearch(project, embeddingVector, VECTOR_SEARCH_TOP_K, 0.55, filters)

    // Build rerank data
    const rerankData: string[] = []
    for (const chunkResult of chunkResults) {
        const chunk = chunkResult.chunk
        const memoId = chunk.memo

        // Load the full memo
        const memo = await DI.em.getRepository('Memo').findOne({ uuid: memoId as any })

        if (!memo) {
            continue
        }

        // Try to get summary, use fallback if it doesn't exist
        let summary = '[Summary not yet generated]'
        try {
            const memoSummary = await DI.em.getRepository('MemoSummary').findOne({ memo: memoId as any })
            if (memoSummary) {
                summary = (memoSummary as any).summary
            }
        } catch (error) {
            // Summary doesn't exist, use default
        }

        const rerankSnippet = `Title: ${(memo as any).title}\n\nFull content summary: ${summary}\n\nChunk content: ${chunk.chunk_content}\n\n`
        rerankData.push(rerankSnippet)
    }

    // Split into batches of 25 to ensure we're under the 32k token limit
    const rerankDataBatches: string[][] = []
    for (let i = 0; i < rerankData.length; i += 25) {
        rerankDataBatches.push(rerankData.slice(i, i + 25))
    }

    // Rerank all batches
    const results: RerankResult[] = []
    for (const batch of rerankDataBatches) {
        const rerankResult = await RerankService.rerank(query, batch)
        results.push(...rerankResult)
    }

    return results.map((r) => r.document)
}

export async function prepareContextForChatAgent(
    query: string,
    project: Project,
    filters?: MemoFilter[]
): Promise<RerankResult[]> {
    const results = await chunkVectorSearch(query, project, filters)

    // Convert strings back to rerank results with scores
    const rerankResults: RerankResult[] = results.map((doc, index) => ({
        index,
        document: doc,
        relevance_score: 1.0 - index * 0.01, // Simple decreasing score
    }))

    // Sort by relevance score
    rerankResults.sort((a, b) => b.relevance_score - a.relevance_score)

    // Return top K
    return rerankResults.slice(0, POST_RERANK_TOP_K)
}
