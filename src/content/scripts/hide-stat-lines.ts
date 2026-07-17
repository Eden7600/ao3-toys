import { ContentScript } from "../content-script";

type StatLineSetting =
  | "hideBlurbLanguageLine"
  | "hideBlurbCommentsCount"
  | "hideBlurbBookmarksCount"
  | "hideBlurbCollectionsCount";

// One toggleable stat line in the blurb stats row: the dd selector plus
// the setting that hides it (the preceding dt label is hidden with it).
const STAT_LINES: Array<{ setting: StatLineSetting; selector: string }> = [
  { setting: "hideBlurbLanguageLine", selector: "dl.stats dd.language" },
  { setting: "hideBlurbCommentsCount", selector: "dl.stats dd.comments" },
  { setting: "hideBlurbBookmarksCount", selector: "dl.stats dd.bookmarks" },
  { setting: "hideBlurbCollectionsCount", selector: "dl.stats dd.collections" },
];

export default class HideStatLines extends ContentScript {
  private static get WORK_SELECTOR(): string {
    return "li.work.blurb.group";
  }

  getEnabled(): boolean {
    return STAT_LINES.some(({ setting }) => this.settings[setting]);
  }

  async onProcess(): Promise<void> {
    const works = document.querySelectorAll<HTMLElement>(
      HideStatLines.WORK_SELECTOR,
    );
    const lines = STAT_LINES.filter(({ setting }) => this.settings[setting]);

    let hiddenCount = 0;

    works.forEach((work) => {
      lines.forEach(({ selector }) => {
        const value = work.querySelector<HTMLElement>(selector);

        if (!value) {
          return;
        }

        // Hide, never remove: other scripts still read these stats
        // (e.g. the language filter reads dd.language).
        value.style.display = "none";

        const label = value.previousElementSibling;

        if (label instanceof HTMLElement && label.tagName === "DT") {
          label.style.display = "none";
        }

        hiddenCount++;
      });
    });

    this.logger.log(`Hid ${String(hiddenCount)} stat lines on blurbs`);
  }
}
