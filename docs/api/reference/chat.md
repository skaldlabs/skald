# Chat API Reference

The Chat API provides conversational AI capabilities powered by your memo content. The AI agent searches your knowledge base and generates contextual responses.

## Base URL

```
https://api.skald.ai
```

## Authentication

All requests require an API key provided in the `X-API-Key` header:

```bash
curl -H "X-API-Key: YOUR_API_KEY" https://api.skald.ai/v1/chat
```

---

## Endpoints

### POST /v1/chat

Send a query to the AI chat agent. Supports both streaming and non-streaming responses.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | The user's query or message |
| `stream` | boolean | No | Enable streaming responses via Server-Sent Events (default: false) |
| `filters` | array | No | Array of filters to apply when searching memos |
| `chat_id` | string | No | Chat ID to continue an existing conversation |
| `system_prompt` | string | No | Custom system prompt to guide AI behavior |

#### Example Request (Non-streaming)

```bash
curl -X POST https://api.skald.ai/v1/chat \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main benefits of our product?",
    "stream": false,
    "filters": []
  }'
```

#### Response (200 OK)

**Non-streaming response:**

```json
{
  "ok": true,
  "chat_id": "conversation-123",
  "response": "Based on your documentation, the main benefits include: 1) Advanced semantic search capabilities, 2) Easy integration with existing workflows, 3) Scalable architecture for enterprise use.",
  "intermediate_steps": []
}
```

**Streaming response (Server-Sent Events):**

When `stream: true`, the response is sent as Server-Sent Events:

```
: ping

data: {"content":"Based on"}

data: {"content":" your documentation"}

data: {"content":", the main benefits"}

data: {"content":" include:"}

data: {"type":"done","chat_id":"conversation-123"}
```

#### Response Fields (Non-streaming)

| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | Indicates successful response |
| `chat_id` | string | Unique identifier for this conversation |
| `response` | string | The AI's response to the query |
| `intermediate_steps` | array | Intermediate reasoning steps (usually empty) |

#### Response Events (Streaming)

| Event Type | Fields | Description |
|------------|--------|-------------|
| Content chunk | `content` | A piece of the response text |
| Completion | `type: "done"`, `chat_id` | Indicates stream finished |
| Error | `type: "error"`, `content` | Error occurred during streaming |

#### Example Request (Streaming)

```bash
curl -X POST https://api.skald.ai/v1/chat \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main benefits?",
    "stream": true
  }'
```

#### Example Request (With Chat History)

To continue a conversation, provide the `chat_id` from a previous response:

```bash
curl -X POST https://api.skald.ai/v1/chat \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Can you elaborate on the first benefit?",
    "chat_id": "conversation-123",
    "stream": false
  }'
```

#### Example Request (With Custom System Prompt)

```bash
curl -X POST https://api.skald.ai/v1/chat \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Summarize our product features",
    "system_prompt": "You are a helpful assistant that provides concise, bullet-point answers.",
    "stream": false
  }'
```

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
  "error": "Filters must be a list"
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

##### 503 Service Unavailable

Chat agent error:

```json
{
  "error": "Chat agent unavailable"
}
```

---

## Code Examples

### Node.js (Non-streaming)

```javascript
const axios = require('axios');

async function chat(query, chatId = null) {
  const response = await axios.post('https://api.skald.ai/v1/chat', {
    query,
    stream: false,
    filters: [],
    chat_id: chatId
  }, {
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

// Usage
chat('What are the main benefits?').then(result => {
  console.log(result.response);
  console.log('Chat ID:', result.chat_id);
});
```

### Node.js (Streaming)

```javascript
const fetch = require('node-fetch');

async function chatStream(query) {
  const response = await fetch('https://api.skald.ai/v1/chat', {
    method: 'POST',
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      stream: true
    })
  });

  const reader = response.body;

  reader.on('data', (chunk) => {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'done') {
          console.log('\nChat ID:', data.chat_id);
        } else if (data.content) {
          process.stdout.write(data.content);
        }
      }
    }
  });
}

// Usage
chatStream('Explain the product features');
```

### Python (Non-streaming)

```python
import requests

def chat(query, chat_id=None):
    response = requests.post(
        'https://api.skald.ai/v1/chat',
        json={
            'query': query,
            'stream': False,
            'filters': [],
            'chat_id': chat_id
        },
        headers={
            'X-API-Key': 'YOUR_API_KEY',
            'Content-Type': 'application/json'
        }
    )
    response.raise_for_status()
    return response.json()

# Usage
result = chat('What are the main benefits?')
print(result['response'])
print('Chat ID:', result['chat_id'])
```

### Python (Streaming)

```python
import requests
import json

def chat_stream(query):
    response = requests.post(
        'https://api.skald.ai/v1/chat',
        json={
            'query': query,
            'stream': True
        },
        headers={
            'X-API-Key': 'YOUR_API_KEY',
            'Content-Type': 'application/json'
        },
        stream=True
    )

    for line in response.iter_lines():
        if line:
            line = line.decode('utf-8')
            if line.startswith('data: '):
                data = json.loads(line[6:])
                if data.get('type') == 'done':
                    print(f"\nChat ID: {data['chat_id']}")
                elif 'content' in data:
                    print(data['content'], end='', flush=True)

# Usage
chat_stream('Explain the product features')
```

### curl (Non-streaming)

```bash
curl -X POST https://api.skald.ai/v1/chat \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main benefits?",
    "stream": false
  }'
```

### curl (Streaming)

```bash
curl -N -X POST https://api.skald.ai/v1/chat \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main benefits?",
    "stream": true
  }'
```

---

## Notes

- **Conversation History**: Pass the `chat_id` from previous responses to maintain conversation context. The system automatically manages conversation history.
- **Streaming**: Streaming responses are useful for providing real-time feedback to users. Use Server-Sent Events (SSE) to consume the stream.
- **Filters**: Apply the same filter syntax as the Search API to narrow the knowledge base used for responses.
- **System Prompts**: Custom system prompts allow you to control the AI's behavior, tone, and response format.
- **Context**: The chat agent automatically searches your memos and uses relevant content to generate responses.
