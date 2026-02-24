# HOT Core
## High-Performance HTML ↔ TeX Converter (Rust/WASM)

HOT is the Client SDK that maintains the Single Source of Truth (SSOT) inside the browser. It is written in **Rust** and compiled to **WASM** via `wasm-pack`.

### Capabilities
- **Exact Conversion**: Guaranteed zero-loss "Round-trip" of protected tokens.
- **WASM Performance**: Native-speed conversion within the browser UI thread.
- **Safety First**: Prevents invalid TeX states from entering the SSOT.

### Development & Build
1. Install Rust and `wasm-pack`.
2. Build the WASM package:
   ```bash
   bun run build
   ```
3. The resulting package is located in `pkg/`.

### NPM Publishing
This package is scoped as `@hotpaxel/hot`. To publish a new version:
1. Update `version` in `package.json`.
2. Run build: `bun run build`.
3. Login and publish:
   ```bash
   cd pkg
   npm publish --access public
   ```
