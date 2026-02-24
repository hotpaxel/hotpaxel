#!/bin/bash

# TIPEX-WEB Image Builder
# Usage: ./build.sh [tag] [user]

TAG=${1:-latest}
USER=${2:-hotpaxel}

# Find project root (where Dockerfile context should be)
ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || echo "../../")
cd "$ROOT_DIR"

echo "📦 Building tiptex-web (tag: $TAG, owner: $USER)..."
docker build --platform linux/amd64 -t ghcr.io/$USER/tiptex-web:$TAG -f apps/tiptex-web/Dockerfile .
