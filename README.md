# Skald 2.0

## How to run

### Option 1: Docker Compose (Recommended for Development)

The easiest way to run the project locally with all dependencies:

```sh
# First time setup - build the image
docker-compose build

# Start the API and database
docker-compose up

# Access the API at http://localhost:8000
```

**Benefits:**

- ✅ No need to install PostgreSQL locally
- ✅ Code changes auto-reload (no rebuild needed)
- ✅ Migrations run automatically on startup
- ✅ Consistent environment across team

**When you need to rebuild:**

- Only when you change dependencies in `pyproject.toml`
- Run: `docker-compose build`

### Option 2: Local Development (Without Docker)

#### Pre-requisites

- Create a Langchain account and get your secret key
- Make sure you've created a db called `skald2` locally (or use another name and change the config on the servers)
- **LLM Provider API Key**: Get an API key from [OpenAI](https://platform.openai.com/), [Anthropic](https://console.anthropic.com/), or set up a local LLM (see LLM Provider Options below)
- **Voyage AI API Key**: Get your API key from [Voyage AI](https://www.voyageai.com/) for embeddings
- **PostgreSQL with pgvector**: Create a database with the vector extension

    ```sh
    createdb skald2
    psql -d skald2
    skald2=# CREATE EXTENSION vector;
    ```

#### Environment variables

See `.env.example` for a complete list of environment variables.

**Required:**

```
# Embeddings (required for vector search)
VOYAGE_API_KEY=<your Voyage API key>

# LLM Provider (choose one)
LLM_PROVIDER=openai  # Options: openai, anthropic, local

# OpenAI (if LLM_PROVIDER=openai)
OPENAI_API_KEY=<your OpenAI API key>
OPENAI_MODEL=gpt-4o-mini  # Default model

# Anthropic (if LLM_PROVIDER=anthropic)
ANTHROPIC_API_KEY=<your Anthropic API key>
ANTHROPIC_MODEL=claude-3-7-sonnet-20250219  # Default model

# Local LLM (if LLM_PROVIDER=local)
LOCAL_LLM_BASE_URL=http://localhost:11434/v1  # e.g., Ollama, LM Studio, vLLM
LOCAL_LLM_MODEL=llama3.1:8b
LOCAL_LLM_API_KEY=not-needed  # Most local servers don't need this
```

**Optional (for LangChain tracing):**

```
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=<your LangSmith API key>
LANGSMITH_PROJECT=<langsmith_project_name>
```

The LangSmith vars will be given to you during LangChain onboarding.

#### LLM Provider Options

Skald supports multiple LLM providers. Choose the one that works best for you:

**1. OpenAI (Default)**

- Most reliable and well-tested
- Requires OpenAI API key
- Recommended model: `gpt-4o-mini` (fast and cost-effective)

**2. Anthropic**

- Alternative to OpenAI
- Requires Anthropic API key
- Recommended model: `claude-3-5-sonnet-20241022`

# Configure .env

LLM_PROVIDER=local
LOCAL_LLM_BASE_URL=http://localhost:11434/v1
LOCAL_LLM_MODEL=llama3.1:8b

```

#### Authentication Bypass (Development Only)

To disable authentication for development/testing purposes, set:

```

DISABLE_AUTH=true

````

**⚠️ WARNING: Never use this in production!** This bypasses all authentication and authorization checks.

When `DISABLE_AUTH=true`:
- All API endpoints become accessible without authentication
- You must provide `project_id` in request bodies for project-scoped endpoints
- No user context is available (`request.user` will be `None`)
- This is useful for testing API functionality without setting up user accounts


#### Django server (local development)

From the root dir you can run commands like:

```sh
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
````

### Memo processing server

From inside `memo-processing-server`, run:

```sh
pnpm install
pnpm run dev
```

## Overview

We currently have one working endpoint which is `POST /api/memo`. This endpoint will receive the memo from the client and create it with pending=True.

pending=True denotes that it hasn't gone through the knowledge base update process yet.

Django will then publish a message to a Redis Pub Sub channel which sends the memo UUID to the Node server for processing. Note that this is for dev only!!! In production we can't do this because messages get lost, and because it won't work if we scale horizontally. In prod we'll be using a queue.

From here on out, there certainly will be bugs. The Memo Processing Server will then trigger the knowledge base update agent, which runs actions by itself. Why? I initially had it outputting in the right format and there were bugs because it was including markdown in JSON. This is highly experimental and one could very easily say that it plain sucks. I have a ton of ideas to make it better.

When a new memo gets added, we run various agents concurrently that process the data, these being:

- Tags extractor: extracts tags from the content
- Summary extractor: summarizes the content, also creates an embedding for the summary
- Chunk and vectorize: Generates chunks from the content and vectorizes them
- Chunk keywords extractor: Extracts keywords from chunks

Note that if you look at `skald/models/memo.py` you will see a bunch of other stuff. Maybe these shouldn't have been added from the start but yeah there's a lot of stuff not being used yet like "archived", relationships, expiration, etc.

Lastly, the UI has not been touched yet.

There are no projects and no organizations, all the data gets lumped into one.

## Mock Data Import

Import mock documentation and Wikipedia articles:

```sh
# Import both Odin docs and Wikipedia articles
python push_mock_docs.py --all --project-id YOUR_PROJECT_UUID

# Import only Odin documentation
python push_mock_docs.py --odin --project-id YOUR_PROJECT_UUID

# Import only Wikipedia articles
python push_mock_docs.py --wikipedia --project-id YOUR_PROJECT_UUID

# Add delay between requests to prevent rate limiting
python push_mock_docs.py --all --project-id YOUR_PROJECT_UUID --sleep 1.0
```

**Note**: You need to provide a valid project UUID. You can get this from your database or create a project first through the API.

## Production Deployment

For production, use the standard Docker build without docker-compose:

```sh
# Build the production image
docker build -t skald .

# Run with production settings
docker run --env-file .env -p 8000:8000 skald
```

This uses gunicorn and bakes the code into the image for optimal performance.
