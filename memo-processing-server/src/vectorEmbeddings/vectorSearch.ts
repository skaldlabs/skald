import { runQuery } from "../db/db";
import { MemoChunk, MemoSummary } from "../db/models";

export interface MemoChunkWithDistance extends MemoChunk {
  distance: number;
}

export interface MemoSummaryWithDistance extends MemoSummary {
  distance: number;
}

/**
 * Search for the most similar memo chunks in the knowledge base using cosine distance
 * @param embeddingVector - The embedding vector to search with
 * @param topK - The maximum number of results to return (default: 10)
 * @param similarityThreshold - The maximum cosine distance threshold (default: 0.5)
 * @returns Array of memo chunks with their cosine distances
 */
export const memoChunkVectorSearch = async (
  embeddingVector: number[],
  topK: number = 10,
  similarityThreshold: number = 0.5
): Promise<MemoChunkWithDistance[]> => {
  const result = await runQuery<MemoChunkWithDistance>(`
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
  `, [JSON.stringify(embeddingVector), similarityThreshold, topK]);

  if (result.error) {
    throw new Error(result.error);
  }

  return result.rows || [];
};

/**
 * Search for the most similar memo summaries in the knowledge base using cosine distance
 * @param embeddingVector - The embedding vector to search with
 * @param topK - The maximum number of results to return (default: 10)
 * @param similarityThreshold - The maximum cosine distance threshold (default: 0.5)
 * @returns Array of memo summaries with their cosine distances
 */
export const memoSummaryVectorSearch = async (
  embeddingVector: number[],
  topK: number = 10,
  similarityThreshold: number = 0.5
): Promise<MemoSummaryWithDistance[]> => {
  const result = await runQuery<MemoSummaryWithDistance>(`
    SELECT 
      uuid,
      memo_id,
      summary,
      embedding,
      (embedding <=> $1::vector) as distance
    FROM skald_memosummary
    WHERE (embedding <=> $1::vector) <= $2
    ORDER BY distance
    LIMIT $3
  `, [JSON.stringify(embeddingVector), similarityThreshold, topK]);

  if (result.error) {
    throw new Error(result.error);
  }

  return result.rows || [];
};

