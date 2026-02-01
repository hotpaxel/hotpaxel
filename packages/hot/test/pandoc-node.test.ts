import { beforeAll, describe, expect, it } from "bun:test";
import { HotManager } from "../src/index.node";

describe("Node pandoc converter", () => {
  let hasPandoc = false;

  beforeAll(async () => {
    try {
      const proc = Bun.spawn(["pandoc", "--version"], {
        stderr: "ignore",
        stdout: "ignore",
      });
      const exitCode = await proc.exited;
      hasPandoc = exitCode === 0;
    } catch (error) {
      hasPandoc = false;
    }

    if (!hasPandoc) {
      console.warn("Pandoc not found. Skipping node pandoc conversion test.");
    }
  });

  it("converts generic HTML through pandoc when available", async () => {
    if (!hasPandoc) return;

    const hot = new HotManager();
    await hot.load("\\begin{document}seed\\end{document}");
    await hot.update("<p>foo & bar</p>");

    expect(hot.getTex().trim()).toBe("foo \\& bar");
  });
});
