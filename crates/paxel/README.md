# PAXEL
## Stateless XeLaTeX Rendering Engine (Rust/Axum)

PAXEL is the core rendering engine for HOTPAXEL. It is a stateless service written in **Rust** using the **Axum** web framework.

### Features
- **High Performance**: Asynchronous rendering using `tokio::process`.
- **Stateless Architecture**: No database or state management; strictly consumes TeX and returns PDF.
- **Security & Constraints**: Designed to run XeLaTeX under strict resource limits.

### Getting Started

#### Option A: Docker (Recommended)
```bash
docker pull ghcr.io/hotpaxel/paxel:latest
docker run -p 8889:8888 ghcr.io/hotpaxel/paxel:latest
```

#### Option B: Local Build
1. Install Rust (1.80+).
2. Install XeLaTeX (TeX Live / MacTeX).
3. Run: `cargo run`
