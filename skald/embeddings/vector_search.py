from typing import TypedDict

from pgvector.django import CosineDistance

from skald.models.memo import MemoChunk, MemoSummary
from skald.models.project import Project


class MemoChunkWithDistance(TypedDict):
    chunk: MemoChunk
    distance: float


class MemoSummaryWithDistance(TypedDict):
    summary: MemoSummary
    distance: float


def memo_chunk_vector_search(
    project: Project,
    embedding_vector: list[float],
    top_k: int = 10,
    similarity_threshold: float = 0.9,
    tags: list[str] = None,
) -> list[MemoChunkWithDistance]:
    # search for the most similar memos in the knowledge base using the Memo model and the MemoChunk model
    query = (
        MemoChunk.objects.select_related("memo")
        .annotate(distance=CosineDistance("embedding", embedding_vector))
        .filter(distance__lte=similarity_threshold, project=project)
    )

    # Filter by tags if provided
    if tags is not None:
        query = query.filter(memo__memotag__tag__in=tags).distinct()

    memo_chunks = query.order_by("distance")[:top_k]

    return [{"chunk": chunk, "distance": chunk.distance} for chunk in memo_chunks]


def memo_summary_vector_search(
    project: Project,
    embedding_vector: list[float],
    top_k: int = 10,
    distance_threshold: float = 0.5,
    tags: list[str] = None,
) -> list[MemoSummaryWithDistance]:
    # search for the most similar memos in the knowledge base using the Memo model and the MemoSummary model
    query = (
        MemoSummary.objects.select_related("memo")
        .annotate(distance=CosineDistance("embedding", embedding_vector))
        .filter(distance__lte=distance_threshold, project=project)
    )

    # Filter by tags if provided
    if tags is not None:
        query = query.filter(memo__memotag__tag__in=tags).distinct()

    memo_summaries = query.order_by("distance")[:top_k]

    return [
        {"summary": summary, "distance": summary.distance} for summary in memo_summaries
    ]
