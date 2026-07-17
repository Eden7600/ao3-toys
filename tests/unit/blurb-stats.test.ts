import {
  computeBlurbRatios,
  extractPublishedChapters,
  extractStatNumber,
  formatKudosPerHit,
  formatRatio,
  kudosPerHitRatio,
  parseStatNumber,
  wordsPerChapterRatio,
} from "@src/common/blurb-stats";
import { describe, expect, it } from "vitest";

describe("parseStatNumber", () => {
  it("parses plain numbers", () => {
    expect(parseStatNumber("42")).toBe(42);
  });

  it("strips comma thousands separators", () => {
    expect(parseStatNumber("1,234,567")).toBe(1234567);
  });

  it("tolerates surrounding whitespace", () => {
    expect(parseStatNumber("  1,532 ")).toBe(1532);
  });

  it("returns null for missing or empty text", () => {
    expect(parseStatNumber(null)).toBeNull();
    expect(parseStatNumber(undefined)).toBeNull();
    expect(parseStatNumber("")).toBeNull();
  });

  it("returns null for non-numeric text", () => {
    expect(parseStatNumber("English")).toBeNull();
    expect(parseStatNumber("12/?")).toBeNull();
  });
});

describe("kudosPerHitRatio", () => {
  it("divides kudos by hits", () => {
    expect(kudosPerHitRatio(100, 1532)).toBeCloseTo(0.0653, 4);
  });

  it("returns null when kudos is 0 (unrated, not bad)", () => {
    expect(kudosPerHitRatio(0, 1532)).toBeNull();
  });

  it("returns null when hits is 0", () => {
    expect(kudosPerHitRatio(100, 0)).toBeNull();
  });

  it("returns null when either input is missing", () => {
    expect(kudosPerHitRatio(null, 1532)).toBeNull();
    expect(kudosPerHitRatio(100, null)).toBeNull();
  });
});

describe("wordsPerChapterRatio", () => {
  it("divides words by published chapters", () => {
    expect(wordsPerChapterRatio(45000, 12)).toBe(3750);
  });

  it("returns null when published chapters is 0", () => {
    expect(wordsPerChapterRatio(45000, 0)).toBeNull();
  });

  it("returns null when either input is missing", () => {
    expect(wordsPerChapterRatio(null, 12)).toBeNull();
    expect(wordsPerChapterRatio(45000, null)).toBeNull();
  });
});

describe("formatRatio", () => {
  it("formats words/chapter as a rounded integer", () => {
    expect(formatRatio(3750.4, 0)).toBe("3750");
    expect(formatRatio(3750.5, 0)).toBe("3751");
  });
});

describe("formatKudosPerHit", () => {
  it("formats the fraction as a one-decimal percentage", () => {
    expect(formatKudosPerHit(0.06527)).toBe("6.5%");
    expect(formatKudosPerHit(0.1)).toBe("10.0%");
  });
});

function makeBlurb(statsHtml: string): HTMLElement {
  const blurb = document.createElement("li");
  blurb.className = "work blurb group";
  blurb.innerHTML = `<dl class="stats">${statsHtml}</dl>`;

  return blurb;
}

const FULL_STATS = `
  <dt class="language">Language:</dt><dd class="language">English</dd>
  <dt class="words">Words:</dt><dd class="words">45,000</dd>
  <dt class="chapters">Chapters:</dt><dd class="chapters"><a href="#">12</a>/?</dd>
  <dt class="kudos">Kudos:</dt><dd class="kudos"><a href="#">100</a></dd>
  <dt class="hits">Hits:</dt><dd class="hits">1,532</dd>
`;

describe("blurb extraction", () => {
  it("reads numeric stats including linked values", () => {
    const blurb = makeBlurb(FULL_STATS);

    expect(extractStatNumber(blurb, "dd.hits")).toBe(1532);
    expect(extractStatNumber(blurb, "dd.kudos")).toBe(100);
    expect(extractStatNumber(blurb, "dd.words")).toBe(45000);
  });

  it("reads the published side of the chapters stat", () => {
    const blurb = makeBlurb(FULL_STATS);

    expect(extractPublishedChapters(blurb)).toBe(12);
  });

  it("returns null for absent stats", () => {
    const blurb = makeBlurb(
      `<dt class="words">Words:</dt><dd class="words">100</dd>`,
    );

    expect(extractStatNumber(blurb, "dd.hits")).toBe(null);
    expect(extractPublishedChapters(blurb)).toBe(null);
  });
});

describe("computeBlurbRatios", () => {
  it("computes both ratios from a full stats row", () => {
    const ratios = computeBlurbRatios(makeBlurb(FULL_STATS));

    expect(ratios.kudosPerHit).toBeCloseTo(0.0653, 4);
    expect(ratios.wordsPerChapter).toBe(3750);
  });

  it("yields null ratios when inputs are missing (0 kudos, hidden hits)", () => {
    const blurb = makeBlurb(`
      <dt class="words">Words:</dt><dd class="words">45,000</dd>
      <dt class="chapters">Chapters:</dt><dd class="chapters">12/?</dd>
    `);
    const ratios = computeBlurbRatios(blurb);

    expect(ratios.kudosPerHit).toBeNull();
    expect(ratios.wordsPerChapter).toBe(3750);
  });
});
