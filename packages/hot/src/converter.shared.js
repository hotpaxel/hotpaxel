const LOGIC_TOKEN_REGEX = /%%\s*(\{\{[\s\S]*?\}\}|\{%\s*[\s\S]*?%\})/g;

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const escapeHtmlAttribute = (value) =>
  escapeHtml(value).replaceAll("\"", "&quot;").replaceAll("'", "&#39;");

const unescapeHtml = (value) =>
  value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");

const escapeLatex = (value) => {
  const sentinel = "__HOT_BACKSLASH__";
  return value
    .replaceAll("\\", sentinel)
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
    .replaceAll(">", "\\textgreater{}")
    .replaceAll(sentinel, "\\textbackslash{}");
};

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

const texToHotHtml = (tex) => {
  let html = "";
  let cursor = 0;
  let match;

  while ((match = LOGIC_TOKEN_REGEX.exec(tex)) !== null) {
    const token = match[0];
    html += escapeHtml(tex.slice(cursor, match.index));
    html += `<span class="hot-protect" data-raw="${escapeHtmlAttribute(token)}">${escapeHtml(
      token,
    )}</span>`;
    cursor = match.index + token.length;
  }

  html += escapeHtml(tex.slice(cursor));
  return `<pre data-hot-tex="true">${html}</pre>`;
};

const extractHotTex = (html) => {
  const preMatch = html.match(/<pre[^>]*data-hot-tex="true"[^>]*>([\s\S]*?)<\/pre>/i);
  if (!preMatch) {
    return null;
  }

  let body = preMatch[1];

  body = body.replace(/<span\b[^>]*class="hot-protect"[^>]*>[\s\S]*?<\/span>/gi, (match) => {
    const rawMatch = match.match(/data-raw=("|')([\s\S]*?)\1/i);
    if (!rawMatch) {
      return "";
    }
    return unescapeHtml(rawMatch[2]);
  });

  body = body.replace(/<[^>]+>/g, "");
  return unescapeHtml(body);
};

module.exports = {
  LOGIC_TOKEN_REGEX,
  createStubConverter,
  escapeLatex,
  extractHotTex,
  texToHotHtml,
};
