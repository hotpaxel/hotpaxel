# HOT Round-trip Test Vectors

This directory contains test vectors for the HOTPAXEL round-trip conversion (TeX → HTML → TeX).

## Equality Rule

The Golden Rule for these vectors is **Exact String Equality**.

* Input TeX must match Output TeX byte-for-byte.
* Any deviation (whitespace, ordering, escaping) is considered a failure unless explicitly documented here as an exception.

### Why?
Legal and contract documents rely on precise formatting and logic tokens. We cannot afford "close enough" conversions that might inadvertently alter the meaning or validity of a smart contract wrapper.

## Exceptions

*(None currently defined. If an exception is needed, it must be approved by the CTO and documented here with a rationale.)*
