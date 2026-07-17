import { progressBarGeometry } from "@src/common/progress-bar";
import { describe, expect, it } from "vitest";

describe("progressBarGeometry", () => {
  it("anchors horizontal bars to their edge, full width", () => {
    const top = progressBarGeometry("top");

    expect(top.horizontal).toBe(true);
    expect(top.anchor).toEqual({
      top: "0",
      left: "0",
      width: "100%",
      height: "6px",
    });
    expect(top.fillProperty).toBe("width");
    expect(top.gradientDirection).toBe("to right");
    expect(top.offscreenTransform).toBe("translateY(-12px)");
    expect(top.markerOffsetProperty).toBe("left");
    expect(top.markerBorderProperty).toBe("borderLeft");

    const bottom = progressBarGeometry("bottom");

    expect(bottom.anchor.bottom).toBe("0");
    // Slides down off the bottom edge
    expect(bottom.offscreenTransform).toBe("translateY(12px)");
  });

  it("anchors vertical bars to their edge, full height", () => {
    const left = progressBarGeometry("left");

    expect(left.horizontal).toBe(false);
    expect(left.anchor).toEqual({
      left: "0",
      top: "0",
      height: "100%",
      width: "6px",
    });
    expect(left.fillProperty).toBe("height");
    expect(left.gradientDirection).toBe("to bottom");
    expect(left.offscreenTransform).toBe("translateX(-12px)");
    expect(left.markerOffsetProperty).toBe("top");
    expect(left.markerBorderProperty).toBe("borderTop");

    const right = progressBarGeometry("right");

    expect(right.anchor.right).toBe("0");
    expect(right.offscreenTransform).toBe("translateX(12px)");
  });
});
