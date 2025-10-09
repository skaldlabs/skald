from skald.models.memo import MemoChunk, MemoSummary
from pgvector.django import CosineDistance
from typing import TypedDict



def memo_chunk_vector_search(
    embedding_vector: list[float], top_k: int = 10, similarity_threshold: float = 0.5
) -> list[MemoChunk]:
    # search for the most similar memos in the knowledge base using the Memo model and the MemoChunk model
    memo_chunks = (
        MemoChunk.objects.annotate(
            distance=CosineDistance("embedding", embedding_vector)
        )
        .filter(distance__lte=similarity_threshold)
        .order_by("distance")[:top_k]
    )
    
    return memo_chunks
    



def memo_summary_vector_search(
    embedding_vector: list[float], top_k: int = 10, similarity_threshold: float = 0.5
) -> list[MemoSummary]:
    # search for the most similar memos in the knowledge base using the Memo model and the MemoSummary model
    memo_summaries = (
        MemoSummary.objects.annotate(
            distance=CosineDistance("embedding", embedding_vector)
        )
        .filter(distance__lte=similarity_threshold)
        .order_by("distance")[:top_k]
    )
    return memo_summaries
    
