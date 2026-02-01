const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const DEFAULT_LUA_FILTER_PATH = path.join(__dirname, "lua", "html-to-tex.lua");

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

const pandocAvailability = {
  checked: false,
  available: false,
};

const hasPandoc = () => {
  if (pandocAvailability.checked) {
    return pandocAvailability.available;
  }
  try {
    const result = spawnSync("pandoc", ["--version"], {
      stdio: "ignore",
    });
    pandocAvailability.available = result.status === 0;
  } catch (error) {
    pandocAvailability.available = false;
  }
  pandocAvailability.checked = true;
  return pandocAvailability.available;
};

const runPandoc = (args, input) =>
  new Promise((resolve, reject) => {
    const proc = spawn("pandoc", args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", (error) => {
      reject(error);
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      const message = stderr.trim().length > 0 ? stderr.trim() : `pandoc exited ${code}`;
      reject(new Error(message));
    });

    if (input) {
      proc.stdin.write(input);
    }
    proc.stdin.end();
  });

const LOGIC_TOKEN_REGEX = /%%\s*(\{\{.*?\}\}|\{%\s*.*?%\})/g;

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

const createLuaFilterConverter = ({ luaFilterPath = DEFAULT_LUA_FILTER_PATH } = {}) => ({
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

    if (hasPandoc()) {
      const output = await runPandoc(
        ["-f", "html", "-t", "latex", "--wrap=none", "--lua-filter", luaFilterPath],
        html,
      );
      return output;
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

const escapeHtmlAttribute = (value) =>
  escapeHtml(value).replaceAll("\"", "&quot;").replaceAll("'", "&#39;");

const unescapeHtml = (value) =>
  value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");

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
  createLuaFilterConverter,
};
