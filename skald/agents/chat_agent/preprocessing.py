import asyncio
from typing import Any, Dict, List, Optional

import voyageai

from skald.embeddings.vector_search import memo_chunk_vector_search
from skald.models.memo import Memo
from skald.models.project import Project
from skald.services.embedding_service import EmbeddingService
from skald.utils.filter_utils import MemoFilter, filter_queryset

DEFAULT_VOYAGE_RERANK_MODEL = "rerank-2.5"
VECTOR_SEARCH_TOP_K = 100
POST_RERANK_TOP_K = 50


def _chunk_vector_search(
    query: str, project: Project, filters: Optional[List[MemoFilter]] = None
) -> List[Dict[str, Any]]:
    from skald.models.memo import MemoSummary

    embedding_vector = EmbeddingService.generate_embedding(query, usage="search")
    chunk_results = memo_chunk_vector_search(
        project, embedding_vector, VECTOR_SEARCH_TOP_K, filters=filters
    )

    rerank_data = []
    for chunk_result in chunk_results:
        chunk = chunk_result["chunk"]
        memo = chunk.memo

        # Try to get summary, use fallback if it doesn't exist
        try:
            summary = memo.summary
        except MemoSummary.DoesNotExist:
            summary = "[Summary not yet generated]"

        rerank_snippet = f"Title: {memo.title}\n\nFull content summary: {summary}\n\nChunk content: {chunk.chunk_content}\n\n"
        rerank_data.append(rerank_snippet)

    # split into batches of 25 to ensure we're under the 32k token limit
    rerank_data_batches = [
        rerank_data[i : i + 25] for i in range(0, len(rerank_data), 25)
    ]

    vc = voyageai.Client()

    results = []
    for batch in rerank_data_batches:
        rerank_result = vc.rerank(
            query=query,
            documents=batch,
            model=DEFAULT_VOYAGE_RERANK_MODEL,
            top_k=min(100, len(batch)),
        )
        results.extend(rerank_result.results)

    return results


def prepare_context_for_chat_agent(
    query: str, project: Project, filters: Optional[List[MemoFilter]] = None
) -> List[Dict[str, Any]]:
    """
    Async version of prepare_context_for_chat_agent that processes rerank batches in parallel.

    Args:
        query: The search query
        project: The project to scope the search to

    Returns:
        List of reranked results
    """

    results = _chunk_vector_search(query, project, filters)

    # sort all results by relevance score
    results.sort(key=lambda x: x.relevance_score, reverse=True)

    return results[:POST_RERANK_TOP_K]
