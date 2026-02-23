# --- Stage 1: Build Frontend ---
FROM oven/bun:1-debian AS fe-builder
WORKDIR /app
COPY package.json turbo.json bun.lock ./
COPY apps/tiptex-web/package.json ./apps/tiptex-web/
COPY packages packages
RUN bun install
COPY apps/tiptex-web ./apps/tiptex-web
WORKDIR /app/apps/tiptex-web
RUN bun run build

# --- Stage 2: Build Backend ---
FROM oven/bun:1-debian AS be-builder
WORKDIR /app
COPY package.json turbo.json bun.lock ./
COPY apps/paxel/package.json ./apps/paxel/
COPY packages packages
RUN bun install
COPY apps/paxel ./apps/paxel
WORKDIR /app/apps/paxel
RUN bun run build

# --- Stage 3: Final Runner (Unified) ---
FROM makye/texlive-node:latest-24.13.0-ko

WORKDIR /app

# Install Nginx
USER root
RUN apt-get update && apt-get install -y nginx gettext-base && rm -rf /var/lib/apt/lists/*
RUN groupadd -r paxel && useradd -r -g paxel -m paxel

# Copy backend
COPY --from=be-builder /app/apps/paxel/dist/index.js ./dist/index.js

# Copy frontend assets to where Nginx expects them
COPY --from=fe-builder /app/apps/tiptex-web/dist /var/www/html

# Copy Nginx config template
COPY apps/tiptex-web/nginx.conf /etc/nginx/sites-available/default.template

# Super-simple script to run both
RUN echo '#!/bin/sh\n\
    export PAXEL_HOST=localhost\n\
    envsubst "\$PAXEL_HOST" < /etc/nginx/sites-available/default.template > /etc/nginx/sites-enabled/default\n\
    nginx -g "daemon off;" & \n\
    node dist/index.js' > /app/start.sh && chmod +x /app/start.sh

ENV PORT=8888
EXPOSE 80 8888

CMD ["/app/start.sh"]
