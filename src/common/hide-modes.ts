export type HideSource =
  | "excluded-tags"
  | "language"
  | "fandom"
  | "kudos-hits"
  | "words-chapter"
  | "word-count"
  | "podfic"
  | "ignored"
  | "visited"
  | "subscribed"
  | "read-finished"
  | "read-caught-up"
  | "read-behind"
  | "read-barely-started";

export type HideMode = "none" | "collapse" | "remove";

export type HideModes = Record<HideSource, HideMode>;

export const defaultHideModes: HideModes = {
  "excluded-tags": "collapse",
  language: "none",
  fandom: "none",
  "kudos-hits": "none",
  "words-chapter": "none",
  "word-count": "none",
  podfic: "none",
  ignored: "remove",
  visited: "none",
  subscribed: "none",
  "read-finished": "none",
  "read-caught-up": "none",
  "read-behind": "none",
  "read-barely-started": "none",
};

export const hideSourceLabels: Record<HideSource, string> = {
  "excluded-tags": "Excluded tags",
  language: "Language filter",
  fandom: "Fandom filter",
  "kudos-hits": "Kudos/hits filter",
  "words-chapter": "Words/chapter filter",
  "word-count": "Word count filter",
  podfic: "Podfic/non-text filter",
  ignored: "Ignored works",
  visited: "Visited works",
  subscribed: "Subscribed works",
  "read-finished": "Finished works",
  "read-caught-up": "Caught-up works",
  "read-behind": "Fallen-behind works",
  "read-barely-started": "Barely-started works",
};

/**
 * Resolve the hide mode for a blurb from the sources that marked it, by
 * severity: any remove-configured source wins, then collapse, then none
 * ("don't hide" — the blurb stays visible). Blurbs without recorded
 * sources (legacy markers) collapse as before.
 */
export function resolveHideMode(
  sources: HideSource[],
  modes: HideModes,
): HideMode {
  if (sources.some((source) => modes[source] === "remove")) {
    return "remove";
  }

  if (sources.some((source) => modes[source] === "collapse")) {
    return "collapse";
  }

  return sources.length === 0 ? "collapse" : "none";
}

function appendToJsonArray(
  existing: string | undefined,
  value: string,
): string {
  let values: string[] = [];

  if (existing) {
    try {
      const parsed: unknown = JSON.parse(existing);

      if (Array.isArray(parsed)) {
        values = parsed as string[];
      }
    } catch {
      // Corrupt marker data; start a fresh array
    }
  }

  if (!values.includes(value)) {
    values.push(value);
  }

  return JSON.stringify(values);
}

/**
 * Mark a work blurb for the hide pipeline, recording both the
 * human-readable reason and the machine-readable source.
 */
export function markWorkForHiding(
  work: HTMLElement,
  source: HideSource,
  reason: string,
): void {
  work.dataset.toyboxHide = "true";
  work.dataset.toyboxHideReason = appendToJsonArray(
    work.dataset.toyboxHideReason,
    reason,
  );
  work.dataset.toyboxHideSources = appendToJsonArray(
    work.dataset.toyboxHideSources,
    source,
  );
}

/**
 * Exempt a work from the hide pipeline (subscribed works when the
 * never-hide toggle is on). The hide pipeline checks this marker before
 * hiding and restores works that were hidden before the marker arrived —
 * subscription status resolves asynchronously, so both orderings happen.
 */
export function markWorkHideExempt(work: HTMLElement): void {
  work.dataset.toyboxHideExempt = "true";
}

export function isWorkHideExempt(work: HTMLElement): boolean {
  return work.dataset.toyboxHideExempt === "true";
}

/**
 * Undo any applied hide on an exempt work: restore display and drop the
 * collapse placeholder if one was injected (always the immediately
 * preceding sibling; "remove"-mode hides have none). Pins the processed
 * marker to "exempt" so the hide path never picks the work up again.
 * Idempotent — returns whether a restore actually ran.
 */
export function restoreExemptWork(work: HTMLElement): boolean {
  const wasProcessed = work.dataset.toyboxHideProcessed === "true";

  work.dataset.toyboxHideProcessed = "exempt";

  if (!wasProcessed) {
    return false;
  }

  work.style.display = "";

  const placeholder = work.previousElementSibling;

  if (
    placeholder instanceof HTMLElement &&
    placeholder.dataset.toyboxHideReason === "true"
  ) {
    placeholder.remove();
  }

  return true;
}

/**
 * Read the sources recorded on a marked blurb; empty for legacy markers.
 */
export function getHideSources(work: HTMLElement): HideSource[] {
  const data = work.dataset.toyboxHideSources;

  if (!data) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(data);

    return Array.isArray(parsed) ? (parsed as HideSource[]) : [];
  } catch {
    return [];
  }
}
