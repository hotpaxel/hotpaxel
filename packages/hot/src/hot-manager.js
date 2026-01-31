class HotManager {
  constructor() {
    this.currentTex = "\\documentclass{article}\\begin{document}\\end{document}";
    this.lastValidTex = this.currentTex;
    this.failureState = {
      hasFailure: false,
      error: null,
    };
    this.lastHtml = "";
  }

  async init() {
    return;
  }

  async load(tex) {
    this.currentTex = tex;
    this.lastValidTex = tex;
    this.failureState = {
      hasFailure: false,
      error: null,
    };
    return `<pre>${escapeHtml(tex)}</pre>`;
  }

  async update(html) {
    this.lastHtml = html;
    try {
      const convertedTex = this.convertHtmlToTex(html);
      this.currentTex = convertedTex;
      this.lastValidTex = convertedTex;
      this.failureState = {
        hasFailure: false,
        error: null,
      };
    } catch (error) {
      // Failure semantics: keep last valid TeX as the SSOT and surface metadata.
      this.currentTex = this.lastValidTex;
      this.failureState = {
        hasFailure: true,
        error: {
          message: error instanceof Error ? error.message : "Unknown conversion error",
          cause: error instanceof Error ? error.cause ?? null : null,
        },
      };
    }
  }

  getTex() {
    return this.lastValidTex;
  }

  async renderPdf(paxelUrl, opts = {}) {
    return {
      status: "stub",
      paxelUrl,
      opts,
    };
  }

  convertHtmlToTex(html) {
    // Phase 1 stub: ensures a non-empty TeX string for SSOT continuity.
    if (typeof html !== "string") {
      throw new TypeError("HTML input must be a string");
    }
    if (html.includes("__FAIL__")) {
      throw new Error("Stub conversion failure");
    }
    return `\\begin{document}${html}\\end{document}`;
  }
}

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

module.exports = {
  HotManager,
};
