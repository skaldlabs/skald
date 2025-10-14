# SQS Integration for Django API

## Overview

The Django API now supports publishing memo processing messages to either Redis (development) or AWS SQS (production) based on environment configuration.

## Environment-Based Routing

### Development Mode (Redis)
- **Trigger**: `NODE_ENV=development` or `SQS_QUEUE_URL` not set
- **Behavior**: Publishes to Redis pub/sub channel `process_memo`
- **Consumer**: Node.js memo processing server (Redis mode)

### Production Mode (SQS)
- **Trigger**: `NODE_ENV` != `development` AND `SQS_QUEUE_URL` is set
- **Behavior**: Publishes to AWS SQS queue
- **Consumer**: Node.js memo processing server (SQS mode)

## Configuration

### Environment Variables

```bash
# Required for SQS mode
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/memo-processing-queue
AWS_REGION=us-east-1  # Optional, defaults to us-east-1

# AWS Credentials (one of):
# Option 1: Environment variables
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Option 2: IAM Role (recommended for EC2/ECS)
# No credentials needed - uses instance/container role

# Development mode (Redis)
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Dependencies

The Django project now includes `boto3>=1.35.0` for AWS SQS integration.

## Message Format

Both Redis and SQS use the same message format:

```json
{
  "memo_uuid": "uuid-of-the-memo-to-process"
}
```

## Implementation Details

### Code Changes

**File**: `skald/flows/process_memo/process_memo.py`

- Added SQS client initialization with fallback to Redis
- Split publishing logic into separate functions:
  - `_publish_to_redis()` - Redis pub/sub
  - `_publish_to_sqs()` - SQS queue
- Environment-based routing in `create_new_memo()`
- Graceful fallback: if SQS fails, falls back to Redis

### Error Handling

- **SQS Unavailable**: Falls back to Redis with warning
- **SQS Error**: Logs error and falls back to Redis
- **Missing boto3**: Warns and uses Redis only

### Logging

The system logs the publishing method used:

```
# Redis mode
Published memo abc-123 to Redis process_memo channel

# SQS mode  
Published memo abc-123 to SQS queue: msg-456
```

## Deployment

### Development

```bash
# Uses Redis by default
python manage.py runserver
```

### Production

```bash
# Set environment variables
export NODE_ENV=production
export SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/memo-processing-queue

# Run Django
python manage.py runserver
```

### Docker

```dockerfile
# In your Dockerfile or docker-compose.yml
ENV NODE_ENV=production
ENV SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/memo-processing-queue
ENV AWS_REGION=us-east-1
```

## AWS Setup

### IAM Permissions

Your AWS credentials need the following SQS permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:REGION:ACCOUNT_ID:QUEUE_NAME"
    }
  ]
}
```

### SQS Queue Configuration

Recommended settings:

- **Visibility Timeout**: 300 seconds (5 minutes)
- **Message Retention**: 4 days
- **Dead-Letter Queue**: Configure for failed messages
- **FIFO**: Not required (standard queue is fine)

## Testing

### Development Testing

```python
# In Django shell
from skald.flows.process_memo.process_memo import create_new_memo
from skald.models.project import Project

project = Project.objects.first()
memo_data = {
    "content": "Test memo content",
    "title": "Test Memo"
}
memo = create_new_memo(memo_data, project)
# Should publish to Redis
```

### Production Testing

```bash
# Check SQS queue
aws sqs get-queue-attributes \
  --queue-url YOUR_QUEUE_URL \
  --attribute-names ApproximateNumberOfMessages

# Send test message
aws sqs send-message \
  --queue-url YOUR_QUEUE_URL \
  --message-body '{"memo_uuid": "test-123"}'
```

## Monitoring

### Key Metrics

1. **Django Logs**: Check for SQS publishing success/failure
2. **SQS Metrics**: Queue depth, message age
3. **Consumer Logs**: Memo processing success/failure

### CloudWatch Alarms

Set up alarms for:
- Queue depth > threshold
- Oldest message age > threshold  
- Failed message processing

## Troubleshooting

### Common Issues

**"SQS client not available"**
- Check `boto3` is installed: `pip install boto3`
- Verify AWS credentials are configured
- Check `SQS_QUEUE_URL` is set correctly

**"Error publishing to SQS"**
- Verify IAM permissions include `sqs:SendMessage`
- Check queue URL is correct
- Verify AWS region matches queue region

**Messages not being processed**
- Check memo processing server is running
- Verify SQS queue URL matches between Django and consumer
- Check consumer logs for errors

### Fallback Behavior

If SQS is unavailable, the system automatically falls back to Redis:

```
Warning: SQS client not available, falling back to Redis for memo abc-123
```

This ensures memo processing continues even if SQS is down, though you'll need Redis running in production for this fallback to work.

## Migration Strategy

1. **Phase 1**: Deploy with both Redis and SQS configured
2. **Phase 2**: Monitor SQS publishing success
3. **Phase 3**: Remove Redis dependency once SQS is stable
4. **Phase 4**: Scale memo processing server instances

This approach provides zero-downtime migration from Redis to SQS.
