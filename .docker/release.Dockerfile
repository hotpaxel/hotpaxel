# --- Release Image for HOTPaxel (Single Unified Binary) ---
# Pre-built artifacts are copied directly from GitHub Actions build stages.
FROM makye/texlive-node:latest-24.13.0-ko
LABEL org.opencontainers.image.source=https://github.com/hotpaxel/hotpaxel

WORKDIR /app

USER root
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
RUN groupadd -r paxel && useradd -r -g paxel -m paxel

# Copy pre-built backend binary for target architecture
ARG TARGETARCH
COPY artifacts/${TARGETARCH}/paxel ./paxel
RUN chmod +x ./paxel

# Copy pre-built frontend UI assets
COPY public ./public

# Copy pre-built API documentation
COPY docs ./docs

ENV PORT=8888
ENV STATIC_DIR=./public
ENV DOCS_DIR=./docs
EXPOSE 8888

# Run the single binary
CMD ["./paxel", "--port", "8888", "--static-dir", "./public", "--docs-dir", "./docs"]
