# Search API Reference

The Search API enables semantic search across your memos using vector embeddings. Instead of exact keyword matching, it finds content based on meaning and context.

## Base URL

```
https://api.skald.ai
```

## Authentication

All requests require an API key provided in the `X-API-Key` header:

```bash
curl -H "X-API-Key: YOUR_API_KEY" https://api.skald.ai/v1/search
```

---

## Endpoints

### POST /v1/search

Perform a semantic search across your memos.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | The search query text |
| `limit` | integer | No | Maximum number of results (1-50, default: 10) |
| `filters` | array | No | Array of filter objects to narrow results |

#### Example Request

```bash
curl -X POST https://api.skald.ai/v1/search \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the key features of our product?",
    "limit": 10,
    "filters": []
  }'
```

#### Response (200 OK)

```json
{
  "results": [
    {
      "memo_uuid": "550e8400-e29b-41d4-a716-446655440000",
      "chunk_uuid": "660e8400-e29b-41d4-a716-446655440000",
      "memo_title": "Product Features Documentation",
      "memo_summary": "Overview of key product features and capabilities",
      "content_snippet": "Our product offers advanced semantic search capabilities that enable users to find relevant...",
      "chunk_content": "The semantic search feature uses vector embeddings to find relevant content based on meaning rather than exact keyword matches.",
      "distance": 0.234
    }
  ]
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `results` | array | Array of search results |
| `results[].memo_uuid` | string | UUID of the memo |
| `results[].chunk_uuid` | string | UUID of the matched chunk |
| `results[].memo_title` | string | Title of the memo |
| `results[].memo_summary` | string | Summary of the memo |
| `results[].content_snippet` | string | First 100 characters of the memo content |
| `results[].chunk_content` | string | Full content of the matched chunk |
| `results[].distance` | number | Similarity score (lower is better) |

#### Error Responses

##### 400 Bad Request

Missing or invalid parameters:

```json
{
  "error": "Query is required"
}
```

```json
{
  "error": "Limit must be less than or equal to 50"
}
```

```json
{
  "error": "Invalid filter: <error details>"
}
```

##### 401 Unauthorized

Invalid or missing API key:

```json
{
  "error": "Unauthorized"
}
```

##### 404 Not Found

Project not found:

```json
{
  "error": "Project not found"
}
```

---

## Code Examples

### Node.js

```javascript
const axios = require('axios');

async function search(query, limit = 10) {
  const response = await axios.post('https://api.skald.ai/v1/search', {
    query,
    limit,
    filters: []
  }, {
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
      'Content-Type': 'application/json'
    }
  });

  return response.data.results;
}

// Usage
search('product features').then(results => {
  console.log(results);
});
```

### Python

```python
import requests

def search(query, limit=10):
    response = requests.post(
        'https://api.skald.ai/v1/search',
        json={
            'query': query,
            'limit': limit,
            'filters': []
        },
        headers={
            'X-API-Key': 'YOUR_API_KEY',
            'Content-Type': 'application/json'
        }
    )
    response.raise_for_status()
    return response.json()['results']

# Usage
results = search('product features')
print(results)
```

### curl

```bash
curl -X POST https://api.skald.ai/v1/search \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "product features",
    "limit": 10
  }'
```

---

## Notes

- The `distance` field indicates how similar the result is to your query. Lower values indicate better matches.
- Results are automatically ranked by relevance (distance score).
- The maximum allowed limit is 50 results per request.
- Filters can be used to narrow results based on memo properties like tags, metadata, or date ranges.
