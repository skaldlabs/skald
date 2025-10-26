from typing import List, Optional, TypedDict

from pgvector.django import CosineDistance

from skald.models.memo import MemoChunk, MemoSummary
from skald.models.project import Project
from skald.utils.filter_utils import MemoFilter, filter_queryset


class MemoChunkWithDistance(TypedDict):
    chunk: MemoChunk
    distance: float


def memo_chunk_vector_search(
    project: Project,
    embedding_vector: list[float],
    top_k: int = 10,
    similarity_threshold: float = 0.9,
    filters: Optional[List[MemoFilter]] = None,
) -> list[MemoChunkWithDistance]:
    # search for the most similar memos in the knowledge base using the Memo model and the MemoChunk model
    query = (
        MemoChunk.objects.select_related("memo")
        .annotate(distance=CosineDistance("embedding", embedding_vector))
        .filter(distance__lte=similarity_threshold, project=project)
    )

    if filters is not None:
        query = filter_queryset(query, filters)

    memo_chunks = query.order_by("distance")[:top_k]

    return [{"chunk": chunk, "distance": chunk.distance} for chunk in memo_chunks]
