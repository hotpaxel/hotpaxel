# --- Stage 1: Build ---
FROM oven/bun:1-debian AS builder

WORKDIR /app

# Copy monorepo config
COPY package.json turbo.json bun.lock ./
COPY apps/tiptex-web/package.json ./apps/tiptex-web/
COPY packages packages

# Install dependencies (including internal packages)
RUN bun install

# Copy App source
COPY apps/tiptex-web ./apps/tiptex-web

# Build
WORKDIR /app/apps/tiptex-web
RUN bun run build

# --- Stage 2: Run ---
FROM nginx:stable-alpine

# Copy built assets
COPY --from=builder /app/apps/tiptex-web/dist /usr/share/nginx/html

# Copy Nginx config
COPY apps/tiptex-web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
