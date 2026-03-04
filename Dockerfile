# --- Stage 1: Build Rust Backend & WASM ---
FROM rust:1.88-slim-bookworm AS rust-builder

RUN apt-get update && apt-get install -y curl build-essential pkg-config libssl-dev protobuf-compiler && rm -rf /var/lib/apt/lists/*
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

WORKDIR /app
COPY . .

WORKDIR /app
COPY . .

# Build Workspace-wide but target paxel
RUN uname -m && rustc -vV
RUN cargo build --release -p paxel

# Verify the binary in builder stage
RUN ls -l /app/target/release/paxel && \
    head -c 4 /app/target/release/paxel | od -A n -t x1 | grep -q "7f 45 4c 46" || (echo "❌ Invalid ELF binary" && exit 1)

# Build HOT (WASM)
WORKDIR /app/crates/hot
RUN wasm-pack build --target web --release --scope hotpaxel

# --- Stage 2: Build Frontend ---
FROM oven/bun:1-debian AS fe-builder
WORKDIR /app
COPY . .
# Copy the built WASM package from stage 1
COPY --from=rust-builder /app/crates/hot/pkg /app/crates/hot/pkg

RUN bun install
WORKDIR /app/apps/hot-editor
RUN bun run build

# --- Stage 3: Build API Documentation ---
FROM fe-builder AS docs-builder
WORKDIR /app
# Generate docs using bun script (which calls buf)
RUN bun run gen:docs

# --- Stage 4: Final Runner (Single Binary) ---
FROM makye/texlive-node:latest-24.13.0-ko

WORKDIR /app

# Install dependencies (only basic ones if needed)
USER root
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
RUN groupadd -r paxel && useradd -r -g paxel -m paxel

# Copy backend binary
COPY --from=rust-builder /app/target/release/paxel ./paxel

# Copy frontend assets to ./public
COPY --from=fe-builder /app/apps/hot-editor/dist ./public

# Copy API documentation to ./docs
COPY --from=docs-builder /app/apps/docs ./docs

ENV PORT=8888
ENV STATIC_DIR=./public
ENV DOCS_DIR=./docs
EXPOSE 8888

# Run the single binary
CMD ["./paxel", "--port", "8888", "--static-dir", "./public", "--docs-dir", "./docs"]
