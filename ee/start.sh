#!/bin/sh
set -e

echo "Running migrations..."
cd /app/backend && pnpm run migration:up

echo "Starting enterprise server..."
cd /app/ee && NODE_PATH=/app/backend/node_modules:/app/ee/node_modules exec node dist/ee/src/enterpriseServer.js
