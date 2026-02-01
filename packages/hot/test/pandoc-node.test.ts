import { beforeAll, describe, expect, it } from "bun:test";
import { HotManager } from "../src/index.node";
import { detectPandoc, warnPandocMissing } from "./pandoc";

describe("Node pandoc converter", () => {
  let hasPandoc = false;

  beforeAll(async () => {
    hasPandoc = await detectPandoc();

    if (!hasPandoc) {
      warnPandocMissing("node pandoc conversion");
    }
  });

  it("converts generic HTML through pandoc when available", async () => {
    if (!hasPandoc) return;

    const hot = new HotManager();
    await hot.load("\\begin{document}seed\\end{document}");
    await hot.update("<p>foo & bar</p>");

    expect(hot.getTex()).toContain("foo \\& bar");
  });
});
