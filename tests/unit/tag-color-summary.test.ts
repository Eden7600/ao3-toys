import {
  averageTagColor,
  countTagColors,
  formatColorCounts,
  TAG_HIGHLIGHT_COLORS,
} from "@src/common/tag-color-summary";
import { describe, expect, it } from "vitest";

describe("countTagColors", () => {
  it("counts tags per color", () => {
    const counts = countTagColors(["red", "blue", "red", "blue", "blue"]);

    expect(counts.get("red")).toBe(2);
    expect(counts.get("blue")).toBe(3);
    expect(counts.size).toBe(2);
  });

  it("keys results in palette order regardless of input order", () => {
    const counts = countTagColors(["purple", "red", "green", "purple"]);

    expect([...counts.keys()]).toEqual(["red", "green", "purple"]);
  });

  it("ignores null, fade, and off-palette values", () => {
    const counts = countTagColors([null, "fade", "magenta", "red", null]);

    expect([...counts.entries()]).toEqual([["red", 1]]);
  });

  it("returns an empty map for no highlighted tags", () => {
    expect(countTagColors([]).size).toBe(0);
    expect(countTagColors([null, null]).size).toBe(0);
  });
});

describe("averageTagColor", () => {
  it("returns the single color's 500 shade unchanged", () => {
    expect(averageTagColor(new Map([["green", 1]]))).toBe("#22c55e");
  });

  it("averages two colors channel-wise", () => {
    // Equal-weight blend of red-500 #ef4444 and blue-500 #3b82f6
    const blended = averageTagColor(
      new Map([
        ["red", 1],
        ["blue", 1],
      ]),
    );

    expect(blended).toBe("#95639d");
  });

  it("weights the mean by count", () => {
    // Two parts red-500, one part blue-500
    const blended = averageTagColor(
      new Map([
        ["red", 2],
        ["blue", 1],
      ]),
    );

    expect(blended).toBe("#b3597f");
  });

  it("returns null for empty counts", () => {
    expect(averageTagColor(new Map())).toBeNull();
  });

  it("blends every palette color without throwing", () => {
    const counts = new Map(TAG_HIGHLIGHT_COLORS.map((color) => [color, 1]));

    expect(averageTagColor(counts)).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("formatColorCounts", () => {
  it("lists counts with color names", () => {
    const counts = new Map([
      ["red", 2],
      ["blue", 1],
    ]);

    expect(formatColorCounts(counts)).toBe("2 red, 1 blue");
  });

  it("returns an empty string for empty counts", () => {
    expect(formatColorCounts(new Map())).toBe("");
  });
});
