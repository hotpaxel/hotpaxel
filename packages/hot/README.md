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

## Converter interface

HOT accepts a converter implementation so we can plug in pandoc + Lua filters.
Pass an object with `texToHtml` and `htmlToTex` async methods when constructing `HotManager`.

```js
const converter = {
  async texToHtml(tex) {
    return "<p>converted</p>";
  },
  async htmlToTex(html) {
    return "\\begin{document}converted\\end{document}";
  },
};

const hot = new HotManager({ converter });
```

### Pandoc/Lua hook point

By default, HOT uses an internal converter that:

* Wraps logic chips in `<span class="hot-protect" data-raw="...">` per the Lua contract.
* Round-trips HTML produced by HOT without pandoc by extracting the protected `data-raw`.
* Uses pandoc + the Jules Lua filter (`src/lua/html-to-tex.lua`) when pandoc is available.
* Falls back to the legacy escape-based stub when pandoc is unavailable and the HTML is not HOT-produced.

See the Lua filter contract and known limits in [`src/lua/README.md`](./src/lua/README.md).

## Notes

- `renderPdf` is a stub in Phase 1 and will be wired to PAXEL later.
- Conversion logic is pluggable via the converter interface; default behavior uses the Lua-aware converter.
