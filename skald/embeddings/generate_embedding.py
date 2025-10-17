import voyageai

from skald.settings import VOYAGE_EMBEDDING_MODEL

EMBEDDING_VECTOR_DIMENSIONS = 2048

# Lazy initialization of client
_voyage_client = None


def _get_voyage_client():
    """Get or create the Voyage AI client instance."""
    global _voyage_client
    if _voyage_client is None:
        _voyage_client = voyageai.Client()
    return _voyage_client


def generate_vector_embedding_for_storage(content: str):
    client = _get_voyage_client()
    result = client.embed(
        [content],
        model=VOYAGE_EMBEDDING_MODEL,
        input_type="document",
        output_dimension=EMBEDDING_VECTOR_DIMENSIONS,
    )
    return result.embeddings[0]


def generate_vector_embedding_for_search(query: str):
    client = _get_voyage_client()
    result = client.embed(
        [query],
        model=VOYAGE_EMBEDDING_MODEL,
        input_type="query",
        output_dimension=EMBEDDING_VECTOR_DIMENSIONS,
    )
    return result.embeddings[0]
