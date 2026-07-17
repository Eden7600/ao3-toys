import {
  extractWorkIdFromUrl,
  isWorkPage,
  scrapeCurrentChapter,
} from "@src/common/ao3";
import {
  type ChapterBody,
  READING_LINE_PX,
  RESUME_FRAGMENT,
  type ReadingPosition as Position,
  captureActivePosition,
  collectChapterBodies,
  getParagraphs,
  isPositionAhead,
  meetsTrackingThreshold,
  positionPercent,
  resolveChapterUrl,
  scaleParagraphIndex,
} from "@src/common/reading-position";
import { workStatusService } from "@src/common/services/work-status-service";
import { render } from "preact";
import { ContentScript } from "../content-script";

const CAPTURE_THROTTLE_MS = 500;
const SEND_INTERVAL_MS = 10_000;

const resumeToastStyles = `
  .toybox-resume-toast {
    position: fixed;
    bottom: 1.5em;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1002;
    display: flex;
    align-items: center;
    gap: 0.75em;
    max-width: min(90vw, 34em);
    padding: 0.6em 1em;
    border-radius: 0.5em;
    background: var(--button-background-color, #2a2a2a);
    color: var(--text-color, #fff);
    border: 1px solid var(--box-border-color-subtle, transparent);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
    font-size: 0.95em;
  }

  .toybox-resume-toast button {
    cursor: pointer;
  }

  .toybox-resume-toast-close {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.1em;
    line-height: 1;
    padding: 0 0.2em;
  }
`;

const ResumeToast = ({
  position,
  onResume,
  onDismiss,
}: {
  position: Position;
  onResume: () => void;
  onDismiss: () => void;
}) => (
  <div class="toybox-resume-toast">
    <span>
      Pick up where you left off?{" "}
      <strong>
        ch {position.chapter} · {positionPercent(position)}%
      </strong>
    </span>
    <button type="button" onClick={onResume}>
      Resume
    </button>
    <button
      type="button"
      class="toybox-resume-toast-close"
      aria-label="Dismiss"
      onClick={onDismiss}
    >
      ×
    </button>
  </div>
);

export default class ReadingPositionTracker extends ContentScript {
  private started = false;
  private toastContainer: HTMLElement | null = null;
  private savedPosition: Position | null = null;

  getEnabled(): boolean {
    return this.settings.trackReadingPosition && isWorkPage();
  }

  async onProcess(): Promise<void> {
    const workId = extractWorkIdFromUrl();

    if (!workId || this.started) {
      return;
    }

    this.started = true;

    const chapterBodies = collectChapterBodies(
      document,
      scrapeCurrentChapter(),
    );

    if (chapterBodies.length === 0) {
      return;
    }

    this.savedPosition = await this.fetchSavedPosition(workId);

    this.startTracking(workId, chapterBodies);

    if (window.location.hash === RESUME_FRAGMENT) {
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );

      if (this.savedPosition) {
        this.resume(workId, chapterBodies, this.savedPosition);
      }

      return;
    }

    const current = this.capturePosition(chapterBodies);

    if (
      this.savedPosition &&
      this.settings.showResumePrompt &&
      (!current || isPositionAhead(this.savedPosition, current))
    ) {
      this.showToast(workId, chapterBodies, this.savedPosition);
    }
  }

  private startTracking(workId: string, chapterBodies: ChapterBody[]): void {
    let furthest = this.savedPosition;
    let lastSent = this.savedPosition;
    let throttled = false;
    let sendTimer: number | null = null;

    const send = (keepalive: boolean) => {
      const snapshot = furthest;

      if (!snapshot || (lastSent && !isPositionAhead(snapshot, lastSent))) {
        return;
      }

      void this.sendPosition(workId, snapshot, keepalive).then((ok) => {
        if (ok && (!lastSent || isPositionAhead(snapshot, lastSent))) {
          lastSent = snapshot;
        }
      });
    };

    const capture = () => {
      const position = this.capturePosition(chapterBodies);

      if (!position) {
        return;
      }

      if (
        this.savedPosition &&
        !isPositionAhead(this.savedPosition, position)
      ) {
        this.dismissToast();
      }

      // Skimming the top of a chapter is not reading it yet — nothing
      // below the tracking threshold is ratcheted or sent.
      if (!meetsTrackingThreshold(position)) {
        return;
      }

      if (isPositionAhead(position, furthest)) {
        furthest = position;

        sendTimer ??= window.setTimeout(() => {
          sendTimer = null;
          send(false);
        }, SEND_INTERVAL_MS);
      }
    };

    window.addEventListener(
      "scroll",
      () => {
        if (throttled) {
          return;
        }

        throttled = true;
        window.setTimeout(() => {
          throttled = false;
          capture();
        }, CAPTURE_THROTTLE_MS);
      },
      { passive: true },
    );

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        send(true);
      }
    });
    window.addEventListener("pagehide", () => {
      send(true);
    });
  }

  private capturePosition(chapterBodies: ChapterBody[]): Position | null {
    return captureActivePosition(chapterBodies, READING_LINE_PX);
  }

  private resume(
    workId: string,
    chapterBodies: ChapterBody[],
    position: Position,
  ): void {
    this.dismissToast();

    const target = chapterBodies.find(
      (candidate) => candidate.chapter === position.chapter,
    );

    if (!target) {
      window.location.href = resolveChapterUrl(
        document,
        workId,
        position.chapter,
      );

      return;
    }

    const paragraphs = getParagraphs(target.body);

    if (paragraphs.length === 0) {
      return;
    }

    paragraphs[scaleParagraphIndex(position, paragraphs.length)].scrollIntoView(
      {
        block: "start",
        behavior: "smooth",
      },
    );
  }

  private showToast(
    workId: string,
    chapterBodies: ChapterBody[],
    position: Position,
  ): void {
    if (!document.body.dataset.toyboxResumeToastStyles) {
      const styleElement = document.createElement("style");
      styleElement.textContent = resumeToastStyles;
      document.head.appendChild(styleElement);
      document.body.dataset.toyboxResumeToastStyles = "true";
    }

    this.toastContainer = document.createElement("div");
    document.body.appendChild(this.toastContainer);

    render(
      <ResumeToast
        position={position}
        onResume={() => {
          this.resume(workId, chapterBodies, position);
        }}
        onDismiss={() => {
          this.dismissToast();
        }}
      />,
      this.toastContainer,
    );
  }

  private dismissToast(): void {
    if (!this.toastContainer) {
      return;
    }

    render(null, this.toastContainer);
    this.toastContainer.remove();
    this.toastContainer = null;
  }

  private async fetchSavedPosition(workId: string): Promise<Position | null> {
    const status = await workStatusService.getStatus(this.settings, workId);

    return status?.position ?? null;
  }

  private async sendPosition(
    workId: string,
    position: Position,
    keepalive: boolean,
  ): Promise<boolean> {
    return workStatusService.sendReadingPosition(
      this.settings,
      workId,
      position,
      keepalive,
    );
  }
}
