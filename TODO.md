# HOTPAXEL Architecture Refactoring Plan

Renegotiating the monorepo structure to align with the original project intent (hot=client, paxel=server).

## Background

| Issue | Details |
|---|---|
| [hot](crates/hot/src/lib.rs#L49-L68) Identity Crisis | Currently just an HTML↔TeX conversion library, not performing client-side roles. |
| Regex-based Engine | Over 30 regex patterns make it impossible to handle nested tags or complex styles. Hard to extend/maintain. |
| Shell Script CLI | Compatibility issues between macOS and Linux (`grep -P`), external dependencies like `jq`. |
| `hot-editor` Naming | Renamed from `tiptex-web` to better reflect its role as the project's primary editor UI. |
| Single-pass xelatex | Page numbers, TOC, and cross-references often show as `??`. Needs multi-pass. |

## Target Architecture

```
hotpaxel/
├── crates/
│   ├── hot/                → Core: IR Definition + CLI + PAXEL API Client
│   ├── hot-html/           → Plugin: HTML ↔ IR (Parser-based, style support)
│   ├── hot-markdown/       → Plugin: Markdown → IR
│   ├── hot-tex/            → Plugin: IR → TeX
│   └── paxel/              → Rendering Server (Axum, multi-pass supported)
│
├── apps/
│   └── hot-editor/         → Web Editor Example App (formerly tiptex-web)
│
└── paxel-cli.sh            → Deleted (Replaced by hot CLI)
```

---

## Phase 1: [hot](crates/hot/src/lib.rs#L49-L68) Core + CLI [COMPLETED]

> Reorganize the [hot](crates/hot/src/lib.rs#L49-L68) crate into a **Core SDK + CLI binary**.
> Define plugin traits while temporarily maintaining legacy regex conversion.

### Core Design: Plugin Traits

```rust
// hot/src/ir.rs — Intermediate Representation
pub enum HotNode {
    Text(String),
    Bold(Vec<HotNode>),
    Italic(Vec<HotNode>),
    Heading { level: u8, children: Vec<HotNode> },
    List { ordered: bool, items: Vec<Vec<HotNode>> },
    Image { path: String, options: String },
    Styled { style: HotStyle, children: Vec<HotNode> },
    Raw(String),  // Protected tokens ({{ var }} etc.)
}

pub struct HotStyle {
    pub font_family: Option<String>,
    pub font_size: Option<f64>,
    pub color: Option<String>,
    pub text_align: Option<Align>,
    pub text_decoration: Option<Decoration>,
}

// hot/src/traits.rs — Plugin Interfaces
pub trait Parser {
    fn parse(&self, input: &str) -> Vec<HotNode>;
}

pub trait Renderer {
    fn render(&self, nodes: &[HotNode]) -> String;
}
```

---

## Phase 2: `tiptex-web` → `hot-editor` Renaming [COMPLETED]

> Unified renaming of directories, Docker images, and CI/CD references.

| Before | After |
|---|---|
| `apps/tiptex-web/` | `apps/hot-editor/` |
| `hotpaxel/tiptex-web` (Docker) | `hotpaxel/hot-editor` (Docker) |
| `docker-compose.yml` service | `tiptex-web` → `hot-editor` |

---

## Phase 3: Plugin Crate Implementation [COMPLETED]

> Replace regex-based conversion with parser-based plugins.

### [NEW] `crates/hot-html/` — HTML ↔ IR
### [NEW] `crates/hot-markdown/` — Markdown → IR
### [NEW] `crates/hot-tex/` — IR → TeX

---

## Phase 6: Single Binary & Infra Consolidation [COMPLETED]

> Consolidate the stack into a single Rust binary and slim down the infrastructure.

- **Integrated Binary**: Paxel (Axum) serves both API and Editor UI.
- **Nginx Removal**: Simplified single-process Docker image.
- **CI/CD Optimization**: Modular jobs (build-wasm, build-editor).
- **CLI Flags**: `--port`, `--static-dir`, `--disable-ui`.

## Phase 7: Performance & Documentation [PLANNED]

- [ ] Automated API Documentation (Swagger/OpenAPI)
- [ ] Response Compression (Gzip/Brotli) - Optional feature flag
- [ ] Compression Caching (Avoid redundant compute for static assets)

## Verification Plan

### CI/CD
- GitHub Actions: `release.yml` modular jobs validation.
- Docker: Single binary execution and UI serving check.

### E2E
- HTML → HOT → TeX → PAXEL → PDF full pipeline test.
- Remote asset handling (client-side download) verification.
