import { Color } from "./color";

// Pure rollup + blending logic for the per-work highlight summary shown
// in blurb stats. No DOM — unit-tested directly.

/**
 * The assignable highlight palette, in display order. Lives here (not in
 * content/tag-config) so common stays importable outside extension
 * contexts; tag-config re-exports it.
 */
export const TAG_HIGHLIGHT_COLORS = [
  "red",
  "orange",
  "yellow",
  "lime",
  "green",
  "blue",
  "purple",
];

/**
 * Counts resolved tag colors per palette color, keyed in palette order.
 * Ignores null (unconfigured/hidden tags), "fade" (de-emphasis, not a
 * category), and anything off-palette.
 */
export function countTagColors(
  resolvedColors: Array<string | null>,
): Map<string, number> {
  const tally = new Map<string, number>();

  for (const color of resolvedColors) {
    if (color === null) continue;
    tally.set(color, (tally.get(color) ?? 0) + 1);
  }

  const counts = new Map<string, number>();

  for (const color of TAG_HIGHLIGHT_COLORS) {
    const count = tally.get(color);

    if (count) {
      counts.set(color, count);
    }
  }

  return counts;
}

function hexChannels(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/**
 * Count-weighted sRGB mean of each color's Tailwind 500 shade — the
 * hue-representative value; averaging the pale 200 backgrounds would
 * collapse to near-white. Returns hex, or null for empty counts.
 */
export function averageTagColor(counts: Map<string, number>): string | null {
  let total = 0;
  const sum = [0, 0, 0];

  counts.forEach((count, color) => {
    const shades = Color.tailwind[color as keyof typeof Color.tailwind];

    if (typeof shades === "string") {
      return;
    }

    const [r, g, b] = hexChannels(shades[500]);

    sum[0] += r * count;
    sum[1] += g * count;
    sum[2] += b * count;
    total += count;
  });

  if (total === 0) {
    return null;
  }

  const channel = (value: number): string =>
    Math.round(value / total)
      .toString(16)
      .padStart(2, "0");

  return `#${channel(sum[0])}${channel(sum[1])}${channel(sum[2])}`;
}

/** Human-readable counts for the swatch tooltip, e.g. "2 red, 1 blue". */
export function formatColorCounts(counts: Map<string, number>): string {
  const parts: string[] = [];

  counts.forEach((count, color) => {
    parts.push(`${String(count)} ${color}`);
  });

  return parts.join(", ");
}
