import asyncio
from typing import Any, Dict, List

import voyageai
from asgiref.sync import sync_to_async

from skald.embeddings.generate_embedding import generate_vector_embedding_for_search
from skald.embeddings.vector_search import memo_chunk_vector_search

DEFAULT_VOYAGE_RERANK_MODEL = "rerank-2.5"
VECTOR_SEARCH_TOP_K = 100
POST_RERANK_TOP_K = 50


async def _process_rerank_batch_async(
    vc: voyageai.Client, query: str, batch: List[str]
) -> List[Dict[str, Any]]:
    """
    Process a single rerank batch asynchronously.

    Args:
        vc: Voyage AI client instance
        query: The search query
        batch: List of documents to rerank

    Returns:
        List of reranked results for this batch
    """
    # Run the synchronous rerank call in a thread pool to avoid blocking
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: vc.rerank(
            query=query,
            documents=batch,
            model=DEFAULT_VOYAGE_RERANK_MODEL,
            top_k=min(100, len(batch)),
        ),
    )
    return result


def foo(query: str) -> List[Dict[str, Any]]:
    # Wrap synchronous database operations with sync_to_async
    from skald.models.memo import MemoSummary

    embedding_vector = generate_vector_embedding_for_search(query)
    chunk_results = memo_chunk_vector_search(embedding_vector, VECTOR_SEARCH_TOP_K)

    print("chunk_results", chunk_results)
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

    return rerank_data_batches


async def prepare_context_for_chat_agent_async(query: str) -> List[Dict[str, Any]]:
    """
    Async version of prepare_context_for_chat_agent that processes rerank batches in parallel.

    Args:
        query: The search query

    Returns:
        List of reranked results
    """

    rerank_data_batches = await sync_to_async(foo)(query)
    vc = voyageai.Client()

    print("rerank_data_batches", rerank_data_batches)

    # Process all batches in parallel using asyncio.gather
    batch_tasks = [
        _process_rerank_batch_async(vc, query, batch) for batch in rerank_data_batches
    ]

    # Wait for all batches to complete
    batch_results = await asyncio.gather(*batch_tasks)

    # Flatten the results from all batches
    reranked_results = []
    for batch_result in batch_results:
        reranked_results.extend(batch_result.results)

    # sort all results by relevance score
    reranked_results.sort(key=lambda x: x.relevance_score, reverse=True)

    return reranked_results[:POST_RERANK_TOP_K]


def prepare_context_for_chat_agent(query: str) -> List[Dict[str, Any]]:
    """
    Synchronous wrapper for the async prepare_context_for_chat_agent_async function.
    This maintains backward compatibility with existing code.

    Args:
        query: The search query

    Returns:
        List of reranked results
    """
    # Run the async function in a new event loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        reranked_results = loop.run_until_complete(
            prepare_context_for_chat_agent_async(query)
        )

        return reranked_results
    finally:
        loop.close()
