# HOTPAXEL

HOTPAXEL is a document generation product where **the source of truth is TeX** while the editing experience feels WYSIWYG.

## Core Modules

- **HOT (Client SDK)**  
  Browser-side TeX state manager & HTML ↔ TeX converter.  
  SSOT: `currentTex` (always compilable, logic-intact, serializable).

- **PAXEL (Server Engine)**  
  Stateless XeLaTeX rendering engine that produces PDFs under strict security and resource constraints.

- **Tiptex Web (Product UI)**  
  A thin UI layer that manipulates HOT safely and calls PAXEL only for PDF generation.

## Spec of Record

- `docs/ARCHITECTURE.md` is the single source of truth for the system architecture.  
  Changes require PR + CTO approval.

## Monorepo Layout

- `packages/hot` — `@hotpaxel/hot` (HOT SDK)
- `packages/ui-kit` — shared UI kit (internal)
- `services/paxel` — rendering service (internal)
- `apps/tiptex-web` — product UI (Next.js)

## Development Rules (Summary)

- Spec is Law: `docs/ARCHITECTURE.md`
- Phase 4 UI work requires `docs/UI_CONTRACT.md` freeze first.
- Outsourcing is allowed for UI implementation only; architecture/contract decisions remain internal.

## Engineering Context

- **Architecture Guide**: `docs/ENGINEERING_GUIDE.md` (Team understanding & onboarding)

