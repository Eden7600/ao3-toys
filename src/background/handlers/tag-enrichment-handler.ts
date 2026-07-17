import { Logger } from "@src/common/logger";
import type { ParsedTagPage } from "@src/common/tag-page";

const logger = new Logger("BG-TagEnrichment");

const TAB_TIMEOUT_MS = 15_000;

// Minimal cross-browser surface: Firefox exposes promise-based
// `browser.tabs`, Chrome MV3 exposes promise-based `chrome.tabs`.
type TabsApi = {
  create(createProperties: {
    url: string;
    active: boolean;
  }): Promise<{ id?: number }>;
  remove(tabId: number): Promise<void>;
  onRemoved: { addListener(callback: (tabId: number) => void): void };
};

// Only firefox-webext-browser is in the tsconfig type roots; Chrome's
// global is declared just narrowly enough to reach its tabs API.
declare const chrome: { tabs: unknown };

function getTabsApi(): TabsApi {
  return (
    typeof browser === "undefined" ? chrome.tabs : browser.tabs
  ) as TabsApi;
}

type PendingParse = {
  resolve: (parsed: ParsedTagPage | null) => void;
  timer: ReturnType<typeof setTimeout>;
};

/**
 * Fallback acquisition tier for tag pages when a content-script fetch is
 * blocked by a Cloudflare challenge: opens the tag page in an inactive tab
 * (a real navigation executes challenge JS), waits for the tag-page content
 * script to report its parse, and closes the tab. One tab at a time; an
 * interactive challenge that never resolves is bounded by a timeout.
 */
export class TagEnrichmentHandler {
  private pendingByTabId = new Map<number, PendingParse>();
  private queue: Promise<unknown> = Promise.resolve();

  constructor() {
    getTabsApi().onRemoved.addListener((tabId) => {
      this.settle(tabId, null);
    });
  }

  async enrichViaTab(url: string): Promise<ParsedTagPage | null> {
    const run = this.queue.then(async () => this.openAndAwaitParse(url));
    // Serialize: the next request starts only after this one settles.
    this.queue = run.catch(() => null);

    return run;
  }

  reportParse(tabId: number | undefined, parsed: ParsedTagPage): void {
    if (tabId === undefined) {
      return;
    }

    this.settle(tabId, parsed);
  }

  private async openAndAwaitParse(url: string): Promise<ParsedTagPage | null> {
    const tabs = getTabsApi();
    let tabId: number | undefined;

    try {
      const tab = await tabs.create({ url, active: false });
      tabId = tab.id;
    } catch (error) {
      logger.error("Failed to open enrichment tab:", error);

      return null;
    }

    if (tabId === undefined) {
      return null;
    }

    const openedTabId = tabId;

    logger.log("Opened enrichment tab", openedTabId, url);

    try {
      return await new Promise<ParsedTagPage | null>((resolve) => {
        const timer = setTimeout(() => {
          logger.warn("Enrichment tab timed out", openedTabId);
          this.settle(openedTabId, null);
        }, TAB_TIMEOUT_MS);
        this.pendingByTabId.set(openedTabId, { resolve, timer });
      });
    } finally {
      try {
        await tabs.remove(openedTabId);
      } catch {
        // Tab already closed (user or onRemoved race) — nothing to do.
      }
    }
  }

  private settle(tabId: number, parsed: ParsedTagPage | null): void {
    const pending = this.pendingByTabId.get(tabId);

    if (!pending) {
      return;
    }

    this.pendingByTabId.delete(tabId);
    clearTimeout(pending.timer);
    pending.resolve(parsed);
  }
}
