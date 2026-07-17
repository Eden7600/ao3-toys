import {
  classifyReadingStates,
  parseChapterStats,
  type ReadingStateThresholds,
} from "@src/common/reading-state";
import { describe, expect, it } from "vitest";

const thresholds: ReadingStateThresholds = { farBehind: 10, barelyStarted: 2 };

function status(reached: number | null) {
  return { last_chapter: reached, highest_chapter: reached };
}

describe("parseChapterStats", () => {
  it("parses a complete stat", () => {
    expect(parseChapterStats("7/10")).toEqual({ published: 7, total: 10 });
  });

  it("parses an open-ended stat", () => {
    expect(parseChapterStats("7/?")).toEqual({ published: 7, total: null });
  });

  it("parses thousands separators", () => {
    expect(parseChapterStats("1,024/?")).toEqual({
      published: 1024,
      total: null,
    });
  });

  it("tolerates surrounding whitespace", () => {
    expect(parseChapterStats("  3/3 ")).toEqual({ published: 3, total: 3 });
  });

  it("rejects garbage, empty, and zero-published stats", () => {
    expect(parseChapterStats("Complete")).toBeNull();
    expect(parseChapterStats("")).toBeNull();
    expect(parseChapterStats(null)).toBeNull();
    expect(parseChapterStats(undefined)).toBeNull();
    expect(parseChapterStats("0/?")).toBeNull();
  });
});

describe("classifyReadingStates", () => {
  it("returns nothing without reading history", () => {
    expect(
      classifyReadingStates(
        status(null),
        { published: 7, total: 7 },
        thresholds,
      ),
    ).toEqual([]);
  });

  it("returns nothing without a chapter stat", () => {
    expect(classifyReadingStates(status(5), null, thresholds)).toEqual([]);
  });

  it("classifies a fully read complete work as finished", () => {
    const marks = classifyReadingStates(
      status(7),
      { published: 7, total: 7 },
      thresholds,
    );

    expect(marks.map((mark) => mark.source)).toEqual(["read-finished"]);
    expect(marks[0].reason).toBe("Finished (7/7 read)");
  });

  it("classifies a fully read WIP as caught up", () => {
    const marks = classifyReadingStates(
      status(7),
      { published: 7, total: null },
      thresholds,
    );

    expect(marks.map((mark) => mark.source)).toEqual(["read-caught-up"]);
    expect(marks[0].reason).toBe("Caught up (7/? published)");
  });

  it("treats a declared-total WIP read to the front as caught up", () => {
    const marks = classifyReadingStates(
      status(7),
      { published: 7, total: 20 },
      thresholds,
    );

    expect(marks.map((mark) => mark.source)).toEqual(["read-caught-up"]);
    expect(marks[0].reason).toBe("Caught up (7/20 published)");
  });

  it("clamps a ratchet beyond the published count", () => {
    const marks = classifyReadingStates(
      status(9),
      { published: 7, total: null },
      thresholds,
    );

    expect(marks.map((mark) => mark.source)).toEqual(["read-caught-up"]);
  });

  it("marks far-behind works at the threshold", () => {
    const marks = classifyReadingStates(
      status(5),
      { published: 15, total: 25 },
      thresholds,
    );

    expect(marks.map((mark) => mark.source)).toEqual(["read-behind"]);
    expect(marks[0].reason).toBe("10 unread chapters");
  });

  it("does not mark slightly-behind works", () => {
    expect(
      classifyReadingStates(
        status(5),
        { published: 8, total: null },
        thresholds,
      ),
    ).toEqual([]);
  });

  it("marks barely-started works with unread chapters", () => {
    const marks = classifyReadingStates(
      status(2),
      { published: 5, total: 5 },
      thresholds,
    );

    expect(marks.map((mark) => mark.source)).toEqual(["read-barely-started"]);
    expect(marks[0].reason).toBe("Barely started (read 2/5)");
  });

  it("marks both behind and barely-started when they overlap", () => {
    const marks = classifyReadingStates(
      status(1),
      { published: 50, total: null },
      thresholds,
    );

    expect(marks.map((mark) => mark.source)).toEqual([
      "read-behind",
      "read-barely-started",
    ]);
  });

  it("never marks a fully read oneshot as barely started", () => {
    const marks = classifyReadingStates(
      status(1),
      { published: 1, total: 1 },
      thresholds,
    );

    expect(marks.map((mark) => mark.source)).toEqual(["read-finished"]);
  });

  it("uses the ratchet over the last-read chapter", () => {
    const marks = classifyReadingStates(
      { last_chapter: 1, highest_chapter: 7 },
      { published: 7, total: 7 },
      thresholds,
    );

    expect(marks.map((mark) => mark.source)).toEqual(["read-finished"]);
  });
});
