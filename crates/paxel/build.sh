#!/bin/bash

# PAXEL Image Builder
# Usage: ./build.sh [tag] [user]

TAG=${1:-latest}
USER=${2:-hotpaxel}

# Find project root
ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || echo "../../")
cd "$ROOT_DIR"

echo "📦 Building paxel (tag: $TAG, owner: $USER)..."
docker build --platform linux/amd64 -t ghcr.io/$USER/paxel:$TAG -f crates/paxel/Dockerfile .
