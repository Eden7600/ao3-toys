import type { Browser } from "./constants";

export function getCurrentBrowser(): Browser {
  // Try process.env.BROWSER first
  if (process.env.BROWSER) {
    return process.env.BROWSER as Browser;
  }

  // Fallback to user agent
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("firefox/")) {
    return "firefox";
  }

  if (userAgent.includes("chrome/")) {
    return "chrome";
  }

  throw new Error("Could not determine browser");
}
