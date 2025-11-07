# Memo API Reference

The Memo API allows you to create, read, update, and delete memos (knowledge documents) in your Skald project. Memos are the core content that powers search and chat capabilities.

## Base URL

```
https://api.skald.ai
```

## Authentication

All requests require an API key provided in the `X-API-Key` header:

```bash
curl -H "X-API-Key: YOUR_API_KEY" https://api.skald.ai/v1/memos
```

---

## Endpoints

### GET /v1/memos

Retrieve a paginated list of memos in your project.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (1-indexed, default: 1) |
| `page_size` | integer | No | Items per page (1-100, default: 20) |

#### Example Request

```bash
curl -X GET "https://api.skald.ai/v1/memos?page=1&page_size=20" \
  -H "X-API-Key: YOUR_API_KEY"
```

#### Response (200 OK)

```json
{
  "results": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:35:00Z",
      "title": "Product Requirements Document",
      "summary": "This document outlines key product requirements including user authentication and data storage.",
      "content_length": 5420,
      "metadata": {
        "department": "Engineering"
      },
      "client_reference_id": "PRD-2024-001",
      "processing_status": "processed"
    }
  ],
  "count": 150,
  "page": 1,
  "page_size": 20,
  "total_pages": 8
}
```

---

### POST /v1/memos

Create a new memo with either plaintext content or a document file.

#### Content Types

- **Plaintext**: `application/json`
- **Document Upload**: `multipart/form-data`

#### Plaintext Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Title of the memo (1-255 chars) |
| `content` | string | Yes | Full text content |
| `source` | string | No | Source or origin (max 255 chars) |
| `reference_id` | string | No | Client reference ID (max 255 chars) |
| `expiration_date` | string | No | ISO 8601 date (must be future) |
| `tags` | array | No | Array of tag strings |
| `metadata` | object | No | Additional metadata key-value pairs |

#### Example Request (Plaintext)

```bash
curl -X POST https://api.skald.ai/v1/memos \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Product Requirements Document",
    "content": "This document outlines the key requirements for our new product...",
    "source": "Internal Documentation",
    "reference_id": "PRD-2024-001",
    "tags": ["product", "requirements"],
    "metadata": {
      "department": "Engineering",
      "priority": "high"
    }
  }'
```

#### Document Upload Request

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | Yes | Document file (PDF, DOC, DOCX, PPTX, max 100MB) |
| `title` | string | No | Title (defaults to filename) |
| `source` | string | No | Source or origin |
| `reference_id` | string | No | Client reference ID |
| `expiration_date` | string | No | ISO 8601 date |
| `tags` | string | No | JSON-encoded array of tags |
| `metadata` | string | No | JSON-encoded metadata object |

#### Example Request (Document Upload)

```bash
curl -X POST https://api.skald.ai/v1/memos \
  -H "X-API-Key: YOUR_API_KEY" \
  -F "file=@/path/to/document.pdf" \
  -F "title=Q4 Roadmap Presentation" \
  -F "source=Product Team" \
  -F "reference_id=ROADMAP-Q4-2024" \
  -F 'tags=["roadmap", "product"]' \
  -F 'metadata={"quarter":"Q4","year":"2024"}'
```

#### Response (201 Created)

```json
{
  "memo_uuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### GET /v1/memos/{id}

Retrieve detailed information about a specific memo.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Memo UUID or reference ID |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id_type` | string | No | `memo_uuid` or `reference_id` (default: `memo_uuid`) |

#### Example Request

```bash
curl -X GET "https://api.skald.ai/v1/memos/550e8400-e29b-41d4-a716-446655440000" \
  -H "X-API-Key: YOUR_API_KEY"
```

#### Example Request (Using Reference ID)

```bash
curl -X GET "https://api.skald.ai/v1/memos/PRD-2024-001?id_type=reference_id" \
  -H "X-API-Key: YOUR_API_KEY"
```

#### Response (200 OK)

```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:35:00Z",
  "title": "Product Requirements Document",
  "content": "This document outlines the key requirements...",
  "summary": "Overview of product requirements including authentication and storage.",
  "metadata": {
    "department": "Engineering"
  },
  "client_reference_id": "PRD-2024-001",
  "source": "Internal Documentation",
  "type": "plaintext",
  "expiration_date": "2025-12-31T23:59:59Z",
  "archived": false,
  "processing_status": "processed",
  "tags": [
    {
      "uuid": "660e8400-e29b-41d4-a716-446655440000",
      "tag": "product"
    },
    {
      "uuid": "770e8400-e29b-41d4-a716-446655440000",
      "tag": "requirements"
    }
  ],
  "chunks": [
    {
      "uuid": "880e8400-e29b-41d4-a716-446655440000",
      "chunk_content": "The authentication system must support OAuth 2.0...",
      "chunk_index": 0
    },
    {
      "uuid": "990e8400-e29b-41d4-a716-446655440000",
      "chunk_content": "Data storage requirements include PostgreSQL...",
      "chunk_index": 1
    }
  ]
}
```

---

### PATCH /v1/memos/{id}

Update specific fields of an existing memo.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Memo UUID or reference ID |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id_type` | string | No | `memo_uuid` or `reference_id` (default: `memo_uuid`) |

#### Request Body

All fields are optional. Only provided fields will be updated.

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Updated title (max 255 chars) |
| `content` | string | Updated content (triggers reprocessing) |
| `metadata` | object | Updated metadata |
| `client_reference_id` | string | Updated reference ID |
| `source` | string | Updated source |
| `expiration_date` | string | Updated expiration date (ISO 8601) |

#### Example Request

```bash
curl -X PATCH https://api.skald.ai/v1/memos/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Product Requirements",
    "metadata": {
      "department": "Engineering",
      "status": "updated"
    }
  }'
```

#### Response (200 OK)

```json
{
  "ok": true
}
```

---

### DELETE /v1/memos/{id}

Permanently delete a memo and all its related data.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Memo UUID or reference ID |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id_type` | string | No | `memo_uuid` or `reference_id` (default: `memo_uuid`) |

#### Example Request

```bash
curl -X DELETE https://api.skald.ai/v1/memos/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: YOUR_API_KEY"
```

#### Response (204 No Content)

No response body. Status 204 indicates successful deletion.

---

### GET /v1/memos/{id}/status

Check the processing status of a memo.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Memo UUID or reference ID |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id_type` | string | No | `memo_uuid` or `reference_id` (default: `memo_uuid`) |

#### Example Request

```bash
curl -X GET "https://api.skald.ai/v1/memos/550e8400-e29b-41d4-a716-446655440000/status" \
  -H "X-API-Key: YOUR_API_KEY"
```

#### Response (200 OK)

```json
{
  "memo_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processed",
  "processing_started_at": "2024-01-15T10:30:00Z",
  "processing_completed_at": "2024-01-15T10:35:00Z",
  "error_reason": null
}
```

#### Processing Statuses

| Status | Description |
|--------|-------------|
| `processing` | Memo is being processed (chunking, embedding, summarizing) |
| `processed` | Processing completed successfully |
| `error` | Processing failed (see `error_reason` for details) |

---

## Code Examples

### Node.js

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.skald.ai/v1',
  headers: {
    'X-API-Key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

// List memos
async function listMemos(page = 1, pageSize = 20) {
  const response = await client.get('/memos', {
    params: { page, page_size: pageSize }
  });
  return response.data;
}

// Create plaintext memo
async function createMemo(title, content, options = {}) {
  const response = await client.post('/memos', {
    title,
    content,
    ...options
  });
  return response.data.memo_uuid;
}

// Get memo by ID
async function getMemo(memoUuid) {
  const response = await client.get(`/memos/${memoUuid}`);
  return response.data;
}

// Update memo
async function updateMemo(memoUuid, updates) {
  const response = await client.patch(`/memos/${memoUuid}`, updates);
  return response.data;
}

// Delete memo
async function deleteMemo(memoUuid) {
  await client.delete(`/memos/${memoUuid}`);
}

// Check memo status
async function getMemoStatus(memoUuid) {
  const response = await client.get(`/memos/${memoUuid}/status`);
  return response.data;
}

// Usage examples
(async () => {
  // Create a new memo
  const memoUuid = await createMemo(
    'Product Requirements',
    'This document outlines...',
    {
      tags: ['product', 'requirements'],
      metadata: { department: 'Engineering' }
    }
  );
  console.log('Created memo:', memoUuid);

  // Check processing status
  const status = await getMemoStatus(memoUuid);
  console.log('Status:', status.status);

  // List all memos
  const memos = await listMemos();
  console.log('Total memos:', memos.count);
})();
```

### Python

```python
import requests

class SkaldMemoClient:
    def __init__(self, api_key):
        self.base_url = 'https://api.skald.ai/v1'
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }

    def list_memos(self, page=1, page_size=20):
        response = requests.get(
            f'{self.base_url}/memos',
            params={'page': page, 'page_size': page_size},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def create_memo(self, title, content, **options):
        response = requests.post(
            f'{self.base_url}/memos',
            json={'title': title, 'content': content, **options},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()['memo_uuid']

    def get_memo(self, memo_uuid):
        response = requests.get(
            f'{self.base_url}/memos/{memo_uuid}',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def update_memo(self, memo_uuid, **updates):
        response = requests.patch(
            f'{self.base_url}/memos/{memo_uuid}',
            json=updates,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def delete_memo(self, memo_uuid):
        response = requests.delete(
            f'{self.base_url}/memos/{memo_uuid}',
            headers=self.headers
        )
        response.raise_for_status()

    def get_memo_status(self, memo_uuid):
        response = requests.get(
            f'{self.base_url}/memos/{memo_uuid}/status',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Usage
client = SkaldMemoClient('YOUR_API_KEY')

# Create a memo
memo_uuid = client.create_memo(
    'Product Requirements',
    'This document outlines...',
    tags=['product', 'requirements'],
    metadata={'department': 'Engineering'}
)
print(f'Created memo: {memo_uuid}')

# Check status
status = client.get_memo_status(memo_uuid)
print(f'Status: {status["status"]}')

# List memos
memos = client.list_memos()
print(f'Total memos: {memos["count"]}')
```

---

## Notes

- **Processing**: After creation, memos are asynchronously processed (chunked, embedded, and summarized). Use the status endpoint to monitor progress.
- **Reference IDs**: Use `reference_id` to maintain your own identifier system alongside Skald's UUIDs.
- **Content Updates**: Updating a memo's content triggers reprocessing, which deletes existing chunks, embeddings, and summary.
- **Document Files**: Supported formats are PDF, DOC, DOCX, and PPTX (max 100MB). Documents require a DATALAB_API_KEY for processing.
- **Expiration**: Memos with expiration dates won't be included in search/chat results after the date passes.
- **Pagination**: When listing memos, use pagination to handle large result sets efficiently.
- **Metadata**: Store arbitrary key-value pairs in metadata for filtering and organization.
