class HotManager {
  constructor() {
    this.currentTex = "\\documentclass{article}\\begin{document}\\end{document}";
    this.lastHtml = "";
  }

  async init() {
    return;
  }

  async load(tex) {
    this.currentTex = tex;
    return `<pre>${escapeHtml(tex)}</pre>`;
  }

  async update(html) {
    this.lastHtml = html;
  }

  getTex() {
    return this.currentTex;
  }

  async renderPdf(paxelUrl, opts = {}) {
    return {
      status: "stub",
      paxelUrl,
      opts,
    };
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
