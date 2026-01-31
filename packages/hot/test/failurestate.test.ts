import { describe, expect, it } from "bun:test";
import { HotManager } from "../src";

describe("FailureState handling", () => {
  it("updates TeX on successful conversion", async () => {
    const hot = new HotManager();

    await hot.load("\\begin{document}start\\end{document}");
    await hot.update("<p>ok</p>");

    expect(hot.getTex()).toBe("\\begin{document}<p>ok</p>\\end{document}");
  });

  it("preserves last valid TeX on conversion failure", async () => {
    const hot = new HotManager();

    await hot.load("\\begin{document}safe\\end{document}");
    await hot.update("__FAIL__");

    expect(hot.getTex()).toBe("\\begin{document}safe\\end{document}");
  });

  it("never throws when getting TeX", async () => {
    const hot = new HotManager();

    await hot.load("\\begin{document}safe\\end{document}");
    await hot.update("__FAIL__");

    expect(() => hot.getTex()).not.toThrow();
  });
});
