# 📘 HOTPaxel Engineering Architecture Guide

**(Team Understanding Document)**

**[Back to README](../README.md)** | **[Architecture Spec](./architecture.md)** | **[API Reference](./api.md)** | **[UI/SDK Contract](./ui_contract.md)**

---

## 1. Why HOTPaxel?

HOTPaxel is not just a "document editor".
It must satisfy **contradictory requirements**:

1. **Legal/Contract documents must be strict like TeX**
2. But **Users want a WYSIWYG experience like Word/Notion**
3. **Data loss is unacceptable** (server failure/network issues)
4. PDF generation is a heavy and risky operation (security/resource)

👉 Decision: Product name is **HOTPaxel**.
👉 To resolve this, HOTPaxel **physically separates editing and rendering**.

---

## 2. Core Architecture Summary

```
[ Browser ]
   |
   |  (HTML Editing)
   v
[ HOT SDK ]
   |
   |  (Always alive .tex)
   v
[ .tex File ]  ←── Single Source of Truth
   |
   |  (Only when needed)
   v
[ PAXEL Server ]
   |
   v
[ PDF ]
```

### Key Points

* **.tex is always generated in the browser**
* Server is used **only when PDF is needed**
* **Editing and saving continue** even if the server dies

---

## 3. HOT (Client SDK) Role

HOT is **not an editor**.

> HOT is **"The manager that keeps a clean TeX source of truth inside the browser"**.

### HOT Principles

HOT maintains a single state called `currentTex`.
This value must **always satisfy**:

* ✔ Compilable TeX
* ✔ Contract logic intact
* ✔ Saveable as pure text at any time

👉 HOT is **more important than UI**.
UI can change, but HOT's state rules cannot.

---

## 4. Logic Chip Protection

Contract documents contain:

* Conditional clauses `{% if %}`
* Sign boxes `\SignBox`
* Party references `\Party`

These are **Logic, not Text**.

HOT handles these tokens by:

* Converting to HTML
* Wrapping them so humans can't edit
* Ensuring **zero character change** upon round-trip to TeX

👉 This is handled by the **Rust/WASM Core (HOT)**.

---

## 5. FailureState is "Normal"

WASM in the browser can crash.

HOT behaves like this:

* Conversion Success → Update `currentTex`
* Conversion Failure → **Keep last successful TeX**
* UI shows "Temporary Conversion Error"
* User continues typing
* `.tex` download is always available

👉 **Conversion Failure ≠ Data Loss**
This is the core philosophy.

---

## 6. PAXEL Server is "Dumb"

PAXEL has no state.

> PAXEL is just a **Print Shop**.

* Receives TeX
* Safely
* Within time limits
* Prints PDF
* Returns result

PAXEL is a high-performance **Rust (Axum)** service.

PAXEL:

* Knows no logic
* Knows no document state
* Knows no user

👉 **Ignorance is Security.**

---

## 7. Tiptex Web (UI) Position

Tiptex Web is:

* A **thin UI layer** on top of HOT
* A tool to **safely manipulate HOT**
* Not where the document is "made"

Therefore, UI is **part of the architecture**, and cannot be arbitrary.

---

## 8. Development History & Milestones

### 🚀 Phase 1-3: Core Foundation [COMPLETED]
- Replaced Pandoc/Node.js with **Rust/WASM** for extreme performance and type-safety.
- Established the **PAXEL** rendering server with strict timeout and security controls.

### 🎨 Phase 4: HotPaxel Editor [COMPLETED]
- Integrated the React/Tiptap editor with the HOT WASM SDK.
- Implemented **Logic Chip Protection** for non-destructive contract editing.

### 📦 Phase 6: Single Binary Integration [COMPLETED]
- Consolidated the entire stack into a single Rust binary.
- Removed Nginx to simplify infrastructure and Docker deployment.

### 🏆 Milestone Achievements
- [x] **Gate A**: HOT exports stable compilable TeX offline.
- [x] **Gate B**: PAXEL compiles safely under constraints.
- [x] **Gate C**: Full E2E integration passes contract tests.
- [x] **Gate D**: Single binary deployment validated.
