import { formatRelativeTime } from "@src/common/relative-time";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const NOW = new Date("2026-07-10T12:00:00Z");

function secondsAgo(seconds: number): Date {
  return new Date(NOW.getTime() - seconds * 1000);
}

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("treats anything under a minute as just now", () => {
    expect(formatRelativeTime(NOW)).toBe("just now");
    expect(formatRelativeTime(secondsAgo(59))).toBe("just now");
  });

  it("treats future dates as just now", () => {
    expect(formatRelativeTime(secondsAgo(-3600))).toBe("just now");
  });

  it("formats minutes", () => {
    expect(formatRelativeTime(secondsAgo(60))).toBe("1m ago");
    expect(formatRelativeTime(secondsAgo(59 * 60))).toBe("59m ago");
  });

  it("formats hours", () => {
    expect(formatRelativeTime(secondsAgo(3600))).toBe("1h ago");
    expect(formatRelativeTime(secondsAgo(23 * 3600))).toBe("23h ago");
  });

  it("formats days", () => {
    expect(formatRelativeTime(secondsAgo(86400))).toBe("1d ago");
    expect(formatRelativeTime(secondsAgo(6 * 86400))).toBe("6d ago");
  });

  it("formats weeks", () => {
    expect(formatRelativeTime(secondsAgo(604800))).toBe("1w ago");
    expect(formatRelativeTime(secondsAgo(4 * 604800))).toBe("4w ago");
  });

  it("formats months", () => {
    expect(formatRelativeTime(secondsAgo(2629800))).toBe("1mo ago");
    expect(formatRelativeTime(secondsAgo(11 * 2629800))).toBe("11mo ago");
  });

  it("formats years", () => {
    expect(formatRelativeTime(secondsAgo(31557600))).toBe("1y ago");
    expect(formatRelativeTime(secondsAgo(10 * 31557600))).toBe("10y ago");
  });
});
