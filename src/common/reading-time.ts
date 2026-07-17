// Reading-speed math and formatting for the blurb stats and chapter stat
// lines. Pure — no DOM, no extension APIs.

/**
 * Minutes to read `words` at `wpm`; null when either input is unusable
 * (missing word count, non-positive speed).
 */
export function readingMinutes(
  words: number | null,
  wpm: number,
): number | null {
  if (words === null || words <= 0 || !Number.isFinite(wpm) || wpm <= 0) {
    return null;
  }

  return words / wpm;
}

/** Humanized duration: "~4m", "~1h", "~1h 23m". Never below one minute. */
export function formatReadingTime(minutes: number): string {
  const total = Math.max(1, Math.round(minutes));

  if (total < 60) {
    return `~${String(total)}m`;
  }

  const hours = Math.floor(total / 60);
  const rest = total % 60;

  return rest === 0
    ? `~${String(hours)}h`
    : `~${String(hours)}h ${String(rest)}m`;
}

export function finishReadingAt(start: Date, minutes: number): Date {
  return new Date(start.getTime() + minutes * 60_000);
}

function daysBetween(from: Date, to: Date): number {
  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  return Math.round((startOfDay(to) - startOfDay(from)) / 86_400_000);
}

/**
 * Locale clock time for the finish moment, marked when it lands on a
 * later day: "9:15 PM", "9:15 PM tomorrow", "9:15 PM on Jul 18".
 */
export function formatFinishAt(finish: Date, now: Date): string {
  const time = finish.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const days = daysBetween(now, finish);

  if (days <= 0) {
    return time;
  }

  if (days === 1) {
    return `${time} tomorrow`;
  }

  return `${time} on ${finish.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })}`;
}

/** Whitespace-delimited word count; 0 for empty/blank text. */
export function countWords(text: string | null | undefined): number {
  if (!text) {
    return 0;
  }

  const trimmed = text.trim();

  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

/** Measured speed from the reading test; null for degenerate inputs. */
export function wpmFromTest(words: number, elapsedMs: number): number | null {
  if (words <= 0 || elapsedMs <= 0) {
    return null;
  }

  return Math.round(words / (elapsedMs / 60_000));
}
