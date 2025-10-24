from typing import Literal

from django.conf import settings


class EmbeddingService:
    """
    Service for generating embeddings using various providers.
    Ensures all embeddings are normalized to 2048 dimensions.
    """

    TARGET_DIMENSION = settings.EMBEDDING_VECTOR_DIMENSIONS

    @staticmethod
    def _normalize_embedding(embedding: list[float]) -> list[float]:
        """Pad or validate embedding to match TARGET_DIMENSION"""
        current_dim = len(embedding)

        if current_dim == EmbeddingService.TARGET_DIMENSION:
            return embedding
        elif current_dim < EmbeddingService.TARGET_DIMENSION:
            # Pad with zeros
            return embedding + [0.0] * (EmbeddingService.TARGET_DIMENSION - current_dim)
        else:
            # Vector too large - not supported
            raise ValueError(
                f"Embedding dimension {current_dim} exceeds maximum supported dimension {EmbeddingService.TARGET_DIMENSION}"
            )

    @staticmethod
    def _generate_voyage_embedding(
        content: str, input_type: Literal["document", "query"]
    ) -> list[float]:
        """Generate embedding using Voyage AI"""
        import voyageai

        client = voyageai.Client(api_key=settings.VOYAGE_API_KEY)
        result = client.embed(
            [content],
            model=settings.VOYAGE_EMBEDDING_MODEL,
            input_type=input_type,
            output_dimension=EmbeddingService.TARGET_DIMENSION,
        )
        return result.embeddings[0]

    @staticmethod
    def _generate_openai_embedding(content: str) -> list[float]:
        """Generate embedding using OpenAI"""
        from openai import OpenAI

        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        response = client.embeddings.create(
            input=content,
            model=settings.OPENAI_EMBEDDING_MODEL,
            dimensions=EmbeddingService.TARGET_DIMENSION,
        )
        return response.data[0].embedding

    @staticmethod
    def generate_embedding(
        query: str, usage: Literal["storage", "search"]
    ) -> list[float]:
        """Generate embedding for either storage or search

        Args:
            query: The query to generate an embedding for
            usage: The usage of the embedding, either "storage" or "search". Used to determine the input type for the Voyage AI embedding.

        Returns:
            The embedding as a list of floats
        """
        provider = settings.EMBEDDING_PROVIDER

        if provider == "voyage":
            input_type = "query" if usage == "search" else "document"
            embedding = EmbeddingService._generate_voyage_embedding(
                query, input_type=input_type
            )
        elif provider == "openai":
            embedding = EmbeddingService._generate_openai_embedding(query)
        else:
            raise ValueError(f"Unsupported embedding provider: {provider}")

        return EmbeddingService._normalize_embedding(embedding)
