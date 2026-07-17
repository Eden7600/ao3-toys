import type { ReadingPosition } from "@src/common/reading-position";

export type WorkStatus = {
  subscribed: boolean;
  subscribed_at: string | null;
  last_visited_at: string | null;
  last_chapter: number | null;
  highest_chapter: number | null;
  ignored: boolean;
  position: ReadingPosition | null;
};

export type WorkStatusMap = Partial<Record<string, WorkStatus>>;

// Local-mode storage row: the same shape the server returns, keyed by work
export type WorkStatusRow = WorkStatus & { workId: string };

export type WorkStatusResponse = {
  works: WorkStatusMap;
};

// Short reading-progress text for badges: "ch 3" or "ch 3 · top 7"
export function formatChapterProgress(status: WorkStatus): string | null {
  if (status.last_chapter === null) {
    return null;
  }

  const hasHigherChapter =
    status.highest_chapter !== null &&
    status.highest_chapter !== status.last_chapter;

  return hasHigherChapter
    ? `ch ${String(status.last_chapter)} · top ${String(status.highest_chapter)}`
    : `ch ${String(status.last_chapter)}`;
}

/**
 * Published chapter count from an AO3 chapters stat like "7/10", "7/?",
 * or "1,024/?" — the first number is how many chapters exist to read.
 */
export function parseChapterCount(
  text: string | null | undefined,
): number | null {
  if (!text) {
    return null;
  }

  const match = /^\s*([\d,]+)\s*\//.exec(text);

  if (!match) {
    return null;
  }

  const count = parseInt(match[1].replace(/,/g, ""), 10);

  return Number.isNaN(count) ? null : count;
}

/**
 * True when the reader's furthest chapter is behind the work's published
 * chapter count — i.e. there are fresh chapters to read.
 */
export function hasFreshChapters(
  status: Pick<WorkStatus, "last_chapter" | "highest_chapter">,
  availableChapters: number | null,
): boolean {
  const reached = Math.max(
    status.highest_chapter ?? 0,
    status.last_chapter ?? 0,
  );

  return (
    reached > 0 && availableChapters !== null && reached < availableChapters
  );
}

export type WorkPageProgress = {
  lastChapter: number;
  highestChapter: number;
};

/**
 * Progress to display while ON a work page: the page being viewed counts
 * as a visit immediately, so the current chapter overrides the saved last
 * chapter and joins the highest-chapter ratchet — mirroring what the
 * concurrent visit write will store. Null when neither the page nor the
 * saved status yields usable progress.
 */
export function workPageProgress(
  status: WorkStatus | null,
  currentChapter: number | null,
): WorkPageProgress | null {
  const lastChapter = currentChapter ?? status?.last_chapter ?? null;
  const highestChapter = Math.max(
    status?.highest_chapter ?? 0,
    currentChapter ?? 0,
  );

  if (lastChapter === null || highestChapter === 0) {
    return null;
  }

  return { lastChapter, highestChapter };
}
