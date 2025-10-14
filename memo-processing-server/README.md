# Memo Processing Server

A Node.js TypeScript server that processes memo messages from Redis (development) or SQS (production).

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

### Development (Redis)

- `NODE_ENV` - Set to `development` for Redis mode (default: production)
- `REDIS_HOST` - Redis server host (default: localhost)
- `REDIS_PORT` - Redis server port (default: 6379)
- `CHANNEL_NAME` - Redis pub/sub channel name (default: process_memo)

### Production (SQS)

- `NODE_ENV` - Set to `production` or leave unset for SQS mode
- `SQS_QUEUE_URL` - AWS SQS queue URL (required)
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_ACCESS_KEY_ID` - AWS credentials (set via environment or IAM role)
- `AWS_SECRET_ACCESS_KEY` - AWS credentials (set via environment or IAM role)

### Common

- `VOYAGE_API_KEY` - VoyageAI API key
- `OPENAI_API_KEY` - OpenAI API key
- `DATABASE_URL` - PostgreSQL connection string

## Message Format

Both Redis and SQS expect messages in the following JSON format:

```json
{
    "memo_uuid": "uuid-of-the-memo-to-process"
}
```

## SQS Configuration

The SQS consumer:

- Polls up to 10 messages at a time
- Processes messages concurrently using Promise.allSettled
- Uses long polling (20 seconds) for efficiency
- Sets visibility timeout to 5 minutes (adjustable based on processing time)
- Automatically deletes messages after successful processing
- Failed messages become visible again after timeout (consider using a dead-letter queue)

## Testing

### Development (Redis)

Publish a message to the Redis channel:

```bash
redis-cli PUBLISH memo-processing '{"memo_uuid": "test-uuid-123"}'
```

### Production (SQS)

Send a message to the SQS queue using AWS CLI:

```bash
aws sqs send-message \
  --queue-url YOUR_QUEUE_URL \
  --message-body '{"memo_uuid": "test-uuid-123"}'
```
