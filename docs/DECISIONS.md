# Decisions (ADR-lite)

## D-0001: Product name
- Date: 2026-01-31
- Status: Finalized
- Decision: Product name is **HOTPAXEL**.

## D-0002: NPM scope
- Date: 2026-01-31
- Status: Finalized
- Decision: Use `@hotpaxel/*` for packages.

## D-0003: Package manager
- Date: 2026-01-31
- Status: Finalized
- Decision: Use **bun** as package manager for the monorepo.

## D-0004: Headless architecture split
- Date: 2026-01-31
- Status: Finalized
- Decision: Local-first editing in HOT; compute-only PDF rendering in PAXEL.

## D-0005: Phase 4 outsourcing boundary
- Date: 2026-01-31
- Status: Finalized
- Decision: UI implementation may be outsourced, but API/HTML contract and architecture decisions remain internal and immutable without CTO approval.

## D-0006: Lockfile Format
- Date: 2026-01-31
- Status: Finalized
- Decision: Use text-based **`bun.lock`** (default in Bun v1.2+) instead of binary `bun.lockb`.
- Context: Provides better git diff visibility and merge conflict resolution.

## D-0007: Performance & Reliability Refactor (Rust-First)
- Date: 2026-02-23
- Status: Finalized
- Decision: Migrate core logic (**HOT**) to **Rust/WASM** and rendering backend (**PAXEL**) to **Rust/Axum**.
- Context: Replaced Node.js/Pandoc-filters to resolve performance bottlenecks, regex limitations, and high memory overhead. Established a "Rust-First" architecture with a unified Cargo workspace.
