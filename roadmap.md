# HOTPAXEL Roadmap - v0.2 (Rust Refactoring)

As identified in the v0.1 analysis, while TeX Live remains the primary bottleneck for single-document compilation, transitioning core components to Rust provides critical advantages for resource-constrained environments like Oracle Cloud Free Tier.

## Objectives

### 1. PAXEL Backend Refactoring (Node.js -> Rust)
- **Tech Stack**: Axum or Actix-web + Tokio.
- **Goal**: 
    - Reduce idle memory footprint from ~150MB to <20MB.
    - Improve concurrency handling for multiple simultaneous PDF requests.
    - Enhance security via Rust's memory safety when handling external assets.

### 2. HOT Core Refactoring (JS -> Rust/WASM)
- **Tech Stack**: Rust + `wasm-bindgen`.
- **Goal**:
    - Move HTML ↔ TeX conversion logic (including Lua filters) to a compiled WASM module.
    - Drastically reduce UI latency during real-time synchronization for large documents (>50 pages).
    - Ensure identical conversion logic across Browser and Edge environments.

### 3. Edge-Ready Architecture
- **Goal**:
    - Optimize the backend to be deployable on lightweight container runtimes.
    - Explore TeX engine optimizations (e.g., Tectonic) to further reduce the 5GB footprint of TeX Live.

## Performance Targets
- **Memory**: <50MB total system overhead (excluding XeLaTeX).
- **Concurrency**: 5x increase in handled requests per VM.
- **Latency**: <10ms for HOT round-trip synchronization in-browser.
