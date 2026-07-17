import {
  extractWorkIdFromUrl,
  isWorkPage,
  scrapeCurrentChapter,
} from "@src/common/ao3";
import { cleanTagUrl } from "@src/common/clean-urls";
import { markdownService } from "@src/common/markdown";
import {
  READING_LINE_PX,
  captureActivePosition,
  collectChapterBodies,
  meetsVisitThreshold,
  type ChapterBody,
} from "@src/common/reading-position";
import { workStatusService } from "@src/common/services/work-status-service";
import { TagType, type TagRecord } from "@src/types/tags";
import type { WorkVisitAuthor, WorkVisitPayload } from "@src/types/work-visit";
import { ContentScript } from "../content-script";

export default class WorkPageObserver extends ContentScript {
  getEnabled(): boolean {
    return this.settings.trackVisitedWorks && isWorkPage();
  }

  async onProcess(): Promise<void> {
    const chapterBodies = collectChapterBodies(
      document,
      scrapeCurrentChapter(),
    );

    // Fail open on unrecognizable layouts, and count fully-visible chapters
    // immediately — no scrolling is required to read them, so the
    // opened-but-unread heuristic has nothing to measure.
    if (
      chapterBodies.length === 0 ||
      this.isChapterFullyVisible(chapterBodies)
    ) {
      await this.scrapeAndSend();

      return;
    }

    this.watchForReadThreshold(chapterBodies);
  }

  /**
   * Defers the visit until the reader has actually read into the chapter
   * (2 paragraphs or 10%, whichever comes first). A tab that never gets
   * scrolled never registers a visit.
   */
  private watchForReadThreshold(chapterBodies: ChapterBody[]): void {
    const controller = new AbortController();
    let throttled = false;

    const check = () => {
      const position = captureActivePosition(chapterBodies, READING_LINE_PX);

      if (position && meetsVisitThreshold(position)) {
        controller.abort();
        void this.scrapeAndSend();
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
          check();
        }, 500);
      },
      { passive: true, signal: controller.signal },
    );
  }

  private isChapterFullyVisible(chapterBodies: ChapterBody[]): boolean {
    const active = chapterBodies[0];

    return active.body.getBoundingClientRect().bottom <= window.innerHeight;
  }

  private async scrapeAndSend(): Promise<void> {
    try {
      const workData = this.scrapeWorkPage();

      this.logger.log("Work data", workData);

      if (workData) {
        const recorded = await workStatusService.sendVisit(
          this.settings,
          workData,
        );

        if (recorded) {
          this.logger.log(`Recorded visit for work ${workData.workId}`);
        }
      }
    } catch (error) {
      this.logger.error("Failed to scrape work page", error);
    }
  }

  private scrapeWorkPage(): WorkVisitPayload | null {
    // Extract work ID from URL
    const workId = extractWorkIdFromUrl();
    this.logger.log("Work ID match", workId);
    if (!workId) return null;

    // Get basic work info
    const title = this.scrapeTitle();
    this.logger.log("Title", title);
    const summary = this.scrapeSummary();
    this.logger.log("Summary", summary);
    const authors = this.scrapeAuthors();
    this.logger.log("Authors", authors);
    const stats = this.scrapeStats();
    this.logger.log("Stats", stats);
    const tags = this.scrapeTags();
    this.logger.log("Tags", tags);
    const dates = this.scrapeDates();
    this.logger.log("Dates", dates);

    return {
      workId,
      currentChapter: scrapeCurrentChapter(),
      currentlySubscribed: this.scrapeSubscriptionStatus(),
      work: {
        id: workId,
        title,
        summary,
        language: stats.language,
        wordCount: stats.wordCount,
        chapterCount: stats.chapterCount,
        isComplete: stats.isComplete,
        publishedAt: dates.publishedAt,
        kudos: stats.kudos,
        hits: stats.hits,
        bookmarks: stats.bookmarks,
        comments: stats.comments,
        updatedAt: dates.updatedAt,
        authors,
        tags,
      },
    };
  }

  private scrapeTitle(): string {
    const titleElement = document.querySelector(".preface h2.title.heading");

    return titleElement?.textContent.trim() ?? "";
  }

  private scrapeSummary(): string | null {
    return markdownService.extractSummaryAsMarkdown(
      document.body,
      ".summary.module blockquote.userstuff",
    );
  }

  private scrapeAuthors(): WorkVisitAuthor[] {
    const authors: WorkVisitAuthor[] = [];

    // Check for byline in preface
    const bylineElement = document.querySelector(".preface .byline.heading");

    if (bylineElement) {
      const authorLinks = bylineElement.querySelectorAll("a[rel='author']");

      if (authorLinks.length > 0) {
        authorLinks.forEach((link) => {
          const { pathname } = link as HTMLAnchorElement;
          const name = pathname.split("/")[2] ?? "";
          authors.push({
            name,
            url: `https://archiveofourown.org${pathname}`,
          });
        });
      } else {
        // Check if it's anonymous
        const bylineText = bylineElement.textContent.trim();

        if (bylineText === "Anonymous" || bylineText.includes("Anonymous")) {
          authors.push({
            name: "Anonymous",
            url: undefined,
          });
        }
      }
    }

    // If no authors found, default to Anonymous
    if (authors.length === 0) {
      authors.push({
        name: "Anonymous",
        url: undefined,
      });
    }

    return authors;
  }

  private scrapeStats() {
    const stats = {
      language: "English",
      wordCount: 0,
      chapterCount: 0,
      isComplete: false,
      kudos: 0,
      hits: 0,
      bookmarks: 0,
      comments: 0,
    };

    // Find the stats section
    const statsContainer = document.querySelector("dl.stats");

    if (statsContainer) {
      // Language
      const languageElement = statsContainer.querySelector("dd.language");

      if (languageElement) {
        stats.language = languageElement.textContent.trim();
      }

      // Word count
      const wordsElement = statsContainer.querySelector("dd.words");

      if (wordsElement) {
        const wordsText = wordsElement.textContent.replace(/,/g, "");
        stats.wordCount = wordsText ? parseInt(wordsText, 10) : 0;
      }

      // Chapters
      const chaptersElement = statsContainer.querySelector("dd.chapters");

      if (chaptersElement) {
        const chaptersText = chaptersElement.textContent.trim();

        if (chaptersText) {
          const [current, total] = chaptersText.split("/");
          stats.chapterCount = parseInt(current, 10) || 0;
          stats.isComplete = total !== "?" && current === total;
        }
      }

      // Other stats
      stats.kudos = this.extractNumber(statsContainer, "dd.kudos");
      stats.hits = this.extractNumber(statsContainer, "dd.hits");
      stats.bookmarks = this.extractNumber(statsContainer, "dd.bookmarks");
      stats.comments = this.extractNumber(statsContainer, "dd.comments");
    }

    return stats;
  }

  private scrapeTags(): TagRecord[] {
    const tags: TagRecord[] = [];
    const metaContainer = document.querySelector("dl.work.meta.group");

    if (metaContainer) {
      // Process each tag category
      const tagCategories = {
        "warning tags": TagType.WARNING,
        "rating tags": TagType.RATING,
        "category tags": TagType.CATEGORY,
        "relationship tags": TagType.RELATIONSHIP,
        "fandom tags": TagType.FANDOM,
        "character tags": TagType.CHARACTER,
        "freeform tags": TagType.FREEFORM,
      };

      Object.entries(tagCategories).forEach(([className, tagType]) => {
        const tagSection = metaContainer.querySelector(
          `dd.${className.replace(" ", ".")}`,
        );

        if (tagSection) {
          const tagLinks = tagSection.querySelectorAll("a.tag");
          tagLinks.forEach((tag) => {
            const name = tag.textContent.trim();
            let url = (tag as HTMLAnchorElement).href || "";

            // Use cleanTagUrl to strip base URL and /works suffix
            url = cleanTagUrl(url);

            if (name) {
              tags.push({
                name,
                type: tagType,
                url,
                typeConfidence: 10,
              });
            }
          });
        }
      });
    }

    return tags;
  }

  private scrapeDates() {
    const dates = {
      publishedAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    const statsContainer = document.querySelector("dl.stats");

    if (statsContainer) {
      // Published date
      const publishedElement = statsContainer.querySelector("dd.published");

      if (publishedElement) {
        const publishedText = publishedElement.textContent.trim();

        if (publishedText) {
          dates.publishedAt = publishedText;
        }
      }

      // Updated date - look for completed date first, then updated date
      const completedElement = statsContainer.querySelector("dd.status");
      const updatedElement = statsContainer.querySelector("dd.updated");

      if (completedElement) {
        const completedText = completedElement.textContent.trim();

        if (completedText) {
          dates.updatedAt = completedText;
        }
      } else if (updatedElement) {
        const updatedText = updatedElement.textContent.trim();

        if (updatedText) {
          dates.updatedAt = updatedText;
        }
      } else {
        // If no update date, use published date
        dates.updatedAt = dates.publishedAt;
      }
    }

    return dates;
  }

  private extractNumber(element: Element, selector: string): number {
    const text = element.querySelector(selector)?.textContent;
    if (!text) return 0;

    // Remove commas and extract number
    const cleanText = text.replace(/,/g, "");

    return parseInt(cleanText, 10) || 0;
  }

  private scrapeSubscriptionStatus(): boolean | undefined {
    // Look for the subscribe form
    const subscribeElement = document.querySelector("li.subscribe form");

    if (!subscribeElement) {
      // No subscribe form found, user might not be logged in or this is not a subscribable work
      return undefined;
    }

    // Check the submit button value to determine subscription status
    const submitButton: HTMLButtonElement | null =
      subscribeElement.querySelector('input[type="submit"]');

    if (submitButton) {
      const buttonValue = submitButton.value.trim();

      if (buttonValue === "Unsubscribe") {
        return true; // User is currently subscribed
      }

      if (buttonValue === "Subscribe") {
        return false; // User is not subscribed
      }
    }

    // Fallback: check for delete method input which indicates unsubscribe form
    const deleteMethodInput = subscribeElement.querySelector(
      'input[name="_method"][value="delete"]',
    );

    if (deleteMethodInput) {
      return true; // User is currently subscribed (unsubscribe form)
    }

    // If we can't determine the status, return undefined
    return undefined;
  }
}
