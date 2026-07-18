import {
  FINISH_AT_MINUTES_ATTR,
  FINISH_AT_TICK_MS,
  FinishAtTicker,
} from "@src/common/finish-at-ticker";
import { finishReadingAt, formatFinishAt } from "@src/common/reading-time";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Locale-proof expected value: same formatter, explicit clock
const expectedAt = (now: Date, minutes: number): string =>
  formatFinishAt(finishReadingAt(now, minutes), now);

/** Overrides happy-dom's always-visible document for pause/resume tests. */
function setHidden(hidden: boolean): void {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("FinishAtTicker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 17, 12, 0, 0));
    document.body.innerHTML = "";
  });

  afterEach(() => {
    setHidden(false);
    vi.useRealTimers();
  });

  const injectElement = (minutes: number): HTMLElement => {
    const element = document.createElement("span");
    element.setAttribute(FINISH_AT_MINUTES_ATTR, String(minutes));
    element.textContent = expectedAt(new Date(), minutes);
    document.body.appendChild(element);

    return element;
  };

  it("re-renders tagged elements as the clock advances", () => {
    const element = injectElement(60);
    const ticker = new FinishAtTicker(document);
    ticker.ensure();

    expect(element.textContent).toBe(expectedAt(new Date(), 60));

    // Two ticks: one minute of wall clock, so the finish minute moves
    vi.advanceTimersByTime(2 * FINISH_AT_TICK_MS);

    expect(element.textContent).toBe(expectedAt(new Date(), 60));
    expect(new Date().getMinutes()).toBe(1);
  });

  it("skips elements with unusable minute values", () => {
    const element = injectElement(60);
    element.setAttribute(FINISH_AT_MINUTES_ATTR, "not-a-number");
    const before = element.textContent;

    const ticker = new FinishAtTicker(document);
    ticker.ensure();
    vi.advanceTimersByTime(2 * FINISH_AT_TICK_MS);

    expect(element.textContent).toBe(before);
  });

  it("pauses while the tab is hidden and catches up on return", () => {
    const element = injectElement(60);
    const ticker = new FinishAtTicker(document);
    ticker.ensure();

    const staleText = element.textContent;
    setHidden(true);

    // A long background stretch: no re-renders happen
    vi.advanceTimersByTime(120 * FINISH_AT_TICK_MS);

    expect(element.textContent).toBe(staleText);

    // Returning refreshes immediately, before any interval fires
    setHidden(false);

    expect(element.textContent).toBe(expectedAt(new Date(), 60));
    expect(element.textContent).not.toBe(staleText);
  });

  it("keeps ticking after a resume", () => {
    const element = injectElement(60);
    const ticker = new FinishAtTicker(document);
    ticker.ensure();

    setHidden(true);
    vi.advanceTimersByTime(10 * FINISH_AT_TICK_MS);
    setHidden(false);

    const atResume = element.textContent;
    vi.advanceTimersByTime(2 * FINISH_AT_TICK_MS);

    expect(element.textContent).toBe(expectedAt(new Date(), 60));
    expect(element.textContent).not.toBe(atResume);
  });

  it("does not start the interval when created on a hidden tab", () => {
    setHidden(true);
    const element = injectElement(60);
    const staleText = element.textContent;

    const ticker = new FinishAtTicker(document);
    ticker.ensure();
    vi.advanceTimersByTime(4 * FINISH_AT_TICK_MS);

    expect(element.textContent).toBe(staleText);
  });
});
