# API Reference

Complete API reference for Skald 2.0. All endpoints return JSON unless otherwise specified.

## Table of Contents

- [Authentication](#authentication)
- [Health Check](#health-check)
- [User Management](#user-management)
- [Email Verification](#email-verification)
- [Organization Management](#organization-management)
- [Project Management](#project-management)
- [Memo Management](#memo-management)
- [Search](#search)
- [Chat](#chat)

---

## Authentication

Skald supports two authentication methods:

1. **Token Authentication** - For user-scoped endpoints
   - Header: `Authorization: Token <your-token>`
   - Used for: User management, organization management, project management
   - Can also be used for project-scoped endpoints (requires `project_id` in request body)

2. **Project API Key** - For project-scoped endpoints (memos, search, chat)
   - Header: `Authorization: Bearer <project-api-key>`
   - Used for: Memos, search, chat
   - Project is automatically inferred from the API key (no `project_id` needed)

---

## Health Check

### GET /api/health

Check if the API is running.

**Authentication:** None

**Response:**
```json
{
  "status": "ok",
  "message": "API is healthy"
}
```

---

## User Management

### POST /api/user

Create a new user account.

**Authentication:** None

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "token": "abc123...",
  "user": {
    "email": "user@example.com",
    "default_organization": null,
    "email_verified": false,
    "organization_name": null,
    "is_superuser": false,
    "name": null,
    "access_levels": {
      "organization_access_levels": {}
    }
  }
}
```

### POST /api/user/login

Authenticate and get access token.

**Authentication:** None

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "token": "abc123...",
  "user": {
    "email": "user@example.com",
    "default_organization": "org-uuid",
    "email_verified": true,
    "organization_name": "My Organization",
    "is_superuser": false,
    "name": "John Doe",
    "access_levels": {
      "organization_access_levels": {
        "org-uuid": 3
      }
    }
  }
}
```

**Error Response (400):**
```json
{
  "error": "Invalid Credentials"
}
```

### POST /api/user/logout

Log out and invalidate the current token.

**Authentication:** Token (required)

**Response:** `204 No Content`

### GET /api/user/details

Get current user details.

**Authentication:** Token (required)

**Response:**
```json
{
  "email": "user@example.com",
  "default_organization": "org-uuid",
  "email_verified": true,
  "organization_name": "My Organization",
  "is_superuser": false,
  "name": "John Doe",
  "access_levels": {
    "organization_access_levels": {
      "org-uuid": 3
    }
  }
}
```

### POST /api/user/change_password

Change the user's password.

**Authentication:** Token (required)

**Request:**
```json
{
  "old_password": "current_password",
  "new_password": "new_secure_password"
}
```

**Response:** `200 OK`

**Error Response (400):**
```json
{
  "old_password": ["Wrong password."]
}
```

---

## Email Verification

### POST /api/email_verification/send

Send a verification code to the user's email.

**Authentication:** Token (required)

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent!"
}
```

**Error Responses:**

Email already verified (400):
```json
{
  "success": false,
  "message": "Email already verified."
}
```

Rate limited (400):
```json
{
  "success": false,
  "message": "Please wait 5 minutes before requesting a new verification code."
}
```

### POST /api/email_verification/verify

Verify email with the code sent.

**Authentication:** Token (required)

**Request:**
```json
{
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully!"
}
```

**Error Responses (400):**
```json
{
  "success": false,
  "message": "Invalid code."
}
```

```json
{
  "success": false,
  "message": "Code expired or not found."
}
```

---

## Organization Management

### GET /api/organization

List all organizations the user is a member of.

**Authentication:** Token (required)

**Response:**
```json
[
  {
    "uuid": "org-uuid-1",
    "name": "My Organization",
    "owner": "user-id"
  }
]
```

### POST /api/organization

Create a new organization.

**Authentication:** Token (required)

**Request:**
```json
{
  "name": "New Organization"
}
```

**Response:**
```json
{
  "uuid": "org-uuid",
  "name": "New Organization",
  "owner": "user-id"
}
```

### GET /api/organization/{organization_id}

Get organization details.

**Authentication:** Token (required)
**Permission:** Organization member

**Response:**
```json
{
  "uuid": "org-uuid",
  "name": "My Organization",
  "owner": "user-id"
}
```

### GET /api/organization/{organization_id}/members

List all members of the organization.

**Authentication:** Token (required)
**Permission:** Organization member

**Response:**
```json
[
  {
    "email": "member@example.com",
    "name": "John Doe",
    "role": "OWNER",
    "joined_at": "2024-01-15T10:30:00Z"
  },
  {
    "email": "member2@example.com",
    "name": "Jane Smith",
    "role": "MEMBER",
    "joined_at": "2024-02-20T14:45:00Z"
  }
]
```

### POST /api/organization/{organization_id}/invite_member

Invite a new member to the organization.

**Authentication:** Token (required)
**Permission:** Organization member

**Request:**
```json
{
  "email": "newmember@example.com"
}
```

**Response:**
```json
{
  "detail": "Invitation sent successfully"
}
```

**Error Responses:**

Invalid email (400):
```json
{
  "detail": "Invalid email address"
}
```

Already a member (400):
```json
{
  "detail": "User is already a member of this organization"
}
```

### GET /api/organization/pending_invites

Get all pending invites for the current user.

**Authentication:** Token (required)

**Response:**
```json
[
  {
    "id": 1,
    "organization_uuid": "org-uuid",
    "organization_name": "Example Org"
  }
]
```

### POST /api/organization/{invite_id}/accept_invite

Accept an organization invitation.

**Authentication:** Token (required)

**Response:**
```json
{
  "detail": "Invite accepted successfully"
}
```

**Error Response (404):**
```json
{
  "detail": "No pending invite found"
}
```

### GET /api/organization/{organization_id}/sent_invites

Get all pending invites sent by the organization.

**Authentication:** Token (required)
**Permission:** Organization member

**Response:**
```json
[
  {
    "uuid": "invite-uuid",
    "email": "invitee@example.com",
    "created_at": "2024-01-15T10:30:00Z",
    "invited_by_name": "John Doe",
    "invited_by_email": "john@example.com"
  }
]
```

### POST /api/organization/{organization_id}/cancel_invite

Cancel a pending organization invite.

**Authentication:** Token (required)
**Permission:** Organization owner

**Request:**
```json
{
  "invite_id": "invite-uuid"
}
```

**Response:**
```json
{
  "detail": "Invite cancelled successfully"
}
```

### POST /api/organization/{organization_id}/resend_invite

Resend an organization invite email.

**Authentication:** Token (required)
**Permission:** Organization owner

**Request:**
```json
{
  "invite_id": "invite-uuid"
}
```

**Response:**
```json
{
  "detail": "Invitation resent successfully"
}
```

### POST /api/organization/{organization_id}/remove_member

Remove a member from the organization.

**Authentication:** Token (required)
**Permission:** Organization owner

**Request:**
```json
{
  "email": "member@example.com"
}
```

**Response:**
```json
{
  "detail": "Member removed successfully"
}
```

**Error Responses:**

Self-removal (400):
```json
{
  "detail": "You cannot remove yourself from the organization"
}
```

Cannot remove owner (400):
```json
{
  "detail": "Cannot remove organization owner"
}
```

---

## Project Management

### GET /api/organization/{organization_id}/projects

List all projects in an organization.

**Authentication:** Token (required)
**Permission:** Organization member

**Response:**
```json
[
  {
    "uuid": "project-uuid",
    "name": "My Project",
    "organization": "org-uuid",
    "owner": "user-id",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "has_api_key": true,
    "api_key_first_12_digits": "sk_proj_abcd"
  }
]
```

### POST /api/organization/{organization_id}/projects

Create a new project.

**Authentication:** Token (required)
**Permission:** Organization member

**Request:**
```json
{
  "name": "New Project"
}
```

**Response:**
```json
{
  "uuid": "project-uuid",
  "name": "New Project",
  "organization": "org-uuid",
  "owner": "user-id",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "has_api_key": false,
  "api_key_first_12_digits": null
}
```

### GET /api/organization/{organization_id}/projects/{project_id}

Get project details.

**Authentication:** Token (required)
**Permission:** Organization member

**Response:**
```json
{
  "uuid": "project-uuid",
  "name": "My Project",
  "organization": "org-uuid",
  "owner": "user-id",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "has_api_key": true,
  "api_key_first_12_digits": "sk_proj_abcd"
}
```

### PUT /api/organization/{organization_id}/projects/{project_id}

Update a project.

**Authentication:** Token (required)
**Permission:** Organization owner

**Request:**
```json
{
  "name": "Updated Project Name"
}
```

**Response:**
```json
{
  "uuid": "project-uuid",
  "name": "Updated Project Name",
  "organization": "org-uuid",
  "owner": "user-id",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-16T11:20:00Z",
  "has_api_key": true,
  "api_key_first_12_digits": "sk_proj_abcd"
}
```

### DELETE /api/organization/{organization_id}/projects/{project_id}

Delete a project.

**Authentication:** Token (required)
**Permission:** Organization owner

**Response:** `204 No Content`

### POST /api/organization/{organization_id}/projects/{project_id}/generate_api_key

Generate a new API key for the project. This will invalidate any existing API key.

**Authentication:** Token (required)
**Permission:** Organization member

**Response:**
```json
{
  "api_key": "sk_proj_abc123xyz789..."
}
```

**Note:** This is the only time the full API key will be returned. Store it securely.

---

## Memo Management

All memo endpoints support both authentication methods:
- **Project API Key** (recommended): Project is automatically inferred, `project_id` not needed
- **Token Authentication**: Requires `project_id` in request body and organization membership

### GET /api/v1/memo

List all memos in the project.

**Authentication:** Project API Key or Token (required)

**Response:**
```json
[
  {
    "id": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "title": "Meeting Notes",
    "summary": "Discussion about Q1 goals",
    "content_length": 1234,
    "metadata": {"type": "notes"},
    "client_reference_id": "external-id-123"
  }
]
```

### POST /api/v1/memo

Create a new memo. The memo will be automatically processed (summarized, chunked, and indexed for search).

**Authentication:** Project API Key or Token (required)

**Request (using Project API Key):**
```json
{
  "title": "Meeting Notes",
  "content": "Full content of the memo...",
  "metadata": {
    "type": "notes",
    "author": "John Doe"
  },
  "reference_id": "external-id-123",
  "tags": ["meeting", "q1"],
  "source": "notion",
  "expiration_date": "2024-12-31T23:59:59Z"
}
```

**Request (using Token Authentication):**
```json
{
  "title": "Meeting Notes",
  "content": "Full content of the memo...",
  "project_id": "project-uuid",
  "metadata": {
    "type": "notes",
    "author": "John Doe"
  },
  "reference_id": "external-id-123",
  "tags": ["meeting", "q1"],
  "source": "notion",
  "expiration_date": "2024-12-31T23:59:59Z"
}
```

**Required Fields:**
- `title` (string, max 255 chars)
- `content` (string)
- `project_id` (UUID) - **Only required when using Token Authentication**

**Optional Fields:**
- `metadata` (object): Custom JSON metadata
- `reference_id` (string, max 255 chars): External reference ID
- `tags` (array of strings): Tags for categorization
- `source` (string, max 255 chars): Source system name
- `expiration_date` (datetime): When the memo should expire

**Response:**
```json
{
  "ok": true
}
```

### GET /api/v1/memo/{memo_id}

Get memo details.

**Authentication:** Project API Key or Token (required)

**Response:**
```json
{
  "id": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "title": "Meeting Notes",
  "summary": "Discussion about Q1 goals",
  "content_length": 1234,
  "metadata": {"type": "notes"},
  "client_reference_id": "external-id-123"
}
```

### POST /api/v1/memo/push

Placeholder endpoint for batch push operations.

**Authentication:** Project API Key or Token (required)

**Response:**
```json
{
  "ok": true
}
```

### POST /api/v1/memo/push_memo_content

Placeholder endpoint for pushing memo content updates.

**Authentication:** Project API Key or Token (required)

**Response:**
```json
{
  "ok": true
}
```

### POST /api/v1/memo/push_memo_tag

Placeholder endpoint for pushing memo tags.

**Authentication:** Project API Key or Token (required)

**Response:**
```json
{
  "ok": true
}
```

### POST /api/v1/memo/push_memo_relationship

Placeholder endpoint for pushing memo relationships.

**Authentication:** Project API Key or Token (required)

**Response:**
```json
{
  "ok": true
}
```

---

## Search

### POST /api/v1/search

Search through memos using various methods.

**Authentication:** Project API Key or Token (required)

**Request (using Project API Key):**
```json
{
  "query": "quarterly goals",
  "search_method": "chunk_vector_search",
  "limit": 10,
  "tags": ["meeting", "q1"]
}
```

**Request (using Token Authentication):**
```json
{
  "query": "quarterly goals",
  "search_method": "chunk_vector_search",
  "project_id": "project-uuid",
  "limit": 10,
  "tags": ["meeting", "q1"]
}
```

**Parameters:**
- `query` (string, required): The search query
- `search_method` (string, required): One of:
  - `summary_vector_search` - Semantic search on memo summaries
  - `chunk_vector_search` - Semantic search on memo chunks
  - `title_contains` - Case-insensitive substring match on titles
  - `title_startswith` - Case-insensitive prefix match on titles
- `project_id` (UUID, optional): **Only required when using Token Authentication**
- `limit` (integer, optional): Max results to return (1-50, default 10)
- `tags` (array of strings, optional): Filter by tags

**Response:**
```json
{
  "results": [
    {
      "title": "Meeting Notes",
      "uuid": "memo-uuid",
      "content_snippet": "Full content of the memo (first 100 chars)...",
      "summary": "Discussion about Q1 goals",
      "distance": 0.234
    }
  ]
}
```

**Notes:**
- `distance` is the vector similarity distance (lower is more similar)
- `distance` is `null` for non-vector search methods
- Results are ordered by relevance

**Error Responses:**

Missing query (400):
```json
{
  "error": "Query is required"
}
```

Invalid search method (400):
```json
{
  "error": "Search method is required and must be one of: title_contains, title_startswith, summary_vector_search, chunk_vector_search"
}
```

Limit too high (400):
```json
{
  "error": "Limit must be less than or equal to 50"
}
```

---

## Chat

### POST /api/v1/chat

Ask questions about your knowledge base using an AI agent. See [Chat API Documentation](./chat.md) for detailed information.

**Authentication:** Project API Key or Token (required)

**Request (using Project API Key):**
```json
{
  "query": "What were the main points discussed in the Q1 meeting?",
  "stream": false
}
```

**Request (using Token Authentication):**
```json
{
  "query": "What were the main points discussed in the Q1 meeting?",
  "project_id": "project-uuid",
  "stream": false
}
```

**Parameters:**
- `query` (string, required): The question to ask
- `project_id` (UUID, optional): **Only required when using Token Authentication**
- `stream` (boolean, optional): Enable streaming responses (default: false)

**Response (Non-streaming):**
```json
{
  "ok": true,
  "response": "The main points discussed in the Q1 meeting were:\n1. Revenue targets [[1]]\n2. Hiring plans [[2]]\n3. Product roadmap [[1]][[3]]",
  "intermediate_steps": []
}
```

**Response (Streaming):**

When `stream: true`, returns Server-Sent Events:

```
Content-Type: text/event-stream

: ping

data: {"type": "token", "content": "The"}

data: {"type": "token", "content": " main"}

data: {"type": "done"}
```

**Error Responses:**

Missing query (400):
```json
{
  "error": "Query is required"
}
```

Agent error (500):
```json
{
  "error": "Agent error: <error details>"
}
```

**Citation Format:**

Responses include inline citations in the format `[[N]]` where N is the result number from the retrieved context.

---

## Common Error Responses

### 400 Bad Request
Invalid request parameters or validation errors.

### 401 Unauthorized
Missing or invalid authentication credentials.

### 403 Forbidden
User does not have permission to access the resource.

### 404 Not Found
Resource not found.

### 500 Internal Server Error
Server-side error occurred.

### 503 Service Unavailable
External service (e.g., email) temporarily unavailable.

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

---

## CORS

All API endpoints include CORS headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS, GET, PUT, DELETE`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

---

## Pagination

Currently, pagination is not implemented for list endpoints. Consider implementing cursor-based or offset pagination for production use.

---

## Access Levels

Organization membership has three access levels:

- **MEMBER** (1): Can view organization and projects, create memos
- **ADMIN** (2): Reserved for future use
- **OWNER** (3): Full control including member management and project deletion

---

## Best Practices

1. **Store API Keys Securely**: Never commit API keys to version control
2. **Use HTTPS**: Always use HTTPS in production
3. **Handle Errors**: Implement proper error handling for all API calls
4. **Token Management**: Refresh tokens as needed, invalidate on logout
5. **Validation**: Validate all inputs on the client side before sending
6. **Streaming**: Use streaming for chat responses to improve UX
7. **Tags**: Use tags consistently for better search filtering
8. **Metadata**: Store structured metadata for easier querying later
