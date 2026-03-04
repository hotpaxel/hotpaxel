> Spec of Record: This document is the single source of truth for HOTPaxel architecture.  
> Changes require PR + CTO approval.

# HOTPaxel System Design Specification
Version: 1.3.0 (Unified Binary)
Date: 2026-03-03
Status: Fully Implemented (v0.2.1)

## Architecture Evolution: Single Binary Consolidation
The system has evolved from a multi-service container architecture to a **Single Unified Binary**. The Rust/Axum server (`paxel`) now performs dual roles:
1. **API Role**: Stateless XeLaTeX rendering.
2. **Static Role**: Directly serving the `hot-editor` frontend assets.

This eliminates the need for Nginx and simplifies Docker orchestration.

### Component Specification
- **PAXEL Node (Core)**: Implemented in **Rust (Axum)**. Handles `/compile`, `/health`, and `/version` endpoints, while serving static UI files from a configurable directory (`--static-dir`).
- **HOT SDK (Logic)**: Implemented in **Rust** and compiled to **WASM**. Encapsulates high-performance HTML ↔ TeX conversion and token protection.
- **HotPaxel Editor (View)**: React frontend that integrates the HOT WASM SDK.

---

### Quick Links
**[Back to README](../README.md)** | **[Engineering Guide](./engineering_guide.md)** | **[API Reference](./api.md)** | **[UI/SDK Contract](./ui_contract.md)**
