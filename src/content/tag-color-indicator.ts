import { Color } from "@src/common/color";
import type { Settings } from "@src/common/settings";
import {
  averageTagColor,
  formatColorCounts,
} from "@src/common/tag-color-summary";

// DOM rendering for the per-work highlight summary stat. Rollup math
// lives in common/tag-color-summary; tag-highlighter supplies the counts.

const INDICATOR_CLASS = "toybox-tag-colors";

/**
 * Appends a "Highlights:" dt/dd pair to the work's stats row — count
 * chips, one blended swatch, or both per the style setting. No-ops on
 * empty counts, missing stats row, or an already-present indicator
 * (listings can be re-processed and stats must not duplicate).
 */
export function appendTagColorSummary(
  work: HTMLElement,
  counts: Map<string, number>,
  style: Settings["tagColorSummaryStyle"],
): boolean {
  const stats = work.querySelector("dl.stats");

  if (!stats || counts.size === 0) {
    return false;
  }

  if (stats.querySelector(`dd.${INDICATOR_CLASS}`)) {
    return false;
  }

  const dt = document.createElement("dt");
  dt.className = `toybox-stat ${INDICATOR_CLASS}`;
  dt.textContent = "Highlights:";

  const dd = document.createElement("dd");
  dd.className = `toybox-stat ${INDICATOR_CLASS}`;

  if (style !== "swatch") {
    counts.forEach((count, color) => {
      dd.appendChild(buildChip(color, count));
    });
  }

  if (style !== "chips") {
    dd.appendChild(buildSwatch(counts));
  }

  stats.append(dt, dd);

  return true;
}

function buildChip(color: string, count: number): HTMLSpanElement {
  const chip = document.createElement("span");

  chip.className = "toybox-tag-color-chip";
  chip.textContent = String(count);
  chip.title = `${String(count)} ${color}`;
  chip.style.backgroundColor = Color.getBackgroundColor(color);
  chip.style.color = Color.getForegroundColor(color);

  return chip;
}

function buildSwatch(counts: Map<string, number>): HTMLSpanElement {
  const swatch = document.createElement("span");

  swatch.className = "toybox-tag-color-swatch";
  swatch.style.backgroundColor = averageTagColor(counts) ?? "";
  swatch.title = formatColorCounts(counts);

  return swatch;
}
