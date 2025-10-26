import { runQuery } from '../db/db'
import { MemoChunk, MemoSummary } from '../db/models'

export interface MemoChunkWithDistance extends MemoChunk {
    distance: number
}

/**
 * Search for the most similar memo chunks in the knowledge base using cosine distance
 * @param embeddingVector - The embedding vector to search with
 * @param topK - The maximum number of results to return (default: 10)
 * @param similarityThreshold - The maximum cosine distance threshold (default: 0.5)
 * @returns Array of memo chunks with their cosine distances
 */
export interface MemoChunkSearchResult {
    title: string
    uuid: string
    chunk_index: number
    distance: number
}

export const memoChunkVectorSearch = async (
    embeddingVector: number[],
    topK: number = 10,
    similarityThreshold: number = 0.5
): Promise<MemoChunkWithDistance[]> => {
    const result = await runQuery<MemoChunkWithDistance>(
        `
    SELECT 
      uuid,
      memo_id,
      chunk_content,
      chunk_index,
      embedding,
      (embedding <=> $1::vector) as distance
    FROM skald_memochunk
    WHERE (embedding <=> $1::vector) <= $2
    ORDER BY distance
    LIMIT $3
  `,
        [JSON.stringify(embeddingVector), similarityThreshold, topK]
    )

    if (result.error) {
        throw new Error(result.error)
    }

    return result.rows || []
}

export const memoChunkVectorSearchWithMemoInfo = async (
    embeddingVector: number[],
    topK: number = 10,
    similarityThreshold: number = 0.5
): Promise<MemoChunkSearchResult[]> => {
    const result = await runQuery<MemoChunkSearchResult>(
        `
    SELECT 
      skald_memo.title,
      skald_memo.uuid,
      skald_memochunk.chunk_index,
      (skald_memochunk.embedding <=> $1::vector) as distance
    FROM skald_memochunk
    JOIN skald_memo ON skald_memochunk.memo_id = skald_memo.uuid
    WHERE (skald_memochunk.embedding <=> $1::vector) <= $2
    ORDER BY distance
    LIMIT $3
  `,
        [JSON.stringify(embeddingVector), similarityThreshold, topK]
    )

    if (result.error) {
        throw new Error(result.error)
    }

    return result.rows || []
}

export interface MemoSummarySearchResult {
    title: string
    uuid: string
    summary: string
    distance: number
}

/**
 * Search for the most similar memo summaries in the knowledge base using cosine distance
 * @param embeddingVector - The embedding vector to search with
 * @param topK - The maximum number of results to return (default: 10)
 * @param distanceThreshold - The maximum cosine distance threshold (default: 0.5). The lower the threshold, the more similar the results will be.
 * @returns Array of memo summaries with their cosine distances
 */
export const memoSummaryVectorSearchWithMemoInfo = async (
    embeddingVector: number[],
    topK: number = 10,
    distanceThreshold: number = 0.5
): Promise<MemoSummarySearchResult[]> => {
    const result = await runQuery<MemoSummarySearchResult>(
        `
    SELECT 
      skald_memo.title,
      skald_memo.uuid,
      skald_memosummary.summary,
      (skald_memosummary.embedding <=> $1::vector) as distance
    FROM skald_memosummary
    JOIN skald_memo ON skald_memosummary.memo_id = skald_memo.uuid
    WHERE (skald_memosummary.embedding <=> $1::vector) <= $2
    ORDER BY distance
    LIMIT $3
  `,
        [JSON.stringify(embeddingVector), distanceThreshold, topK]
    )

    if (result.error) {
        throw new Error(result.error)
    }

    return result.rows || []
}
