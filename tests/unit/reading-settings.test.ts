import { Color } from "@src/common/color";
import {
  buildReadingCss,
  DEFAULT_READING_SETTINGS,
  isSpacerParagraph,
  markSpacerParagraphs,
  migrateReadingSettings,
  SPACER_PARAGRAPH_ATTR,
} from "@src/common/reading-settings";
import { beforeEach, describe, expect, it } from "vitest";

describe("buildReadingCss", () => {
  it("returns an empty string for all-default settings", () => {
    expect(buildReadingCss(DEFAULT_READING_SETTINGS)).toBe("");
  });

  it("emits only font-size when only font size is non-default", () => {
    const css = buildReadingCss({
      ...DEFAULT_READING_SETTINGS,
      fontSizePercent: 115,
    });

    expect(css).toContain("#workskin {");
    expect(css).toContain("font-size: 115% !important;");
    expect(css).not.toContain("font-family");
    expect(css).not.toContain("line-height");
    expect(css).not.toContain("max-width");
    expect(css).not.toContain(".userstuff p");
  });

  it("emits only font-family when only font family is non-default", () => {
    const css = buildReadingCss({
      ...DEFAULT_READING_SETTINGS,
      fontFamily: "monospace",
    });

    expect(css).toContain("font-family: 'Courier New', monospace !important;");
    expect(css).not.toContain("font-size");
  });

  it("emits only line-height when only line height is set", () => {
    const css = buildReadingCss({
      ...DEFAULT_READING_SETTINGS,
      lineHeight: 1.45,
    });

    expect(css).toContain("line-height: 1.45 !important;");
    expect(css).not.toContain("font-size");
  });

  it("emits only max-width when only max width is set", () => {
    const css = buildReadingCss({
      ...DEFAULT_READING_SETTINGS,
      maxWidthEm: 45,
    });

    expect(css).toContain("max-width: 45em !important;");
    expect(css).not.toContain(".userstuff p");
  });

  it("emits only the paragraph rule when only paragraph spacing is set", () => {
    const css = buildReadingCss({
      ...DEFAULT_READING_SETTINGS,
      paragraphSpacingEm: 1.6,
    });

    expect(css).toContain("#workskin .userstuff p {");
    expect(css).toContain("margin-top: 0 !important;");
    expect(css).toContain("margin-bottom: 1.6em !important;");
    expect(css).not.toContain("#workskin {\n");
  });

  it("emits the spacer-hide rule when standardize line breaks is on", () => {
    const css = buildReadingCss({
      ...DEFAULT_READING_SETTINGS,
      standardizeLineBreaks: true,
    });

    expect(css).toContain(`#workskin .userstuff p[${SPACER_PARAGRAPH_ATTR}] {`);
    expect(css).toContain("display: none !important;");
    expect(css).not.toContain("#workskin {\n");
  });

  it("emits only the alignment rule when only text align is set", () => {
    const css = buildReadingCss({
      ...DEFAULT_READING_SETTINGS,
      textAlign: "justify",
    });

    expect(css).toContain("#workskin .userstuff {");
    expect(css).toContain("text-align: justify !important;");
    expect(css).not.toContain("#workskin {\n");

    expect(
      buildReadingCss({ ...DEFAULT_READING_SETTINGS, textAlign: "right" }),
    ).toContain("text-align: right !important;");
  });

  it("combines all rules for mixed settings", () => {
    const css = buildReadingCss({
      fontFamily: "serif",
      textAlign: "justify",
      fontSizePercent: 90,
      maxWidthEm: 85,
      lineHeight: 1.8,
      paragraphSpacingEm: 0.8,
      standardizeLineBreaks: true,
    });

    expect(css).toContain(
      "font-family: 'Georgia', 'Times New Roman', serif !important;",
    );
    expect(css).toContain("font-size: 90% !important;");
    expect(css).toContain("line-height: 1.8 !important;");
    expect(css).toContain("max-width: 85em !important;");
    expect(css).toContain("text-align: justify !important;");
    expect(css).toContain("margin-bottom: 0.8em !important;");
    expect(css).toContain(`p[${SPACER_PARAGRAPH_ATTR}]`);
  });
});

describe("migrateReadingSettings", () => {
  it("returns defaults for null or garbage", () => {
    expect(migrateReadingSettings(null)).toEqual(DEFAULT_READING_SETTINGS);
    expect(migrateReadingSettings("nonsense")).toEqual(
      DEFAULT_READING_SETTINGS,
    );
    expect(migrateReadingSettings(42)).toEqual(DEFAULT_READING_SETTINGS);
  });

  it("maps v1 defaults to the unset v2 state", () => {
    expect(
      migrateReadingSettings({
        fontSize: "medium",
        maxWidth: "medium",
        lineSpacing: "comfortable",
        paragraphSpacing: "standard",
        fontFamily: "default",
      }),
    ).toEqual(DEFAULT_READING_SETTINGS);
  });

  it("maps non-default v1 values to their numeric equivalents", () => {
    expect(
      migrateReadingSettings({
        fontSize: "large",
        maxWidth: "narrow",
        lineSpacing: "spacious",
        paragraphSpacing: "generous",
        fontFamily: "monospace",
      }),
    ).toEqual({
      fontFamily: "monospace",
      textAlign: null,
      fontSizePercent: 115,
      maxWidthEm: 45,
      lineHeight: 1.8,
      paragraphSpacingEm: 1.6,
      standardizeLineBreaks: false,
    });
  });

  it("passes v2 shapes through, merged over defaults", () => {
    expect(
      migrateReadingSettings({
        lineHeight: 1.45,
        standardizeLineBreaks: true,
      }),
    ).toEqual({
      ...DEFAULT_READING_SETTINGS,
      lineHeight: 1.45,
      standardizeLineBreaks: true,
    });
  });

  it("keeps valid text alignment and drops anything else", () => {
    expect(migrateReadingSettings({ textAlign: "justify" }).textAlign).toBe(
      "justify",
    );
    expect(migrateReadingSettings({ textAlign: "left" }).textAlign).toBe(
      "left",
    );
    expect(
      migrateReadingSettings({ textAlign: "center" }).textAlign,
    ).toBeNull();
    expect(migrateReadingSettings({ textAlign: 3 }).textAlign).toBeNull();
  });

  it("ignores wrongly-typed v2 fields", () => {
    expect(
      migrateReadingSettings({
        fontSizePercent: "big",
        maxWidthEm: {},
        fontFamily: "comic-sans",
      }),
    ).toEqual(DEFAULT_READING_SETTINGS);
  });
});

describe("spacer paragraphs", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  const makeParagraph = (html: string): Element => {
    document.body.innerHTML = `<div class="userstuff">${html}</div>`;

    const paragraph = document.querySelector(".userstuff p");

    if (!paragraph) throw new Error("no paragraph rendered");

    return paragraph;
  };

  it("classifies nbsp-only and br-only paragraphs as spacers", () => {
    expect(isSpacerParagraph(makeParagraph("<p>&nbsp;</p>"))).toBe(true);
    expect(isSpacerParagraph(makeParagraph("<p><br></p>"))).toBe(true);
    expect(isSpacerParagraph(makeParagraph("<p>   </p>"))).toBe(true);
    expect(isSpacerParagraph(makeParagraph("<p></p>"))).toBe(true);
    expect(
      isSpacerParagraph(
        makeParagraph(
          '<p style="margin-top: 0px; margin-bottom: 1.2em;">&nbsp;</p>',
        ),
      ),
    ).toBe(true);
  });

  it("never classifies content paragraphs as spacers", () => {
    expect(isSpacerParagraph(makeParagraph("<p>text</p>"))).toBe(false);
    expect(isSpacerParagraph(makeParagraph('<p><img src="x.png"></p>'))).toBe(
      false,
    );
    expect(isSpacerParagraph(makeParagraph("<p><em>styled</em></p>"))).toBe(
      false,
    );
    expect(isSpacerParagraph(makeParagraph("<p><em></em></p>"))).toBe(false);
  });

  it("marks only spacer paragraphs inside userstuff", () => {
    document.body.innerHTML = `
      <div id="workskin">
        <div class="userstuff">
          <p>First paragraph.</p>
          <p>&nbsp;</p>
          <p><br></p>
          <p><img src="divider.png"></p>
          <p>Second paragraph.</p>
        </div>
        <p>&nbsp;</p>
      </div>`;

    expect(markSpacerParagraphs(document)).toBe(2);

    const marked = document.querySelectorAll(`[${SPACER_PARAGRAPH_ATTR}]`);

    expect(marked.length).toBe(2);
    expect(
      document
        .querySelector("img")
        ?.closest("p")
        ?.hasAttribute(SPACER_PARAGRAPH_ATTR),
    ).toBe(false);
  });
});

describe("Color.isDarkCssColor", () => {
  it("classifies white as light", () => {
    expect(Color.isDarkCssColor("rgb(255, 255, 255)")).toBe(false);
  });

  it("classifies AO3 Reversi-style backgrounds as dark", () => {
    expect(Color.isDarkCssColor("rgb(51, 51, 51)")).toBe(true);
  });

  it("classifies black as dark", () => {
    expect(Color.isDarkCssColor("rgb(0, 0, 0)")).toBe(true);
  });

  it("returns null for fully transparent backgrounds", () => {
    expect(Color.isDarkCssColor("rgba(0, 0, 0, 0)")).toBeNull();
  });

  it("returns null for mostly transparent backgrounds", () => {
    expect(Color.isDarkCssColor("rgba(20, 20, 20, 0.25)")).toBeNull();
  });

  it("classifies opaque-enough rgba values", () => {
    expect(Color.isDarkCssColor("rgba(20, 20, 20, 0.9)")).toBe(true);
    expect(Color.isDarkCssColor("rgba(250, 250, 250, 1)")).toBe(false);
  });

  it("returns null for keywords and unparseable values", () => {
    expect(Color.isDarkCssColor("transparent")).toBeNull();
    expect(Color.isDarkCssColor("#333")).toBeNull();
    expect(Color.isDarkCssColor("not-a-color")).toBeNull();
  });
});
