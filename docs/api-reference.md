# API Reference

Complete API reference for Skald 2.0. All endpoints return JSON unless otherwise specified.

## Table of Contents

- [Authentication](#authentication)
- [Health Check](#health-check)
- [User Management](#user-management)
- [Email Verification](#email-verification)
- [Organization Management](#organization-management)
- [Subscription Management](#subscription-management)
- [Project Management](#project-management)
- [Memo Management](#memo-management)
- [Search](#search)
- [Chat](#chat)
- [Generate Document](#generate-document)

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

Check if the API is running and dependencies are accessible. Checks database connectivity.

**Authentication:** None

**Response (Healthy):**

```json
{
    "status": "ok",
    "checks": {
        "database": true
    }
}
```

**Response (Unhealthy - 503):**

```json
{
    "status": "unhealthy",
    "checks": {
        "database": false
    },
    "errors": ["Database connection failed: <error details>"]
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
        "current_project": null,
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
        "current_project": "project-uuid",
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
    "current_project": "project-uuid",
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

### POST /api/user/set_current_project

Set the user's currently selected project. This persists the user's project selection across browser sessions.

**Authentication:** Token (required)

**Request:**

```json
{
    "project_uuid": "project-uuid"
}
```

**Response:**

```json
{
    "email": "user@example.com",
    "default_organization": "org-uuid",
    "current_project": "project-uuid",
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

**Error Responses:**

Missing project_uuid (400):

```json
{
    "error": "project_uuid is required"
}
```

Project not found (404):

```json
{
    "error": "Project not found"
}
```

Project not in user's organization (403):

```json
{
    "error": "Project does not belong to your current organization"
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

## Subscription Management

### GET /api/organization/{organization_id}/subscription/subscription

Get current subscription details for the organization.

**Authentication:** Token (required)
**Permission:** Organization member

**Response:**

```json
{
    "uuid": "subscription-uuid",
    "organization": "org-uuid",
    "plan": {
        "uuid": "plan-uuid",
        "slug": "pro",
        "name": "Pro",
        "stripe_price_id": "price_xxx",
        "monthly_price": "29.00",
        "memo_operations_limit": 80000,
        "chat_queries_limit": 10000,
        "projects_limit": 5,
        "features": {},
        "is_default": false
    },
    "stripe_customer_id": "cus_xxx",
    "stripe_subscription_id": "sub_xxx",
    "status": "active",
    "current_period_start": "2025-01-01T00:00:00Z",
    "current_period_end": "2025-02-01T00:00:00Z",
    "cancel_at_period_end": false,
    "scheduled_plan": null,
    "scheduled_change_date": null
}
```

**Note:** `scheduled_plan` and `scheduled_change_date` will be populated if a plan change has been scheduled for the end of the billing period.

### POST /api/organization/{organization_id}/subscription/upgrade

Smart upgrade endpoint for free to paid plan transitions. Attempts to create subscription with saved payment method first, then falls back to checkout session if needed.

**Authentication:** Token (required)
**Permission:** Organization owner

**Request:**

```json
{
    "plan_slug": "pro",
    "success_url": "https://app.example.com/subscription?success=true",
    "cancel_url": "https://app.example.com/subscription?canceled=true"
}
```

**Response (Subscription created with saved payment):**

```json
{
    "status": "subscription_created",
    "subscription": {
        "uuid": "subscription-uuid",
        "plan": { ... },
        ...
    }
}
```

**Response (Checkout required):**

```json
{
    "status": "checkout_required",
    "checkout_url": "https://checkout.stripe.com/...",
    "reason": "No saved payment method found"
}
```

**Error Response (400):**

```json
{
    "error": "plan_slug, success_url, and cancel_url are required"
}
```

**Note:** This endpoint intelligently handles the upgrade flow by first attempting to use a saved payment method (from previous subscriptions or portal setup), and only redirecting to checkout if necessary.

### POST /api/organization/{organization_id}/subscription/checkout

Create a Stripe checkout session to subscribe to or upgrade to a paid plan. Use this for initial subscriptions or when you want to force a checkout flow.

**Authentication:** Token (required)
**Permission:** Organization owner

**Request:**

```json
{
    "plan_slug": "pro",
    "success_url": "https://app.example.com/subscription?success=true",
    "cancel_url": "https://app.example.com/subscription?canceled=true"
}
```

**Response:**

```json
{
    "checkout_url": "https://checkout.stripe.com/..."
}
```

### POST /api/organization/{organization_id}/subscription/portal

Get Stripe Customer Portal URL for managing payment methods and viewing invoices.

**Authentication:** Token (required)
**Permission:** Organization owner

**Request:**

```json
{
    "return_url": "https://app.example.com/subscription"
}
```

**Response:**

```json
{
    "portal_url": "https://billing.stripe.com/..."
}
```

**Error Response (400):**

```json
{
    "error": "No active subscription to manage. Please upgrade to a paid plan first."
}
```

### POST /api/organization/{organization_id}/subscription/change_plan

Change the organization's subscription plan. Upgrades are immediate, downgrades are scheduled for the end of the current billing period.

**Authentication:** Token (required)
**Permission:** Organization owner

**Request:**

```json
{
    "plan_slug": "basic"
}
```

**Response:**

```json
{
    "status": "success",
    "subscription": {
        "uuid": "subscription-uuid",
        "plan": { ... },
        "scheduled_plan": {
            "uuid": "plan-uuid",
            "slug": "basic",
            "name": "Basic",
            ...
        },
        "scheduled_change_date": "2025-02-01T00:00:00Z",
        ...
    }
}
```

**Error Responses:**

Already scheduled (400):

```json
{
    "error": "A plan change to Pro is already scheduled for February 1, 2025. Please cancel the existing scheduled change before making a new one."
}
```

Use checkout for free to paid (400):

```json
{
    "error": "Use checkout session to upgrade from free plan"
}
```

### POST /api/organization/{organization_id}/subscription/cancel_scheduled_change

Cancel a scheduled plan change.

**Authentication:** Token (required)
**Permission:** Organization owner

**Response:**

```json
{
    "status": "success",
    "subscription": {
        "uuid": "subscription-uuid",
        "plan": { ... },
        "scheduled_plan": null,
        "scheduled_change_date": null,
        ...
    }
}
```

**Error Response (400):**

```json
{
    "error": "No scheduled plan change to cancel"
}
```

### GET /api/organization/{organization_id}/subscription/usage

Get current billing period usage statistics.

**Authentication:** Token (required)
**Permission:** Organization member

**Response:**

```json
{
    "billing_period_start": "2025-01-01",
    "billing_period_end": "2025-02-01",
    "usage": {
        "memo_operations": {
            "count": 45000,
            "limit": 80000,
            "percentage": 56.25
        },
        "chat_queries": {
            "count": 3500,
            "limit": 10000,
            "percentage": 35.0
        },
        "projects": {
            "count": 3,
            "limit": 5,
            "percentage": 60.0
        }
    }
}
```

### GET /api/organization/{organization_id}/subscription/usage_history

Get usage history for previous billing periods (last 12 months).

**Authentication:** Token (required)
**Permission:** Organization member

**Response:**

```json
[
    {
        "billing_period_start": "2024-12-01",
        "billing_period_end": "2025-01-01",
        "memo_operations_count": 72000,
        "chat_queries_count": 8900,
        "projects": 4
    },
    ...
]
```

### GET /api/plans

List all available subscription plans. This endpoint is public and doesn't require authentication.

**Authentication:** None

**Response:**

```json
[
    {
        "uuid": "plan-uuid",
        "slug": "free",
        "name": "Free",
        "stripe_price_id": null,
        "monthly_price": "0.00",
        "memo_operations_limit": 10000,
        "chat_queries_limit": 1000,
        "projects_limit": 1,
        "features": {},
        "is_default": true
    },
    {
        "uuid": "plan-uuid",
        "slug": "basic",
        "name": "Basic",
        "stripe_price_id": "price_xxx",
        "monthly_price": "9.00",
        "memo_operations_limit": 20000,
        "chat_queries_limit": 2500,
        "projects_limit": 2,
        "features": {},
        "is_default": false
    }
]
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

List all memos in the project (paginated).

**Authentication:** Project API Key or Token (required)

**Query Parameters:**

- `page` (integer, optional): Page number (default: 1)
- `page_size` (integer, optional): Number of results per page (default: 20, max: 100)

**Response:**

```json
{
    "count": 45,
    "next": "http://api.example.com/api/v1/memo?page=2",
    "previous": null,
    "results": [
        {
            "uuid": "memo-uuid",
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z",
            "title": "Meeting Notes",
            "summary": "Discussion about Q1 goals",
            "content_length": 1234,
            "metadata": { "type": "notes" },
            "client_reference_id": "external-id-123"
        }
    ]
}
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

Get memo details by UUID or client reference ID.

**Authentication:** Project API Key or Token (required)

**Query Parameters:**

- `id_type` (string, optional): Type of identifier used. Must be either:
    - `memo_uuid` (default) - Use memo UUID
    - `reference_id` - Use client_reference_id
- `project_id` (UUID): **Required when using Token Authentication**

**Examples:**

Get by UUID (default):

```
GET /api/v1/memo/550e8400-e29b-41d4-a716-446655440000?project_id={project-uuid}
```

Get by client reference ID:

```
GET /api/v1/memo/external-id-123?id_type=reference_id&project_id={project-uuid}
```

**Response:**

```json
{
    "uuid": "memo-uuid",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "title": "Meeting Notes",
    "content": "Full content of the memo...",
    "summary": "Discussion about Q1 goals",
    "content_length": 1234,
    "metadata": { "type": "notes" },
    "client_reference_id": "external-id-123",
    "source": "notion",
    "type": "document",
    "expiration_date": "2024-12-31T23:59:59Z",
    "archived": false,
    "pending": false,
    "tags": [
        {
            "uuid": "tag-uuid",
            "tag": "meeting"
        }
    ],
    "chunks": [
        {
            "uuid": "chunk-uuid",
            "chunk_content": "First chunk content...",
            "chunk_index": 0
        }
    ]
}
```

**Error Responses:**

Invalid id_type (400):

```json
{
    "error": "id_type must be either 'memo_uuid' or 'reference_id'"
}
```

Memo not found (404):

```json
{
    "error": "Memo not found"
}
```

### PATCH /api/v1/memo/{memo_id}

Partially update an existing memo by UUID or client reference ID. If the content is updated, all related data (summary, tags, chunks) will be deleted and the memo will be reprocessed.

**Authentication:** Project API Key or Token (required)

**Query Parameters:**

- `id_type` (string, optional): Type of identifier used. Must be either:
    - `memo_uuid` (default) - Use memo UUID
    - `reference_id` - Use client_reference_id
- `project_id` (UUID): **Required when using Token Authentication**

**Examples:**

Update by UUID (default):

```
PATCH /api/v1/memo/550e8400-e29b-41d4-a716-446655440000?project_id={project-uuid}
```

Update by client reference ID:

```
PATCH /api/v1/memo/external-id-123?id_type=reference_id&project_id={project-uuid}
```

**Request:**

```json
{
    "title": "Updated Title",
    "metadata": { "type": "updated" },
    "client_reference_id": "new-ref-id",
    "source": "updated-source",
    "expiration_date": "2025-12-31T23:59:59Z",
    "content": "Updated content..."
}
```

**All Fields Optional:**

- `title` (string, max 255 chars): Update the memo title
- `metadata` (object): Update custom JSON metadata
- `client_reference_id` (string, max 255 chars): Update external reference ID
- `source` (string, max 255 chars): Update source system name
- `expiration_date` (datetime): Update expiration date
- `content` (string): Update the memo content (triggers reprocessing)

**Response:**

```json
{
    "ok": true
}
```

**Notes:**

- When `content` is updated, the memo is automatically reprocessed (summary, tags, and chunks are regenerated)
- When other fields are updated without `content`, related data is preserved
- No authorization checks are needed for `project_id` - access is verified through memo ownership

**Error Responses:**

Invalid id_type (400):

```json
{
    "error": "id_type must be either 'memo_uuid' or 'reference_id'"
}
```

Memo not found (404):

```json
{
    "error": "Memo not found"
}
```

Access denied (403):

```json
{
    "error": "Resource does not belong to the project"
}
```

or

```json
{
    "error": "Access denied"
}
```

### DELETE /api/v1/memo/{memo_id}

Delete a memo by UUID or client reference ID and all its associated data (content, summary, tags, chunks).

**Authentication:** Project API Key or Token (required)

**Query Parameters:**

- `id_type` (string, optional): Type of identifier used. Must be either:
    - `memo_uuid` (default) - Use memo UUID
    - `reference_id` - Use client_reference_id
- `project_id` (UUID): **Required when using Token Authentication**

**Examples:**

Delete by UUID (default):

```
DELETE /api/v1/memo/550e8400-e29b-41d4-a716-446655440000?project_id={project-uuid}
```

Delete by client reference ID:

```
DELETE /api/v1/memo/external-id-123?id_type=reference_id&project_id={project-uuid}
```

**Response:** `204 No Content`

**Error Responses:**

Invalid id_type (400):

```json
{
    "error": "id_type must be either 'memo_uuid' or 'reference_id'"
}
```

Memo not found (404):

```json
{
    "error": "Memo not found"
}
```

Access denied (403):

```json
{
    "error": "Resource does not belong to the project"
}
```

or

```json
{
    "error": "Access denied"
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

Search through memos using various methods with advanced filtering capabilities.

**Authentication:** Project API Key or Token (required)

**Request (using Project API Key):**

```json
{
    "query": "quarterly goals",
    "search_method": "chunk_vector_search",
    "limit": 10,
    "filters": [
        {
            "field": "source",
            "operator": "eq",
            "value": "notion",
            "filter_type": "native_field"
        },
        {
            "field": "level",
            "operator": "eq",
            "value": "beginner",
            "filter_type": "custom_metadata"
        },
        {
            "field": "tags",
            "operator": "in",
            "value": ["meeting", "q1"],
            "filter_type": "native_field"
        }
    ]
}
```

**Request (using Token Authentication):**

```json
{
    "query": "quarterly goals",
    "search_method": "chunk_vector_search",
    "project_id": "project-uuid",
    "limit": 10,
    "filters": [
        {
            "field": "source",
            "operator": "eq",
            "value": "notion",
            "filter_type": "native_field"
        }
    ]
}
```

**Parameters:**

- `query` (string, required): The search query
- `search_method` (string, required): One of:
    - `chunk_vector_search` - Semantic search on memo chunks
    - `title_contains` - Case-insensitive substring match on titles
    - `title_startswith` - Case-insensitive prefix match on titles
- `project_id` (UUID, optional): **Only required when using Token Authentication**
- `limit` (integer, optional): Max results to return (1-50, default 10)
- `filters` (array of filter objects, optional): Array of filters to apply (see Filter Objects below)

#### Filter Objects

Each filter object supports the following structure:

```json
{
    "field": "field_name",
    "operator": "operator_name",
    "value": "value or [array]",
    "filter_type": "native_field | custom_metadata"
}
```

**Filter Types:**

1. **native_field** - Filter on built-in memo fields:
    - `title` - Memo title
    - `source` - Source system name
    - `client_reference_id` - External reference ID
    - `tags` - Memo tags (must use `in` or `not_in` operator with array value)

2. **custom_metadata** - Filter on custom metadata fields:
    - Any field from the memo's `metadata` JSON object

**Supported Operators:**

- `eq` - Equals (exact match)
- `neq` - Not equals
- `contains` - Contains substring (case-insensitive)
- `startswith` - Starts with (case-sensitive)
- `endswith` - Ends with (case-sensitive)
- `in` - Value is in array (requires array value)
- `not_in` - Value is not in array (requires array value)

**Filter Examples:**

Filter by source:

```json
{
    "field": "source",
    "operator": "eq",
    "value": "notion",
    "filter_type": "native_field"
}
```

Filter by custom metadata:

```json
{
    "field": "category",
    "operator": "contains",
    "value": "tutorial",
    "filter_type": "custom_metadata"
}
```

Filter by tags (tags always require array value):

```json
{
    "field": "tags",
    "operator": "in",
    "value": ["meeting", "q1"],
    "filter_type": "native_field"
}
```

Filter by multiple sources:

```json
{
    "field": "source",
    "operator": "in",
    "value": ["notion", "confluence"],
    "filter_type": "native_field"
}
```

**Combining Filters:**

Multiple filters use AND logic - all filters must match:

```json
{
    "query": "python",
    "search_method": "title_contains",
    "filters": [
        {
            "field": "source",
            "operator": "eq",
            "value": "docs.python.org",
            "filter_type": "native_field"
        },
        {
            "field": "level",
            "operator": "eq",
            "value": "beginner",
            "filter_type": "custom_metadata"
        },
        {
            "field": "tags",
            "operator": "in",
            "value": ["tutorial"],
            "filter_type": "native_field"
        }
    ]
}
```

This returns only memos where:

- Title contains "python" AND
- Source equals "docs.python.org" AND
- Metadata field "level" equals "beginner" AND
- Has at least one tag in ["tutorial"]

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
- Filters work with all search methods
- Empty filters array is equivalent to no filters

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
    "error": "Search method is required and must be one of: title_contains, title_startswith, chunk_vector_search"
}
```

Limit too high (400):

```json
{
    "error": "Limit must be less than or equal to 50"
}
```

Invalid filter (400):

```json
{
    "error": "Invalid filter: <specific error message>"
}
```

Common filter errors:

- Missing required fields (`field`, `operator`, `value`, `filter_type`)
- Invalid operator (must be one of: `eq`, `neq`, `contains`, `startswith`, `endswith`, `in`, `not_in`)
- Invalid filter_type (must be `native_field` or `custom_metadata`)
- Invalid native field (must be `title`, `source`, `client_reference_id`, or `tags`)
- Tags filter must use `in` or `not_in` operator with array value
- `in` and `not_in` operators require array value

---

## Chat

### POST /api/v1/chat

Ask questions about your knowledge base using an AI agent with optional filtering to focus the search context. See [Chat API Documentation](./chat.md) for detailed information.

**Authentication:** Project API Key or Token (required)

**Request (using Project API Key):**

```json
{
    "query": "What were the main points discussed in the Q1 meeting?",
    "stream": false,
    "filters": [
        {
            "field": "source",
            "operator": "eq",
            "value": "meeting-notes",
            "filter_type": "native_field"
        },
        {
            "field": "tags",
            "operator": "in",
            "value": ["q1", "meeting"],
            "filter_type": "native_field"
        }
    ]
}
```

**Request (using Token Authentication):**

```json
{
    "query": "What were the main points discussed in the Q1 meeting?",
    "project_id": "project-uuid",
    "stream": false,
    "filters": [
        {
            "field": "category",
            "operator": "eq",
            "value": "meeting",
            "filter_type": "custom_metadata"
        }
    ]
}
```

**Parameters:**

- `query` (string, required): The question to ask
- `project_id` (UUID, optional): **Only required when using Token Authentication**
- `stream` (boolean, optional): Enable streaming responses (default: false)
- `filters` (array of filter objects, optional): Filters to narrow the search context (see [Search Filters](#filter-objects) for full documentation)

**Filter Support:**

The chat endpoint uses the same filter structure as the search endpoint. You can filter by:

- **Native fields**: `title`, `source`, `client_reference_id`, `tags`
- **Custom metadata**: Any field from the memo's `metadata` object
- **Operators**: `eq`, `neq`, `contains`, `startswith`, `endswith`, `in`, `not_in`

Filters are applied during the initial retrieval of relevant context, allowing you to:

- Focus the chat on specific sources (e.g., only Notion docs)
- Limit to specific time periods via metadata
- Query only memos with certain tags
- Exclude certain categories of content

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

Invalid filters (400):

```json
{
    "error": "Filters must be a list"
}
```

Invalid filter structure (400):

```json
{
    "error": "Invalid filter: <specific error message>"
}
```

**Citation Format:**

Responses include inline citations in the format `[[N]]` where N is the result number from the retrieved context.

---

## Generate Document

### POST /api/v1/generate

Generate documents based on prompts and retrieved context from the knowledge base with optional filtering to control context sources. Similar to chat but optimized for document generation with optional style/format rules.

**Authentication:** Project API Key or Token (required)

**Request (using Project API Key):**

```json
{
    "prompt": "Create a product requirements document for a new mobile app",
    "rules": "Use formal business language. Include sections for: Overview, Requirements, Technical Specifications, Timeline",
    "stream": false,
    "filters": [
        {
            "field": "source",
            "operator": "in",
            "value": ["product-specs", "user-research"],
            "filter_type": "native_field"
        },
        {
            "field": "document_type",
            "operator": "eq",
            "value": "specification",
            "filter_type": "custom_metadata"
        }
    ]
}
```

**Request (using Token Authentication):**

```json
{
    "prompt": "Create a product requirements document for a new mobile app",
    "project_id": "project-uuid",
    "rules": "Use formal business language. Include sections for: Overview, Requirements, Technical Specifications, Timeline",
    "stream": false,
    "filters": [
        {
            "field": "tags",
            "operator": "in",
            "value": ["mobile", "product"],
            "filter_type": "native_field"
        }
    ]
}
```

**Parameters:**

- `prompt` (string, required): Description of what document to generate
- `rules` (string, optional): Style guidelines, format requirements, or structural rules for the generated document
- `project_id` (UUID, optional): **Only required when using Token Authentication**
- `stream` (boolean, optional): Enable streaming responses (default: false)
- `filters` (array of filter objects, optional): Filters to control which memos are used as context (see [Search Filters](#filter-objects) for full documentation)

**Filter Support:**

The generate endpoint uses the same filter structure as the search endpoint. You can filter by:

- **Native fields**: `title`, `source`, `client_reference_id`, `tags`
- **Custom metadata**: Any field from the memo's `metadata` object
- **Operators**: `eq`, `neq`, `contains`, `startswith`, `endswith`, `in`, `not_in`

Filters are applied during context retrieval, allowing you to:

- Generate documents from specific sources only (e.g., only technical docs)
- Use only recent content via metadata timestamps
- Include/exclude specific categories
- Combine multiple sources strategically

**Response (Non-streaming):**

```json
{
    "ok": true,
    "response": "# Product Requirements Document\n\n## Overview\nBased on the context from your knowledge base...",
    "intermediate_steps": []
}
```

**Response (Streaming):**

When `stream: true`, returns Server-Sent Events:

```
Content-Type: text/event-stream

: ping

data: {"type": "token", "content": "#"}

data: {"type": "token", "content": " Product"}

data: {"type": "done"}
```

**Error Responses:**

Missing prompt (400):

```json
{
    "error": "Prompt is required"
}
```

Invalid filter structure (400):

```json
{
    "error": "Invalid filter: <specific error message>"
}
```

**Use Cases:**

- Generate documentation from existing knowledge
- Create reports based on stored information
- Compile research summaries with specific formatting
- Generate technical specifications with style constraints
- Create focused documents using filtered context sources

**How It Works:**

1. System retrieves relevant context from knowledge base based on prompt (with optional filters applied)
2. Context is combined with prompt and optional rules
3. AI agent generates structured document
4. Response includes citations to source memos

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
