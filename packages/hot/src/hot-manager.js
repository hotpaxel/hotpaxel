const { createStubConverter } = require("./converter");

class HotManager {
  constructor({ converter } = {}) {
    this.defaultTex = "\\documentclass{article}\\begin{document}\\end{document}";
    // currentTex represents the latest successful conversion output.
    this.currentTex = this.defaultTex;
    this.lastValidTex = this.defaultTex;
    this.failureState = {
      hasFailure: false,
      error: null,
    };
    this.lastHtml = "";
    this.converter = converter ?? createStubConverter();
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
    return this.converter.texToHtml(nextTex);
  }

  async update(html) {
    this.lastHtml = html;
    try {
      const convertedTex = await this.converter.htmlToTex(html);
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
}

module.exports = {
  HotManager,
};
