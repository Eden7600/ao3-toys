// Keeps injected "Finish At" / "done by" clock times current. The stats
// mean "when you'd be done if you started now", so they drift stale the
// moment they render; elements tag themselves with their reading minutes
// and a page-wide interval re-renders them. The Page Visibility API
// pauses the interval in background tabs — nobody can read them there —
// and a refresh fires the instant the user returns.

import { finishReadingAt, formatFinishAt } from "./reading-time";

// Displayed times have minute granularity; half-minute ticks keep them at
// most ~30s behind without measurable cost.
export const FINISH_AT_TICK_MS = 30_000;

/** Marker attribute carrying the element's reading time in minutes. */
export const FINISH_AT_MINUTES_ATTR = "data-toybox-finish-minutes";

export class FinishAtTicker {
  private readonly doc: Document;
  private timer: ReturnType<typeof setInterval> | null = null;
  private installed = false;

  constructor(doc: Document) {
    this.doc = doc;
  }

  /** Idempotent: installs the visibility listener and starts ticking. */
  ensure(): void {
    if (!this.installed) {
      this.installed = true;
      this.doc.addEventListener("visibilitychange", this.onVisibilityChange);
    }

    this.start();
  }

  /** Re-renders every tagged element from its stored minutes. */
  refresh(): void {
    const now = new Date();
    const elements = this.doc.querySelectorAll<HTMLElement>(
      `[${FINISH_AT_MINUTES_ATTR}]`,
    );

    elements.forEach((element) => {
      const minutes = Number(element.dataset.toyboxFinishMinutes);

      if (!Number.isFinite(minutes) || minutes <= 0) {
        return;
      }

      element.textContent = formatFinishAt(finishReadingAt(now, minutes), now);
    });
  }

  private readonly onVisibilityChange = (): void => {
    if (this.doc.hidden) {
      this.stop();
    } else {
      // Catch up immediately — the stale value from before the tab was
      // hidden could be hours old
      this.refresh();
      this.start();
    }
  };

  private start(): void {
    if (this.timer !== null || this.doc.hidden) {
      return;
    }

    this.timer = setInterval(() => {
      this.refresh();
    }, FINISH_AT_TICK_MS);
  }

  private stop(): void {
    if (this.timer === null) {
      return;
    }

    clearInterval(this.timer);
    this.timer = null;
  }
}

let shared: FinishAtTicker | null = null;

/**
 * Call after injecting a finish-at element; the injecting scripts are only
 * active when their settings are on, so the ticker never runs otherwise.
 */
export function ensureFinishAtTicker(): void {
  shared ??= new FinishAtTicker(document);
  shared.ensure();
}
