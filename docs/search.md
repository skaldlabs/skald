# Search API Documentation

The Search API provides multiple search methods for finding memos in your knowledge base, including semantic vector search and traditional text-based search methods.

## Overview

The Search API consists of two main components:

1. **API Endpoint** (`search_api.py:32`) - Handles HTTP requests and routes to search methods
2. **Vector Search Engine** (`vector_search.py:18`) - Implements semantic similarity search using pgvector

## Endpoint

**URL:** `/api/search/`
**Method:** `POST`
**Authentication:** Project API Key (Bearer token)

### Request Format

```json
{
  "query": "Your search query here",
  "search_method": "chunk_vector_search",
  "limit": 10,
  "tags": ["tag1", "tag2"]  // Optional
}
```

### Parameters

- `query` (string, required): The search query text
- `search_method` (string, required): The search method to use (see below)
- `limit` (integer, optional): Maximum number of results to return. Defaults to 10, max 50
- `tags` (array of strings, optional): Filter results by tags

### Authentication

Include your project API key in the Authorization header:

```
Authorization: Bearer your_api_key_here
```

The API uses the `ProjectApiKeyPermissionMixin` (`permissions.py:141`) to validate the API key and retrieve the associated project.

## Search Methods

### 1. Vector-Based Search

#### `chunk_vector_search` (Recommended)

Performs semantic similarity search across memo content chunks using vector embeddings.

**How it works:**
1. Converts query to 2048-dimensional vector using Voyage AI (`generate_embedding.py:20`)
2. Searches all memo chunks using cosine distance similarity (`vector_search.py:18`)
3. Filters by similarity threshold (d 0.9 distance)
4. Returns top K most similar chunks with their parent memos

**Best for:**
- Finding specific content within larger documents
- Precise semantic matching
- Questions that require exact details

**Configuration:**
- Default similarity threshold: `0.9`
- Vector dimensions: `2048`
- Uses `input_type="query"` for embeddings

**Implementation:** `vector_search.py:18-42`

#### `summary_vector_search`

Performs semantic similarity search across memo summaries rather than full content.

**How it works:**
1. Converts query to vector embedding
2. Searches memo summaries using cosine distance similarity (`vector_search.py:45`)
3. Filters by distance threshold (d 0.5 distance)
4. Returns top K most similar memo summaries

**Best for:**
- Finding documents by overall topic or theme
- High-level content discovery
- When you want the most relevant documents, not specific passages

**Configuration:**
- Default distance threshold: `0.5` (more restrictive than chunk search)
- Searches at memo-level granularity

**Implementation:** `vector_search.py:45-71`

### 2. Text-Based Search

#### `title_contains`

Case-insensitive substring search on memo titles.

**How it works:**
- Django ORM filter: `title__icontains=query.lower()` (`search_api.py:152`)
- Returns memos where the title contains the query text

**Best for:**
- Finding memos by partial title match
- Quick lookups when you know part of the title

**Implementation:** `search_api.py:148-165`

#### `title_startswith`

Case-insensitive prefix search on memo titles.

**How it works:**
- Django ORM filter: `title__istartswith=query` (`search_api.py:132`)
- Returns memos where the title starts with the query text

**Best for:**
- Autocomplete functionality
- Hierarchical title structures (e.g., "Project: Subproject: Task")

**Implementation:** `search_api.py:128-145`

## Response Format

All search methods return the same response structure:

```json
{
  "results": [
    {
      "title": "Memo Title",
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "content_snippet": "First 100 characters of memo content...",
      "summary": "The memo's summary text",
      "distance": 0.234  // Only for vector searches, null for text searches
    }
  ]
}
```

### Response Fields

- `title` (string): The memo's title
- `uuid` (string): The memo's unique identifier
- `content_snippet` (string): First 100 characters of the memo content
- `summary` (string): The memo's AI-generated summary
- `distance` (float or null): Similarity distance (lower is more similar). Only present for vector searches

### Distance Interpretation

For vector searches, the `distance` value represents cosine distance:
- `0.0` = Identical vectors (perfect match)
- `0.1-0.3` = Highly relevant
- `0.3-0.5` = Moderately relevant
- `0.5-0.9` = Potentially relevant
- `>0.9` = Not similar (filtered out in chunk search)

## Filtering

### Tag Filtering

All search methods support tag filtering:

```json
{
  "query": "machine learning",
  "search_method": "chunk_vector_search",
  "tags": ["research", "ai"]
}
```

**Behavior:**
- Only returns memos that have at least one of the specified tags
- Uses Django's `memotag__tag__in=tags` filter
- Applies `.distinct()` to avoid duplicate results

**Implementation:** `vector_search.py:37-38` and `search_api.py:130-131`

## Embeddings

### Vector Generation

The system uses Voyage AI for generating embeddings:

**Model Configuration:**
- Model: Configured via `VOYAGE_EMBEDDING_MODEL` setting
- Dimensions: `2048`
- Provider: Voyage AI

**Two Types of Embeddings:**

1. **Document Embeddings** (`generate_embedding.py:11`)
   - `input_type="document"`
   - Used when storing memo content
   - Optimized for content representation

2. **Query Embeddings** (`generate_embedding.py:20`)
   - `input_type="query"`
   - Used for search queries
   - Optimized for search matching

**Why Different Input Types:**
Voyage AI's models are trained to handle documents and queries differently, improving semantic search accuracy.

## Performance Characteristics

### Vector Search

**Advantages:**
- Semantic understanding (finds conceptually similar content)
- Works with synonyms and related concepts
- No exact keyword match required

**Considerations:**
- Requires vector index (pgvector extension)
- More computationally intensive than text search
- Embedding generation adds latency (~100-200ms)

### Text Search

**Advantages:**
- Extremely fast (database index lookups)
- Predictable, deterministic results
- No external API dependencies

**Considerations:**
- No semantic understanding
- Requires knowing specific keywords
- Case-insensitive but requires substring match

## Error Handling

### Client Errors (400)

```json
{
  "error": "Query is required"
}
```

```json
{
  "error": "Search method is required and must be one of: title_contains, title_startswith, summary_vector_search, chunk_vector_search"
}
```

```json
{
  "error": "Limit must be less than or equal to 50"
}
```

## Example Usage

### cURL (Vector Search)

```bash
curl -X POST https://your-domain.com/api/search/ \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do neural networks learn?",
    "search_method": "chunk_vector_search",
    "limit": 5
  }'
```

### cURL (Text Search with Tags)

```bash
curl -X POST https://your-domain.com/api/search/ \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Meeting Notes",
    "search_method": "title_startswith",
    "limit": 20,
    "tags": ["meetings", "2024"]
  }'
```

### JavaScript (Fetch API)

```javascript
const response = await fetch('https://your-domain.com/api/search/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_api_key_here',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'machine learning algorithms',
    search_method: 'summary_vector_search',
    limit: 10
  })
});

const data = await response.json();
console.log(data.results);
```

### Python

```python
import requests

url = "https://your-domain.com/api/search/"
headers = {
    "Authorization": "Bearer your_api_key_here",
    "Content-Type": "application/json"
}
payload = {
    "query": "python debugging techniques",
    "search_method": "chunk_vector_search",
    "limit": 10,
    "tags": ["programming", "python"]
}

response = requests.post(url, json=payload, headers=headers)
results = response.json()["results"]

for result in results:
    print(f"{result['title']} (distance: {result['distance']})")
    print(f"  {result['content_snippet']}")
```

## Search Method Selection Guide

### Use `chunk_vector_search` when:
- You need to find specific information within documents
- The query uses natural language questions
- You want semantically similar content, not just keyword matches
- You need the most precise results

### Use `summary_vector_search` when:
- You want to find documents by overall topic
- You need document-level results (not specific passages)
- You want faster vector search (summaries are smaller)
- You're building a "related documents" feature

### Use `title_contains` when:
- You know part of the title
- You need instant results (no embedding generation)
- You want predictable, keyword-based matching
- Building a simple search bar

### Use `title_startswith` when:
- Building autocomplete functionality
- Working with hierarchical title structures
- You know how the title begins
- You want the fastest possible search

## Database Requirements

### PostgreSQL Extensions

The vector search functionality requires:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Indexes

Optimal performance requires vector indexes on:
- `MemoChunk.embedding` field
- `MemoSummary.embedding` field

### Vector Storage

- Embeddings are stored as `vector(2048)` PostgreSQL type
- Uses pgvector extension for efficient similarity search
- Cosine distance operator (`<=>`) for similarity calculations

## Dependencies

### Required Packages
- `pgvector` - PostgreSQL vector extension for Django
- `voyageai` - Voyage AI Python client
- `django` - Web framework
- `djangorestframework` - API framework

### Environment Variables
- `VOYAGE_API_KEY` - Required for embedding generation
- `VOYAGE_EMBEDDING_MODEL` - Model name for embeddings

## Security Considerations

1. **API Key Authentication** - All requests must include a valid project API key
2. **CSRF Exemption** - The endpoint is exempt from CSRF protection (API usage)
3. **Project Scoping** - All searches are automatically scoped to the authenticated project
4. **Rate Limiting** - Consider implementing rate limiting for production use (especially for vector search)
5. **Query Validation** - Limit parameter is capped at 50 to prevent resource exhaustion

## Related Files

- `skald/api/search_api.py` - Main search endpoint
- `skald/embeddings/vector_search.py` - Vector similarity search logic
- `skald/embeddings/generate_embedding.py` - Embedding generation
- `skald/models/memo.py` - Memo, MemoChunk, and MemoSummary models
- `skald/api/permissions.py` - Authentication
