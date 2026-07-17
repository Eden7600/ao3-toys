import { isWorkPage } from "@src/common/ao3";
import {
  hasConfiguredNames,
  mightContainPlaceholder,
  replacePlaceholders,
  type YnNames,
} from "@src/common/yn-replacer";
import { ContentScript } from "../content-script";

/**
 * Replaces reader-insert placeholders (Y/N and friends) with the reader's
 * configured names, in text nodes inside #workskin only — title, summary,
 * notes, chapter text, endnotes. Element structure, attributes, and
 * everything outside the work skin (comments, navigation) are untouched,
 * so work skins, selection, and the other work-page features are
 * unaffected. Work text is static; one pass suffices.
 */
export default class YnReplacer extends ContentScript {
  getEnabled(): boolean {
    return (
      this.settings.enableYnReplacer &&
      isWorkPage() &&
      hasConfiguredNames(this.names())
    );
  }

  async onProcess(): Promise<void> {
    const workskin = document.getElementById("workskin");

    if (!workskin) {
      return;
    }

    const names = this.names();
    const walker = document.createTreeWalker(workskin, NodeFilter.SHOW_TEXT);
    let replacedNodes = 0;

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent;

      if (text === null || !mightContainPlaceholder(text)) {
        continue;
      }

      const replaced = replacePlaceholders(text, names);

      if (replaced !== text) {
        node.textContent = replaced;
        replacedNodes++;
      }
    }

    this.logger.log(
      `Replaced placeholders in ${String(replacedNodes)} text nodes`,
    );
  }

  private names(): YnNames {
    return {
      firstName: this.settings.ynFirstName,
      lastName: this.settings.ynLastName,
    };
  }
}
