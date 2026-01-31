# HOTPAXEL Guidelines (Human)

## Spec is Law
- `docs/ARCHITECTURE.md` is the source of truth.
- Changes require PR + CTO approval.

## Branch & PR
- Branches: feat/*, fix/*, chore/*
- No direct push to main.
- PR must include:
  - What changed
  - How to test
  - Risks/impact

## Security & Secrets
- Never commit secrets.
- Local env via `.env` files (gitignored).
- Service credentials are managed outside repo.

## Quality gates (minimal)
- Lint must pass before merge.
- Build must run (even if stub during Phase 0).
- Add tests when implementing HOT/PAXEL core.

## Outsourcing rule (UI)
- Outsourced UI work must follow `docs/UI_CONTRACT.md`.
- HOT API, HTML structure, protected tokens are immutable unless CTO approves.
