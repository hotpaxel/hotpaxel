# HOTPAXEL API Reference

This document provides technical details for the PAXEL Rendering Engine (Server) and the HOT SDK (WASM).

---

## 🚀 PAXEL Rendering Engine (REST API)

The PAXEL server is a stateless Rust/Axum service.

### 1. Compile TeX to PDF
`POST /compile`

Processes a TeX source and returns the compiled PDF file.

- **Request Body (JSON)**:
  ```json
  {
    "tex": "string",
    "passes": 2,
    "options": {
      "paper": "a4",
      "margin": "1in"
    }
  }
  ```
- **Response**: `application/pdf` binary stream.
- **Error Codes**:
  - `400 Bad Request`: Invalid TeX syntax or missing parameters.
  - `413 Payload Too Large`: TeX source exceeds the server limit.
  - `500 Internal Server Error`: XeLaTeX execution failure or timeout.

### 2. Font Management
- **`GET /fonts`**: Returns a JSON list of available system fonts for `fontspec`.
- **`GET /fonts/download/:file_name`**: Downloads a specific font file (e.g., `.ttf`, `.otf`).

### 3. Service Metadata
- **`GET /health`**: Returns `ok` (Text). Used for Docker health checks and load balancers.
- **`GET /version`**: Returns JSON with package information:
  ```json
  {
    "name": "paxel",
    "version": "0.2.1"
  }
  ```

---

## 🛠️ HOT SDK (WASM Library)

The HOT SDK is used in the browser to maintain the TeX Source of Truth.

### `HotConverter` Class

#### `new()`
Initializes a new converter instance.
- **Returns**: `HotConverter` instance.

#### `extract_hot_tex(html: string) -> string`
**The Core SSOT Extraction.** Converts editor HTML into clean, compilable TeX.
- **Note**: Handles logic chip protection and recursive node conversion.

#### `tex_to_hot_html(tex: string) -> string`
Converts TeX back into protected HTML for display in the editor.
- **Note**: Wraps logic tokens (`{{ ... }}`, `{% ... %}`) in non-editable tags.

#### `escape_latex(text: string) -> string`
Utility to escape TeX special characters (%, $, &, etc.).

---

## 🌐 Unified Serving

When running the unified `hotpaxel` binary, the server also serves the Editor UI:
- **Default Port**: `8888`
- **Static Assets**: Served from `./public`
- **SPA Routing**: Unknown paths fallback to `index.html` (managed by `ServeDir`).
