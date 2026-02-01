# Known Limits of Round-Trip Conversion

This document outlines the known limitations of the TeX <-> HTML round-trip conversion process, specifically regarding the Lua filter strategy.

## 1. Whitespace Normalization

When converting TeX to HTML and back, whitespace (newlines, spaces) within paragraphs is normalized.

*   **Behavior:** Newlines in TeX paragraphs become spaces in HTML (standard HTML behavior). When converted back to TeX, they remain as spaces (or soft wrapped lines by Pandoc).
*   **Impact:** Byte-for-byte equality is not guaranteed for content that relies on specific line breaks within a paragraph (e.g., logic tokens placed on separate lines for readability).
*   **Workaround:** Logic tokens and content are preserved semantically. If strict formatting is required, logic tokens should be handled as block elements or preformatted text, which requires broader UI/Schema changes.

## 2. Comment Preservation

The logic tokens in `logic.tex` use TeX comments (`%% ...`).

*   **Behavior:** Standard Pandoc processing strips TeX comments.
*   **Mitigation:** The Lua filter strategy protects these tokens by wrapping them in `span.hot-protect` with `data-raw` attribute *before* they reach Pandoc (during TeX -> HTML, simulated in tests).
*   **Limit:** Any comments *not* wrapped in a protected span will be lost during the round-trip.

## 3. HTML Attributes

Pandoc's HTML reader strips the `data-` prefix from attributes.

*   **Behavior:** `<span data-raw="...">` becomes a span with attribute `raw="..."` in Pandoc's internal AST.
*   **Resolution:** The Lua filter handles this by checking for both `data-raw` and `raw` attributes.

## 4. Unmatched Protected Spans

*   **Behavior:** If a `span.hot-protect` does not have a `data-raw` attribute, the filter "fails open" and returns the inner content of the span.
*   **Behavior:** If a span has `data-raw` but does not match the `hot-protect` class, it is ignored by the filter and processed by Pandoc (typically resulting in `{Content}` in LaTeX output).

## Verification

To verify the round-trip behavior and the fix for logic token preservation, run the following tests:

```bash
bun test packages/hot/test/lua_roundtrip.test.ts
bun test packages/hot/test/lua-filter.test.ts
```
