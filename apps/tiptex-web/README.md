# TipTeX Web

TipTeX Web is a modern React Single Page Application (SPA) powered by Vite. It serves as the primary frontend for the HotPaxel project, providing a rich, interactive WYSIWYG editor for LaTeX using TipTap.

## Features
- **Rich Text Editing**: Powered by TipTap, allowing users to write and format text visually.
- **WASM Integration**: Encapsulates the `@hotpaxel/hot` WebAssembly SDK to perform local HTML-to-LaTeX conversions instantly in the browser without server roundtrips.
- **Live Rendering**: Communicates with the `paxel` Rust backend to compile LaTeX into visual outputs (SVG/PDF).

## Prerequisites

Since this package depends on a local WebAssembly module within the monorepo, you need the following tools installed:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Bun](https://bun.sh/) (Package manager)
- [Rust & Cargo](https://rustup.rs/) (For building the WASM module)
- `wasm-pack` (`cargo install wasm-pack`)

## Development Setup

We recommend running the development server from the monorepo root using Turborepo to ensure all dependencies (like the WASM package) are built in the correct order.

1.  **From the monorepo root**, install dependencies:
    ```bash
    bun install
    ```

2.  Start the development server:
    ```bash
    bun run dev
    # OR to build specifically:
    # turbo run dev --filter=@hotpaxel/tiptex-web
    ```

Alternatively, if the `@hotpaxel/hot` WASM package is already built, you can run the vite server directly from this directory:
```bash
bun dev
```

## Production Build

To build the optimized static assets for production:

```bash
bun run build
```

This will generate a `dist` directory containing the HTML, JS, CSS, and compiled WASM assets ready to be statically styled or served via Nginx.
