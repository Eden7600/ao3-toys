export type ColorKeyframe = {
  days: number;
  color: number[];
};

export const DATE_TEXT_KEYFRAMES: ColorKeyframe[] = [
  { days: 0, color: [63, 98, 18] }, // Green
  { days: 180, color: [133, 77, 14] }, // Yellow
  { days: 365, color: [154, 52, 18] }, // Orange
  { days: 730, color: [153, 27, 27] }, // Red
];

export const DATE_BACKGROUND_KEYFRAMES: ColorKeyframe[] = [
  { days: 0, color: [236, 252, 203] }, // Green
  { days: 180, color: [254, 249, 195] }, // Yellow
  { days: 365, color: [255, 237, 213] }, // Orange
  { days: 730, color: [254, 226, 226] }, // Red
];

export const COMPLETED_TEXT_COLOR = [63, 98, 18];
export const COMPLETED_BACKGROUND_COLOR = [236, 252, 203];

export function interpolateColor(
  keyframes: ColorKeyframe[],
  days: number,
): number[] {
  for (let i = 0; i < keyframes.length - 1; i++) {
    const currentFrame = keyframes[i];
    const nextFrame = keyframes[i + 1];

    if (days >= currentFrame.days && days <= nextFrame.days) {
      const fraction =
        (days - currentFrame.days) / (nextFrame.days - currentFrame.days);

      return currentFrame.color.map((c, index) =>
        Math.round(c + fraction * (nextFrame.color[index] - c)),
      );
    }
  }

  // If days exceed the range, use the last keyframe color
  return keyframes[keyframes.length - 1].color;
}

export function convertToRGB(color: number[], brighten = false): string {
  const adjusted = brighten
    ? color.map((c) => Math.min(255, Math.round(c * 1.3)))
    : color;

  return `rgb(${String(adjusted[0])}, ${String(adjusted[1])}, ${String(adjusted[2])})`;
}

/**
 * Natural-language label for a work's age, exactly as the date-formatter
 * content script has always produced it (including its label precedence).
 */
export function naturalDateLabel(daysDifference: number): string {
  const yearsDifference = Math.floor(daysDifference / 365);

  switch (true) {
    case daysDifference <= 0:
      return "Today";
    case daysDifference === 1:
      return "Yesterday";
    case daysDifference > 1 && daysDifference < 365:
      return `${String(daysDifference)} days ago`;
    case yearsDifference === 1:
      return "Last year";
    case yearsDifference > 1:
      return `${String(yearsDifference)} years ago`;
    default:
      return "Unknown";
  }
}

export type DateBadgeStyle = {
  color: string;
  backgroundColor: string | null;
  padding: string;
  borderRadius: string;
  border: string;
};

/**
 * Inline styles for a date badge. In OLED mode the text/border brighten
 * and the background is dropped, matching the content script's rendering.
 */
export function dateBadgeStyle(
  color: number[],
  backgroundColor: number[] | undefined,
  oled: boolean,
): DateBadgeStyle {
  return {
    color: convertToRGB(color, oled),
    backgroundColor:
      !oled && backgroundColor ? convertToRGB(backgroundColor) : null,
    padding: "2px 10px",
    borderRadius: "4px",
    border: `${oled ? "2px" : "1px"} solid ${convertToRGB(color, oled)}`,
  };
}
