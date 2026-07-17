export function formatRelativeTime(date: Date): string {
  const seconds = Math.max(0, (Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";

  const steps: Array<[limit: number, divisor: number, unit: string]> = [
    [3600, 60, "m"],
    [86400, 3600, "h"],
    [604800, 86400, "d"],
    [2629800, 604800, "w"],
    [31557600, 2629800, "mo"],
    [Infinity, 31557600, "y"],
  ];

  const [, divisor, unit] = steps.find(([limit]) => seconds < limit) ?? [
    Infinity,
    31557600,
    "y",
  ];

  return `${String(Math.floor(seconds / divisor))}${unit} ago`;
}
