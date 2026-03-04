#!/bin/bash

# HOTPaxel Unified Image Builder
# Usage: ./build.sh [tag] [user]

TAG=${1:-latest}
USER=${2:-hotpaxel}

echo "📦 Building hotpaxel unified (tag: $TAG, owner: $USER)..."
docker build -t hotpaxel/hotpaxel:$TAG -f Dockerfile .
