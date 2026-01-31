import { describe, it, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Round-trip Vectors", () => {
  const vectorsDir = join(import.meta.dir, "../test-vectors");
  const logicTexPath = join(vectorsDir, "logic.tex");

  it("should load the logic.tex vector", () => {
    const content = readFileSync(logicTexPath, "utf-8");
    expect(content).toBeString();
    expect(content).toContain("\\makyesignmeta");
    expect(content).toContain("{% if is_valid %}");
  });

  // This test is the scaffold for Phase 2 implementation.
  // It is currently skipped because the logic chip protection is not yet implemented.
  test.skip("should round-trip logic.tex with exact string equality", async () => {
    const input = readFileSync(logicTexPath, "utf-8");

    // TODO: Implement actual conversion logic here
    // const html = await hot.convertToHtml(input);
    // const output = await hot.convertToTex(html);
    const output = input; // Placeholder

    expect(output).toBe(input);
  });
});
