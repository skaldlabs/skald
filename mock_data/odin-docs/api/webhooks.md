# Webhooks

Receive real-time notifications about events in your Odin account (Pro and Enterprise tiers only).

## Overview

Webhooks allow you to receive HTTP POST notifications when specific events occur in your Odin account. Instead of polling the API, you can configure endpoints to receive automatic notifications.

## Supported Events

### User Events

- `user.lesson.completed` - User completes a language lesson
- `user.progress.milestone` - User reaches a learning milestone
- `user.streak.achieved` - User maintains a learning streak

### Content Events

- `content.mythology.updated` - Mythology content is updated
- `content.saga.added` - New saga content is added
- `content.rune.inscriptions.updated` - New runic inscriptions are added

### System Events

- `api.key.expiring` - API key will expire soon (30 days)
- `api.rate_limit.warning` - Approaching rate limit (80%)
- `api.quota.exceeded` - Monthly quota exceeded

## Creating a Webhook

### Via API

```bash
curl -X POST "https://api.odin.io/v1/webhooks" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/webhooks/odin",
    "events": ["user.lesson.completed", "content.mythology.updated"],
    "description": "Production webhook for user events",
    "secret": "your_webhook_secret_key"
  }'
```

Response:

```json
{
    "success": true,
    "data": {
        "webhook": {
            "id": "webhook_abc123",
            "url": "https://your-domain.com/webhooks/odin",
            "events": ["user.lesson.completed", "content.mythology.updated"],
            "description": "Production webhook for user events",
            "status": "active",
            "created_at": "2025-10-10T12:00:00Z",
            "secret": "whsec_abc123..."
        }
    }
}
```

## Webhook Payload

All webhook deliveries follow this structure:

```json
{
    "id": "evt_abc123",
    "type": "user.lesson.completed",
    "created_at": "2025-10-10T12:30:00Z",
    "data": {
        "user_id": "user_xyz789",
        "lesson_id": "lesson_non_01",
        "language": "non",
        "score": 95,
        "completion_time_seconds": 450
    },
    "metadata": {
        "api_version": "v1",
        "request_id": "req_123456"
    }
}
```

## Event Types and Payloads

### user.lesson.completed

Triggered when a user completes a language lesson.

```json
{
    "id": "evt_001",
    "type": "user.lesson.completed",
    "created_at": "2025-10-10T12:30:00Z",
    "data": {
        "user_id": "user_xyz789",
        "lesson_id": "lesson_non_01",
        "language": "non",
        "lesson_title": "Introduction to Old Norse",
        "score": 95,
        "completion_time_seconds": 450,
        "exercises_completed": 12,
        "exercises_total": 12
    }
}
```

### user.progress.milestone

Triggered when a user reaches a learning milestone.

```json
{
    "id": "evt_002",
    "type": "user.progress.milestone",
    "created_at": "2025-10-10T14:00:00Z",
    "data": {
        "user_id": "user_xyz789",
        "milestone": "lessons_completed_10",
        "language": "non",
        "total_lessons": 10,
        "level": "beginner",
        "next_milestone": "lessons_completed_25"
    }
}
```

### content.mythology.updated

Triggered when mythology content is updated.

```json
{
    "id": "evt_003",
    "type": "content.mythology.updated",
    "created_at": "2025-10-10T15:00:00Z",
    "data": {
        "content_type": "deity",
        "deity_id": "deity_thor",
        "update_type": "enrichment",
        "changes": ["Added new story references", "Updated family relationships"],
        "version": "1.2"
    }
}
```

### api.rate_limit.warning

Triggered when you approach your rate limit.

```json
{
    "id": "evt_004",
    "type": "api.rate_limit.warning",
    "created_at": "2025-10-10T16:00:00Z",
    "data": {
        "api_key_id": "key_abc123",
        "current_usage": 8000,
        "limit": 10000,
        "usage_percentage": 80,
        "reset_at": "2025-10-10T17:00:00Z"
    }
}
```

## Verifying Webhook Signatures

All webhook requests include a signature in the `X-Odin-Signature` header to verify authenticity.

### Signature Format

```
X-Odin-Signature: t=1696680000,v1=abc123def456...
```

- `t` = timestamp
- `v1` = signature hash

### Verification Steps

1. Extract timestamp and signature from header
2. Create signed payload: `timestamp + '.' + request_body`
3. Compute HMAC-SHA256 using your webhook secret
4. Compare computed signature with received signature

### Example Verification (Node.js)

```javascript
const crypto = require('crypto')

function verifyWebhookSignature(payload, signature, secret) {
    const parts = signature.split(',')
    const timestamp = parts[0].split('=')[1]
    const receivedSignature = parts[1].split('=')[1]

    // Prevent replay attacks - reject if older than 5 minutes
    const currentTime = Math.floor(Date.now() / 1000)
    if (currentTime - parseInt(timestamp) > 300) {
        return false
    }

    // Compute signature
    const signedPayload = `${timestamp}.${payload}`
    const computedSignature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')

    // Compare signatures
    return crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(receivedSignature))
}

// Express.js example
app.post('/webhooks/odin', express.raw({ type: 'application/json' }), (req, res) => {
    const signature = req.headers['x-odin-signature']
    const payload = req.body.toString()

    if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
        return res.status(401).send('Invalid signature')
    }

    const event = JSON.parse(payload)
    // Process event...

    res.status(200).send('OK')
})
```

### Example Verification (Python)

```python
import hmac
import hashlib
import time

def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    parts = signature.split(',')
    timestamp = parts[0].split('=')[1]
    received_signature = parts[1].split('=')[1]

    # Prevent replay attacks
    current_time = int(time.time())
    if current_time - int(timestamp) > 300:
        return False

    # Compute signature
    signed_payload = f"{timestamp}.{payload.decode()}"
    computed_signature = hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256
    ).hexdigest()

    # Compare signatures
    return hmac.compare_digest(computed_signature, received_signature)

# Flask example
@app.route('/webhooks/odin', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Odin-Signature')
    payload = request.get_data()

    if not verify_webhook_signature(payload, signature, WEBHOOK_SECRET):
        return 'Invalid signature', 401

    event = request.json
    # Process event...

    return 'OK', 200
```

## Responding to Webhooks

Your endpoint should:

1. **Respond quickly** - Acknowledge receipt within 5 seconds
2. **Return 200 status** - Indicates successful receipt
3. **Process asynchronously** - Queue long-running tasks

```javascript
app.post('/webhooks/odin', (req, res) => {
    // Immediately acknowledge
    res.status(200).send('OK')

    // Process asynchronously
    processWebhookAsync(req.body).catch((err) => {
        console.error('Webhook processing error:', err)
    })
})
```

## Retry Logic

If your endpoint fails to respond successfully, Odin will retry:

- 1st retry: After 1 minute
- 2nd retry: After 5 minutes
- 3rd retry: After 30 minutes
- 4th retry: After 2 hours
- 5th retry: After 6 hours

After 5 failed attempts, the webhook will be automatically disabled.

## Testing Webhooks

### Send Test Event

```bash
curl -X POST "https://api.odin.io/v1/webhooks/{webhook_id}/test" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "user.lesson.completed"
  }'
```

### View Webhook Logs

```bash
curl -X GET "https://api.odin.io/v1/webhooks/{webhook_id}/logs" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Response:

```json
{
    "success": true,
    "data": {
        "logs": [
            {
                "id": "log_abc123",
                "event_id": "evt_001",
                "event_type": "user.lesson.completed",
                "delivered_at": "2025-10-10T12:30:05Z",
                "response_status": 200,
                "response_time_ms": 145,
                "attempt": 1
            }
        ]
    }
}
```

## Managing Webhooks

### List All Webhooks

```bash
curl -X GET "https://api.odin.io/v1/webhooks" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Update Webhook

```bash
curl -X PATCH "https://api.odin.io/v1/webhooks/{webhook_id}" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "events": ["user.lesson.completed", "user.progress.milestone"],
    "status": "active"
  }'
```

### Delete Webhook

```bash
curl -X DELETE "https://api.odin.io/v1/webhooks/{webhook_id}" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Best Practices

1. **Idempotency** - Handle duplicate events gracefully using event IDs
2. **Signature Verification** - Always verify webhook signatures
3. **Async Processing** - Respond immediately, process asynchronously
4. **Error Handling** - Log errors but still return 200 to prevent retries
5. **Monitoring** - Monitor webhook delivery success rates
6. **Timeout Protection** - Set reasonable timeouts for webhook processing

## Troubleshooting

### Webhook Not Receiving Events

- Verify webhook is active: `GET /v1/webhooks/{webhook_id}`
- Check webhook logs for delivery attempts
- Ensure your endpoint is publicly accessible
- Verify firewall/security groups allow Odin's IPs

### Odin Webhook IPs

For firewall allowlisting:

```
52.1.2.3/32
52.4.5.6/32
52.7.8.9/32
```

### Signature Verification Failing

- Ensure you're using the raw request body
- Check for middleware that modifies the body
- Verify you're using the correct webhook secret
- Check timestamp isn't too old (>5 minutes)
