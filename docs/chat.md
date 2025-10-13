# Chat API Documentation

The Chat API provides an intelligent question-answering system that searches through your project's knowledge base and generates contextual responses using a LangChain-powered agent.

## Overview

The Chat API consists of three main components:

1. **API Endpoint** (`chat_api.py:17`) - Handles HTTP requests and authentication
2. **Context Preparation** (`preprocessing.py:113`) - Retrieves and reranks relevant content
3. **Chat Agent** (`chat_agent.py:70`) - Generates responses using GPT-4o-mini

## Endpoint

**URL:** `/api/chat/`
**Method:** `POST`
**Authentication:** Project API Key (Bearer token)

### Request Format

```json
{
  "query": "Your question here",
  "stream": false  // Optional, defaults to false
}
```

### Parameters

- `query` (string, required): The user's question or message
- `stream` (boolean, optional): Enable Server-Sent Events streaming. Defaults to `false`

### Authentication

Include your project API key in the Authorization header:

```
Authorization: Bearer your_api_key_here
```

The API uses the `ProjectApiKeyPermissionMixin` (`permissions.py:141`) to validate the API key and retrieve the associated project.

## Response Formats

### Non-Streaming Response

When `stream` is `false` or omitted, the API returns a standard JSON response:

```json
{
  "ok": true,
  "response": "The agent's answer to your question with citations like [[1]][[2]]",
  "intermediate_steps": []
}
```

**Fields:**
- `ok` (boolean): Indicates successful completion
- `response` (string): The generated answer with inline citations
- `intermediate_steps` (array): LangChain agent execution steps (currently empty as no tools are used)

### Streaming Response

When `stream` is `true`, the API returns Server-Sent Events (SSE):

**Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
X-Accel-Buffering: no
```

**Event Format:**
```
: ping

data: {"type": "token", "content": "The"}

data: {"type": "token", "content": " answer"}

data: {"type": "done"}
```

**Event Types:**
- Initial ping event (`: ping`) establishes the connection
- `type: "token"` - Streaming content chunks
- `type: "output"` - Final complete output
- `type: "error"` - Error information
- `type: "done"` - Signals completion

## How It Works

### 1. Context Retrieval Pipeline

The `prepare_context_for_chat_agent` function (`preprocessing.py:113`) executes a sophisticated retrieval pipeline:

#### Step 1: Vector Search (`preprocessing.py:48`)
- Generates an embedding vector from the query
- Performs semantic search across memo chunks
- Returns top 100 most similar chunks

#### Step 2: Context Enrichment (`preprocessing.py:54-65`)
- For each chunk, constructs a rich context snippet:
  ```
  Title: [memo title]

  Full content summary: [memo summary]

  Chunk content: [actual chunk text]
  ```

#### Step 3: Reranking (`preprocessing.py:68-110`)
- Splits results into batches of 25 (to stay under token limits)
- Uses Voyage AI's `rerank-2.5` model to rerank all batches in parallel
- Sorts combined results by relevance score
- Returns top 50 most relevant chunks

**Key Constants:**
- `VECTOR_SEARCH_TOP_K = 100` - Initial retrieval size
- `POST_RERANK_TOP_K = 50` - Final context size
- Batch size: 25 chunks per rerank call

### 2. Agent Execution

The `run_chat_agent` or `stream_chat_agent` function (`chat_agent.py:70-173`) processes the query:

#### Agent Configuration
- **Model:** GPT-4o-mini
- **Temperature:** 0 (deterministic responses)
- **Tools:** None (currently no tool calling)
- **Prompt:** Specialized QA system prompt (`prompts.py:1`)

#### Agent Behavior
The agent is instructed to:
1. Answer questions using ONLY the provided context
2. Cite sources inline using `[[result_number]]` format
3. Prefer concise, well-structured answers
4. Provide partial answers if full information isn't available
5. Use proper markdown formatting

#### Streaming Implementation
- Uses `AsyncStreamingCallbackHandler` for token-by-token streaming
- Runs agent asynchronously while yielding events
- Handles errors gracefully with error events

## Error Handling

### Client Errors (400)
```json
{
  "error": "Query is required"
}
```

### Server Errors (500)
```json
{
  "error": "Agent error: [error message]"
}
```

### Streaming Errors
When streaming, errors are sent as SSE events:
```
data: {"type": "error", "content": "Error message with traceback"}
```

## CORS Support

The API includes CORS headers for cross-origin requests:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

The `OPTIONS` method handles CORS preflight requests (`chat_api.py:22-28`).

## Example Usage

### cURL (Non-streaming)
```bash
curl -X POST https://your-domain.com/api/chat/ \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main features of this project?"
  }'
```

### cURL (Streaming)
```bash
curl -X POST https://your-domain.com/api/chat/ \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main features of this project?",
    "stream": true
  }'
```

### JavaScript (Fetch API)
```javascript
// Non-streaming
const response = await fetch('https://your-domain.com/api/chat/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_api_key_here',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'What are the main features of this project?'
  })
});

const data = await response.json();
console.log(data.response);
```

### JavaScript (EventSource for Streaming)
```javascript
// Streaming with EventSource
const eventSource = new EventSource(
  'https://your-domain.com/api/chat/',
  {
    headers: {
      'Authorization': 'Bearer your_api_key_here',
    }
  }
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'token') {
    console.log(data.content); // Stream tokens
  } else if (data.type === 'done') {
    eventSource.close();
  } else if (data.type === 'error') {
    console.error(data.content);
    eventSource.close();
  }
};
```

## Performance Characteristics

### Latency
- Vector search: Fast (indexed operations)
- Reranking: ~1-2s for 100 items (parallel batches)
- Agent response: 2-5s (non-streaming) or immediate start (streaming)

### Throughput
- Parallel reranking batches improve throughput significantly
- Async implementation prevents blocking during agent execution

## Dependencies

### Required Packages
- `langchain` - Agent framework
- `langchain-openai` - OpenAI integration
- `voyageai` - Reranking model
- `django` - Web framework
- `djangorestframework` - API framework

### Environment Variables
- `OPENAI_API_KEY` - Required for GPT-4o-mini
- Voyage AI credentials (configured in voyageai.Client)

## Security Considerations

1. **API Key Authentication** - All requests must include a valid project API key
2. **CSRF Exemption** - The endpoint is exempt from CSRF protection (API usage)
3. **Project Scoping** - All searches are automatically scoped to the authenticated project
4. **Rate Limiting** - Consider implementing rate limiting for production use

## Future Enhancements

The agent infrastructure supports tool calling (`chat_agent.py:46-47`), which is currently disabled but can be enabled for:
- Web searches
- Code execution
- External API calls
- Custom business logic tools

## Related Files

- `skald/api/chat_api.py` - Main endpoint
- `skald/agents/chat_agent/chat_agent.py` - Agent logic
- `skald/agents/chat_agent/preprocessing.py` - Context retrieval
- `skald/agents/chat_agent/prompts.py` - System prompts
- `skald/api/permissions.py` - Authentication
- `skald/agents/streaming.py` - Streaming handler
