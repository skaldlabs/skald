# Deployment Guide

## Production Deployment with SQS

### Prerequisites

1. AWS SQS queue created
2. AWS credentials configured (via environment variables or IAM role)
3. PostgreSQL database accessible
4. API keys for VoyageAI and OpenAI

### Environment Variables

Create a `.env` file or set the following environment variables:

```bash
# Required
NODE_ENV=production
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/memo-processing-queue
DATABASE_URL=postgres://user:password@host:5432/database
VOYAGE_API_KEY=your-voyage-api-key
OPENAI_API_KEY=your-openai-api-key

# Optional
AWS_REGION=us-east-1  # Default: us-east-1
```

### AWS Credentials

You can provide AWS credentials in one of the following ways:

**Option 1: Environment Variables**
```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

**Option 2: IAM Role (Recommended for EC2/ECS)**
- Attach an IAM role to your EC2 instance or ECS task with SQS permissions
- No need to set AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY

### Required IAM Permissions

Your IAM role or user needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:REGION:ACCOUNT_ID:QUEUE_NAME"
    }
  ]
}
```

### SQS Queue Configuration

Recommended queue settings:

- **Visibility Timeout**: 300 seconds (5 minutes) - matches the consumer setting
- **Message Retention**: 4 days (default) or adjust based on needs
- **Receive Message Wait Time**: 0 seconds (long polling is handled by consumer)
- **Dead-Letter Queue**: Configure a DLQ to capture failed messages after max retries

Example DLQ configuration:
- **Maximum Receives**: 3-5 (messages move to DLQ after this many failures)
- **DLQ**: Create a separate queue to store failed messages for later analysis

### Docker Deployment

Build the image:

```bash
docker build -t memo-processing-server ./memo-processing-server
```

Run the container:

```bash
docker run -d \
  --name memo-processor \
  -e NODE_ENV=production \
  -e SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/memo-processing-queue \
  -e DATABASE_URL=postgres://user:password@host:5432/database \
  -e VOYAGE_API_KEY=your-voyage-api-key \
  -e OPENAI_API_KEY=your-openai-api-key \
  -e AWS_REGION=us-east-1 \
  memo-processing-server
```

Or use environment file:

```bash
docker run -d \
  --name memo-processor \
  --env-file .env.production \
  memo-processing-server
```

### AWS ECS Deployment

Example ECS task definition (JSON snippet):

```json
{
  "containerDefinitions": [
    {
      "name": "memo-processor",
      "image": "your-registry/memo-processing-server:latest",
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "AWS_REGION", "value": "us-east-1" },
        { "name": "SQS_QUEUE_URL", "value": "https://sqs.us-east-1.amazonaws.com/123456789/memo-processing-queue" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..." },
        { "name": "VOYAGE_API_KEY", "valueFrom": "arn:aws:secretsmanager:..." },
        { "name": "OPENAI_API_KEY", "valueFrom": "arn:aws:secretsmanager:..." }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/memo-processor",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/memo-processor-task-role",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole"
}
```

### Monitoring

Key metrics to monitor:

1. **SQS Metrics**:
   - `ApproximateNumberOfMessagesVisible` - messages waiting to be processed
   - `ApproximateAgeOfOldestMessage` - processing backlog
   - `NumberOfMessagesReceived` - throughput
   - `NumberOfMessagesDeleted` - successful processing

2. **Application Logs**:
   - Processing errors
   - Failed memo processing attempts
   - SQS polling errors

3. **CloudWatch Alarms** (recommended):
   - Alert when queue depth exceeds threshold
   - Alert when oldest message age is too high
   - Alert on processing errors

### Scaling

To increase throughput, run multiple instances of the service:

- Each instance will poll up to 10 messages concurrently
- Multiple instances will process different batches of messages
- SQS handles message distribution automatically via visibility timeout

Example with 3 instances:
- Total concurrent processing: up to 30 messages
- Configure based on your memo processing time and throughput requirements

### Troubleshooting

**Messages not being processed:**
- Check SQS_QUEUE_URL is correct
- Verify IAM permissions
- Check application logs for errors

**Messages being processed multiple times:**
- Increase visibility timeout if processing takes longer than 5 minutes
- Check for errors during processing causing messages to return to queue

**High queue depth:**
- Scale up the number of instances
- Check for processing bottlenecks (database, API calls)
- Review failed messages in DLQ

**AWS credential errors:**
- Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
- Or verify IAM role is attached to EC2/ECS
- Check IAM permissions include required SQS actions

