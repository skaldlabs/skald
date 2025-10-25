import json
from types import SimpleNamespace
from typing import Optional

import numpy as np
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda
from pydantic import BaseModel, Field

from skald import settings
from skald.services.prompts import RERANK_PROMPT


class RerankService:
    """Service for reranking results using various providers."""

    @staticmethod
    def rerank(query: str, results: list[dict]) -> list[dict]:
        embedding_provider = settings.EMBEDDING_PROVIDER

        if embedding_provider == "voyage":
            return RerankService._rerank_voyage(query, results)
        elif embedding_provider == "openai":
            return RerankService._rerank_openai(query, results)
        elif embedding_provider == "local":
            # when EMBEDDING_PROVIDER=local, we use the so-called "local embedding service" to rerank the results
            # via its /rerank endpoint. this uses the sentence_transformers library and is meant for advanced usage
            # when those self-hosting don't want to send data to any third-party providers.
            return RerankService._rerank_local(query, results)

        raise ValueError(f"Unsupported embedding provider: {embedding_provider}")

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
    def _rerank_openai(query: str, results: list[dict]) -> list[dict]:
        chain = RerankService._build_openai_rerank_chain()
        payload = {"query": query, "documents": results}
        result_dict = chain.invoke({"payload": payload})

        return RerankService._normalize_rerank_results(
            RerankOutput(**result_dict), results
        )

    @staticmethod
    def _rerank_local(query: str, results: list[dict]) -> list[dict]:
        if not results:
            return []

        import requests

        response = requests.post(
            f"{settings.EMBEDDING_SERVICE_URL}/rerank",
            json={
                "query": query,
                "documents": results,
                "top_k": settings.POST_RERANK_TOP_K,
            },
            timeout=30,
        )

        if not response.ok:
            raise ValueError(
                f"Rerank service error: {response.status_code} - {response.text}"
            )

        parsed_results = []
        for result in response.json()["results"]:
            parsed_results.append(
                SimpleNamespace(
                    index=result["index"],
                    document=result["document"],
                    relevance_score=result["relevance_score"],
                )
            )
        parsed_results.sort(key=lambda r: r.relevance_score, reverse=True)

        return parsed_results

    @staticmethod
    def _build_openai_rerank_chain():
        """Builds the LLM chain for reranking with OpenAI."""
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(model=settings.OPENAI_MODEL, temperature=0)
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", RERANK_PROMPT),
                ("user", "Here are the inputs as JSON:\n\n{payload_json}"),
            ]
        )
        parser = JsonOutputParser(pydantic_object=RerankOutput)

        return (
            {
                "payload_json": RunnableLambda(
                    lambda x: json.dumps(
                        x["payload"],
                        ensure_ascii=False,
                        allow_nan=False,
                        separators=(",", ":"),
                    )
                )
            }
            | prompt
            | llm.bind(response_format={"type": "json_object"})
            | parser
        )

    @staticmethod
    def _normalize_rerank_results(
        rerank_output: "RerankOutput", original_results: list[dict]
    ) -> list[dict]:
        """Normalizes rerank output to consistent format with top-k filtering."""
        normalized = []

        for item in rerank_output.results:
            idx = int(item.index)
            if idx < 0 or idx >= len(original_results):
                continue

            score = float(max(0.0, min(1.0, item.relevance_score)))
            normalized.append(
                SimpleNamespace(
                    index=idx,
                    document=original_results[idx],
                    relevance_score=float(f"{score:.6f}"),
                )
            )

        normalized.sort(key=lambda r: r.relevance_score, reverse=True)

        if (
            isinstance(settings.POST_RERANK_TOP_K, int)
            and settings.POST_RERANK_TOP_K > 0
        ):
            normalized = normalized[: settings.POST_RERANK_TOP_K]

        return normalized


class RerankItem(BaseModel):
    index: int = Field(
        ..., description="Original index of the document in the input list"
    )
    document: str = Field(..., description="The original document text verbatim")
    relevance_score: float = Field(
        ..., ge=0.0, le=1.0, description="Relevance score in [0.0, 1.0]"
    )


class RerankOutput(BaseModel):
    results: list[RerankItem] = Field(default_factory=list, min_length=0)
