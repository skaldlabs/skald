#!/bin/sh
set -e

echo "Running migrations..."
cd /app/backend && pnpm run migration:up

echo "Starting enterprise server..."
cd /app/ee && exec node dist/ee/src/enterpriseServer.js
