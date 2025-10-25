# Embedding Service

FastAPI microservice for generating embeddings and reranking documents using sentence-transformers.

## Features

- **Embedding Generation**: Generate text embeddings using SentenceTransformer models
- **Document Reranking**: Rerank documents based on relevance to a query using CrossEncoder models
- **Dimension Normalization**: Automatically normalize embeddings to a target dimension (default: 2048)

## Running the Service

### Using uv

```bash
cd embedding-service
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install fastapi uvicorn[standard] sentence-transformers pydantic
uvicorn main:app --host 0.0.0.0 --port 8000
```

Or using uv sync:

```bash
cd embedding-service
uv sync --no-install-project
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Using Docker

```bash
cd embedding-service
docker build -t embedding-service .
docker run -p 8000:8000 embedding-service
```

### Using Docker Compose

Add to your `docker-compose.yml`:

```yaml
embedding-service:
  build:
    context: ./embedding-service
  ports:
    - "8000:8000"
  environment:
    - EMBEDDING_MODEL=all-MiniLM-L6-v2
    - RERANK_MODEL=cross-encoder/ms-marco-MiniLM-L-6-v2
    - TARGET_DIMENSION=2048
```

## Configuration

Environment variables:

- `EMBEDDING_MODEL`: SentenceTransformer model name (default: `all-MiniLM-L6-v2`)
- `RERANK_MODEL`: CrossEncoder model name (default: `cross-encoder/ms-marco-MiniLM-L-6-v2`)
- `TARGET_DIMENSION`: Target embedding dimension for normalization (default: `2048`)

## API Endpoints

### Health Check

```
GET /health
```

Returns service health status.

### Generate Embeddings

```
POST /embed
```

Request body:
```json
{
  "content": "Text to embed",
  "normalize": true
}
```

Response:
```json
{
  "embedding": [0.1, 0.2, ...],
  "dimension": 2048
}
```

### Rerank Documents

```
POST /rerank
```

Request body:
```json
{
  "query": "search query",
  "documents": ["doc1", "doc2", "doc3"],
  "top_k": 10
}
```

Response:
```json
{
  "results": [
    {
      "index": 0,
      "text": "doc1",
      "relevance_score": 0.95
    },
    ...
  ]
}
```

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
