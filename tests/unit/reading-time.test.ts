import {
  countWords,
  finishReadingAt,
  formatFinishAt,
  formatReadingTime,
  readingMinutes,
  wpmFromTest,
} from "@src/common/reading-time";
import { describe, expect, it } from "vitest";

describe("readingMinutes", () => {
  it("computes minutes from words and speed", () => {
    expect(readingMinutes(25_000, 250)).toBe(100);
    expect(readingMinutes(125, 250)).toBe(0.5);
  });

  it("guards unusable inputs", () => {
    expect(readingMinutes(null, 250)).toBeNull();
    expect(readingMinutes(0, 250)).toBeNull();
    expect(readingMinutes(1000, 0)).toBeNull();
    expect(readingMinutes(1000, -5)).toBeNull();
    expect(readingMinutes(1000, Number.NaN)).toBeNull();
  });
});

describe("formatReadingTime", () => {
  it("formats sub-hour durations in minutes", () => {
    expect(formatReadingTime(4)).toBe("~4m");
    expect(formatReadingTime(59)).toBe("~59m");
    expect(formatReadingTime(59.4)).toBe("~59m");
  });

  it("switches to hours at 60 minutes", () => {
    expect(formatReadingTime(59.6)).toBe("~1h");
    expect(formatReadingTime(60)).toBe("~1h");
    expect(formatReadingTime(83)).toBe("~1h 23m");
    expect(formatReadingTime(130)).toBe("~2h 10m");
  });

  it("never reports below one minute", () => {
    expect(formatReadingTime(0.1)).toBe("~1m");
  });
});

describe("finishReadingAt / formatFinishAt", () => {
  const noon = new Date(2026, 6, 16, 12, 0);

  it("adds the duration", () => {
    const finish = finishReadingAt(noon, 90);

    expect(finish.getHours()).toBe(13);
    expect(finish.getMinutes()).toBe(30);
  });

  it("renders a bare time for same-day finishes", () => {
    const finish = finishReadingAt(noon, 45);

    expect(formatFinishAt(finish, noon)).toBe(
      finish.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    );
  });

  it("marks next-day finishes as tomorrow", () => {
    const finish = finishReadingAt(noon, 14 * 60);

    expect(formatFinishAt(finish, noon)).toMatch(/ tomorrow$/);
  });

  it("uses a date for finishes beyond tomorrow", () => {
    const finish = finishReadingAt(noon, 3 * 24 * 60);

    expect(formatFinishAt(finish, noon)).toMatch(/ on /);
  });
});

describe("countWords", () => {
  it("counts whitespace-delimited words", () => {
    expect(countWords("one two  three\nfour\tfive")).toBe(5);
  });

  it("is zero-safe", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
    expect(countWords(null)).toBe(0);
    expect(countWords(undefined)).toBe(0);
  });
});

describe("wpmFromTest", () => {
  it("computes rounded words per minute", () => {
    expect(wpmFromTest(200, 60_000)).toBe(200);
    expect(wpmFromTest(215, 45_000)).toBe(287);
  });

  it("rejects degenerate inputs", () => {
    expect(wpmFromTest(200, 0)).toBeNull();
    expect(wpmFromTest(200, -1)).toBeNull();
    expect(wpmFromTest(0, 60_000)).toBeNull();
  });
});
