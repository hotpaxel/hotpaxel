class HotManager {
  constructor() {
    this.currentTex = "";
    this.lastHtml = "";
  }

  async init() {
    return;
  }

  async load(tex) {
    this.currentTex = tex;
    return this.currentTex;
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

module.exports = {
  HotManager,
};
