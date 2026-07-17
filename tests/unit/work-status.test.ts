import {
  formatChapterProgress,
  hasFreshChapters,
  parseChapterCount,
  workPageProgress,
  type WorkStatus,
} from "@src/common/work-status";
import { describe, expect, it } from "vitest";

function status(overrides: Partial<WorkStatus>): WorkStatus {
  return {
    subscribed: false,
    subscribed_at: null,
    last_visited_at: null,
    last_chapter: null,
    highest_chapter: null,
    ignored: false,
    position: null,
    ...overrides,
  };
}

describe("formatChapterProgress", () => {
  it("returns null when no last chapter is known", () => {
    expect(formatChapterProgress(status({}))).toBeNull();
    expect(formatChapterProgress(status({ highest_chapter: 5 }))).toBeNull();
  });

  it("shows only the last chapter when it equals the highest", () => {
    expect(
      formatChapterProgress(status({ last_chapter: 7, highest_chapter: 7 })),
    ).toBe("ch 7");
  });

  it("shows only the last chapter when no highest is known", () => {
    expect(formatChapterProgress(status({ last_chapter: 3 }))).toBe("ch 3");
  });

  it("appends the highest chapter when it differs", () => {
    expect(
      formatChapterProgress(status({ last_chapter: 3, highest_chapter: 7 })),
    ).toBe("ch 3 · top 7");
  });
});

describe("parseChapterCount", () => {
  it("parses complete and in-progress chapter stats", () => {
    expect(parseChapterCount("7/10")).toBe(7);
    expect(parseChapterCount("12/?")).toBe(12);
    expect(parseChapterCount("1/1")).toBe(1);
    expect(parseChapterCount(" 1,024/? ")).toBe(1024);
  });

  it("returns null for missing or unparseable stats", () => {
    expect(parseChapterCount(null)).toBeNull();
    expect(parseChapterCount(undefined)).toBeNull();
    expect(parseChapterCount("")).toBeNull();
    expect(parseChapterCount("unknown")).toBeNull();
    expect(parseChapterCount("/10")).toBeNull();
  });
});

describe("hasFreshChapters", () => {
  it("is true when the highest reached chapter trails the published count", () => {
    expect(
      hasFreshChapters(status({ last_chapter: 3, highest_chapter: 7 }), 10),
    ).toBe(true);
  });

  it("falls back to last chapter when no highest is known", () => {
    expect(hasFreshChapters(status({ last_chapter: 3 }), 5)).toBe(true);
    expect(hasFreshChapters(status({ last_chapter: 5 }), 5)).toBe(false);
  });

  it("is false when fully caught up", () => {
    expect(
      hasFreshChapters(status({ last_chapter: 7, highest_chapter: 10 }), 10),
    ).toBe(false);
  });

  it("is false without visit data or without a published count", () => {
    expect(hasFreshChapters(status({}), 10)).toBe(false);
    expect(
      hasFreshChapters(status({ last_chapter: 3, highest_chapter: 7 }), null),
    ).toBe(false);
  });
});

describe("workPageProgress", () => {
  it("mirrors the visit ratchet: current chapter wins last, joins highest", () => {
    expect(
      workPageProgress(status({ last_chapter: 7, highest_chapter: 9 }), 3),
    ).toEqual({ lastChapter: 3, highestChapter: 9 });
    expect(
      workPageProgress(status({ last_chapter: 2, highest_chapter: 4 }), 6),
    ).toEqual({ lastChapter: 6, highestChapter: 6 });
  });

  it("works from the page alone on a first visit", () => {
    expect(workPageProgress(null, 5)).toEqual({
      lastChapter: 5,
      highestChapter: 5,
    });
  });

  it("falls back to saved progress on chapterless views", () => {
    expect(
      workPageProgress(status({ last_chapter: 3, highest_chapter: 7 }), null),
    ).toEqual({ lastChapter: 3, highestChapter: 7 });
  });

  it("is null without any usable progress", () => {
    expect(workPageProgress(null, null)).toBeNull();
    expect(workPageProgress(status({}), null)).toBeNull();
    expect(workPageProgress(status({ highest_chapter: 4 }), null)).toBeNull();
  });
});
