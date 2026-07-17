/**
 * Single source of truth for every domain AO3 answers on: the primary
 * domain, the OTW-owned vanity/redirect domains, and the
 * transformativeworks.org alias. The manifest's match patterns and URL
 * cleaning both derive from this list.
 */
export const AO3_DOMAINS: string[] = [
  "archiveofourown.org",
  "archiveofourown.com",
  "archiveofourown.net",
  "ao3.org",
  "archive.transformativeworks.org",
];

// "*://*.example.org/*" matches example.org itself as well as subdomains
export const AO3_MATCH_PATTERNS: string[] = AO3_DOMAINS.map(
  (domain) => `*://*.${domain}/*`,
);

// Selectors to find elements on AO3 Pages
export const AO3_TAG_SELECTOR = "a.tag";
export const AO3_BLURB_SELECTOR = "li.work.blurb";
export const AO3_WORK_NAVIGATION_SELECTOR = "ul.work.navigation.actions";

// Individual work pages like /works/12345 or /works/12345/chapters/67890
const AO3_WORK_PAGE_PATTERNS = [
  /\/works\/\d+$/,
  /\/works\/\d+\/chapters\/\d+$/,
  /\/works\/\d+\?.*$/,
];

export function isWorkPage(): boolean {
  return AO3_WORK_PAGE_PATTERNS.some((pattern) =>
    pattern.test(window.location.pathname + window.location.search),
  );
}

export function extractWorkIdFromUrl(): string | null {
  const match = /\/works\/(\d+)/.exec(window.location.pathname);

  return match ? match[1] : null;
}

// Determine the chapter currently being read on a work/chapter page.
// Null when it cannot be determined (view_full_work or the main work page).
export function scrapeCurrentChapter(): number | null {
  if (window.location.href.includes("view_full_work=true")) {
    return null;
  }

  // Look for chapter title in the page content
  const chapterTitleElement = document.querySelector(
    'h3.title a[href*="/chapters/"]',
  );
  const chapterText = chapterTitleElement?.textContent.trim();

  if (chapterText) {
    // Extract chapter number from text like "Chapter 17"
    const chapterMatch = /Chapter\s+(\d+)/.exec(chapterText);

    if (chapterMatch) {
      return parseInt(chapterMatch[1], 10);
    }
  }

  // On a chapter page but the chapter number is not in the content;
  // this might be chapter 1 or an unnumbered chapter
  if (/\/works\/\d+\/chapters\/\d+/.test(window.location.pathname)) {
    return 1;
  }

  // Single-chapter works render their text directly inside #chapters with no
  // .chapter wrapper or chapter heading; the whole work is chapter 1.
  const chaptersModule = document.getElementById("chapters");

  if (chaptersModule && !chaptersModule.querySelector(".chapter")) {
    return 1;
  }

  // Multi-chapter main work page with no readable chapter marker
  return null;
}
