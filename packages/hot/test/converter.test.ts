import { describe, expect, it } from "bun:test";
import { HotManager } from "../src";

describe("Converter interface", () => {
  it("delegates conversions to the provided converter", async () => {
    const calls = {
      texToHtml: 0,
      htmlToTex: 0,
    };
    const converter = {
      async texToHtml(tex: string) {
        calls.texToHtml += 1;
        return `<pre>${tex}</pre>`;
      },
      async htmlToTex() {
        calls.htmlToTex += 1;
        return "\\begin{document}custom\\end{document}";
      },
    };

    const hot = new HotManager({ converter });

    await hot.load("\\begin{document}start\\end{document}");
    await hot.update("<p>hello</p>");

    expect(calls.texToHtml).toBe(1);
    expect(calls.htmlToTex).toBe(1);
    expect(hot.getTex()).toBe("\\begin{document}custom\\end{document}");
  });
});
