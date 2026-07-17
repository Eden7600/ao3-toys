export type ProgressBarPosition = "top" | "bottom" | "left" | "right";

export type ProgressBarGeometry = {
  horizontal: boolean;
  /** Styles anchoring the track to its screen edge, spanning it fully. */
  anchor: Record<string, string>;
  /** CSS property the progress fill animates ("width" or "height"). */
  fillProperty: "width" | "height";
  /** Linear-gradient direction along the reading axis. */
  gradientDirection: "to right" | "to bottom";
  /** Transform that slides the bar off its edge when there is no progress. */
  offscreenTransform: string;
  /** CSS property positioning a chapter marker along the bar ("left"/"top"). */
  markerOffsetProperty: "left" | "top";
  /** Border side that draws the marker line, perpendicular to the bar. */
  markerBorderProperty: "borderLeft" | "borderTop";
};

const BAR_THICKNESS_PX = 6;
const OFFSCREEN_PX = BAR_THICKNESS_PX * 2;

export const PROGRESS_BAR_THICKNESS_PX = BAR_THICKNESS_PX;

/**
 * Everything orientation-dependent about the progress bar, derived from
 * the edge it is anchored to. Horizontal bars fill left-to-right,
 * vertical bars fill top-to-bottom; the slide-away animation always moves
 * toward the anchored edge.
 */
export function progressBarGeometry(
  position: ProgressBarPosition,
): ProgressBarGeometry {
  const thickness = `${String(BAR_THICKNESS_PX)}px`;
  const horizontal = position === "top" || position === "bottom";

  if (horizontal) {
    return {
      horizontal,
      anchor: {
        [position]: "0",
        left: "0",
        width: "100%",
        height: thickness,
      },
      fillProperty: "width",
      gradientDirection: "to right",
      offscreenTransform:
        position === "top"
          ? `translateY(-${String(OFFSCREEN_PX)}px)`
          : `translateY(${String(OFFSCREEN_PX)}px)`,
      markerOffsetProperty: "left",
      markerBorderProperty: "borderLeft",
    };
  }

  return {
    horizontal,
    anchor: {
      [position]: "0",
      top: "0",
      height: "100%",
      width: thickness,
    },
    fillProperty: "height",
    gradientDirection: "to bottom",
    offscreenTransform:
      position === "left"
        ? `translateX(-${String(OFFSCREEN_PX)}px)`
        : `translateX(${String(OFFSCREEN_PX)}px)`,
    markerOffsetProperty: "top",
    markerBorderProperty: "borderTop",
  };
}
