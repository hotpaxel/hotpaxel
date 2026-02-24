# HOTPAXEL

HOTPAXEL is a high-performance document generation suite where **the source of truth is TeX** while the editing experience remains fluid and modern.

## Core Modules

- **HOT (Client SDK)**  
  High-performance HTML ↔ TeX converter written in **Rust** and compiled to **WASM**.  
  SSOT: `currentTex` (always compilable, logic-intact, serializable).
  Available as [`@hotpaxel/hot`](https://www.npmjs.com/package/@hotpaxel/hot) on NPM.

- **PAXEL (Server Engine)**  
  Stateless XeLaTeX rendering engine implemented in **Rust (Axum)**. Produces PDFs under strict security and resource constraints.

- **Tiptex Web (Product UI)**  
  A modern UI layer (**Vite/React**) that integrates the HOT WASM SDK and uses PAXEL for high-fidelity PDF generation.

## Technology Stack

- **Rust**: Powering the high-performance conversion SDK and Rendering Engine.
- **WebAssembly**: Enabling Rust-speed TeX processing directly in the browser.
- **Vite & React**: Providing a responsive and modern user interface.
- **XeLaTeX**: The gold standard for high-fidelity PDF document generation.
- **Bun & Turbo**: Modern toolkit for monorepo management and ultra-fast automation.
- **Docker**: Containerized deployment for consistent environments across any cloud.

## Monorepo Layout

- `crates/hot` — [HOT SDK](crates/hot/README.md) (**Rust/WASM**)
- `crates/paxel` — [Rendering Engine](crates/paxel/README.md) (**Rust/Axum**)
- `apps/tiptex-web` — [Product UI](apps/tiptex-web/README.md) (**Vite/React**)

## Docker Strategy

We provide 3 specialized Docker images via [GHCR](https://github.com/hotpaxel/hotpaxel/pkgs/container):
- `hotpaxel`: Unified image with both UI and Engine.
- `tiptex-web`: Frontend-only (Nginx).
- `paxel`: Backend-only (XeLaTeX/Rust).

## Management Commands

| Command | Description |
| :--- | :--- |
| `bun dev` | Start development environment |
| `bun run clean` | **Safe**: Delete all build artifacts (`target`, `dist`, `pkg`, etc.) |
| `bun run purge` | **Full**: `clean` + remove all `node_modules` |
| `./build.sh` | Build the unified `hotpaxel` image |
| `./build-all.sh` | Build all 3 core images in sequence |

## Engineering Principles

- **Spec is Law**: Refer to `docs/architecture.md` for all technical decisions.
- **SSOT**: The TeX source is the absolute truth; HTML is a transient view.
- **Statelessness**: The backend never stores document state.

## Open Source Licenses

This project is built upon the following technologies and appreciates their contributions to the open-source ecosystem:

| Component | License |
| :--- | :--- |
| **Rust** | MIT / Apache 2.0 |
| **React / Vite** | MIT |
| **XeLaTeX (TeX Live)** | LPPL / GPL |
| **Axum / Tokio / Serde** | MIT |
| **Bun** | MIT |
| **Turbo** | Apache 2.0 |
| **Docker** | Apache 2.0 |

> [!NOTE]
> **Usage of LPPL/GPL Engines**: This project bundled XeLaTeX (LPPL/GPL) within its Docker images as an **aggregate**. Since the application interacts with these engines as external executable processes and does not modify their source code, it remains a separate work and is not subject to the engine's license requirements. Redistributing these unmodified binaries within container images is permitted under both LPPL and GPL.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for the full license text.
