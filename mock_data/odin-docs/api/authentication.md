# Authentication

Learn how to authenticate with the Odin API.

## API Keys

All requests to the Odin API must be authenticated using an API key. You can obtain an API key by signing up at [https://odin.io/signup](https://odin.io/signup).

## Using Your API Key

Include your API key in the `Authorization` header of every request:

```bash
curl -X GET "https://api.odin.io/v1/mythology/deities" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## API Key Types

Odin offers different API key tiers:

### Free Tier
- **Rate Limit**: 100 requests/hour
- **Features**: Access to all basic endpoints
- **Support**: Community support
- **Cost**: Free

### Basic Tier
- **Rate Limit**: 1,000 requests/hour
- **Features**: All free tier features plus batch operations
- **Support**: Email support
- **Cost**: $19/month

### Pro Tier
- **Rate Limit**: 10,000 requests/hour
- **Features**: All basic tier features plus webhooks, priority processing
- **Support**: Priority email support
- **Cost**: $99/month

### Enterprise Tier
- **Rate Limit**: Custom (unlimited available)
- **Features**: All features, custom integrations, SLA guarantees
- **Support**: Dedicated support engineer
- **Cost**: Custom pricing

## Creating an API Key

1. Sign up at [https://odin.io/signup](https://odin.io/signup)
2. Verify your email address
3. Navigate to the Dashboard > API Keys section
4. Click "Generate New Key"
5. Name your key and select permissions
6. Copy and securely store your API key

**Important**: API keys are shown only once. Store them securely.

## Key Permissions

You can create API keys with specific permissions:

| Permission | Description |
|------------|-------------|
| `read:mythology` | Read access to mythology endpoints |
| `read:language` | Read access to language endpoints |
| `read:culture` | Read access to culture endpoints |
| `read:runes` | Read access to runes endpoints |
| `read:sagas` | Read access to sagas endpoints |
| `read:geography` | Read access to geography endpoints |
| `write:user_data` | Write access to user-specific data (saved lessons, bookmarks) |
| `read:analytics` | Read access to usage analytics |

Example key creation request:

```json
POST /v1/auth/keys
{
  "name": "My App Key",
  "permissions": [
    "read:mythology",
    "read:language",
    "write:user_data"
  ],
  "expires_at": "2026-12-31T23:59:59Z"
}
```

## Rotating API Keys

For security, we recommend rotating your API keys regularly:

1. Generate a new API key
2. Update your applications to use the new key
3. Delete the old key once all services are updated

You can have up to 5 active API keys simultaneously to facilitate rotation.

## Revoking API Keys

If an API key is compromised:

1. Immediately revoke it via the Dashboard or API
2. Generate a new key
3. Update your applications

Revoke via API:

```bash
curl -X DELETE "https://api.odin.io/v1/auth/keys/{key_id}" \
  -H "Authorization: Bearer YOUR_ACTIVE_API_KEY"
```

## OAuth 2.0 (Enterprise Only)

Enterprise customers can use OAuth 2.0 for user-based authentication:

### Authorization Code Flow

1. **Authorization Request**
```
GET https://auth.odin.io/oauth/authorize?
  response_type=code&
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  scope=read:all write:user_data&
  state=RANDOM_STATE
```

2. **Token Exchange**
```bash
curl -X POST "https://auth.odin.io/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTHORIZATION_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=YOUR_REDIRECT_URI"
```

3. **Response**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "def50200...",
  "scope": "read:all write:user_data"
}
```

### Using Access Tokens

```bash
curl -X GET "https://api.odin.io/v1/user/profile" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Refreshing Tokens

```bash
curl -X POST "https://auth.odin.io/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=REFRESH_TOKEN" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

## Security Best Practices

1. **Never expose API keys in client-side code**
   - Keep keys on the server
   - Use environment variables
   - Never commit keys to version control

2. **Use HTTPS only**
   - The API only accepts HTTPS connections
   - HTTP requests will be rejected

3. **Implement key rotation**
   - Rotate keys every 90 days
   - Use multiple keys for different environments

4. **Monitor API usage**
   - Check the dashboard for unusual activity
   - Set up alerts for rate limit approaches

5. **Use minimal permissions**
   - Create keys with only required permissions
   - Use separate keys for different services

6. **Store keys securely**
   - Use secrets management systems (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Encrypt keys at rest
   - Restrict access to keys

## Rate Limiting

Rate limits are enforced per API key. Response headers indicate your current status:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1696680000
```

When rate limited, you'll receive a `429 Too Many Requests` response:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "limit": 1000,
      "reset_at": "2025-10-10T13:00:00Z"
    }
  }
}
```

## Testing Your Authentication

Test your API key with this simple request:

```bash
curl -X GET "https://api.odin.io/v1/auth/verify" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Successful response:

```json
{
  "success": true,
  "data": {
    "key_id": "key_abc123",
    "tier": "pro",
    "permissions": ["read:all", "write:user_data"],
    "rate_limit": {
      "limit": 10000,
      "remaining": 9847,
      "reset_at": "2025-10-10T13:00:00Z"
    }
  }
}
```
