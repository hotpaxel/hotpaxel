> Spec of Record: This document is the single source of truth for HOTPAXEL architecture.  
> Changes require PR + CTO approval.

# HOTPAXEL System Design Specification
Version: 1.2.0 (Rust Refactor)
Date: 2026-02-23
Status: Implemented (v0.2)

## v0.2 - Rust/WASM Core Optimization
The system has been refactored for high performance and strict reliability by transitioning the core engine and client SDK to Rust.

### Component Specification
- **PAXEL Engine**: Implemented in **Rust (Axum)**. A stateless service that executes XeLaTeX compilation in an isolated process. Replaced Node.js/Hono.
- **HOT SDK**: Implemented in **Rust** and compiled to **WASM**. Handles HTML ↔ TeX conversion, token protection, and state management. Replaced Pandoc/Lua-based browser filters.
- **Tiptex Interface**: Vite/React frontend integrating the WASM module for local-speed document manipulation.

---

### Reference
For a high-level engineering understanding and team context, please refer to:
- [Engineering Architecture Guide](file:///Users/mstorm/src/hotpaxel/docs/engineering_guide.md)
