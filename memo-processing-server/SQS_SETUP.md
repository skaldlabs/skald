# SQS Production Setup - Quick Start

## Overview

The memo processing server now supports two modes:
- **Development**: Redis pub/sub (existing behavior)
- **Production**: AWS SQS with concurrent processing

## Key Features

✅ Processes up to 10 messages concurrently  
✅ Long polling for efficient SQS usage  
✅ Automatic message deletion on success  
✅ Failed messages return to queue after visibility timeout  
✅ Graceful error handling with Promise.allSettled  

## Quick Start

### 1. Set Environment Variables

```bash
# Required
export NODE_ENV=production
export SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/YOUR_ACCOUNT/YOUR_QUEUE
export DATABASE_URL=postgres://user:password@host:5432/database
export VOYAGE_API_KEY=your-voyage-api-key
export OPENAI_API_KEY=your-openai-api-key

# Optional (defaults shown)
export AWS_REGION=us-east-1
```

### 2. Run Production Mode

```bash
pnpm build
pnpm start:prod
```

Or with Docker:

```bash
docker build -t memo-processor .
docker run -e NODE_ENV=production -e SQS_QUEUE_URL=... memo-processor
```

## Message Format

Send messages to SQS in this format:

```json
{
  "memo_uuid": "uuid-of-memo-to-process"
}
```

## Configuration Details

| Setting | Value | Notes |
|---------|-------|-------|
| Max Messages per Poll | 10 | Processed concurrently |
| Long Poll Wait Time | 20 seconds | Reduces empty responses |
| Visibility Timeout | 5 minutes | Adjust if processing takes longer |
| Polling | Continuous | Runs indefinitely |

## Architecture

```
┌─────────────────┐
│   API Server    │
│  (Django/Node)  │
└────────┬────────┘
         │ Publishes
         ↓
┌─────────────────┐
│   SQS Queue     │
└────────┬────────┘
         │ Polls (max 10)
         ↓
┌─────────────────┐
│ Memo Processor  │
│   (This Server) │
├─────────────────┤
│ Concurrent:     │
│ • Chunk         │
│ • Extract Tags  │
│ • Summarize     │
└─────────────────┘
```

## AWS Setup Checklist

- [ ] Create SQS queue
- [ ] Configure Dead-Letter Queue (recommended)
- [ ] Set up IAM permissions (ReceiveMessage, DeleteMessage)
- [ ] Set visibility timeout to 300 seconds (or higher if needed)
- [ ] Get queue URL for SQS_QUEUE_URL env var
- [ ] Configure CloudWatch alarms for monitoring

## Monitoring Commands

Check queue depth:
```bash
aws sqs get-queue-attributes \
  --queue-url YOUR_QUEUE_URL \
  --attribute-names ApproximateNumberOfMessages
```

Send test message:
```bash
aws sqs send-message \
  --queue-url YOUR_QUEUE_URL \
  --message-body '{"memo_uuid": "test-123"}'
```

## Troubleshooting

**No messages being processed?**
- Check logs for connection errors
- Verify SQS_QUEUE_URL is correct
- Confirm IAM permissions

**Messages processed multiple times?**
- Increase VISIBILITY_TIMEOUT in sqsConsumer.ts
- Check for processing errors in logs

**Want to scale?**
- Run multiple instances (each processes 10 concurrent)
- 3 instances = up to 30 concurrent messages

## Files Modified

- `src/sqsConsumer.ts` - New SQS consumer implementation
- `src/index.ts` - Routing logic (dev=Redis, prod=SQS)
- `package.json` - Added @aws-sdk/client-sqs dependency
- `README.md` - Updated with SQS documentation
- `DEPLOYMENT.md` - Comprehensive deployment guide

See `DEPLOYMENT.md` for detailed production deployment instructions.

