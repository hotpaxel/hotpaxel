#!/bin/bash

# HOTPAXEL Unified Image Builder
# Usage: ./build.sh [tag] [user]

TAG=${1:-latest}
USER=${2:-hotpaxel}

echo "📦 Building hotpaxel unified (tag: $TAG, owner: $USER)..."
docker build --platform linux/amd64 -t ghcr.io/$USER/hotpaxel:$TAG -f Dockerfile .
