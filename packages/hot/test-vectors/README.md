# HOT Round-trip Test Vectors

This directory contains test vectors for the HOTPAXEL round-trip conversion (TeX → HTML → TeX).

## Equality Rule

The Golden Rule for these vectors is **Exact String Equality**.

* Input TeX must match Output TeX byte-for-byte.
* Any deviation (whitespace, ordering, escaping) is considered a failure unless explicitly documented here as an exception.

### Why?
Legal and contract documents rely on precise formatting and logic tokens. We cannot afford "close enough" conversions that might inadvertently alter the meaning or validity of a smart contract wrapper.

## Logic Tokens in TeX

Logic tokens like `{% if ... %}` and `{{ variable }}` are invalid LaTeX because `%` starts a comment, potentially leaving unbalanced braces `{`. To maintain TeX validity and parsing safety, these tokens **must be wrapped in TeX comments** (e.g., `%% {% if ... %}`) in the source file.

The round-trip conversion logic must respect this wrapping:
- **TeX → HTML**: Detect `%% {% ... %}` and convert to protected HTML logic chips.
- **HTML → TeX**: Convert logic chips back to `%% {% ... %}` exactly.

## Exceptions

*(None currently defined. If an exception is needed, it must be approved by the CTO and documented here with a rationale.)*
