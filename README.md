# Skald 2.0

## How to run

### Pre-requisites

- Create a Langchain account and get your secret key
- Make sure you've created a db called `skald2` locally (or use another name and change the config on the servers)

    ```sh
    createdb skald2
    psql -d skald2
    skald2=# CREATE EXTENSION vector;
    ```


### Environment variables

```
VOYAGE_API_KEY=<your Voyage API key>
OPENAI_API_KEY=<your OpenAI API key>
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=<your LangSmith API key>
LANGSMITH_PROJECT=<langsmith_project_name>
```

The LangSmith vars will be given to you during LangChain onboarding.


### Django server

From the root dir you can run commands like:

```sh
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```


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
python push_mock_docs.py --all

# Import only Odin documentation
python push_mock_docs.py --odin

# Import only Wikipedia articles  
python push_mock_docs.py --wikipedia

# Add delay between requests to prevent rate limiting
python push_mock_docs.py --all --sleep 1.0
``` 