import { AO3_BLURB_SELECTOR } from "@src/common/ao3";
import {
  type ChapterIndexEntry,
  chapterIndexUrl,
  chapterJumpHref,
  chapterJumpTarget,
  parseChapterIndex,
  resolveChapterUrl,
} from "@src/common/chapter-index";
import { markWorkForHiding, markWorkHideExempt } from "@src/common/hide-modes";
import {
  classifyReadingStates,
  parseChapterStats,
} from "@src/common/reading-state";
import { formatRelativeTime } from "@src/common/relative-time";
import { workStatusService } from "@src/common/services/work-status-service";
import {
  formatChapterProgress,
  hasFreshChapters,
  parseChapterCount,
  type WorkStatus,
} from "@src/common/work-status";
import { render } from "preact";
import { ContentScript } from "../content-script";

type BlurbTarget = {
  element: HTMLElement;
  workId: string;
};

const subscriptionStatusStyles = `
  li.work.blurb.toybox-substatus-subscribed {
    border: 1px solid var(--ao3-accent-color, #900) !important;
  }

  li.work.blurb.toybox-substatus-visited {
    border: 1px dashed color-mix(in srgb, var(--ao3-accent-color, #900) 30%, transparent) !important;
  }

  .toybox-substatus-badges {
    display: inline-flex;
    gap: 0.4em;
    margin-left: 0.5em;
    vertical-align: middle;
  }

  .toybox-substatus-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    font-size: 0.72em;
    font-weight: 500;
    line-height: 1.4;
    padding: 0.05em 0.6em;
    border-radius: 1em;
    border: 1px solid var(--ao3-accent-color, #900);
    color: var(--text-color, #333);
    background: color-mix(in srgb, var(--ao3-accent-color, #900) 10%, transparent);
    white-space: nowrap;
    cursor: default;
  }

  .toybox-substatus-badge-fresh {
    border-color: #2f9e44;
    background: color-mix(in srgb, #2f9e44 16%, transparent);
    color: color-mix(in srgb, #40c057 60%, var(--text-color, #333));
    font-weight: 600;
  }

  /* Anchor variants outrank AO3's a:link/:visited color rules */
  a.toybox-substatus-badge,
  a.toybox-substatus-badge:link,
  a.toybox-substatus-badge:visited {
    cursor: pointer;
    text-decoration: none;
    color: var(--text-color, #333);
  }

  a.toybox-substatus-badge:hover,
  a.toybox-substatus-badge:focus-visible {
    background: color-mix(in srgb, var(--ao3-accent-color, #900) 22%, transparent);
  }

  a.toybox-substatus-badge-fresh,
  a.toybox-substatus-badge-fresh:link,
  a.toybox-substatus-badge-fresh:visited {
    color: color-mix(in srgb, #40c057 60%, var(--text-color, #333));
  }

  a.toybox-substatus-badge-fresh:hover,
  a.toybox-substatus-badge-fresh:focus-visible {
    background: color-mix(in srgb, #2f9e44 28%, transparent);
  }
`;

// Chapter indexes fetched for badge jumps, memoized (promises included)
// per page load so double-clicks and duplicate blurbs never refetch
const chapterIndexes = new Map<string, Promise<ChapterIndexEntry[]>>();

function getChapterIndex(workId: string): Promise<ChapterIndexEntry[]> {
  let index = chapterIndexes.get(workId);

  if (!index) {
    index = fetch(chapterIndexUrl(workId), {
      credentials: "same-origin",
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Chapter index fetch failed: ${String(response.status)}`,
        );
      }

      return parseChapterIndex(
        new DOMParser().parseFromString(await response.text(), "text/html"),
      );
    });

    chapterIndexes.set(workId, index);
  }

  return index;
}

/**
 * Upgrade a badge click to the exact chapter URL. Failures of any kind
 * (network, challenge HTML parsing to nothing, chapter missing from the
 * index) land on the index page itself — the anchor's href — so the
 * click never dead-ends.
 */
async function jumpToChapter(workId: string, chapter: number): Promise<void> {
  const fallback = chapterIndexUrl(workId);

  try {
    const url = resolveChapterUrl(await getChapterIndex(workId), chapter);
    window.location.assign(url ?? fallback);
  } catch {
    window.location.assign(fallback);
  }
}

function handleJumpClick(
  event: MouseEvent,
  workId: string,
  chapter: number,
): void {
  // Chapter 1 hrefs already point at the work; modified clicks keep
  // native behavior (new tab lands on the chapter index)
  if (
    chapter <= 1 ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  event.preventDefault();
  void jumpToChapter(workId, chapter);
}

const StatusBadges = ({
  workId,
  status,
  availableChapters,
}: {
  workId: string;
  status: WorkStatus;
  availableChapters: number | null;
}) => {
  const chapterProgress = formatChapterProgress(status);
  const fresh = hasFreshChapters(status, availableChapters);
  const jumpTarget = chapterJumpTarget(status);

  return (
    <span class="toybox-substatus-badges">
      {status.subscribed_at && (
        <span class="toybox-substatus-badge" title={status.subscribed_at}>
          ★ subscribed {formatRelativeTime(new Date(status.subscribed_at))}
        </span>
      )}
      {status.last_visited_at && (
        <span class="toybox-substatus-badge" title={status.last_visited_at}>
          ⏱ visited {formatRelativeTime(new Date(status.last_visited_at))}
        </span>
      )}
      {chapterProgress && jumpTarget !== null && (
        <a
          class={`toybox-substatus-badge${fresh ? " toybox-substatus-badge-fresh" : ""}`}
          href={chapterJumpHref(workId, jumpTarget)}
          title={`${
            fresh
              ? `New chapters available (${String(availableChapters)} published) · last read · highest reached`
              : "Last read chapter · highest chapter reached"
          } · click to jump to chapter ${String(jumpTarget)}`}
          onClick={(event) => {
            handleJumpClick(event, workId, jumpTarget);
          }}
        >
          📖 {chapterProgress}
        </a>
      )}
    </span>
  );
};

export default class SubscriptionStatus extends ContentScript {
  getEnabled(): boolean {
    // Also runs badge-less when hiding needs statuses: the subscribed-works
    // exemption and every status-derived hide source
    return (
      this.settings.showSubscriptionStatus ||
      (this.settings.hideWorks &&
        (this.settings.neverHideSubscribedWorks || this.hasStatusHideModes()))
    );
  }

  private hasStatusHideModes(): boolean {
    const statusSources = [
      "visited",
      "subscribed",
      "read-finished",
      "read-caught-up",
      "read-behind",
      "read-barely-started",
    ] as const;

    return statusSources.some(
      (source) => this.settings.hideModes[source] !== "none",
    );
  }

  async onPreProcess(): Promise<void> {
    if (
      this.settings.showSubscriptionStatus &&
      !document.body.dataset.toyboxSubstatusStyles
    ) {
      const styleElement = document.createElement("style");
      styleElement.textContent = subscriptionStatusStyles;
      document.head.appendChild(styleElement);
      document.body.dataset.toyboxSubstatusStyles = "true";
    }
  }

  async onProcess(): Promise<void> {
    await this.processUnhandledBlurbs();
  }

  async onMutation(): Promise<void> {
    await this.processUnhandledBlurbs();
  }

  private async processUnhandledBlurbs(): Promise<void> {
    const targets = this.collectBlurbs();

    if (targets.length === 0) {
      return;
    }

    const statuses = await workStatusService.getStatuses(
      this.settings,
      targets.map((target) => target.workId),
    );

    if (!statuses) {
      return;
    }

    targets.forEach(({ element, workId }) => {
      const status = statuses[workId];

      if (status?.ignored) {
        this.markIgnored(element);
      } else if (status) {
        this.renderStatus(element, workId, status);
      }
    });
  }

  private collectBlurbs(): BlurbTarget[] {
    const blurbs = document.querySelectorAll<HTMLElement>(AO3_BLURB_SELECTOR);
    const targets: BlurbTarget[] = [];

    blurbs.forEach((element) => {
      if (element.dataset.toyboxSubstatus) {
        return;
      }

      // Mark immediately so concurrent onMutation runs never double-process
      element.dataset.toyboxSubstatus = "pending";

      const workId = this.extractWorkId(element);

      if (workId) {
        targets.push({ element, workId });
      }
    });

    return targets;
  }

  private extractWorkId(blurb: HTMLElement): string | null {
    const idMatch = /^work_(\d+)$/.exec(blurb.id);

    if (idMatch) {
      return idMatch[1];
    }

    // Bookmark blurbs carry a bookmark_<id> element id; fall back to the
    // work link in the blurb heading
    const link = blurb.querySelector<HTMLAnchorElement>(
      '.header h4.heading a[href*="/works/"]',
    );
    const hrefMatch = /\/works\/(\d+)/.exec(link?.getAttribute("href") ?? "");

    return hrefMatch ? hrefMatch[1] : null;
  }

  private markIgnored(element: HTMLElement): void {
    element.dataset.toyboxSubstatus = "done";
    markWorkForHiding(element, "ignored", "Ignored work");
    this.nudgeHidePipeline();
  }

  // The shared MutationObserver only watches body attributes, so nudge it
  // to make hide-works re-process newly marked blurbs
  private nudgeHidePipeline(): void {
    const signal = Number(document.body.dataset.toyboxHideSignal ?? "0");
    document.body.dataset.toyboxHideSignal = String(signal + 1);
  }

  private markStatusHides(element: HTMLElement, status: WorkStatus): void {
    if (!this.settings.hideWorks) {
      return;
    }

    // The exemption trumps the subscribed/visited hide sources — a work
    // it spares must not simultaneously be marked for hiding
    if (this.settings.neverHideSubscribedWorks && status.subscribed) {
      markWorkHideExempt(element);
      this.nudgeHidePipeline();

      return;
    }

    const modes = this.settings.hideModes;
    let marked = false;

    if (status.subscribed && modes.subscribed !== "none") {
      markWorkForHiding(element, "subscribed", "Subscribed work");
      marked = true;
    }

    if (status.last_visited_at && modes.visited !== "none") {
      markWorkForHiding(
        element,
        "visited",
        `Visited ${formatRelativeTime(new Date(status.last_visited_at))}`,
      );
      marked = true;
    }

    // Reading-progress states: derived from the same status plus the
    // blurb's own chapter stat, so no extra requests
    const readingMarks = classifyReadingStates(
      status,
      parseChapterStats(element.querySelector("dd.chapters")?.textContent),
      {
        farBehind: this.settings.hideFarBehindThreshold,
        barelyStarted: this.settings.hideBarelyStartedThreshold,
      },
    );

    for (const { source, reason } of readingMarks) {
      if (modes[source] !== "none") {
        markWorkForHiding(element, source, reason);
        marked = true;
      }
    }

    if (marked) {
      this.nudgeHidePipeline();
    }
  }

  private renderStatus(
    element: HTMLElement,
    workId: string,
    status: WorkStatus,
  ): void {
    element.dataset.toyboxSubstatus = "done";

    // Borders and badges belong to the badge setting; hide/exempt marking
    // below runs regardless (the script can be enabled for either)
    if (this.settings.showSubscriptionStatus) {
      if (status.subscribed) {
        element.classList.add("toybox-substatus-subscribed");
      } else if (status.last_visited_at) {
        element.classList.add("toybox-substatus-visited");
      }
    }

    this.markStatusHides(element, status);

    if (!this.settings.showSubscriptionStatus) {
      return;
    }

    if (
      !status.subscribed_at &&
      !status.last_visited_at &&
      status.last_chapter === null
    ) {
      return;
    }

    const heading = element.querySelector<HTMLElement>(".header h4.heading");

    if (!heading) {
      return;
    }

    const availableChapters = parseChapterCount(
      element.querySelector("dd.chapters")?.textContent,
    );

    const mountPoint = document.createElement("span");
    heading.appendChild(mountPoint);
    render(
      <StatusBadges
        workId={workId}
        status={status}
        availableChapters={availableChapters}
      />,
      mountPoint,
    );
  }
}
