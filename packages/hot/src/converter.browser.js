const {
  createStubConverter,
  escapeLatex,
  extractHotTex,
  texToHotHtml,
} = require("./converter.shared");

const createLuaFilterConverter = () => ({
  async texToHtml(tex) {
    if (typeof tex !== "string") {
      throw new TypeError("TeX input must be a string");
    }
    return texToHotHtml(tex);
  },
  async htmlToTex(html) {
    if (typeof html !== "string") {
      throw new TypeError("HTML input must be a string");
    }
    if (html.includes("__FAIL__")) {
      throw new Error("Stub conversion failure");
    }

    const hotTex = extractHotTex(html);
    if (hotTex !== null) {
      return hotTex;
    }

    const safeText = escapeLatex(html);
    return `\\documentclass{article}\\begin{document}${safeText}\\end{document}`;
  },
});

module.exports = {
  createStubConverter,
  createLuaFilterConverter,
};
