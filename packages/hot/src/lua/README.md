# HOTPAXEL Lua Filter Strategy

This directory contains the Lua filters used by Pandoc to convert HTML back to TeX while preserving critical Logic Chips (contracts).

## Philosophy: Dumb Preservation

The Lua filter is designed to be **dumb**. It does not:
* Parse TeX logic.
* Validate syntax.
* Infer intent from inner HTML.

It only does one thing: **Unwrap `data-raw` verbatim.**

## The Contract (UI → Pandoc)

To protect a token (Logic Chip) during conversion, the HTML must follow this strict structure:

```html
<span class="hot-protect" data-raw="%% {% if x %}">
  Human Readable Content (Ignored by Lua)
</span>
```

### Rules

1.  **Exact Class Match:** The element must have the class `hot-protect`.
2.  **`data-raw` is King:** If `data-raw` is present, its value is injected directly into the TeX output as a `RawInline`.
    * No trimming (whitespace is preserved).
    * No escaping (it is raw TeX).
    * Inner HTML content is completely ignored.
3.  **Fail-Open / Pass-Through:** If `data-raw` is missing on a `hot-protect` span:
    * The filter returns `nil` (pass-through).
    * Pandoc will process the inner content normally (likely escaping special characters).
    * This is considered a "Contract Violation" by the UI, but the filter will not crash.

## External Dependencies

*   **Pandoc:** This filter requires Pandoc to run. It is not a standalone script.
