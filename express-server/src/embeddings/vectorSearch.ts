import { MemoChunk } from '../entities/MemoChunk'
import { DI } from '../index'

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

export const memoChunkVectorSearchWithMemoInfo = async (
    embeddingVector: number[],
    topK: number = 10,
    similarityThreshold: number = 0.5
): Promise<MemoChunkSearchResult[]> => {
    try {
        const result = await DI.em.getConnection().execute<MemoChunkSearchResult[]>(
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
        return result || []
    } catch (error) {
        throw new Error(error as string)
    }
}
