# Database Models Reference

Complete reference for all database models in the Skald system.

## Table of Contents

- [Organization Models](#organization-models)
- [User Models](#user-models)
- [Project Models](#project-models)
- [Memo Models](#memo-models)
- [Model Relationships Diagram](#model-relationships-diagram)

---

## Organization Models

### Organization

**File:** `organization.py:7`

Represents a team or company that owns projects and has members.

#### Fields

| Field        | Type             | Description                                              |
| ------------ | ---------------- | -------------------------------------------------------- |
| `uuid`       | UUIDField        | Primary key, auto-generated UUID                         |
| `created_at` | DateTimeField    | Timestamp when organization was created (auto)           |
| `updated_at` | DateTimeField    | Timestamp of last update (auto)                          |
| `name`       | CharField(255)   | Organization name                                        |
| `owner`      | ForeignKey(User) | Organization owner (related_name: `owned_organizations`) |

#### Relationships

- **Owner**: Many-to-one with User (one user owns the organization)
- **Members**: Many-to-many with User through OrganizationMembership
- **Projects**: One-to-many with Project (related_name: `projects`)

---

## User Models

### User

**File:** `user.py:43`

Custom user model extending Django's AbstractUser. Uses email instead of username for authentication.

#### Fields

| Field                  | Type                     | Description                                                                  |
| ---------------------- | ------------------------ | ---------------------------------------------------------------------------- |
| `id`                   | AutoField                | Primary key (inherited)                                                      |
| `email`                | EmailField               | User's email address (unique, used for login)                                |
| `password`             | CharField                | Hashed password (inherited)                                                  |
| `first_name`           | CharField                | First name (inherited)                                                       |
| `last_name`            | CharField                | Last name (inherited)                                                        |
| `name`                 | CharField(255)           | Full name (blank allowed)                                                    |
| `is_staff`             | BooleanField             | Django admin access flag (inherited)                                         |
| `is_superuser`         | BooleanField             | Superuser flag (inherited)                                                   |
| `is_active`            | BooleanField             | Account active status (inherited)                                            |
| `date_joined`          | DateTimeField            | Account creation timestamp (inherited)                                       |
| `last_login`           | DateTimeField            | Last login timestamp (inherited)                                             |
| `default_organization` | ForeignKey(Organization) | Default organization (nullable)                                              |
| `current_project`      | ForeignKey(Project)      | Currently selected project (nullable, related_name: `current_project_users`) |
| `email_verified`       | BooleanField             | Email verification status (default: False)                                   |

#### Key Attributes

- `USERNAME_FIELD = "email"` - Uses email for authentication instead of username
- `username = None` - Username field is removed
- `REQUIRED_FIELDS = []` - No additional required fields beyond email and password
- `objects = UserManager()` - Custom user manager

#### Relationships

- **Default Organization**: Many-to-one with Organization (optional)
- **Current Project**: Many-to-one with Project (optional, related_name: `current_project_users`)
- **Owned Organizations**: One-to-many with Organization (related_name: `owned_organizations`)
- **Owned Projects**: One-to-many with Project (related_name: `owned_projects`)
- **Organization Memberships**: Many-to-many with Organization through OrganizationMembership

#### Notes

- Email verification can be disabled via `EMAIL_VERIFICATION_ENABLED` setting
- When email verification is disabled, accounts are automatically verified

---

### UserManager

**File:** `user.py:17`

Custom user manager for the User model. Extends Django's BaseUserManager.

#### Methods

##### `create_user(email, password=None, **extra_fields)`

Creates and saves a regular user.

**Parameters:**

- `email` (str): User's email address (required)
- `password` (str): User's password (optional)
- `**extra_fields`: Additional user fields

**Behavior:**

- Normalizes email address
- Auto-verifies email if `EMAIL_VERIFICATION_ENABLED = False`
- Hashes password before saving

##### `create_superuser(email, password=None, **extra_fields)`

Creates and saves a superuser with staff and admin privileges.

**Parameters:**

- `email` (str): Superuser's email address
- `password` (str): Superuser's password
- `**extra_fields`: Additional user fields

**Behavior:**

- Sets `is_staff=True` and `is_superuser=True`
- Validates that both flags are True
- Calls `create_user()` with superuser flags

---

### OrganizationMembership

**File:** `user.py:66`

Links users to organizations with role-based access control.

#### Fields

| Field          | Type                     | Description                                 |
| -------------- | ------------------------ | ------------------------------------------- |
| `id`           | AutoField                | Primary key                                 |
| `user`         | ForeignKey(User)         | Member user                                 |
| `organization` | ForeignKey(Organization) | Organization                                |
| `access_level` | IntegerField             | Role level (see OrganizationMembershipRole) |
| `joined_at`    | DateTimeField            | When user joined (auto)                     |

#### Constraints

- **Unique Together**: (`user`, `organization`) - One membership per user per organization

#### Default Values

- `access_level`: OrganizationMembershipRole.MEMBER (1)

---

### OrganizationMembershipRole

**File:** `user.py:10`

Enum defining organization access levels.

#### Values

| Role          | Value | Description                        |
| ------------- | ----- | ---------------------------------- |
| `MEMBER`      | 1     | Regular organization member        |
| `SUPER_ADMIN` | 19    | Administrative privileges          |
| `OWNER`       | 20    | Organization owner (highest level) |

#### Usage

```python
from skald.models.user import OrganizationMembershipRole

membership.access_level = OrganizationMembershipRole.SUPER_ADMIN
```

---

### OrganizationMembershipInvite

**File:** `user.py:76`

Manages invitations to join organizations.

#### Fields

| Field          | Type                     | Description                             |
| -------------- | ------------------------ | --------------------------------------- |
| `id`           | UUIDField                | Primary key, auto-generated UUID        |
| `organization` | ForeignKey(Organization) | Target organization                     |
| `invited_by`   | ForeignKey(User)         | User who sent the invitation            |
| `email`        | EmailField               | Invitee's email address                 |
| `created_at`   | DateTimeField            | Invitation creation timestamp (auto)    |
| `accepted_at`  | DateTimeField            | When invitation was accepted (nullable) |

#### Constraints

- **Unique Together**: (`organization`, `email`) - One pending invite per email per organization

#### Workflow

1. User with appropriate permissions creates invite
2. Email is sent to invitee
3. Invitee accepts (sets `accepted_at`)
4. OrganizationMembership is created

---

### EmailVerificationCode

**File:** `user.py:88`

Manages email verification codes for user registration.

#### Fields

| Field        | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `id`         | AutoField        | Primary key                                  |
| `user`       | ForeignKey(User) | User to verify (unique)                      |
| `code`       | CharField(6)     | 6-character verification code                |
| `created_at` | DateTimeField    | Code creation timestamp (auto)               |
| `expires_at` | DateTimeField    | Code expiration time                         |
| `attempts`   | IntegerField     | Number of verification attempts (default: 0) |

#### Indexes

- Index on `code` field for fast lookups

#### Notes

- `user` field has `unique=True` constraint - one active code per user
- Consider converting to OneToOneField (TODO in code)

---

## Project Models

### Project

**File:** `project.py:9`

Represents a project within an organization. Projects scope memos and API keys.

#### Fields

| Field          | Type                     | Description                                    |
| -------------- | ------------------------ | ---------------------------------------------- |
| `uuid`         | UUIDField                | Primary key, auto-generated UUID               |
| `created_at`   | DateTimeField            | Project creation timestamp (auto)              |
| `updated_at`   | DateTimeField            | Last update timestamp (auto)                   |
| `name`         | CharField(255)           | Project name                                   |
| `organization` | ForeignKey(Organization) | Parent organization (related_name: `projects`) |
| `owner`        | ForeignKey(User)         | Project owner (related_name: `owned_projects`) |

#### Properties

##### `has_api_key` (property)

Returns whether the project has at least one API key.

**Returns:** `bool`

**Implementation:** `project.py:32`

```python
@property
def has_api_key(self):
    return ProjectApiKey.objects.filter(project=self).exists()
```

#### Methods

##### `__str__()`

Returns string representation of the project.

**Returns:** `"{name} ({organization_name})"`

**Example:** `"My Project (Acme Corp)"`

#### Meta Options

- **Ordering**: `["-created_at"]` - Newest projects first

#### Relationships

- **Organization**: Many-to-one with Organization
- **Owner**: Many-to-one with User
- **Memos**: One-to-many with Memo (related_name: `memos`)
- **API Keys**: One-to-many with ProjectApiKey

---

### ProjectApiKey

**File:** `project.py:36`

Stores hashed API keys for project authentication.

#### Fields

| Field             | Type                | Description                          |
| ----------------- | ------------------- | ------------------------------------ |
| `api_key_hash`    | CharField(255)      | Primary key, hashed API key (unique) |
| `project`         | ForeignKey(Project) | Associated project                   |
| `first_12_digits` | CharField(12)       | First 12 characters for display      |
| `created_at`      | DateTimeField       | Key creation timestamp (auto)        |

#### Methods

##### `__str__()`

Returns string representation of the API key.

**Returns:** `"{project_name} - {api_key_hash}"`

#### Security Notes

- API keys are stored hashed (not plaintext)
- `first_12_digits` allows users to identify keys without exposing full value
- Hash is used as primary key (guaranteed unique)

---

## Memo Models

### Memo

**File:** `memo.py:9`

Main model representing a piece of knowledge/content in the system.

#### Fields

| Field                 | Type                | Description                                        |
| --------------------- | ------------------- | -------------------------------------------------- |
| `uuid`                | UUIDField           | Primary key, auto-generated UUID                   |
| `created_at`          | DateTimeField       | Memo creation timestamp (auto)                     |
| `updated_at`          | DateTimeField       | Last update timestamp (auto)                       |
| `title`               | CharField(255)      | Memo title                                         |
| `content_length`      | IntegerField        | Length of content in characters                    |
| `metadata`            | JSONField           | Flexible metadata storage (default: {})            |
| `expiration_date`     | DateTimeField       | Optional expiration date (nullable)                |
| `archived`            | BooleanField        | Archive status (default: False)                    |
| `content_hash`        | CharField(255)      | Hash of content for deduplication                  |
| `pending`             | BooleanField        | Processing status (default: True)                  |
| `type`                | CharField(255)      | Content type (e.g., "code", "document") (nullable) |
| `source`              | CharField(255)      | Content source (URL, filename, etc.) (nullable)    |
| `client_reference_id` | CharField(255)      | External system reference ID (nullable)            |
| `project`             | ForeignKey(Project) | Parent project (related_name: `memos`)             |

#### Properties

##### `content` (property)

Returns the full content of the memo.

**Returns:** `str`

**Implementation:** `memo.py:38`

```python
@property
def content(self) -> str:
    return MemoContent.objects.get(memo=self).content
```

**Note:** Content is stored separately in MemoContent for performance optimization.

##### `summary` (property)

Returns the AI-generated summary of the memo.

**Returns:** `str`

**Implementation:** `memo.py:42`

```python
@property
def summary(self) -> str:
    return MemoSummary.objects.get(memo=self).summary
```

#### Relationships

- **Project**: Many-to-one with Project
- **Content**: One-to-one with MemoContent
- **Summary**: One-to-one with MemoSummary
- **Tags**: One-to-many with MemoTag
- **Chunks**: One-to-many with MemoChunk
- **Related Memos**: Many-to-many with Memo through MemoRelationship

#### Workflow States

The `pending` field tracks processing status:

- `True`: Memo is being processed (chunking, embedding generation, summarization)
- `False`: Memo is fully processed and searchable

---

### MemoContent

**File:** `memo.py:54`

Stores the full content of a memo in a separate table for performance.

#### Fields

| Field     | Type             | Description                          |
| --------- | ---------------- | ------------------------------------ |
| `uuid`    | UUIDField        | Primary key, auto-generated UUID     |
| `memo`    | ForeignKey(Memo) | Parent memo                          |
| `content` | TextField        | Full memo content (unlimited length) |

#### Design Rationale

Content is separated from the main Memo model to:

- Improve query performance when content isn't needed
- Reduce table size for index operations
- Allow efficient pagination of memo lists

---

### MemoSummary

**File:** `memo.py:47`

Stores AI-generated summaries and their vector embeddings.

#### Fields

| Field       | Type              | Description                       |
| ----------- | ----------------- | --------------------------------- |
| `uuid`      | UUIDField         | Primary key, auto-generated UUID  |
| `memo`      | ForeignKey(Memo)  | Parent memo                       |
| `summary`   | TextField         | AI-generated summary text         |
| `embedding` | VectorField(2048) | 2048-dimensional vector embedding |

#### Vector Search

The `embedding` field enables semantic search:

- Generated using Voyage AI
- 2048 dimensions
- Uses pgvector for efficient similarity search
- See `vector_search.py:45` for search implementation

---

### MemoTag

**File:** `memo.py:60`

Associates tags with memos for categorization and filtering.

#### Fields

| Field  | Type             | Description                      |
| ------ | ---------------- | -------------------------------- |
| `uuid` | UUIDField        | Primary key, auto-generated UUID |
| `memo` | ForeignKey(Memo) | Tagged memo                      |
| `tag`  | TextField        | Tag text                         |

#### Usage

Tags enable:

- Categorization of memos
- Filtering in search queries
- Organizing knowledge base by topic/project/category

**Example:**

```python
# Add tags to a memo
MemoTag.objects.create(memo=memo, tag="python")
MemoTag.objects.create(memo=memo, tag="machine-learning")
```

---

### MemoRelationship

**File:** `memo.py:66`

Defines directed relationships between memos.

#### Fields

| Field               | Type             | Description                                      |
| ------------------- | ---------------- | ------------------------------------------------ |
| `uuid`              | UUIDField        | Primary key, auto-generated UUID                 |
| `memo`              | ForeignKey(Memo) | Source memo (related_name: `relationships_from`) |
| `related_memo`      | ForeignKey(Memo) | Target memo (related_name: `relationships_to`)   |
| `relationship_type` | TextField        | Type of relationship                             |

#### Relationship Types

Common relationship types (examples):

- `"references"` - Memo A references Memo B
- `"supersedes"` - Memo A supersedes/replaces Memo B
- `"related_to"` - General relation
- `"part_of"` - Memo A is part of Memo B

#### Direction

Relationships are directional:

- `memo` � `related_memo` represents one direction
- To create bidirectional, create two relationships

**Example:**

```python
# "Meeting Notes" references "Project Spec"
MemoRelationship.objects.create(
    memo=meeting_memo,
    related_memo=spec_memo,
    relationship_type="references"
)
```

---

### MemoChunk

**File:** `memo.py:77`

Stores content chunks with vector embeddings for granular semantic search.

#### Fields

| Field           | Type              | Description                                |
| --------------- | ----------------- | ------------------------------------------ |
| `uuid`          | UUIDField         | Primary key, auto-generated UUID           |
| `memo`          | ForeignKey(Memo)  | Parent memo                                |
| `chunk_content` | TextField         | Content of this chunk                      |
| `chunk_index`   | IntegerField      | Position in sequence of chunks (0-indexed) |
| `embedding`     | VectorField(2048) | 2048-dimensional vector embedding          |

#### Chunking Strategy

Memos are split into chunks to:

- Enable finding specific passages within large documents
- Improve search precision (vs searching entire documents)
- Provide context snippets in search results

#### Vector Search

- Each chunk has its own embedding
- Enables searching at passage-level granularity
- See `vector_search.py:18` for chunk search implementation

**Example Workflow:**

1. Large memo is ingested
2. Content is split into logical chunks
3. Each chunk is embedded using Voyage AI
4. Chunks are stored with embeddings
5. Search finds most relevant chunks, returns parent memo

---

### MemoChunkKeyword

**File:** `memo.py:85`

Stores extracted keywords from memo chunks.

#### Fields

| Field        | Type                  | Description                      |
| ------------ | --------------------- | -------------------------------- |
| `uuid`       | UUIDField             | Primary key, auto-generated UUID |
| `memo_chunk` | ForeignKey(MemoChunk) | Parent chunk                     |
| `keyword`    | TextField             | Extracted keyword                |

#### Use Cases

Keywords can be used for:

- Traditional keyword-based search
- Tag cloud generation
- Content analysis and categorization
- Hybrid search (combining keywords + vector search)

---

## Model Relationships Diagram

```mermaid
erDiagram
    %% Organization & User Models
    User ||--o{ Organization : "owns"
    User }o--o{ Organization : "member of"
    Organization ||--o{ OrganizationMembership : "has members"
    User ||--o{ OrganizationMembership : "memberships"
    User ||--o| Organization : "default_organization"

    Organization ||--o{ OrganizationMembershipInvite : "invites"
    User ||--o{ OrganizationMembershipInvite : "invited_by"

    User ||--o| EmailVerificationCode : "has verification"

    %% Project Models
    Organization ||--o{ Project : "contains"
    User ||--o{ Project : "owns"
    Project ||--o{ ProjectApiKey : "has keys"

    %% Memo Models
    Project ||--o{ Memo : "contains"
    Memo ||--|| MemoContent : "has content"
    Memo ||--|| MemoSummary : "has summary"
    Memo ||--o{ MemoTag : "tagged with"
    Memo ||--o{ MemoChunk : "chunked into"
    MemoChunk ||--o{ MemoChunkKeyword : "has keywords"
    Memo ||--o{ MemoRelationship : "relationships from"
    Memo ||--o{ MemoRelationship : "relationships to"

    %% Entity Definitions
    User {
        int id PK
        string email UK
        string password
        string name
        bool email_verified
        bool is_staff
        bool is_superuser
        bool is_active
        datetime date_joined
        uuid default_organization_id FK
    }

    Organization {
        uuid uuid PK
        string name
        datetime created_at
        datetime updated_at
        int owner_id FK
    }

    OrganizationMembership {
        int id PK
        int user_id FK
        uuid organization_id FK
        int access_level
        datetime joined_at
    }

    OrganizationMembershipInvite {
        uuid id PK
        uuid organization_id FK
        int invited_by_id FK
        string email
        datetime created_at
        datetime accepted_at
    }

    EmailVerificationCode {
        int id PK
        int user_id FK,UK
        string code
        datetime created_at
        datetime expires_at
        int attempts
    }

    Project {
        uuid uuid PK
        string name
        datetime created_at
        datetime updated_at
        uuid organization_id FK
        int owner_id FK
    }

    ProjectApiKey {
        string api_key_hash PK
        uuid project_id FK
        string first_12_digits
        datetime created_at
    }

    Memo {
        uuid uuid PK
        string title
        int content_length
        json metadata
        datetime expiration_date
        bool archived
        string content_hash
        bool pending
        string type
        string source
        string client_reference_id
        datetime created_at
        datetime updated_at
        uuid project_id FK
    }

    MemoContent {
        uuid uuid PK
        uuid memo_id FK
        text content
    }

    MemoSummary {
        uuid uuid PK
        uuid memo_id FK
        text summary
        vector embedding
    }

    MemoTag {
        uuid uuid PK
        uuid memo_id FK
        text tag
    }

    MemoRelationship {
        uuid uuid PK
        uuid memo_id FK
        uuid related_memo_id FK
        text relationship_type
    }

    MemoChunk {
        uuid uuid PK
        uuid memo_id FK
        text chunk_content
        int chunk_index
        vector embedding
    }

    MemoChunkKeyword {
        uuid uuid PK
        uuid memo_chunk_id FK
        text keyword
    }
```

## Key Design Patterns

### 1. UUID Primary Keys

Most models use UUID primary keys for:

- Distributed system compatibility
- Security (non-sequential IDs)
- Easy merging of data from multiple sources

**Exception:** User model uses auto-incrementing integer ID (Django default)

### 2. Timestamp Tracking

Most models include:

- `created_at` - Auto-set on creation
- `updated_at` - Auto-updated on modification

### 3. Soft Deletion

The `Memo.archived` field enables soft deletion:

- Memos aren't physically deleted
- Archived memos can be filtered out or restored

### 4. Content Separation

Large text fields are separated:

- `Memo` stores metadata only
- `MemoContent` stores full content
- `MemoSummary` stores summary + embedding

This improves query performance when content isn't needed.

### 5. Vector Embeddings

Vector fields use pgvector extension:

- 2048 dimensions (Voyage AI embeddings)
- Enables semantic similarity search
- Cosine distance for similarity calculation

### 6. Hierarchical Scoping

Data is scoped hierarchically:

```
Organization � Project � Memo
```

This enables:

- Multi-tenancy
- Access control
- Data isolation

### 7. Flexible Metadata

`Memo.metadata` JSON field allows:

- Client-specific data storage
- No schema changes needed
- Queryable using PostgreSQL JSON operators

## Related Files

- `skald/models/organization.py` - Organization model
- `skald/models/user.py` - User, membership, and authentication models
- `skald/models/project.py` - Project and API key models
- `skald/models/memo.py` - Memo and related content models
- `skald/embeddings/vector_search.py` - Vector search queries
- `skald/embeddings/generate_embedding.py` - Embedding generation
