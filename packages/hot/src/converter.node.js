const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");
const {
  createStubConverter,
  escapeLatex,
  extractHotTex,
  texToHotHtml,
} = require("./converter.shared");

const DEFAULT_LUA_FILTER_PATH = path.join(__dirname, "lua", "html-to-tex.lua");

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

module.exports = {
  createStubConverter,
  createLuaFilterConverter,
};
