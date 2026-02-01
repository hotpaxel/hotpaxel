import { describe, expect, it } from "bun:test";
import { HotManager } from "../src";

describe("FailureState handling", () => {
  it("updates TeX on successful conversion", async () => {
    const hot = new HotManager();

    await hot.load("\\begin{document}start\\end{document}");
    await hot.update("<p>ok</p>");

    expect(hot.getTex()).toBe(
      "\\documentclass{article}\\begin{document}\\textless{}p\\textgreater{}ok\\textless{}/p\\textgreater{}\\end{document}",
    );
    expect(hot.getFailureState()).toEqual({ hasFailure: false, error: null });
  });

  it("preserves last valid TeX on conversion failure", async () => {
    const hot = new HotManager();

    await hot.load("\\begin{document}safe\\end{document}");
    await hot.update("__FAIL__");

    expect(hot.getTex()).toBe("\\begin{document}safe\\end{document}");
    expect(hot.getFailureState().hasFailure).toBe(true);
  });

  it("never throws when getting TeX", async () => {
    const hot = new HotManager();

    await hot.load("\\begin{document}safe\\end{document}");
    await hot.update("__FAIL__");

    expect(() => hot.getTex()).not.toThrow();
  });
});
