# @hotpaxel/hot

HOTPAXEL's HOT SDK is the client-side manager that maintains a **single source of truth (SSOT)** for TeX.
The `HotManager` keeps the latest valid TeX in memory so the app can always export or render the document even if HTML conversion fails.

## Usage (intended)

```js
const { HotManager } = require("@hotpaxel/hot");

const hot = new HotManager();

await hot.init();
await hot.load("% Initial TeX");

await hot.update("<p>Hello</p>");

const tex = hot.getTex();
console.log(tex);
```

## Notes

- `renderPdf` is a stub in Phase 1 and will be wired to PAXEL later.
- Conversion logic and failure handling will be implemented in subsequent phases.
- `update()` does not perform HTML-to-TeX conversion yet (Phase 1 stub).
