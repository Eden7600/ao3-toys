import { AO3_TAG_SELECTOR } from "@src/common/ao3";
import { cleanTagName } from "@src/common/tag-cleaning";
import {
  buildKnownNames,
  FADED_TAG_CLASS,
  FADED_TAG_CSS,
  shouldFadeTag,
  type TagType,
} from "@src/common/tag-fading";
import { ContentScript } from "../content-script";

// Blurb tag lists mark the category on the <li> (fandoms on the heading);
// work meta pages mark it on the <dd>
const TAG_TYPE_SELECTORS: ReadonlyArray<[string, TagType]> = [
  ["li.warnings, dd.warning", "warning"],
  ["li.relationships, dd.relationship", "relationship"],
  ["li.characters, dd.character", "character"],
  ["h5.fandoms, dd.fandom", "fandom"],
];

// Where character/ship/fandom names live, for the known-name factor
const NAME_TAG_SELECTOR = [
  "li.relationships a.tag",
  "li.characters a.tag",
  "h5.fandoms a.tag",
  "dd.relationship a.tag",
  "dd.character a.tag",
  "dd.fandom a.tag",
].join(", ");

function tagTypeOf(tagElement: HTMLAnchorElement): TagType {
  for (const [selector, type] of TAG_TYPE_SELECTORS) {
    if (tagElement.closest(selector) !== null) {
      return type;
    }
  }

  return "freeform";
}

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

    // Enable if any cleaning or fading setting is enabled
    return (
      this.settings.removeFandomDiscriminator ||
      this.settings.removeTagSuffixes ||
      this.settings.fadeCommentaryTags
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

    const fadeEnabled = this.settings.fadeCommentaryTags;

    if (fadeEnabled) {
      this.injectFadeStyles();
    }

    // Known names are scraped per blurb (or once for the whole page on a
    // work's meta block) and cached per scope element
    const knownNamesCache = new Map<ParentNode, string[]>();

    // A tag repeated across different blurbs on the page is curated;
    // commentary is unique to its work. Collected before cleaning mutates
    // any text.
    const blurbsByTagText = new Map<string, Set<Element>>();

    if (fadeEnabled) {
      tagElements.forEach((tagElement) => {
        const blurb = tagElement.closest("li.blurb");
        if (!blurb) return;

        const text = tagElement.textContent.trim();
        const blurbs = blurbsByTagText.get(text) ?? new Set<Element>();

        blurbs.add(blurb);
        blurbsByTagText.set(text, blurbs);
      });
    }

    // The last same-type verdict per tag list: commentary runs on across
    // tags in sentence fragments, so a faded predecessor nudges the next
    const momentumByList = new Map<
      ParentNode,
      { type: TagType; faded: boolean }
    >();

    let processedCount = 0;
    let fadedCount = 0;

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

      if (!fadeEnabled) {
        return;
      }

      // Blurbs put all categories in one ul.tags; meta pages use one
      // dd.tags per category
      const chainScope = tagElement.closest("ul.tags, dd.tags") ?? document;
      const tagType = tagTypeOf(tagElement);
      const last = momentumByList.get(chainScope);
      const previousFaded = last?.type === tagType && last.faded;

      // The user's own tag config always wins: tags they highlighted or
      // regex-matched are stamped by the tag-highlighter during onProcess
      // (before this onPostProcess script) and never fade, and hidden
      // tags have nothing to fade. They also break a commentary run.
      if (
        tagElement.dataset.toyboxHighlighted === "true" ||
        tagElement.dataset.toyboxHideTag === "true"
      ) {
        momentumByList.set(chainScope, { type: tagType, faded: false });

        return;
      }

      const scope = tagElement.closest("li.blurb") ?? document;
      let knownNames = knownNamesCache.get(scope);

      if (knownNames === undefined) {
        knownNames = buildKnownNames(
          Array.from(scope.querySelectorAll(NAME_TAG_SELECTOR)).map(
            (nameElement) => nameElement.textContent,
          ),
        );
        knownNamesCache.set(scope, knownNames);
      }

      // Classify on the ORIGINAL text — stripped suffixes like
      // "- Freeform" are canonicality evidence the classifier uses
      const faded = shouldFadeTag(
        originalText,
        this.settings.fadeCommentarySensitivity,
        {
          tagType,
          knownNames,
          previousFaded,
          repeatedOnPage:
            (blurbsByTagText.get(originalText.trim())?.size ?? 0) >= 2,
        },
      );

      momentumByList.set(chainScope, { type: tagType, faded });

      if (faded) {
        tagElement.classList.add(FADED_TAG_CLASS);
        fadedCount++;
      }
    });

    this.logger.log(
      `Cleaned ${String(processedCount)} tags, faded ${String(fadedCount)} tags`,
    );
  }

  private injectFadeStyles(): void {
    if (document.body.dataset.toyboxFadedTagStyles) {
      return;
    }

    const styleElement = document.createElement("style");
    styleElement.textContent = FADED_TAG_CSS;
    document.head.appendChild(styleElement);
    document.body.dataset.toyboxFadedTagStyles = "true";
  }
}
