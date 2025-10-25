import json
from types import SimpleNamespace
from typing import Optional

import numpy as np
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.pydantic_v1 import BaseModel, Field, confloat, conlist
from langchain_core.runnables import RunnableLambda

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
    def _rerank_openai(query: str, results: list[dict]) -> list[dict]:
        chain = RerankService._build_openai_rerank_chain()
        payload = {"query": query, "documents": results}
        result_dict = chain.invoke({"payload": payload})

        return RerankService._normalize_rerank_results(
            RerankOutput(**result_dict), results
        )

    @staticmethod
    def _rerank_local(query: str, results: list[dict]) -> list[dict]:
        from sentence_transformers import CrossEncoder

        if not results:
            return []

        if not hasattr(RerankService, "_local_rerank_model"):
            RerankService._local_rerank_model = CrossEncoder(
                "cross-encoder/ms-marco-MiniLM-L-6-v2"
            )

        model = RerankService._local_rerank_model

        def get_document_text(doc):
            if isinstance(doc, str):
                return doc
            if isinstance(doc, dict):
                for field in ["text", "content", "document", "page_content"]:
                    if field in doc:
                        return doc[field]
            return str(doc)

        pairs = [[query, get_document_text(doc)] for doc in results]

        scores = model.predict(pairs)

        normalized_scores = 1 / (1 + np.exp(-np.array(scores)))

        reranked = []
        for idx, (doc, score) in enumerate(zip(results, normalized_scores)):
            reranked.append(
                SimpleNamespace(
                    index=idx,
                    document=doc,
                    relevance_score=float(f"{score:.6f}"),
                )
            )

        reranked.sort(key=lambda r: r.relevance_score, reverse=True)

        if (
            isinstance(settings.POST_RERANK_TOP_K, int)
            and settings.POST_RERANK_TOP_K > 0
        ):
            reranked = reranked[: settings.POST_RERANK_TOP_K]

        return reranked

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
    relevance_score: confloat(ge=0.0, le=1.0) = Field(
        ..., description="Relevance score in [0.0, 1.0]"
    )


class RerankOutput(BaseModel):
    results: conlist(RerankItem, min_items=0)
    total_tokens: Optional[int] = None
