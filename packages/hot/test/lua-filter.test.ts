import { describe, it, expect, beforeAll } from "bun:test";
import { join } from "node:path";

describe("[GATE] Lua Filter Preservation", () => {
  const luaFilterPath = join(import.meta.dir, "../src/lua/html-to-tex.lua");
  let hasPandoc = false;

  beforeAll(async () => {
    try {
      const proc = Bun.spawn(["pandoc", "--version"], {
        stderr: "ignore",
        stdout: "ignore",
      });
      const exitCode = await proc.exited;
      hasPandoc = exitCode === 0;
    } catch (e) {
      hasPandoc = false;
    }

    if (!hasPandoc) {
      console.warn("Pandoc not found. Install pandoc to enable Phase 2 Gate tests.");
    }
  });

  const runPandoc = async (inputHtml: string): Promise<string> => {
    if (!hasPandoc) return "";

    const proc = Bun.spawn(
      ["pandoc", "-f", "html", "-t", "latex", "--lua-filter", luaFilterPath],
      {
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    const encoder = new TextEncoder();
    proc.stdin.write(encoder.encode(inputHtml));
    proc.stdin.flush();
    proc.stdin.end();

    const output = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    if (stderr && stderr.trim().length > 0) {
        // console.error("Pandoc stderr:", stderr);
    }

    return output;
  };

  it("should preserve protected tokens exactly (byte-for-byte) when data-raw is present", async () => {
    if (!hasPandoc) return;

    const input = `<p>Start <span class="hot-protect" data-raw="%% {% if x %}">Sentinel</span> End</p>`;
    const output = await runPandoc(input);

    // Pandoc latex output for <p> usually adds newlines.
    expect(output.trim()).toBe(`Start %% {% if x %} End`);
  });

  it("should ignore inner content when data-raw is present", async () => {
    if (!hasPandoc) return;

    const input = `<span class="hot-protect" data-raw="REAL">FAKE</span>`;
    const output = await runPandoc(input);

    expect(output.trim()).toBe("REAL");
    expect(output).not.toContain("FAKE");
  });

  it("should pass-through (fail-open) when data-raw is missing", async () => {
    if (!hasPandoc) return;

    const input = `<span class="hot-protect">foo & bar</span>`;
    const output = await runPandoc(input);

    // Normal latex escape for & is \&
    expect(output.trim()).toBe(`foo \\& bar`);
  });

  it("should NOT protect if class does not match exactly", async () => {
    if (!hasPandoc) return;

    const input = `<span class="not-hot-protect" data-raw="HIDDEN">Visible</span>`;
    const output = await runPandoc(input);

    expect(output.trim()).toBe("Visible");
    expect(output).not.toContain("HIDDEN");
  });

  it("should preserve whitespace in data-raw exactly", async () => {
    if (!hasPandoc) return;

    const raw = "  %% {%  preserved  %}  ";
    const input = `<span class="hot-protect" data-raw="${raw}">Content</span>`;
    const output = await runPandoc(input);

    // With -t latex, pandoc often outputs the raw inline.
    // If input is <span ...>...</span> (without <p>), output might not have newlines depending on context.
    // But since runPandoc sends raw html, pandoc treats it as part of document.
    // Let's check containment to be safe against pandoc wrapping logic, but strict enough on the token.
    expect(output).toContain(raw);
  });
});
