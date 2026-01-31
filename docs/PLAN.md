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
  - docs/ARCHITECTURE.md (Spec of Record)
  - docs/DECISIONS.md (ADR-lite)
  - docs/PLAN.md, GUIDELINES.md, AGENTS.md
  - Monorepo skeleton + bun + turbo

### Phase 1 — HOT SDK (@hotpaxel/hot)
- Owner: Codex
- Deliverables:
  - HotManager API, pandoc-wasm wrapper
  - SSOT invariant enforcement
  - FailureState/Recovery + Emergency Export
  - Unit tests

### Phase 2 — Logic Chip Protection
- Owner: Jules
- Deliverables:
  - Lua filters, protected tokens
  - Round-trip tests + known limits

### Phase 3 — PAXEL Server (Rendering)
- Owner: Antigravity
- Deliverables:
  - Dockerized XeLaTeX (no-shell-escape, timeout, payload limits)
  - POST /compile with response codes
  - GCS upload + signed URL

### Phase 4 — Tiptex Web Integration (Outsource included)
- Owner: CTO (Integrator), with AI Studio (UI implementation)
- Internal (CTO/core dev):
  - UI Contract freeze: docs/UI_CONTRACT.md
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
