# Memo Processing Server

A Node.js TypeScript server that processes memo messages from Redis (development), RabbitMQ, or SQS (production).

## Setup

Install dependencies:

```bash
npm install
# or
pnpm install
```

## Running

### Development (with hot reload)

Development mode uses Redis pub/sub:

```bash
npm run dev
```

### Production

Production mode uses AWS SQS for message processing:

```bash
npm run build
NODE_ENV=production npm start
```

## Environment Variables

### Queue Configuration

- `INTER_PROCESS_QUEUE` - Queue type: `redis`, `rabbitmq`, or `sqs` (default: `redis` in development, `sqs` in production)
- `USE_SQS` - Legacy flag, set to `true` to use SQS (overrides INTER_PROCESS_QUEUE)

### Redis Configuration

- `REDIS_HOST` - Redis server host (default: localhost)
- `REDIS_PORT` - Redis server port (default: 6379)
- `CHANNEL_NAME` - Redis pub/sub channel name (default: process_memo)

### RabbitMQ Configuration

- `RABBITMQ_HOST` - RabbitMQ server host (default: localhost)
- `RABBITMQ_PORT` - RabbitMQ server port (default: 5672)
- `RABBITMQ_USER` - RabbitMQ username (default: guest)
- `RABBITMQ_PASSWORD` - RabbitMQ password (default: guest)
- `RABBITMQ_VHOST` - RabbitMQ virtual host (default: /)

### SQS Configuration

- `SQS_QUEUE_URL` - AWS SQS queue URL (required for SQS mode)
- `AWS_REGION` - AWS region (default: us-east-2)
- `AWS_ACCESS_KEY_ID` - AWS credentials (set via environment or IAM role)
- `AWS_SECRET_ACCESS_KEY` - AWS credentials (set via environment or IAM role)

### Common

- `DATABASE_URL` - PostgreSQL connection string
- `VOYAGE_API_KEY` - VoyageAI API key (required for embeddings)

### LLM Configuration

The server supports multiple LLM providers. See `.env.example` for all options.

**Choose your provider:**

- `LLM_PROVIDER` - Set to `openai`, `anthropic`, or `local` (default: openai)

**OpenAI (if LLM_PROVIDER=openai):**

- `OPENAI_API_KEY` - OpenAI API key (required)
- `OPENAI_MODEL` - Model to use (default: gpt-4o-mini)

**Anthropic (if LLM_PROVIDER=anthropic):**

- `ANTHROPIC_API_KEY` - Anthropic API key (required)
- `ANTHROPIC_MODEL` - Model to use (default: claude-3-7-sonnet-20250219)

**Local LLM (if LLM_PROVIDER=local):**

- `LOCAL_LLM_BASE_URL` - OpenAI-compatible API endpoint (e.g., http://localhost:11434/v1 for Ollama)
- `LOCAL_LLM_MODEL` - Model name (e.g., llama3.1:8b)
- `LOCAL_LLM_API_KEY` - API key (default: not-needed)

## Message Format

All queues (Redis, RabbitMQ, and SQS) expect messages in the following JSON format:

```json
{
    "memo_uuid": "uuid-of-the-memo-to-process"
}
```

## Queue Details

### Redis

- Uses pub/sub for simple development setup
- Messages are fire-and-forget (not persisted)
- No acknowledgment or retry mechanism

### RabbitMQ

- Uses durable queues with message persistence
- Manual acknowledgment ensures messages aren't lost
- Failed messages are requeued automatically
- Prefetch set to 1 for balanced processing
- Supports graceful shutdown

### SQS

- Polls up to 10 messages at a time
- Processes messages concurrently using Promise.allSettled
- Uses long polling (1 second) for efficiency
- Sets visibility timeout to 60 seconds (adjustable based on processing time)
- Automatically deletes messages after successful processing
- Failed messages become visible again after timeout (consider using a dead-letter queue)

## Testing

### Redis

Publish a message to the Redis channel:

```bash
redis-cli PUBLISH process_memo '{"memo_uuid": "test-uuid-123"}'
```

### RabbitMQ

Install RabbitMQ locally (macOS):

```bash
brew install rabbitmq
brew services start rabbitmq
```

Send a test message:

```bash
# Using Python with pika
python3 -c "
import pika
import json

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()
channel.queue_declare(queue='process_memo', durable=True)
message = json.dumps({'memo_uuid': 'test-uuid-123'})
channel.basic_publish(
    exchange='',
    routing_key='process_memo',
    body=message,
    properties=pika.BasicProperties(delivery_mode=2)
)
print('Message sent!')
connection.close()
"
```

### SQS

Send a message to the SQS queue using AWS CLI:

```bash
aws sqs send-message \
  --queue-url YOUR_QUEUE_URL \
  --message-body '{"memo_uuid": "test-uuid-123"}'
```
