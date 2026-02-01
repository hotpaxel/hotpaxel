const createStubConverter = () => ({
  async texToHtml(tex) {
    if (typeof tex !== "string") {
      throw new TypeError("TeX input must be a string");
    }
    return `<pre>${escapeHtml(tex)}</pre>`;
  },
  async htmlToTex(html) {
    if (typeof html !== "string") {
      throw new TypeError("HTML input must be a string");
    }
    if (html.includes("__FAIL__")) {
      throw new Error("Stub conversion failure");
    }
    const safeText = escapeLatex(html);
    return `\\documentclass{article}\\begin{document}${safeText}\\end{document}`;
  },
});

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
  createStubConverter,
};
