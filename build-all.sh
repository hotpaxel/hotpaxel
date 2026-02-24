#!/bin/bash

# HOTPAXEL Build-All Orchestrator (Modular)
# Usage: ./build-all.sh [tag] [user]

TAG=${1:-latest}
USER=${2:-hotpaxel}

echo "🚀 Starting modular image build pipeline (Tag: $TAG, User: $USER)..."

# 1. Unified image
./build.sh "$TAG" "$USER" || exit 1

# 2. Frontend image
./apps/tiptex-web/build.sh "$TAG" "$USER" || exit 1

# 3. Backend image
./crates/paxel/build.sh "$TAG" "$USER" || exit 1

echo "✅ All 3 images built successfully using modular scripts!"
