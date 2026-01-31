import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Round-trip Vectors", () => {
  const vectorsDir = join(import.meta.dir, "../test-vectors");
  const logicTexPath = join(vectorsDir, "logic.tex");

  it("should load the logic.tex vector", () => {
    const content = readFileSync(logicTexPath, "utf-8");
    expect(content).toBeString();
    expect(content).toContain("\\makyesignmeta");
    // Ensure the Jinja2 tokens are wrapped in comments as per spec
    expect(content).toContain("%% {% if is_valid %}");
  });

  // TODO(Phase 2): This test MUST be enabled and passing before Phase 4 (UI Contract Freeze).
  // Currently skipped as logic chip protection (Lua filters) is not yet implemented.
  it.skip("should round-trip logic.tex with exact string equality", async () => {
    const input = readFileSync(logicTexPath, "utf-8");

    // TODO: Implement actual conversion logic here
    // const html = await hot.convertToHtml(input);
    // const output = await hot.convertToTex(html);
    const output = input; // Placeholder

    expect(output).toBe(input);
  });
});
