import type { HideSource } from "@src/common/hide-modes";
import type { WorkStatus } from "@src/common/work-status";

// Reading-progress classification for the hide pipeline: which states a
// work is in relative to the reader's chapter ratchet and the blurb's
// chapter stat. Pure — no DOM, no settings access.

export type ChapterStats = {
  published: number;
  /** Null when the planned count is unknown ("7/?"). */
  total: number | null;
};

export type ReadingStateThresholds = {
  /** Unread published chapters at or above this mark "read-behind". */
  farBehind: number;
  /** Reached chapters at or below this mark "read-barely-started". */
  barelyStarted: number;
};

export type ReadingStateMark = {
  source: HideSource;
  reason: string;
};

/**
 * Chapter stat from an AO3 blurb ("7/10", "7/?", "1,024/?"): published
 * count plus the planned total when the author has declared one.
 */
export function parseChapterStats(
  text: string | null | undefined,
): ChapterStats | null {
  if (!text) {
    return null;
  }

  const match = /^\s*([\d,]+)\s*\/\s*([\d,]+|\?)/.exec(text);

  if (!match) {
    return null;
  }

  const published = parseInt(match[1].replace(/,/g, ""), 10);

  if (Number.isNaN(published) || published <= 0) {
    return null;
  }

  return {
    published,
    total: match[2] === "?" ? null : parseInt(match[2].replace(/,/g, ""), 10),
  };
}

/**
 * Reading states for a work, from the reached-chapter ratchet and the
 * chapter stat. Empty without reading history or a parseable stat. A
 * ratchet beyond the published count (deleted chapters) clamps into the
 * caught-up/finished pair; behind and barely-started can both apply.
 */
export function classifyReadingStates(
  status: Pick<WorkStatus, "last_chapter" | "highest_chapter">,
  stats: ChapterStats | null,
  thresholds: ReadingStateThresholds,
): ReadingStateMark[] {
  if (!stats) {
    return [];
  }

  const reached = Math.max(
    status.highest_chapter ?? 0,
    status.last_chapter ?? 0,
  );

  if (reached < 1) {
    return [];
  }

  const { published, total } = stats;
  const unread = published - reached;

  if (unread <= 0) {
    return total !== null && published >= total
      ? [
          {
            source: "read-finished",
            reason: `Finished (${String(published)}/${String(total)} read)`,
          },
        ]
      : [
          {
            source: "read-caught-up",
            reason: `Caught up (${String(published)}/${total === null ? "?" : String(total)} published)`,
          },
        ];
  }

  const marks: ReadingStateMark[] = [];

  if (unread >= thresholds.farBehind) {
    marks.push({
      source: "read-behind",
      reason: `${String(unread)} unread chapters`,
    });
  }

  if (reached <= thresholds.barelyStarted) {
    marks.push({
      source: "read-barely-started",
      reason: `Barely started (read ${String(reached)}/${String(published)})`,
    });
  }

  return marks;
}
