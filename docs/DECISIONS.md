# Decisions (ADR-lite)

## D-0001: Product name
- Date: 2026-01-31
- Status: Accepted
- Decision: Product name is **HOTPAXEL**.

## D-0002: NPM scope
- Date: 2026-01-31
- Status: Accepted
- Decision: Use `@hotpaxel/*` for packages.

## D-0003: Package manager
- Date: 2026-01-31
- Status: Accepted
- Decision: Use **bun** as package manager for the monorepo.

## D-0004: Headless architecture split
- Date: 2026-01-31
- Status: Accepted
- Decision: Local-first editing in HOT; compute-only PDF rendering in PAXEL.

## D-0005: Phase 4 outsourcing boundary
- Date: 2026-01-31
- Status: Accepted
- Decision: UI implementation may be outsourced, but API/HTML contract and architecture decisions remain internal and immutable without CTO approval.

## D-0006: Lockfile Format
- Date: 2026-01-31
- Status: Accepted
- Decision: Use text-based **`bun.lock`** (default in Bun v1.2+) instead of binary `bun.lockb`.
- Context: Provides better git diff visibility and merge conflict resolution.

