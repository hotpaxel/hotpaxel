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

# Copy Nginx config template
COPY apps/tiptex-web/nginx.conf /etc/nginx/templates/default.conf.template

ENV PAXEL_HOST=paxel

EXPOSE 80

# The official nginx image entrypoint will automatically run envsubst on files in /etc/nginx/templates/*.template
# and output them to /etc/nginx/conf.d/*.conf
CMD ["nginx", "-g", "daemon off;"]
