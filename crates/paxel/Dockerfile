# --- Stage 1: Build ---
FROM --platform=linux/amd64 rust:1.88-slim-bookworm AS builder

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json turbo.json bun.lock Cargo.toml ./
COPY crates/paxel ./crates/paxel
COPY crates/hot ./crates/hot

WORKDIR /app/crates/paxel
RUN cargo build --release

# --- Stage 2: Final Runner ---
FROM makye/texlive-node:latest-24.13.0-ko AS runner

WORKDIR /app

RUN groupadd -r paxel && useradd -r -g paxel -m paxel && \
    mkdir -p /home/paxel/.cache/fontconfig && \
    chown -R paxel:paxel /app /home/paxel/.cache

USER paxel

# Copy the binary
COPY --from=builder /app/target/release/paxel ./paxel

ENV PORT=8888
ENV NODE_ENV=production
EXPOSE 8888

CMD ["./paxel"]
