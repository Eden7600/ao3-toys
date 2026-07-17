import {
  computeBlurbRatios,
  extractStatNumber,
  formatKudosPerHit,
  formatRatio,
} from "@src/common/blurb-stats";
import {
  finishReadingAt,
  formatFinishAt,
  formatReadingTime,
  readingMinutes,
} from "@src/common/reading-time";
import { ContentScript } from "../content-script";

export default class RatioStats extends ContentScript {
  private static get WORK_SELECTOR(): string {
    return "li.work.blurb.group";
  }

  getEnabled(): boolean {
    return (
      this.settings.showKudosPerHitRatio ||
      this.settings.showWordsPerChapterRatio ||
      this.settings.showBlurbReadingTime ||
      this.settings.showBlurbFinishAt
    );
  }

  async onProcess(): Promise<void> {
    const works = document.querySelectorAll<HTMLElement>(
      RatioStats.WORK_SELECTOR,
    );

    let injectedCount = 0;

    works.forEach((work) => {
      const stats = work.querySelector("dl.stats");

      if (!stats) {
        return;
      }

      const ratios = computeBlurbRatios(work);

      if (
        this.settings.showKudosPerHitRatio &&
        ratios.kudosPerHit !== null &&
        this.appendStat(
          stats,
          "toybox-kudos-hits",
          "Kudos/Hits:",
          formatKudosPerHit(ratios.kudosPerHit),
        )
      ) {
        injectedCount++;
      }

      if (
        this.settings.showWordsPerChapterRatio &&
        ratios.wordsPerChapter !== null &&
        this.appendStat(
          stats,
          "toybox-words-chapter",
          "Words/Chapter:",
          formatRatio(ratios.wordsPerChapter, 0),
        )
      ) {
        injectedCount++;
      }

      // Both time stats derive from the blurb's word count; blurbs
      // without one get neither
      const minutes = readingMinutes(
        extractStatNumber(work, "dd.words"),
        this.settings.readingWpm,
      );

      if (
        this.settings.showBlurbReadingTime &&
        minutes !== null &&
        this.appendStat(
          stats,
          "toybox-reading-time",
          "Reading Time:",
          formatReadingTime(minutes),
        )
      ) {
        injectedCount++;
      }

      if (this.settings.showBlurbFinishAt && minutes !== null) {
        const now = new Date();

        if (
          this.appendStat(
            stats,
            "toybox-finish-at",
            "Finish At:",
            formatFinishAt(finishReadingAt(now, minutes), now),
          )
        ) {
          injectedCount++;
        }
      }
    });

    this.logger.log(`Injected ${String(injectedCount)} ratio stats`);
  }

  /**
   * Append a dt/dd stat pair unless this blurb already carries it —
   * listings can be re-processed and stats must not duplicate.
   */
  private appendStat(
    stats: Element,
    className: string,
    label: string,
    value: string,
  ): boolean {
    if (stats.querySelector(`dd.${className}`)) {
      return false;
    }

    const dt = document.createElement("dt");
    dt.className = `toybox-stat ${className}`;
    dt.textContent = label;

    const dd = document.createElement("dd");
    dd.className = `toybox-stat ${className}`;
    dd.textContent = value;

    stats.append(dt, dd);

    return true;
  }
}
