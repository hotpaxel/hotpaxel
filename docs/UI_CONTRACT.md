# HotPaxel Editor UI/SDK Contract

**[Back to README](../README.md)** | **[Architecture Spec](./architecture.md)** | **[Engineering Guide](./engineering_guide.md)** | **[API Reference](./api.md)**

---

## HOT Public API usage patterns
- **`init()`**: Initializes the WASM module (must be called once before usage).
- **`HotConverter` class**:
    - `extract_hot_tex(html)`: Takes editor-generated HTML and extracts TeX via intermediate representation (IR).
    - `escape_latex(text)`: Escapes plain text into TeX-safe characters.
- **State Management**: The `HotSdkService` operates as a singleton providing `SYNCING`, `SUCCESS`, and `FAILURE` states.

## HTML & TeX Contract
- **Formatting**: `<strong>` and `<em>` map to `\textbf` and `\textit` respectively.
- **Images**: `<img src="...">` tags are converted to `\includegraphics`. Remote URLs must be pre-downloaded by the client and sent as Base64.
- **Structure**: `<h1>` through `<h3>` correspond to `\section` through `\subsubsection`.

## Protected tokens (must round-trip)
- **Control Statements**: `{% if %}`, `{% for %}`, `{{ variable }}` (Handlebars/Jinja style).
- **Macros**: `\SignBox`, `\ClauseRef`, `\Party`, `\makyesignmeta`.
- These tokens are protected within the editor via the `ProtectedToken` extension and must not be lost or mangled during conversion.

## Failure UX policy
- **Syncing Delay**: While typing, the status shows `SYNCING`. If validation fails, a `FAILURE` status is triggered and an error banner is displayed.
- **Non-destructive Recovery**: Even on conversion failure, the editor's HTML is preserved. Once the user corrects the structure to a valid state, it automatically recovers to `SUCCESS`.
