import os
from typing import Literal

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import CrossEncoder, SentenceTransformer

app = FastAPI(title="Embedding Service", version="1.0.0")

# Configuration
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
RERANK_MODEL = os.getenv("RERANK_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
TARGET_DIMENSION = int(os.getenv("TARGET_DIMENSION", "2048"))

# Initialize models lazily
embedding_model = SentenceTransformer(EMBEDDING_MODEL)
rerank_model = CrossEncoder(RERANK_MODEL)


print(f"Using embedding model: {EMBEDDING_MODEL}")
print(f"Using rerank model: {RERANK_MODEL}")
print(f"Using target dimension: {TARGET_DIMENSION}")

def normalize_embedding(embedding: list[float]) -> list[float]:
    """Pad or validate embedding to match TARGET_DIMENSION"""
    current_dim = len(embedding)

    if current_dim == TARGET_DIMENSION:
        return embedding
    elif current_dim < TARGET_DIMENSION:
        # Pad with zeros
        return embedding + [0.0] * (TARGET_DIMENSION - current_dim)
    else:
        # Vector too large - not supported
        raise ValueError(
            f"Embedding dimension {current_dim} exceeds maximum supported dimension {TARGET_DIMENSION}"
        )


# Request/Response Models
class EmbedRequest(BaseModel):
    content: str = Field(..., description="Text content to embed")
    normalize: bool = Field(
        default=True, description="Whether to normalize to target dimension"
    )


class EmbedResponse(BaseModel):
    embedding: list[float] = Field(..., description="The generated embedding vector")
    dimension: int = Field(..., description="Dimension of the embedding vector")


class RerankDocument(BaseModel):
    text: str = Field(..., description="Document text to rerank")
    index: int = Field(
        ..., description="Original index of the document in the input list"
    )


class RerankRequest(BaseModel):
    query: str = Field(..., description="The search query")
    documents: list[str] = Field(..., description="List of documents to rerank")
    top_k: int = Field(default=None, description="Number of top results to return")


class RerankResult(BaseModel):
    index: int = Field(..., description="Original index of the document")
    document: str = Field(..., description="Document text")
    relevance_score: float = Field(..., description="Relevance score for the document")


class RerankResponse(BaseModel):
    results: list[RerankResult] = Field(
        ..., description="Reranked documents with scores"
    )


# Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.post("/embed", response_model=EmbedResponse)
async def embed(request: EmbedRequest):
    """
    Generate embeddings for the provided text content using sentence transformers.

    Args:
        request: EmbedRequest containing the text content and normalization preference

    Returns:
        EmbedResponse with the embedding vector and its dimension
    """
    try:
        model = get_embedding_model()
        embedding = model.encode(request.content).tolist()

        if request.normalize:
            embedding = normalize_embedding(embedding)

        return EmbedResponse(embedding=embedding, dimension=len(embedding))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Embedding generation failed: {str(e)}"
        )


@app.post("/rerank", response_model=RerankResponse)
async def rerank(request: RerankRequest):
    """
    Rerank documents based on their relevance to the query using a cross-encoder model.

    Args:
        request: RerankRequest containing the query and documents to rerank

    Returns:
        RerankResponse with reranked documents sorted by relevance score
    """
    try:
        if not request.documents:
            return RerankResponse(results=[])

        model = get_rerank_model()

        def get_document_text(doc):
            if isinstance(doc, str):
                return doc
            if isinstance(doc, dict):
                for field in ["text", "content", "document", "page_content"]:
                    if field in doc:
                        return doc[field]
            return str(doc)

        pairs = [[request.query, get_document_text(doc)] for doc in request.documents]

        scores = model.predict(pairs)

        normalized_scores = 1 / (1 + np.exp(-np.array(scores)))

        reranked = []
        for idx, (doc, score) in enumerate(zip(request.documents, normalized_scores)):
            reranked.append(
                RerankResult(
                    index=idx,
                    document=get_document_text(doc),
                    relevance_score=float(f"{score:.6f}"),
                )
            )

        reranked.sort(key=lambda r: r.relevance_score, reverse=True)

        if isinstance(request.top_k, int) and request.top_k > 0:
            reranked = reranked[: request.top_k]

        return RerankResponse(results=reranked)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reranking failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
