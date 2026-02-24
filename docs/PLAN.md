# HOTPAXEL Development Plan (Phase 0–5)

## Roles
- CTO: Architecture owner, integration decision maker, approvals
- Codex: HOT SDK + client-side integration tasks (Phase 1/4 internal parts)
- Jules: Conversion safety + logic token protection (Phase 2)
- Antigravity: PAXEL server + infra hardening (Phase 3)
- AI Studio (Outsource): Tiptex Web UI implementation (Phase 4 UI layer only)

## Phases

### Phase 0 — Repo bootstrap & Spec freeze
- Deliverables:
  - docs/architecture.md (Spec of Record)
  - docs/decisions.md (ADR-lite)
  - docs/plan.md, GUIDELINES.md, AGENTS.md
  - Monorepo skeleton + bun + turbo

### Phase 1 — HOT SDK (@hotpaxel/hot) [COMPLETED]
- Owner: Codex / Antigravity
- Deliverables:
  - **Rust Core**: HTML ↔ TeX conversion in Rust/WASM (replacing Pandoc)
  - SSOT invariant enforcement
  - FailureState/Recovery + Emergency Export
  - Unit tests

### Phase 2 — Logic Chip Protection [COMPLETED]
- Owner: Jules / Antigravity
- Deliverables:
  - **Rust/WASM Core (HOT)**: Protected tokens and round-trip conversion logic
  - Round-trip tests + known limits

### Phase 3 — PAXEL Server (Rendering) [COMPLETED]
- Owner: Antigravity
- Deliverables:
  - **Rust/Axum**: Stateless XeLaTeX rendering service
  - Dockerized XeLaTeX (no-shell-escape, timeout, payload limits)
  - POST /compile with response codes

### Phase 4 — Tiptex Web Integration (Outsource included)
- Owner: CTO (Integrator), with AI Studio (UI implementation)
- Internal (CTO/core dev):
  - UI Contract freeze: docs/ui_contract.md
  - HOT API usage patterns & Failure UX policy finalization
- Outsource (AI Studio):
  - React components, Tiptap UI, PDF preview UI
  - Must not change HOT API / HTML contract / protected tokens
- Acceptance:
  - E2E: HTML → HOT → TeX → PAXEL → PDF works
  - FailureState is visible and non-destructive

### Phase 5 — Stabilization & MVP freeze
- Owner: CTO
- Deliverables:
  - Load tests, failure scenario drills
  - v0.1.0 tag and internal deployment

## Go/No-Go Gates
- Gate A (after Phase 1): HOT exports stable compilable TeX offline
- Gate B (after Phase 3): PAXEL compiles safely under constraints
- Gate C (after Phase 4): Full E2E integration passes contract tests
