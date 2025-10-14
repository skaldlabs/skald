# dockerfile for the skald django server
FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y curl gnupg wget cron && \
    apt-get install -y build-essential libpq-dev python3-dev git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    curl -LsSf https://astral.sh/uv/install.sh | sh

# include local user binaries
ENV PATH="/root/.local/bin:${PATH}"

# set the working directory to /app
WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy from the cache instead of linking since it's a mounted volume
ENV UV_LINK_MODE=copy

COPY pyproject.toml /app/pyproject.toml
COPY extract_deps.py /app/extract_deps.py

RUN python extract_deps.py

RUN uv pip install --system --no-cache -r requirements.txt

COPY manage.py /app/
COPY skald/ /app/skald/
COPY bin/ /app/bin/

# make port 8000 available to the world outside this container
EXPOSE 8000

ENV PYTHONBUFFERED TRUE

CMD ["/app/bin/start-prod.sh"]