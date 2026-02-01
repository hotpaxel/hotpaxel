import { describe, it, expect, beforeAll } from "bun:test";
import { createLuaFilterConverter } from "../src/converter.node";
import { detectPandoc, warnPandocMissing } from "./pandoc";

describe("Lua Round-trip Vectors", () => {
  let converter;
  let hasPandoc = false;

  beforeAll(async () => {
    hasPandoc = await detectPandoc();
    if (!hasPandoc) {
      warnPandocMissing("Lua Round-trip");
    } else {
      converter = createLuaFilterConverter();
    }
  });

  const assertRoundTrip = async (html, expectedTex) => {
    if (!hasPandoc) return;
    const output = await converter.htmlToTex(html);
    // Trim whitespace to handle Pandoc's trailing newline behavior
    expect(output.trim()).toBe(expectedTex.trim());
  };

  it("should pass Template logic tokens in plain paragraphs", async () => {
    // Vector 1: Logic tokens in a paragraph
    // Note: Whitespace between spans/text in HTML becomes space in TeX paragraph.
    // Logic tokens are preserved as RawInline.

    const html = `
<p>
  <span class="hot-protect" data-raw="%% {% if is_valid %}">%% {% if is_valid %}</span>
  This content is visible if valid.
  <span class="hot-protect" data-raw="%% {% endif %}">%% {% endif %}</span>
</p>`;

    // Expected output has spaces where newlines were in HTML (standard behavior)
    const expectedTex = `%% {% if is_valid %} This content is visible if valid. %% {% endif %}`;

    await assertRoundTrip(html, expectedTex);
  });

  it("should pass One macro token inside a typical clause block", async () => {
    // Vector 2: Macro token
    // TeX: \Party{Tenant}{John Doe}

    const html = `<p><span class="hot-protect" data-raw="\\Party{Tenant}{John Doe}">Tenant: John Doe</span></p>`;
    const expectedTex = `\\Party{Tenant}{John Doe}`;

    await assertRoundTrip(html, expectedTex);
  });

  it("should pass ClauseRef macro", async () => {
    // TeX: \ClauseRef{clause:termination}
    const html = `<p>See <span class="hot-protect" data-raw="\\ClauseRef{clause:termination}">Clause 5</span>.</p>`;
    const expectedTex = `See \\ClauseRef{clause:termination}.`;

    await assertRoundTrip(html, expectedTex);
  });

  it("should pass SignBox macro", async () => {
    // TeX: \SignBox{Landlord}{Signature Here}
    const html = `<p><span class="hot-protect" data-raw="\\SignBox{Landlord}{Signature Here}">[SignBox: Landlord]</span></p>`;
    const expectedTex = `\\SignBox{Landlord}{Signature Here}`;

    await assertRoundTrip(html, expectedTex);
  });

  it("should pass Metadata command", async () => {
    // TeX: \makyesignmeta
    // Usually metadata commands might be outside paragraphs, but if wrapped in p it works too.
    // We include dummy content in the span to avoid issues with HTML parsers dropping empty spans.

    const html = `<p><span class="hot-protect" data-raw="\\makyesignmeta">[Meta]</span></p>`;
    const expectedTex = `\\makyesignmeta`;

    await assertRoundTrip(html, expectedTex);
  });
});
