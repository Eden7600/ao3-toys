import {
  applyHighestChapterReset,
  applyIgnored,
  applyReadingPosition,
  applySubscription,
  applyVisit,
  emptyWorkStatus,
  mergeWorkStatus,
} from "@src/common/local-work-status";
import type { ReadingPosition } from "@src/common/reading-position";
import type { WorkStatus } from "@src/common/work-status";
import { describe, expect, it } from "vitest";

const T1 = "2026-07-01T10:00:00.000Z";
const T2 = "2026-07-02T10:00:00.000Z";

function status(overrides: Partial<WorkStatus> = {}): WorkStatus {
  return { ...emptyWorkStatus(), ...overrides };
}

function position(overrides: Partial<ReadingPosition> = {}): ReadingPosition {
  return {
    chapter: 3,
    paragraph: 10,
    paragraph_count: 40,
    offset: 0.5,
    ...overrides,
  };
}

describe("applyVisit", () => {
  it("records the visit and ratchets the highest chapter", () => {
    const result = applyVisit(status({ highest_chapter: 5 }), 3, T1);

    expect(result.last_visited_at).toBe(T1);
    expect(result.last_chapter).toBe(3);
    expect(result.highest_chapter).toBe(5);

    expect(applyVisit(status(), 7, T1).highest_chapter).toBe(7);
  });

  it("keeps the last chapter on chapterless visits", () => {
    const result = applyVisit(status({ last_chapter: 4 }), null, T1);

    expect(result.last_chapter).toBe(4);
    expect(result.last_visited_at).toBe(T1);
  });

  it("clears the position when the visit moves past its chapter", () => {
    const withPosition = status({ position: position({ chapter: 3 }) });

    expect(applyVisit(withPosition, 4, T1).position).toBeNull();
    // Re-reads and same-chapter visits keep it
    expect(applyVisit(withPosition, 3, T1).position).not.toBeNull();
    expect(applyVisit(withPosition, 2, T1).position).not.toBeNull();
    expect(applyVisit(withPosition, null, T1).position).not.toBeNull();
  });
});

describe("applySubscription", () => {
  it("keeps the original subscribe date across repeats", () => {
    const first = applySubscription(status(), true, T1);
    const repeat = applySubscription(first, true, T2);

    expect(repeat.subscribed_at).toBe(T1);
  });

  it("clears the date on unsubscribe", () => {
    const subscribed = applySubscription(status(), true, T1);
    const unsubscribed = applySubscription(subscribed, false, T2);

    expect(unsubscribed.subscribed).toBe(false);
    expect(unsubscribed.subscribed_at).toBeNull();
  });
});

describe("applyIgnored", () => {
  it("toggles the flag", () => {
    expect(applyIgnored(status(), true).ignored).toBe(true);
    expect(applyIgnored(status({ ignored: true }), false).ignored).toBe(false);
  });
});

describe("applyReadingPosition", () => {
  it("accepts only positions ahead of the saved one", () => {
    const saved = status({ position: position({ paragraph: 20 }) });
    const behind = position({ paragraph: 10 });
    const ahead = position({ paragraph: 30 });

    expect(applyReadingPosition(saved, behind)).toBe(saved);
    expect(applyReadingPosition(saved, ahead).position).toEqual(ahead);
  });

  it("sets last_chapter and ratchets highest_chapter", () => {
    const result = applyReadingPosition(
      status({ last_chapter: 1, highest_chapter: 2 }),
      position({ chapter: 5 }),
    );

    expect(result.last_chapter).toBe(5);
    expect(result.highest_chapter).toBe(5);

    const keptHighest = applyReadingPosition(
      status({ highest_chapter: 9 }),
      position({ chapter: 5 }),
    );

    expect(keptHighest.highest_chapter).toBe(9);
  });
});

describe("applyHighestChapterReset", () => {
  it("sets last and highest to the chapter", () => {
    const result = applyHighestChapterReset(
      status({ last_chapter: 9, highest_chapter: 12 }),
      4,
    );

    expect(result.last_chapter).toBe(4);
    expect(result.highest_chapter).toBe(4);
  });

  it("clears positions beyond the reset chapter", () => {
    const beyond = status({ position: position({ chapter: 7 }) });
    const within = status({ position: position({ chapter: 3 }) });

    expect(applyHighestChapterReset(beyond, 4).position).toBeNull();
    expect(applyHighestChapterReset(within, 4).position).not.toBeNull();
  });
});

describe("mergeWorkStatus", () => {
  it("takes the newest visit and its last chapter", () => {
    const older = status({ last_visited_at: T1, last_chapter: 8 });
    const newer = status({ last_visited_at: T2, last_chapter: 3 });

    const merged = mergeWorkStatus(older, newer);

    expect(merged.last_visited_at).toBe(T2);
    expect(merged.last_chapter).toBe(3);
    // Order-independent
    expect(mergeWorkStatus(newer, older).last_chapter).toBe(3);
  });

  it("ratchets highest chapter and ORs the flags", () => {
    const a = status({ highest_chapter: 12, ignored: true });
    const b = status({
      highest_chapter: 5,
      subscribed: true,
      subscribed_at: T1,
    });

    const merged = mergeWorkStatus(a, b);

    expect(merged.highest_chapter).toBe(12);
    expect(merged.ignored).toBe(true);
    expect(merged.subscribed).toBe(true);
    expect(merged.subscribed_at).toBe(T1);
  });

  it("keeps the earliest subscribe date", () => {
    const a = status({ subscribed: true, subscribed_at: T2 });
    const b = status({ subscribed: true, subscribed_at: T1 });

    expect(mergeWorkStatus(a, b).subscribed_at).toBe(T1);
  });

  it("keeps the ahead-most position", () => {
    const behind = status({ position: position({ chapter: 2 }) });
    const ahead = status({ position: position({ chapter: 6 }) });

    expect(mergeWorkStatus(behind, ahead).position?.chapter).toBe(6);
    expect(mergeWorkStatus(ahead, behind).position?.chapter).toBe(6);
    expect(mergeWorkStatus(ahead, status()).position?.chapter).toBe(6);
  });

  it("merges empty statuses to empty", () => {
    expect(mergeWorkStatus(status(), status())).toEqual(status());
  });
});
