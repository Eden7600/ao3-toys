import {
  isPositionAhead,
  type ReadingPosition,
} from "@src/common/reading-position";
import type { WorkStatus } from "@src/common/work-status";

// Pure reducers for the local work-status store. These mirror kepler's
// server-side semantics so local mode and server mode behave identically:
// ratchets only advance, visits past a saved position clear it, resets
// clear positions beyond them. The background handler persists the results.

export function emptyWorkStatus(): WorkStatus {
  return {
    subscribed: false,
    subscribed_at: null,
    last_visited_at: null,
    last_chapter: null,
    highest_chapter: null,
    ignored: false,
    position: null,
  };
}

/**
 * A visit updates the timestamp and chapter ratchet. Moving past the saved
 * position's chapter clears it (it has been superseded); chapterless visits
 * and re-reads of earlier chapters keep it.
 */
export function applyVisit(
  status: WorkStatus,
  chapter: number | null,
  at: string,
): WorkStatus {
  const clearedPosition =
    status.position && chapter !== null && chapter > status.position.chapter
      ? null
      : status.position;

  return {
    ...status,
    last_visited_at: at,
    last_chapter: chapter ?? status.last_chapter,
    highest_chapter:
      Math.max(status.highest_chapter ?? 0, chapter ?? 0) || null,
    position: clearedPosition,
  };
}

/**
 * `subscribed_at` records when the subscription started: it survives
 * repeated subscribed=true updates and resets on unsubscribe.
 */
export function applySubscription(
  status: WorkStatus,
  subscribed: boolean,
  at: string,
): WorkStatus {
  return {
    ...status,
    subscribed,
    subscribed_at: subscribed ? (status.subscribed_at ?? at) : null,
  };
}

export function applyIgnored(status: WorkStatus, ignored: boolean): WorkStatus {
  return { ...status, ignored };
}

/**
 * Positions only ratchet forward. An applied position also counts as
 * reading that chapter: it sets last_chapter and bumps highest_chapter.
 */
export function applyReadingPosition(
  status: WorkStatus,
  position: ReadingPosition,
): WorkStatus {
  if (!isPositionAhead(position, status.position)) {
    return status;
  }

  return {
    ...status,
    position,
    last_chapter: position.chapter,
    highest_chapter: Math.max(status.highest_chapter ?? 0, position.chapter),
  };
}

/**
 * Explicit user reset: progress becomes exactly the given chapter, and a
 * saved position beyond it is discarded.
 */
export function applyHighestChapterReset(
  status: WorkStatus,
  chapter: number,
): WorkStatus {
  const clearedPosition =
    status.position && status.position.chapter > chapter
      ? null
      : status.position;

  return {
    ...status,
    last_chapter: chapter,
    highest_chapter: chapter,
    position: clearedPosition,
  };
}

function newerDate(a: string | null, b: string | null): string | null {
  if (a === null || b === null) {
    return a ?? b;
  }

  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

function olderDate(a: string | null, b: string | null): string | null {
  if (a === null || b === null) {
    return a ?? b;
  }

  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
}

/**
 * Furthest-wins merge for backup imports: importing an older backup never
 * regresses progress. The newer visit contributes last_chapter, ratchets
 * take the max, flags OR together, subscribed_at keeps the earliest date,
 * and the ahead-most position wins.
 */
export function mergeWorkStatus(a: WorkStatus, b: WorkStatus): WorkStatus {
  const newerVisit =
    newerDate(a.last_visited_at, b.last_visited_at) === a.last_visited_at &&
    a.last_visited_at !== null
      ? a
      : b;
  const lastChapter =
    newerVisit.last_chapter ?? a.last_chapter ?? b.last_chapter;
  const highest =
    Math.max(a.highest_chapter ?? 0, b.highest_chapter ?? 0) || null;
  const subscribed = a.subscribed || b.subscribed;

  return {
    subscribed,
    subscribed_at: subscribed
      ? olderDate(a.subscribed_at, b.subscribed_at)
      : null,
    last_visited_at: newerDate(a.last_visited_at, b.last_visited_at),
    last_chapter: lastChapter,
    highest_chapter: highest,
    ignored: a.ignored || b.ignored,
    position:
      a.position && isPositionAhead(a.position, b.position)
        ? a.position
        : (b.position ?? a.position),
  };
}
