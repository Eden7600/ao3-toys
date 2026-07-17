import { isWorkPage, scrapeCurrentChapter } from "@src/common/ao3";
import { collectChapterBodies } from "@src/common/reading-position";
import {
  countWords,
  finishReadingAt,
  formatFinishAt,
  formatReadingTime,
  readingMinutes,
} from "@src/common/reading-time";
import { ContentScript } from "../content-script";

const chapterStatsStyles = `
  .toybox-chapter-stats {
    margin: 0.25em 0 0.9em;
    font-size: 0.85em;
    color: var(--text-color, inherit);
    opacity: 0.7;
  }
`;

/**
 * One compact stat line above each chapter body: word count (from the
 * page text), reading time at the user's WPM, and the finish-at clock
 * time. Inserted as a SIBLING before the chapter's .userstuff — never
 * inside it, so reading-position paragraph anchors, work skins, and
 * getParagraphs stay byte-identical to an uninjected page.
 */
export default class ChapterStats extends ContentScript {
  getEnabled(): boolean {
    return this.settings.enableChapterStats && isWorkPage();
  }

  async onProcess(): Promise<void> {
    const chapterBodies = collectChapterBodies(
      document,
      scrapeCurrentChapter(),
    );

    if (chapterBodies.length === 0) {
      return;
    }

    this.injectStyles();

    for (const { body } of chapterBodies) {
      if (body.dataset.toyboxChapterStats) {
        continue;
      }

      body.dataset.toyboxChapterStats = "true";

      const words = this.countChapterWords(body);
      const minutes = readingMinutes(words, this.settings.readingWpm);

      if (minutes === null) {
        continue;
      }

      const now = new Date();
      const line = document.createElement("div");
      line.className = "toybox-chapter-stats";
      line.textContent = `📖 ${words.toLocaleString()} words · ${formatReadingTime(minutes)} · done by ${formatFinishAt(finishReadingAt(now, minutes), now)}`;
      body.before(line);
    }
  }

  /** Chapter text words, excluding the "Chapter Text" landmark heading. */
  private countChapterWords(body: HTMLElement): number {
    const landmark = body.querySelector(":scope > .landmark");

    return (
      countWords(body.textContent) -
      (landmark ? countWords(landmark.textContent) : 0)
    );
  }

  private injectStyles(): void {
    if (document.body.dataset.toyboxChapterStatsStyles) {
      return;
    }

    const styleElement = document.createElement("style");
    styleElement.textContent = chapterStatsStyles;
    document.head.appendChild(styleElement);
    document.body.dataset.toyboxChapterStatsStyles = "true";
  }
}
