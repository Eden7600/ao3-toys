import { AO3_TAG_SELECTOR } from "@src/common/ao3";
import { cleanTagName } from "@src/common/tag-cleaning";
import { ContentScript } from "../content-script";

export default class TagCleaner extends ContentScript {
  private static get PROCESSED_ATTRIBUTE(): string {
    return "data-toybox-tag-cleaned";
  }

  getEnabled(): boolean {
    // Check if the page has already been processed
    if (document.body.hasAttribute(TagCleaner.PROCESSED_ATTRIBUTE)) {
      this.logger.log("Page has already been processed, skipping");

      return false;
    }

    const hasTags = document.querySelector(AO3_TAG_SELECTOR) !== null;

    if (!hasTags) {
      this.logger.log("No tags found on the page, script not applicable");

      return false;
    }

    // Don't run on tag detail pages (e.g., /tags/Tag-Name)
    // But DO run on tag work listing pages (e.g., /tags/Tag-Name/works)
    const currentPath = window.location.pathname;
    const isTagDetailPage = /^\/tags\/[^/]+$/.test(currentPath);

    if (isTagDetailPage) {
      this.logger.log("Tag detail page detected, skipping tag cleaning");

      return false;
    }

    // Enable if either setting is enabled
    return (
      this.settings.removeFandomDiscriminator || this.settings.removeTagSuffixes
    );
  }

  async onPostProcess(): Promise<void> {
    try {
      this.cleanTags();
      document.body.setAttribute(TagCleaner.PROCESSED_ATTRIBUTE, "true");
    } catch (error) {
      this.logger.error("Error cleaning tags:", error);
    }
  }

  private cleanTags(): void {
    const tagElements =
      document.querySelectorAll<HTMLAnchorElement>(AO3_TAG_SELECTOR);

    let processedCount = 0;

    tagElements.forEach((tagElement) => {
      const originalText = tagElement.textContent;
      if (!originalText) return;

      const cleanedText = cleanTagName(originalText, {
        removeFandomDiscriminator: this.settings.removeFandomDiscriminator,
        removeTagSuffixes: this.settings.removeTagSuffixes,
      });

      if (cleanedText !== originalText) {
        tagElement.textContent = cleanedText;
        processedCount++;
      }
    });

    this.logger.log(`Cleaned ${String(processedCount)} tags`);
  }
}
