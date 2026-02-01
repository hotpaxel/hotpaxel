# Stage 1: Builder (Bun)
# We use Bun to install dependencies and build the TypeScript code efficiently.
FROM oven/bun:1-debian AS builder

WORKDIR /app

# Copy configuration files
# We copy the lockfile and workspace definitions to ensure reproducible builds
COPY package.json turbo.json bun.lock ./

# Copy workspace packages to satisfy lockfile references
# This prevents "missing workspace" errors during install and ensures frozen lockfile works
COPY apps apps
COPY packages packages
COPY services services

# Install dependencies (frozen lockfile for reproducibility)
RUN bun install --frozen-lockfile

# Build the service
WORKDIR /app/services/paxel
RUN bun run build


# Stage 2: Runtime (Node.js + XeLaTeX)
FROM node:20-bookworm-slim AS runner

# 1. Install XeLaTeX and Dependencies
# Added latex-extra and recommended for broader document support as per Review.
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-xetex \
    texlive-lang-korean \
    texlive-latex-recommended \
    texlive-latex-extra \
    fonts-nanum \
    && rm -rf /var/lib/apt/lists/*

# 2. Setup App Directory
WORKDIR /app

# 3. Create non-root user
RUN chown node:node /app

# 4. Copy built artifacts from Builder Stage
# We only need the bundled JS file.
# The bundle includes all dependencies (hono, execa, etc.), so NO npm install is needed.
COPY --from=builder --chown=node:node /app/services/paxel/dist/index.js ./dist/index.js

# 5. Runtime Config
USER node
ENV PORT=8888
ENV NODE_ENV=production
EXPOSE 8888

# 6. Start
CMD ["node", "dist/index.js"]
