import voyageai

from skald.settings import VOYAGE_EMBEDDING_MODEL


EMBEDDING_VECTOR_DIMENSIONS = 2048

# uses VOYAGE_API_KEY environment variable
voyage_client = voyageai.Client()

def generate_vector_embedding_for_storage(content: str):
    result = voyage_client.embed(
        [content],
        model=VOYAGE_EMBEDDING_MODEL,
        input_type="document",
        output_dimension=EMBEDDING_VECTOR_DIMENSIONS,
    )
    return result.embeddings[0]

def generate_vector_embedding_for_search(query: str):
    result = voyage_client.embed(
        [query],
        model=VOYAGE_EMBEDDING_MODEL,
        input_type="query",
        output_dimension=EMBEDDING_VECTOR_DIMENSIONS,
        
    )
    return result.embeddings[0]