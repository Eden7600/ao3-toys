import {
  DATE_BACKGROUND_KEYFRAMES,
  DATE_TEXT_KEYFRAMES,
  dateBadgeStyle,
  interpolateColor,
  naturalDateLabel,
} from "@src/common/date-badge";
import { describe, expect, it } from "vitest";

describe("interpolateColor", () => {
  it("returns keyframe colors at exact stops", () => {
    expect(interpolateColor(DATE_TEXT_KEYFRAMES, 0)).toEqual([63, 98, 18]);
    expect(interpolateColor(DATE_TEXT_KEYFRAMES, 730)).toEqual([153, 27, 27]);
  });

  it("interpolates between stops", () => {
    const mid = interpolateColor(DATE_TEXT_KEYFRAMES, 90);

    expect(mid).toEqual([
      Math.round(63 + 0.5 * (133 - 63)),
      Math.round(98 + 0.5 * (77 - 98)),
      Math.round(18 + 0.5 * (14 - 18)),
    ]);
  });

  it("clamps past the last keyframe", () => {
    expect(interpolateColor(DATE_BACKGROUND_KEYFRAMES, 5000)).toEqual([
      254, 226, 226,
    ]);
  });
});

describe("naturalDateLabel", () => {
  it("labels recent days", () => {
    expect(naturalDateLabel(0)).toBe("Today");
    expect(naturalDateLabel(1)).toBe("Yesterday");
    expect(naturalDateLabel(45)).toBe("45 days ago");
  });

  it("labels years", () => {
    expect(naturalDateLabel(400)).toBe("Last year");
    expect(naturalDateLabel(1100)).toBe("3 years ago");
  });
});

describe("dateBadgeStyle", () => {
  it("renders a filled badge in normal mode", () => {
    const style = dateBadgeStyle([63, 98, 18], [236, 252, 203], false);

    expect(style.color).toBe("rgb(63, 98, 18)");
    expect(style.backgroundColor).toBe("rgb(236, 252, 203)");
    expect(style.border).toBe("1px solid rgb(63, 98, 18)");
  });

  it("brightens and drops the background in OLED mode", () => {
    const style = dateBadgeStyle([63, 98, 18], [236, 252, 203], true);

    expect(style.backgroundColor).toBeNull();
    expect(style.border).toContain("2px solid");
    expect(style.color).toBe(
      `rgb(${String(Math.min(255, Math.round(63 * 1.3)))}, ${String(Math.min(255, Math.round(98 * 1.3)))}, ${String(Math.min(255, Math.round(18 * 1.3)))})`,
    );
  });
});
