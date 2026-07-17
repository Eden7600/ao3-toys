export type ReadingPosition = {
  chapter: number;
  paragraph: number;
  paragraph_count: number;
  offset: number;
};

export type ParagraphBounds = {
  top: number;
  height: number;
};

export type ChapterBody = {
  chapter: number;
  body: HTMLElement;
};

export const RESUME_FRAGMENT = "#toybox-resume";

export const READING_LINE_PX = 4; // Px below the viewport top counted as "being read"

// A tab being open is not a read: visits count only after 2 paragraphs or
// 10% of the chapter (whichever comes first), and positions are only
// tracked past 10%. Fixed baseline behavior, deliberately not settings.
export const VISIT_MIN_PARAGRAPHS = 2;
export const VISIT_MIN_FRACTION = 0.1;
export const TRACKING_MIN_FRACTION = 0.1;

export function positionFraction(position: ReadingPosition): number {
  if (position.paragraph_count <= 0) {
    return 0;
  }

  return (position.paragraph + position.offset) / position.paragraph_count;
}

export function meetsVisitThreshold(position: ReadingPosition): boolean {
  return (
    position.paragraph + position.offset >= VISIT_MIN_PARAGRAPHS ||
    positionFraction(position) >= VISIT_MIN_FRACTION
  );
}

export function meetsTrackingThreshold(position: ReadingPosition): boolean {
  return positionFraction(position) >= TRACKING_MIN_FRACTION;
}

/**
 * The anchor is the last paragraph whose top edge sits at or above the
 * reading line, with the offset measuring how far the line has penetrated
 * it. Bounds and the reading line share any coordinate space (viewport or
 * document) as long as they agree.
 */
export function computeParagraphAnchor(
  paragraphs: ParagraphBounds[],
  readingLine: number,
): { paragraph: number; offset: number } | null {
  if (paragraphs.length === 0) {
    return null;
  }

  let anchor = 0;

  for (const [index, bounds] of paragraphs.entries()) {
    if (bounds.top <= readingLine) {
      anchor = index;
    } else {
      break;
    }
  }

  const bounds = paragraphs[anchor];
  const offset =
    bounds.height > 0
      ? Math.min(Math.max((readingLine - bounds.top) / bounds.height, 0), 1)
      : 0;

  return { paragraph: anchor, offset };
}

export function isPositionAhead(
  candidate: ReadingPosition,
  baseline: ReadingPosition | null,
): boolean {
  if (!baseline) {
    return true;
  }

  if (candidate.chapter !== baseline.chapter) {
    return candidate.chapter > baseline.chapter;
  }

  return (
    candidate.paragraph + candidate.offset >
    baseline.paragraph + baseline.offset
  );
}

/**
 * Map a stored paragraph index onto the chapter's current paragraph list.
 * When the count has changed (the author edited the chapter) the index is
 * scaled proportionally instead of trusted blindly.
 */
export function scaleParagraphIndex(
  position: ReadingPosition,
  liveCount: number,
): number {
  if (liveCount <= 0) {
    return 0;
  }

  const index =
    position.paragraph_count === liveCount || position.paragraph_count <= 0
      ? position.paragraph
      : Math.round((position.paragraph / position.paragraph_count) * liveCount);

  return Math.min(Math.max(index, 0), liveCount - 1);
}

export function positionPercent(position: ReadingPosition): number {
  if (position.paragraph_count <= 0) {
    return 0;
  }

  return Math.round(
    (100 * (position.paragraph + position.offset)) / position.paragraph_count,
  );
}

export function getParagraphs(body: HTMLElement): HTMLElement[] {
  return Array.from(
    body.querySelectorAll<HTMLElement>(":scope > *:not(.landmark)"),
  );
}

/**
 * Ordered chapter bodies for any work-page shape: chaptered pages and the
 * full-work view expose `#chapters > .chapter` containers (chapter number
 * from their `chapter-N` id), oneshots a bare `.userstuff` under
 * `#chapters`. `fallbackChapter` covers containers without a usable id,
 * typically from `scrapeCurrentChapter()`.
 *
 * Only the chapter text — a direct `.userstuff` child of `.chapter` —
 * counts as the body. Chapter summaries, notes, and endnotes also use
 * `.userstuff` but sit nested inside their own modules; anchoring against
 * one of those (a few paragraphs at the top of the page) saturates the
 * position at 100% almost immediately.
 */
export function collectChapterBodies(
  doc: Document,
  fallbackChapter: number | null,
): ChapterBody[] {
  const containers = Array.from(
    doc.querySelectorAll<HTMLElement>("#chapters > .chapter"),
  );

  if (containers.length > 0) {
    const bodies: ChapterBody[] = [];

    for (const [index, container] of containers.entries()) {
      const body = container.querySelector<HTMLElement>(":scope > .userstuff");

      if (!body) {
        continue;
      }

      const idMatch = /^chapter-(\d+)$/.exec(container.id);
      const chapter = idMatch
        ? parseInt(idMatch[1], 10)
        : containers.length === 1
          ? (fallbackChapter ?? 1)
          : index + 1;

      bodies.push({ chapter, body });
    }

    return bodies;
  }

  const single = doc.querySelector<HTMLElement>("#chapters .userstuff");

  return single ? [{ chapter: fallbackChapter ?? 1, body: single }] : [];
}

/**
 * Current reading position across the page's chapter bodies: the active
 * chapter is the last one whose top has crossed the reading line, and the
 * anchor is computed from its paragraph rects. Null when the active chapter
 * has no paragraphs.
 */
export function captureActivePosition(
  chapterBodies: ChapterBody[],
  readingLine: number,
): ReadingPosition | null {
  if (chapterBodies.length === 0) {
    return null;
  }

  let active = chapterBodies[0];

  for (const candidate of chapterBodies) {
    if (candidate.body.getBoundingClientRect().top <= readingLine) {
      active = candidate;
    } else {
      break;
    }
  }

  const paragraphs = getParagraphs(active.body);

  if (paragraphs.length === 0) {
    return null;
  }

  const anchor = computeParagraphAnchor(
    paragraphs.map((paragraph) => {
      const rect = paragraph.getBoundingClientRect();

      return { top: rect.top, height: rect.height };
    }),
    readingLine,
  );

  if (!anchor) {
    return null;
  }

  return {
    chapter: active.chapter,
    paragraph: anchor.paragraph,
    paragraph_count: paragraphs.length,
    offset: Math.round(anchor.offset * 1000) / 1000,
  };
}

/**
 * URL for resuming in a chapter that is not on the current page. AO3
 * chapter URLs use chapter ids, which the chapter-navigation select maps
 * from chapter numbers ("7. Title" options in order). Falls back to the
 * full-work view, which always resolves by chapter number.
 */
export function resolveChapterUrl(
  doc: Document,
  workId: string,
  chapter: number,
): string {
  const options = Array.from(
    doc.querySelectorAll<HTMLOptionElement>("#selected_id option"),
  );

  const byLabel = options.find((option) => {
    const match = /^(\d+)\./.exec(option.textContent.trim());

    return match !== null && parseInt(match[1], 10) === chapter;
  });
  const target = byLabel ?? options.at(chapter - 1);

  if (target?.value) {
    return `/works/${workId}/chapters/${target.value}${RESUME_FRAGMENT}`;
  }

  return `/works/${workId}?view_full_work=true${RESUME_FRAGMENT}`;
}
