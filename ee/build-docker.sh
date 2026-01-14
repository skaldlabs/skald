#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

IMAGE_NAME="${1:-skald-backend-ee}"

echo "Building $IMAGE_NAME from project root..."
cd "$PROJECT_ROOT"

docker build -f ee/Dockerfile -t "$IMAGE_NAME" .

echo "Successfully built $IMAGE_NAME"
