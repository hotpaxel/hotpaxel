import { describe, it, expect, beforeAll } from "bun:test";
import { join } from "node:path";
import { detectPandoc, warnPandocMissing } from "./pandoc";

describe("[GATE] Lua Filter Preservation", () => {
  const luaFilterPath = join(import.meta.dir, "../src/lua/html-to-tex.lua");
  let hasPandoc = false;

  beforeAll(async () => {
    hasPandoc = await detectPandoc();

    if (!hasPandoc) {
      warnPandocMissing("Phase 2 Gate");
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
    // NOTE: We use trim() here because Pandoc often appends a trailing newline to the document.
    // The strict byte-level preservation of the token itself is verified in the "whitespace preservation" test below.
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

    // We expect the output to contain the raw string exactly.
    // This verifies that the Lua filter does NOT trim or normalize the content of data-raw.
    expect(output).toContain(raw);
  });
});
