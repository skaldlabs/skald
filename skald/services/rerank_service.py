from skald import settings


class RerankService:
    """Service for reranking results using various providers."""

    @staticmethod
    def rerank(query: str, results: list[dict]) -> list[dict]:
        embedding_provider = settings.EMBEDDING_PROVIDER

        if embedding_provider == "voyage":
            return RerankService._rerank_voyage(query, results)
        else:
            return RerankService._rerank_local(query, results)

    @staticmethod
    def _rerank_voyage(query: str, results: list[dict]) -> list[dict]:
        import voyageai

        client = voyageai.Client()
        result = client.rerank(
            query=query,
            documents=results,
            model=settings.VOYAGE_RERANK_MODEL,
            top_k=settings.POST_RERANK_TOP_K,
        )

        return result.results

    @staticmethod
    def _rerank_local(query: str, results: list[dict]) -> list[dict]:
        """Rerank results using local embedding provider"""
        return results
