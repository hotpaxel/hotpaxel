# --- Stage 1: Build WASM ---
FROM rust:1.88-slim-bookworm AS wasm-builder

RUN apt-get update && apt-get install -y curl build-essential pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

WORKDIR /app
COPY package.json turbo.json bun.lock ./
COPY crates/hot ./crates/hot
WORKDIR /app/crates/hot
RUN wasm-pack build --target web --release --scope hotpaxel

# --- Stage 2: Build Frontend ---
FROM oven/bun:1-debian AS builder

WORKDIR /app

# Copy monorepo config
COPY package.json turbo.json bun.lock Cargo.toml ./
COPY apps/tiptex-web/package.json ./apps/tiptex-web/
COPY crates/hot/package.json ./crates/hot/
COPY crates/paxel/package.json ./crates/paxel/

# Copy full source (excluding what's in .dockerignore, like pkg)
COPY apps/tiptex-web ./apps/tiptex-web
COPY crates/hot ./crates/hot
COPY crates/paxel ./crates/paxel

# Explicitly copy built WASM package (so it's not overwritten/missing)
COPY --from=wasm-builder /app/crates/hot/pkg /app/crates/hot/pkg

# Install dependencies
RUN bun install

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
