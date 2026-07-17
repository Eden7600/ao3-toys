import type { WorkStatus } from "@src/common/work-status";

export type ChapterIndexEntry = {
  chapter: number;
  url: string;
};

/**
 * Entries from AO3's chapter index page (/works/{id}/navigate), which
 * lists posted chapters in reading order as
 * `ol.chapter.index > li > a[href="/works/ID/chapters/CID"]` with link
 * text "{position}. {title}" (otwarchive navigate.html.erb /
 * Chapter#display_title). The chapter number comes from that prefix,
 * falling back to list position for defensiveness; non-index documents
 * (error pages, Cloudflare challenges) simply yield no entries.
 */
export function parseChapterIndex(doc: Document): ChapterIndexEntry[] {
  const links = Array.from(
    doc.querySelectorAll<HTMLAnchorElement>(
      'ol.chapter.index li > a[href*="/chapters/"]',
    ),
  );

  return links.map((link, index) => {
    const prefix = /^\s*(\d+)\./.exec(link.textContent);

    return {
      chapter: prefix ? parseInt(prefix[1], 10) : index + 1,
      url: link.getAttribute("href") ?? "",
    };
  });
}

/**
 * Exact-number match only: a miss means the saved ratchet no longer maps
 * onto the posted chapter list (deleted/reordered chapters), and callers
 * should fall back to the index page rather than guess.
 */
export function resolveChapterUrl(
  entries: ChapterIndexEntry[],
  chapter: number,
): string | null {
  return entries.find((entry) => entry.chapter === chapter)?.url ?? null;
}

/** The chapter a progress-badge click should land on. */
export function chapterJumpTarget(
  status: Pick<WorkStatus, "last_chapter" | "highest_chapter">,
): number | null {
  return status.highest_chapter ?? status.last_chapter;
}

/**
 * Always-useful anchor href for a jump target: chapter 1 (which covers
 * single-chapter works) lands on /works/{id} directly and needs no
 * resolution; anything higher points at the chapter index page, which a
 * click handler upgrades to the exact chapter URL when it can.
 */
export function chapterJumpHref(workId: string, chapter: number): string {
  return chapter <= 1 ? `/works/${workId}` : chapterIndexUrl(workId);
}

export function chapterIndexUrl(workId: string): string {
  return `/works/${workId}/navigate`;
}
