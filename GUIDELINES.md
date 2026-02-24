# HOTPAXEL Guidelines (Human)

## Spec is Law
- `docs/architecture.md` is the source of truth.
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
- Outsourced UI work must follow `docs/ui_contract.md`.
- HOT API, HTML structure, protected tokens are immutable unless CTO approves.

---

# 🔖 HOTPAXEL Commit Message Guidelines

*(Final / Phase 0 Approved)*

## 1. Purpose (Why)

Commit messages are an **operational asset** for:
* PR review & code quality verification
* Architecture change history tracking
* Outsourcing/AI task inspection
* Regression analysis (`git blame`, `git bisect`)
* Manual for future team members and future self

👉 **Unified format and language turn history into an asset.**

---

## 2. Commit Language Policy

### ✅ Basic Principle (Mandatory)
* **Commit messages must be in English by default.**
* **Commit title must be in English.**

### ✅ Exceptions (Limited)
* **Korean supplementary explanation** is allowed in the **commit body** if necessary.
* Only for cases with significant meaning loss (Legal/Contract/Business context).

### ❌ Prohibited
* Mixed English/Korean in commit title ❌
* Korean commit title ❌

#### Example (Recommended)
```text
docs(architecture): freeze HOTPAXEL spec v1.1.0

- Clarified failure handling and recovery rules
- Locked Phase 4 outsourcing boundary

Note:
- Fixed standards before starting outsourced UI work
```

---

## 3. Commit Message Format (Mandatory)

All commits must follow this format:
```
<type>(<scope>): <short summary>

<body (optional)>
```

---

## 4. Type Rules (Allowlist Only)

| type       | Usage           |
| ---------- | --------------- |
| `feat`     | New feature     |
| `fix`      | Bug fix         |
| `docs`     | Documentation   |
| `refactor` | Refactoring     |
| `chore`    | Config, build, misc |
| `test`     | Test add/edit   |
| `ci`       | CI/CD related   |

❌ Do not use types other than the above.

---

## 5. Scope Rules (Highly Recommended)

Scope indicates the **impact area**.

### Recommended Scopes
* `hot`
* `paxel`
* `tiptex-web`
* `docs`
* `repo`
* `infra`

#### Example
```text
feat(hot): add emergency tex export on wasm failure
fix(paxel): enforce compile timeout
docs(architecture): add security constraints section
chore(repo): initialize turborepo with bun
```

---

## 6. Short Summary Rules

* Use present tense verb (`add`, `fix`, `update`, `remove`, `enforce`)
* No period (`.`) at the end ❌
* Within 72 characters
* Write **WHAT**, not why (why goes in body)

### ❌ Bad
```
fix: bug fix
update stuff
```

### ✅ Good
```
feat(hot): preserve last valid tex on conversion failure
fix(paxel): disable shell escape during xelatex compile
```

---

## 7. Body Rules (Optional, but Mandatory if:)

Body is **mandatory** if:
* Architecture/Spec impact
* Merging outsourced deliverables
* Failure scenario handling
* Intentional "Not Done" items

#### Body Example
```text
feat(hot): add FailureState and recovery handling

- Preserve last valid TeX on WASM crash
- Allow continued HTML editing during failure
- Enable emergency .tex export

No changes to HOT public API.
```

---

## 8. Prohibited Messages (Immediate Rejection)

* `wip`
* `temp`
* `update`
* `fix bug`
* Meaningless number/date

👉 **WIP is only allowed in branch names** (`wip/experiment-xyz`)

---

## 9. Recommended Patterns per Phase

### Phase 0 (Bootstrap)
```text
chore(repo): initialize monorepo with bun and turborepo
docs: add architecture spec as source of truth
docs: add plan, decisions.md, and AGENTS.md guidelines
```

### Phase 1 (HOT SDK)
```text
feat(hot): scaffold HotManager public API
feat(hot): integrate pandoc-wasm loader
test(hot): add round-trip conversion tests
```

### Phase 3 (PAXEL Server)
```text
feat(paxel): add dockerized xelatex render service
fix(paxel): enforce compile timeout and payload limit
```

---

## 10. Outsourcing / AI Agent Rules (Mandatory)

Outsourcing (AI Studio) and AI Agents must follow:
* **English mandatory**
* `type(scope): summary` format mandatory
* One commit = One intent
* PR title = **Same as the most important commit message**
* When changing Spec/Contract docs:
  * Use `docs:` type
  * **Body is mandatory**

---

## 11. CTO Exception Rules

* CTO can override rules if necessary.
* EXCEPT for:
  * `docs/architecture.md`
  * `docs/ui_contract.md` (after freeze)
  → **Must have PR + Explicit approval log**

---

## Final Summary

> **"Commit in English, Intent clear, History for our future selves."**

