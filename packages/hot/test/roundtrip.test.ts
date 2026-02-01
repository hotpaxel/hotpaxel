import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HotManager } from "../src";

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

  it("should round-trip logic.tex with exact string equality", async () => {
    const input = readFileSync(logicTexPath, "utf-8");
    const hot = new HotManager();
    const html = await hot.load(input);
    await hot.update(html);
    const output = hot.getTex();

    expect(output).toBe(input);
  });
});
