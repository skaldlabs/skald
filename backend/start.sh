#!/bin/sh
set -e

echo "Running migrations..."
pnpm run migration:up

echo "Starting server..."
exec node dist/index.js --mode=express-server
