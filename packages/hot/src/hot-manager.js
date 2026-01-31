class HotManager {
  constructor() {
    this.defaultTex = "\\documentclass{article}\\begin{document}\\end{document}";
    // currentTex represents the latest successful conversion output.
    this.currentTex = this.defaultTex;
    this.lastValidTex = this.defaultTex;
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
    const nextTex =
      typeof tex === "string" && tex.trim().length > 0 ? tex : this.defaultTex;
    this.currentTex = nextTex;
    this.lastValidTex = nextTex;
    this.failureState = {
      hasFailure: false,
      error: null,
    };
    return `<pre>${escapeHtml(nextTex)}</pre>`;
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

  getFailureState() {
    return {
      hasFailure: this.failureState.hasFailure,
      error: this.failureState.error ? { ...this.failureState.error } : null,
    };
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
    const safeText = escapeLatex(html);
    return `\\documentclass{article}\\begin{document}${safeText}\\end{document}`;
  }
}

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const escapeLatex = (value) =>
  value
    .replaceAll("\\", "\\textbackslash{}")
    .replaceAll("{", "\\{")
    .replaceAll("}", "\\}")
    .replaceAll("%", "\\%")
    .replaceAll("$", "\\$")
    .replaceAll("#", "\\#")
    .replaceAll("&", "\\&")
    .replaceAll("_", "\\_")
    .replaceAll("^", "\\^{}")
    .replaceAll("~", "\\~{}")
    .replaceAll("<", "\\textless{}")
    .replaceAll(">", "\\textgreater{}");

module.exports = {
  HotManager,
};
