# --- Tier 1: Builder (Bun) ---
# Compiles TypeScript server code.
FROM oven/bun:1-debian AS builder

WORKDIR /app
COPY package.json turbo.json bun.lock ./
COPY apps apps
COPY packages packages
COPY services services
RUN bun install --frozen-lockfile

WORKDIR /app/apps/paxel
RUN bun run build


# --- Tier 2: Final Runner ---
# Use the pre-built image with TeXLive and Korean support
FROM makye/texlive-node:latest-24.13.0-ko AS runner

WORKDIR /app

# Non-root user setup
# Note: Check if the base image already has a suitable user, but 
# we'll stick to 'paxel' for consistency with our app structure.
RUN groupadd -r paxel && useradd -r -g paxel -m paxel && \
    mkdir -p /home/paxel/.cache/fontconfig && \
    chown -R paxel:paxel /app /home/paxel/.cache
USER paxel

# Copy the bundled server code
COPY --from=builder --chown=paxel:paxel /app/apps/paxel/dist/index.js ./dist/index.js

ENV PORT=8888
ENV NODE_ENV=production
EXPOSE 8888

CMD ["node", "dist/index.js"]

