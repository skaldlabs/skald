FROM pgvector/pgvector:pg17

# Install build dependencies and PGMQ
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    postgresql-server-dev-17 \
    && rm -rf /var/lib/apt/lists/*

# Clone and install PGMQ
RUN git clone https://github.com/pgmq/pgmq.git /tmp/pgmq \
    && cd /tmp/pgmq \
    && make \
    && make install \
    && rm -rf /tmp/pgmq

# Cleanup
RUN apt-get purge -y --auto-remove build-essential git postgresql-server-dev-17
