# --- Stage 1: Build Rust Backend & WASM ---
FROM --platform=linux/amd64 rust:1.88-slim-bookworm AS rust-builder

RUN apt-get update && apt-get install -y curl build-essential pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

WORKDIR /app
COPY . .

# Build PAXEL (Binary)
WORKDIR /app/crates/paxel
RUN cargo build --release

# Build HOT (WASM)
WORKDIR /app/crates/hot
RUN wasm-pack build --target web --release --scope hotpaxel

# --- Stage 2: Build Frontend ---
FROM --platform=linux/amd64 oven/bun:1-debian AS fe-builder
WORKDIR /app
COPY package.json turbo.json bun.lock ./
COPY apps/tiptex-web/package.json ./apps/tiptex-web/
COPY crates/hot ./crates/hot
COPY crates/paxel/package.json ./crates/paxel/
# Copy the built WASM package from stage 1
COPY --from=rust-builder /app/crates/hot/pkg /app/crates/hot/pkg

RUN bun install
COPY apps/tiptex-web ./apps/tiptex-web
WORKDIR /app/apps/tiptex-web
RUN bun run build

# --- Stage 3: Final Runner (Unified) ---
FROM makye/texlive-node:latest-24.13.0-ko

WORKDIR /app

# Install Nginx
USER root
RUN apt-get update && apt-get install -y nginx gettext-base && rm -rf /var/lib/apt/lists/*
RUN groupadd -r paxel && useradd -r -g paxel -m paxel

# Copy backend binary
COPY --from=rust-builder /app/target/release/paxel ./paxel

# Copy frontend assets
COPY --from=fe-builder /app/apps/tiptex-web/dist /var/www/html

# Copy Nginx config template
COPY apps/tiptex-web/nginx.conf /etc/nginx/sites-available/default.template

# Startup script
RUN echo '#!/bin/sh\n\
    export PAXEL_HOST=localhost\n\
    envsubst "\$PAXEL_HOST" < /etc/nginx/sites-available/default.template > /etc/nginx/sites-enabled/default\n\
    nginx -g "daemon off;" & \n\
    ./paxel' > /app/start.sh && chmod +x /app/start.sh

ENV PORT=8888
EXPOSE 80 8888

CMD ["/app/start.sh"]
