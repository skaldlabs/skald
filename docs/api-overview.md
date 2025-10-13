# Skald API Overview

## Table of Contents
- [Architecture](#architecture)
- [Authentication Methods](#authentication-methods)
- [Authorization Model](#authorization-model)
- [API Endpoints](#api-endpoints)
- [Security](#security)

## Architecture

Skald uses a Django REST Framework-based API with a hierarchical authorization model:

```
User → Organization → Project → Memos
```

- **Users** can belong to multiple **Organizations** with different roles
- **Organizations** contain **Projects**
- **Projects** contain **Memos** and have API keys for programmatic access
- API keys are scoped to Projects for secure, isolated access

## Authentication Methods

### 1. Session Authentication (Web UI)

Used for interactive web sessions via the frontend.

**Login Flow**:
1. User sends credentials to `/api/user/login/`
2. Server validates credentials and creates session
3. Server returns authentication token
4. Token is stored and included in subsequent requests

**Endpoints**:
- `POST /api/user/login/` - Login with email/password
- `POST /api/user/logout/` - Logout (requires authentication)
- `POST /api/user/` - Register new user account

**Implementation**: `skald/api/user_api.py:124-144`

**Request Example**:
```bash
curl -X POST http://localhost:8000/api/user/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_password"
  }'
```

**Response**:
```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "email": "user@example.com",
    "default_organization": "uuid-here",
    "email_verified": true,
    "organization_name": "My Org",
    "is_superuser": false,
    "name": "John Doe",
    "access_levels": {
      "organization_access_levels": {
        "org-uuid": 20
      }
    }
  }
}
```

### 2. Token Authentication (DRF Token)

REST Framework token-based authentication for API access.

**Authentication Header**:
```
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
```

**Token Management**:
- Tokens are created automatically on user registration
- Tokens are deleted on logout
- Tokens persist until explicitly deleted

**Implementation**: Uses DRF's `TokenAuthentication` class

### 3. Project API Key Authentication

Scoped API keys for programmatic access to project-specific endpoints (memos, search, chat).

**Key Features**:
- Format: `sk_proj_<40-character-hex>` (e.g., `sk_proj_a1b2c3d4e5f6...`)
- SHA3-256 hashed storage for security
- One active key per project
- Only first 12 characters displayed in UI after generation

**Implementation**: `skald/api/permissions.py:141-191`

**API Key Generation**:
```python
# skald/utils/api_key_utils.py:12-14
def generate_api_key(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(20)}"
```

**Hashing**:
```python
# skald/utils/api_key_utils.py:5-7
def hash_api_key(token: str) -> str:
    return hashlib.sha3_256(token.encode("utf-8")).hexdigest()
```

**Storage**:
- Hash stored in `ProjectApiKey.api_key_hash` (primary key)
- First 12 digits stored in `ProjectApiKey.first_12_digits` (for UI display)
- Foreign key to `Project`

**Model**: `skald/models/project.py:36-44`

**Generation Endpoint**:
```bash
POST /api/organization/{org_id}/projects/{project_id}/generate_api_key/
Authorization: Token <user-token>
```

**Response**:
```json
{
  "api_key": "sk_proj_a1b2c3d4e5f6789012345678901234567890"
}
```

**Note**: API key is only shown once during generation. Store it securely.

**Authentication Header**:
```
Authorization: Bearer sk_proj_a1b2c3d4e5f6789012345678901234567890
```

**Authentication Flow**:
1. Client sends request with API key in `Authorization: Bearer` header
2. Server extracts key from header (`skald/api/permissions.py:148-156`)
3. Server hashes the key using SHA3-256
4. Server looks up hash in `ProjectApiKey` table
5. If found, request is authenticated with project context
6. If not found, request is rejected

**Authenticated Endpoints**:
- `POST /api/v1/memo/` - Create memo
- `POST /api/v1/search/` - Search memos
- `POST /api/v1/chat/` - Chat with knowledge base

## Authorization Model

### Organization-Based Access Control

**Roles** (`skald/models/user.py:10-13`):
```python
class OrganizationMembershipRole(models.IntegerChoices):
    MEMBER = 1       # Basic access
    SUPER_ADMIN = 19 # Enhanced permissions
    OWNER = 20       # Full control
```

**Role Hierarchy**:
- `OWNER (20)` - Full control over organization, projects, members
- `SUPER_ADMIN (19)` - Enhanced administrative access
- `MEMBER (1)` - Basic access to organization resources

**Permission Checking**:

**Decorator-Based**: `@require_access_level(role)`
```python
# skald/api/permissions.py:15-52
@require_access_level(OrganizationMembershipRole.OWNER)
def some_action(self, request, pk=None):
    # Only owners can access this
    pass
```

**Mixin-Based**: `OrganizationPermissionMixin`
```python
# skald/api/permissions.py:55-139
class ProjectViewSet(OrganizationPermissionMixin, viewsets.ModelViewSet):
    required_access_level = OrganizationMembershipRole.MEMBER
    organization_url_kwarg = "parent_lookup_organization"
```

**Permission Flow**:
1. Extract organization UUID from URL parameters
2. Verify user is authenticated
3. Lookup user's `OrganizationMembership` for that organization
4. Compare membership's `access_level` with `required_access_level`
5. Grant or deny access based on comparison

**Email Verification**:
- Required for all organization-level actions
- Checked in `@require_access_level` decorator (`skald/api/permissions.py:30-31`)

### Project-Based Access Control

**API Key Scoping**:
- Each API key is tied to a specific project
- API calls are automatically scoped to that project's resources
- No cross-project access possible with a single API key

**Implementation**: `skald/api/permissions.py:171-191`

```python
def get_project(self):
    auth_header = self.request.META.get("HTTP_AUTHORIZATION")
    api_key = auth_header.split(" ")[1]
    api_key_hash = hash_api_key(api_key)
    project_api_key = ProjectApiKey.objects.get(api_key_hash=api_key_hash)
    return project_api_key.project
```

**Automatic Filtering**:
```python
# skald/api/memo_api.py:52-53
def get_queryset(self):
    return Memo.objects.filter(project=self.get_project())
```

## API Endpoints

### User Management

#### Create Account
```
POST /api/user/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

#### Login
```
POST /api/user/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

#### Get User Details
```
GET /api/user/details/
Authorization: Token <token>
```

#### Logout
```
POST /api/user/logout/
Authorization: Token <token>
```

#### Change Password
```
POST /api/user/change_password/
Authorization: Token <token>
Content-Type: application/json

{
  "old_password": "current_password",
  "new_password": "new_password"
}
```

### Organization Management

**Base URL**: `/api/organization/`

#### List Organizations
```
GET /api/organization/
Authorization: Token <token>
```
Returns all organizations the user is a member of.

#### Create Organization
```
POST /api/organization/
Authorization: Token <token>
Content-Type: application/json

{
  "name": "My Organization"
}
```
Automatically creates an `OWNER` membership for the creator and sets it as their default organization.

#### Get Organization Members
```
GET /api/organization/{org_id}/members/
Authorization: Token <token>
```

#### Invite Member
```
POST /api/organization/{org_id}/invite_member/
Authorization: Token <token>
Content-Type: application/json

{
  "email": "newuser@example.com"
}
```
Sends email invitation to join the organization.

#### Accept Invite
```
POST /api/organization/{invite_id}/accept_invite/
Authorization: Token <token>
```
Accepts a pending organization invite and sets it as the user's default organization.

#### Get Pending Invites
```
GET /api/organization/pending_invites/
Authorization: Token <token>
```

#### Remove Member (Owner Only)
```
POST /api/organization/{org_id}/remove_member/
Authorization: Token <token>
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Get Sent Invites
```
GET /api/organization/{org_id}/sent_invites/
Authorization: Token <token>
```

#### Cancel Invite (Owner Only)
```
POST /api/organization/{org_id}/cancel_invite/
Authorization: Token <token>
Content-Type: application/json

{
  "invite_id": "uuid-here"
}
```

#### Resend Invite (Owner Only)
```
POST /api/organization/{org_id}/resend_invite/
Authorization: Token <token>
Content-Type: application/json

{
  "invite_id": "uuid-here"
}
```

### Project Management

**Base URL**: `/api/organization/{org_id}/projects/`

#### List Projects
```
GET /api/organization/{org_id}/projects/
Authorization: Token <token>
```

#### Create Project (Member+)
```
POST /api/organization/{org_id}/projects/
Authorization: Token <token>
Content-Type: application/json

{
  "name": "My Project"
}
```

#### Update Project (Owner Only)
```
PATCH /api/organization/{org_id}/projects/{project_id}/
Authorization: Token <token>
Content-Type: application/json

{
  "name": "Updated Project Name"
}
```

#### Delete Project (Owner Only)
```
DELETE /api/organization/{org_id}/projects/{project_id}/
Authorization: Token <token>
```

#### Generate API Key (Member+)
```
POST /api/organization/{org_id}/projects/{project_id}/generate_api_key/
Authorization: Token <token>
```

Returns new API key (old key is automatically deleted).

### Memo Management

**Authentication**: Project API Key (Bearer token)

#### Create Memo
```
POST /api/v1/memo/
Authorization: Bearer sk_proj_...
Content-Type: application/json

{
  "content": "Memo content here...",
  "title": "Memo Title",
  "project_id": "project-uuid",
  "metadata": {},
  "reference_id": "optional-client-ref",
  "tags": ["tag1", "tag2"],
  "source": "optional-source",
  "expiration_date": "2025-12-31T23:59:59Z"
}
```

**Response**:
```json
{
  "ok": true
}
```

**Processing**:
1. Memo is created with `pending=true`
2. Message published to Redis: `{"memo_uuid": "uuid-here"}`
3. Memo Processing Server picks up the message
4. Parallel processing:
   - Text chunking + keyword extraction
   - Tag extraction
   - Summary generation
5. Memo marked as `pending=false`

See [Memo Processing Server Documentation](./memo-processing-server.md) for details.

#### List Memos
```
GET /api/v1/memo/
Authorization: Bearer sk_proj_...
```

Returns all memos in the project.

### Search API

**Authentication**: Project API Key (Bearer token)

**Supported Methods**:
- `summary_vector_search` - Semantic search on memo summaries
- `chunk_vector_search` - Semantic search on memo chunks
- `title_contains` - Case-insensitive title substring match
- `title_startswith` - Case-insensitive title prefix match

#### Search Memos
```
POST /api/v1/search/
Authorization: Bearer sk_proj_...
Content-Type: application/json

{
  "query": "search query",
  "search_method": "summary_vector_search",
  "limit": 10,
  "tags": ["optional", "tag", "filter"]
}
```

**Response**:
```json
{
  "results": [
    {
      "title": "Memo Title",
      "uuid": "memo-uuid",
      "content_snippet": "First 100 characters...",
      "summary": "Memo summary",
      "distance": 0.234
    }
  ]
}
```

**Distance Metric**:
- Vector searches use cosine distance (lower = more similar)
- Text searches return `distance: null`

**Implementation**: `skald/api/search_api.py:40-81`

### Chat API

**Authentication**: Project API Key (Bearer token)

RAG-powered chat interface using memo context.

#### Chat (Non-Streaming)
```
POST /api/v1/chat/
Authorization: Bearer sk_proj_...
Content-Type: application/json

{
  "query": "What is our product vision?",
  "stream": false
}
```

**Response**:
```json
{
  "ok": true,
  "response": "Based on the memos...",
  "intermediate_steps": []
}
```

#### Chat (Streaming)
```
POST /api/v1/chat/
Authorization: Bearer sk_proj_...
Content-Type: application/json

{
  "query": "What is our product vision?",
  "stream": true
}
```

**Response**: Server-Sent Events (SSE) stream
```
data: {"type": "token", "content": "Based"}
data: {"type": "token", "content": " on"}
data: {"type": "token", "content": " the"}
...
data: {"type": "done"}
```

**Implementation**: `skald/api/chat_api.py:30-99`

**Processing Flow**:
1. Query received
2. Context preparation via vector search + reranking
3. Context passed to chat agent with query
4. Response generated (streamed or complete)

### Health Check

```
GET /api/health
```

No authentication required. Returns server health status.

## Security

### API Key Security

**Generation**: `skald/utils/api_key_utils.py:12-14`
- Uses `secrets.token_hex(20)` for cryptographically secure randomness
- 40-character hex string (160 bits of entropy)
- Prefixed with `sk_proj_` for identification

**Storage**: `skald/models/project.py:36-44`
- Only SHA3-256 hash stored in database
- Original key never stored
- First 12 characters stored separately for UI display

**Transmission**:
- HTTPS required for production
- Bearer token format
- No key in URL parameters (header only)

**Rotation**:
- Old key automatically deleted when generating new key
- No grace period (immediate invalidation)
- Client must update immediately

### Email Verification

**Model**: `skald/models/user.py:88-98`

**Flow**:
1. User signs up
2. 6-digit code generated and emailed
3. User submits code
4. Server verifies code + expiration
5. `user.email_verified` set to `true`

**Enforcement**:
- Required for all organization operations
- Checked in `@require_access_level` decorator
- Bypass available via `EMAIL_VERIFICATION_ENABLED` setting

**Rate Limiting**:
- Maximum attempts tracked in `EmailVerificationCode.attempts`

### CSRF Protection

**Web Endpoints**: CSRF tokens required by default (Django middleware)

**API Endpoints**: CSRF exempted with `@csrf_exempt` decorator
- `MemoViewSet` (`skald/api/memo_api.py:46`)
- `SearchView` (`skald/api/search_api.py:36`)
- `ChatView` (`skald/api/chat_api.py:16`)

**Justification**: API key authentication provides sufficient protection for programmatic access.

### CORS

**Configuration**: Managed via Django CORS middleware

**Chat API**: Explicit CORS headers for streaming responses
```python
# skald/api/chat_api.py:77-80
response["Access-Control-Allow-Origin"] = "*"
response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
response["Access-Control-Allow-Headers"] = "Content-Type"
```

### Permission Enforcement

**Two-Layer Model**:

1. **Authentication Layer**: Verify identity
   - Token authentication for users
   - API key authentication for projects

2. **Authorization Layer**: Verify permissions
   - Organization membership + role check
   - Project scoping via API key

**Enforcement Points**:
- View-level: `permission_classes` + mixins
- Method-level: `@require_access_level` decorator
- Object-level: `has_object_permission` checks

**Examples**:

**Organization Owner Only**:
```python
@require_access_level(OrganizationMembershipRole.OWNER)
def remove_member(self, request, pk=None):
    # Only owners can remove members
```

**Organization Member or Higher**:
```python
class ProjectViewSet(OrganizationPermissionMixin, viewsets.ModelViewSet):
    required_access_level = OrganizationMembershipRole.MEMBER
```

**Project Scoped**:
```python
class MemoViewSet(ProjectApiKeyPermissionMixin, viewsets.ModelViewSet):
    def get_queryset(self):
        return Memo.objects.filter(project=self.get_project())
```

## Error Responses

### Authentication Errors

**Missing Token**:
```json
{
  "detail": "Authentication credentials were not provided."
}
```
Status: `401 Unauthorized`

**Invalid Token**:
```json
{
  "detail": "Invalid token."
}
```
Status: `401 Unauthorized`

**Invalid API Key**:
```
ProjectApiKey.DoesNotExist exception
```
Status: `500 Internal Server Error` (handled by Django)

### Authorization Errors

**Email Not Verified**:
```json
{
  "detail": "Email not verified"
}
```
Status: `403 Forbidden`

**Insufficient Permissions**:
```json
{
  "detail": "You do not have enough permissions to access this resource"
}
```
Status: `403 Forbidden`

**Not Organization Member**:
```json
{
  "detail": "You are not a member of this organization"
}
```
Status: `403 Forbidden`

### Validation Errors

**Missing Required Field**:
```json
{
  "field_name": ["This field is required."]
}
```
Status: `400 Bad Request`

**Invalid Data**:
```json
{
  "error": "Query is required"
}
```
Status: `400 Bad Request`

## Rate Limiting

**Not Currently Implemented**

Considerations for future implementation:
- Per-user rate limits for web API
- Per-API-key rate limits for programmatic access
- Separate limits for expensive operations (chat, search)
- Redis-backed rate limiting (already available in stack)

## Best Practices

### For Web Applications

1. **Token Storage**: Store tokens securely (httpOnly cookies or secure storage)
2. **Token Refresh**: Implement token refresh or re-authentication flow
3. **Logout**: Always call logout endpoint to invalidate tokens
4. **Email Verification**: Guide users through verification before full access

### For Programmatic Access

1. **API Key Security**:
   - Never commit API keys to version control
   - Store keys in environment variables or secret management systems
   - Rotate keys periodically
   - Use separate keys for different environments (dev/staging/prod)

2. **Error Handling**:
   - Handle 401/403 responses gracefully
   - Implement exponential backoff for rate limiting
   - Log authentication failures for monitoring

3. **Project Scoping**:
   - One API key per project
   - Separate projects for different environments
   - Don't share API keys across applications

4. **HTTPS**:
   - Always use HTTPS in production
   - API keys transmitted in plain text over HTTP are vulnerable

### For API Development

1. **Permission Checks**:
   - Always use mixins for organization-scoped endpoints
   - Use `@require_access_level` for granular control
   - Implement `get_queryset()` filtering for automatic scoping

2. **Authentication**:
   - Choose appropriate authentication method per endpoint
   - Use `@csrf_exempt` sparingly and document why
   - Add explicit CORS headers for streaming responses

3. **Testing**:
   - Test permission boundaries (try access with insufficient role)
   - Test cross-organization access prevention
   - Test API key authentication flow
   - Test email verification enforcement
