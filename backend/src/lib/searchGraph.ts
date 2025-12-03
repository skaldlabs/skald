import { Project } from '@/entities/Project'
import { MemoFilter } from '@/lib/filterUtils'
import { EmbeddingService } from '@/services/embeddingService'
import { memoChunkVectorSearch, MemoChunkWithDistance } from '@/embeddings/vectorSearch'
import { getTitleAndSummaryAndContentForMemoList } from '@/queries/memo'
import { StateGraph, END } from '@langchain/langgraph'
import { Annotation } from '@langchain/langgraph'
import { RerankService } from '@/services/rerankService'

export interface SearchResult {
    chunk_uuid: string
    memo_title: string
    memo_summary: string
    content_snippet: string
    chunk_content: string
    distance: number
}

interface RerankResult {
    index: number
    document: string
    relevance_score: number
    memo_uuid?: string
    memo_title?: string
}

const SearchGraphState = Annotation.Root({
    project: Annotation<Project>,
    query: Annotation<string>,
    limit: Annotation<number>,
    filters: Annotation<MemoFilter[]>,
    chunkResults: Annotation<MemoChunkWithDistance[] | null>,
    memoPropertiesMap: Annotation<Map<string, { title: string; summary: string; content: string }> | null>,
    rerankedResults: Annotation<RerankResult[]>,
    results: Annotation<SearchResult[]>,
})

async function vectorSearchNode(state: typeof SearchGraphState.State) {
    const { query, project, filters, limit } = state

    const embeddingVector = await EmbeddingService.generateEmbedding(query, 'search')
    const chunkResults = await memoChunkVectorSearch(project, embeddingVector, limit, 0.75, filters)

    return { chunkResults }
}

async function getMemoPropertiesNode(state: typeof SearchGraphState.State) {
    const { chunkResults, project } = state
    if (!chunkResults) {
        return { memoPropertiesMap: null }
    }

    const relevantMemoUuids = Array.from(new Set(chunkResults.map((c) => c.chunk.memo_uuid)))
    const memoPropertiesMap = await getTitleAndSummaryAndContentForMemoList(project.uuid, relevantMemoUuids)

    return { memoPropertiesMap }
}

async function rerankNode(state: typeof SearchGraphState.State) {
    const { chunkResults, memoPropertiesMap, query, limit } = state
    if (!chunkResults) {
        return { rerankedResults: [] }
    }

    const rerankData: string[] = []
    const rerankMetadata: Array<{ memo_uuid: string; memo_title: string }> = []

    for (const chunkResult of chunkResults) {
        const chunk = chunkResult.chunk

        let rerankSnippet = chunk.chunk_content
        if (memoPropertiesMap) {
            const memo = memoPropertiesMap.get(chunk.memo_uuid)
            rerankSnippet = `Title: ${memo?.title}\n\nFull content summary: ${memo?.summary}\n\nChunk content: ${chunk.chunk_content}\n\n`
        }

        rerankData.push(rerankSnippet)
        rerankMetadata.push({
            memo_uuid: chunk.memo_uuid,
            memo_title: memoPropertiesMap?.get(chunk.memo_uuid)?.title || '',
        })
    }

    // split into batches of 25 to ensure we're under token limits for the reranker
    const rerankDataBatches: string[][] = []
    const rerankMetadataBatches: Array<Array<{ memo_uuid: string; memo_title: string }>> = []

    for (let i = 0; i < rerankData.length; i += 25) {
        rerankDataBatches.push(rerankData.slice(i, i + 25))
        rerankMetadataBatches.push(rerankMetadata.slice(i, i + 25))
    }

    // rerank all batches concurrently, adjusting indices to be global
    const batchResults = await Promise.all(
        rerankDataBatches.map((batch, batchIdx) => RerankService.rerank(query, batch, rerankMetadataBatches[batchIdx]))
    )

    // Adjust indices to be global (batch-relative indices need to be offset by batch start)
    const results: RerankResult[] = []
    for (let batchIdx = 0; batchIdx < batchResults.length; batchIdx++) {
        const batchStart = batchIdx * 25
        for (const result of batchResults[batchIdx]) {
            results.push({
                ...result,
                index: batchStart + result.index,
            })
        }
    }

    // sort by relevance score
    results.sort((a, b) => b.relevance_score - a.relevance_score)
    return { rerankedResults: results.slice(0, limit) }
}

function buildResultsNode(state: typeof SearchGraphState.State) {
    const { chunkResults, memoPropertiesMap, rerankedResults } = state
    if (!chunkResults) {
        return { results: [] }
    }

    // Create a map from original index to chunk result for easy lookup
    const chunkMap = new Map<number, MemoChunkWithDistance>()
    chunkResults.forEach((chunk, idx) => {
        chunkMap.set(idx, chunk)
    })

    // Build results from reranked results, mapping back to original chunks
    const results: SearchResult[] = rerankedResults.map((reranked) => {
        const originalChunk = chunkMap.get(reranked.index)
        if (!originalChunk) {
            throw new Error(`Chunk at index ${reranked.index} not found`)
        }

        const memo = memoPropertiesMap?.get(originalChunk.chunk.memo_uuid)

        return {
            chunk_uuid: originalChunk.chunk.uuid,
            memo_title: memo?.title || '',
            memo_summary: memo?.summary || '',
            content_snippet: memo?.content.slice(0, 100) || '',
            chunk_content: originalChunk.chunk.chunk_content || '',
            // Convert relevance_score (0-1) to distance (lower is better, so invert)
            distance: 1 - reranked.relevance_score,
        }
    })

    return { results }
}

const searchGraphDefinition = new StateGraph(SearchGraphState)
    .addNode('vectorSearch', vectorSearchNode)
    .addNode('getMemoProperties', getMemoPropertiesNode)
    .addNode('rerank', rerankNode)
    .addNode('buildResults', buildResultsNode)
    .addEdge('__start__', 'vectorSearch')
    .addEdge('vectorSearch', 'getMemoProperties')
    .addEdge('getMemoProperties', 'rerank')
    .addEdge('rerank', 'buildResults')
    .addEdge('buildResults', END)

export const searchGraph = searchGraphDefinition.compile()
