# Odin API Overview

Welcome to the Odin API documentation. The Odin API provides programmatic access to Nordic mythology, language learning, and cultural information.

## Base URL

```
https://api.odin.io/v1
```

## Authentication

All API requests require authentication using an API key. Include your API key in the request header:

```
Authorization: Bearer YOUR_API_KEY
```

## Rate Limits

- Free tier: 100 requests/hour
- Basic tier: 1,000 requests/hour
- Pro tier: 10,000 requests/hour
- Enterprise: Custom limits

## Response Format

All responses are returned in JSON format with the following structure:

```json
{
    "success": true,
    "data": {},
    "metadata": {
        "timestamp": "2025-10-10T12:00:00Z",
        "request_id": "req_123456"
    }
}
```

## Error Handling

Errors follow standard HTTP status codes:

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

Error response format:

```json
{
    "success": false,
    "error": {
        "code": "INVALID_PARAMETER",
        "message": "The deity parameter is invalid",
        "details": {}
    }
}
```

## Available Endpoints

- [Mythology API](/api/mythology.md) - Access Nordic gods, creatures, and tales
- [Language API](/api/language.md) - Translation and language learning tools
- [Culture API](/api/culture.md) - Nordic countries, traditions, and history
- [Runes API](/api/runes.md) - Runic alphabet and translations
- [Sagas API](/api/sagas.md) - Access to Nordic sagas and stories
- [Geography API](/api/geography.md) - Nordic countries and regions
