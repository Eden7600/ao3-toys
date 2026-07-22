import {
  type ReadingPosition,
  collectChapterBodies,
  computeParagraphAnchor,
  getParagraphs,
  isPositionAhead,
  meetsTrackingThreshold,
  meetsVisitThreshold,
  positionFraction,
  positionPercent,
  resolveChapterUrl,
  scaleParagraphIndex,
} from "@src/common/reading-position";
import { beforeEach, describe, expect, it } from "vitest";

function position(overrides: Partial<ReadingPosition>): ReadingPosition {
  return {
    chapter: 1,
    paragraph: 0,
    paragraph_count: 100,
    offset: 0,
    ...overrides,
  };
}

describe("computeParagraphAnchor", () => {
  const paragraphs = [
    { top: 0, height: 100 },
    { top: 100, height: 200 },
    { top: 300, height: 100 },
  ];

  it("returns null without paragraphs", () => {
    expect(computeParagraphAnchor([], 50)).toBeNull();
  });

  it("anchors to the last paragraph at or above the reading line", () => {
    expect(computeParagraphAnchor(paragraphs, 150)).toEqual({
      paragraph: 1,
      offset: 0.25,
    });
  });

  it("anchors to the first paragraph before any is reached", () => {
    expect(computeParagraphAnchor(paragraphs, -50)).toEqual({
      paragraph: 0,
      offset: 0,
    });
  });

  it("clamps the offset past the last paragraph", () => {
    expect(computeParagraphAnchor(paragraphs, 900)).toEqual({
      paragraph: 2,
      offset: 1,
    });
  });

  it("treats zero-height paragraphs as offset zero", () => {
    expect(computeParagraphAnchor([{ top: 0, height: 0 }], 50)).toEqual({
      paragraph: 0,
      offset: 0,
    });
  });
});

describe("positionFraction", () => {
  it("measures progress through the chapter", () => {
    expect(positionFraction(position({ paragraph: 25, offset: 0.5 }))).toBe(
      0.255,
    );
  });

  it("is zero for unusable paragraph counts", () => {
    expect(positionFraction(position({ paragraph_count: 0 }))).toBe(0);
  });
});

describe("meetsVisitThreshold", () => {
  it("trips on 2 paragraphs read in a long chapter", () => {
    expect(meetsVisitThreshold(position({ paragraph: 2 }))).toBe(true);
    expect(meetsVisitThreshold(position({ paragraph: 1, offset: 1 }))).toBe(
      true,
    );
    expect(meetsVisitThreshold(position({ paragraph: 1, offset: 0.9 }))).toBe(
      false,
    );
  });

  it("trips on 10% first in a short chapter", () => {
    // 10 paragraphs: 10% = 1 paragraph, reached before 2 paragraphs
    expect(
      meetsVisitThreshold(position({ paragraph: 1, paragraph_count: 10 })),
    ).toBe(true);
    expect(
      meetsVisitThreshold(
        position({ paragraph: 0, offset: 0.5, paragraph_count: 10 }),
      ),
    ).toBe(false);
  });

  it("is not met at the top of the page", () => {
    expect(meetsVisitThreshold(position({}))).toBe(false);
  });
});

describe("meetsTrackingThreshold", () => {
  it("gates on 10% of the chapter", () => {
    expect(
      meetsTrackingThreshold(position({ paragraph: 10, paragraph_count: 100 })),
    ).toBe(true);
    expect(
      meetsTrackingThreshold(
        position({ paragraph: 9, offset: 0.9, paragraph_count: 100 }),
      ),
    ).toBe(false);
  });

  it("ignores the paragraph-count shortcut visits use", () => {
    // 3 paragraphs read of 100 satisfies the visit gate but not tracking
    expect(meetsVisitThreshold(position({ paragraph: 3 }))).toBe(true);
    expect(meetsTrackingThreshold(position({ paragraph: 3 }))).toBe(false);
  });
});

describe("isPositionAhead", () => {
  it("is ahead of a missing baseline", () => {
    expect(isPositionAhead(position({}), null)).toBe(true);
  });

  it("orders by chapter first", () => {
    expect(
      isPositionAhead(
        position({ chapter: 4, paragraph: 0 }),
        position({ chapter: 3, paragraph: 150 }),
      ),
    ).toBe(true);
    expect(
      isPositionAhead(
        position({ chapter: 3, paragraph: 150 }),
        position({ chapter: 4, paragraph: 0 }),
      ),
    ).toBe(false);
  });

  it("orders by paragraph plus offset within a chapter", () => {
    expect(
      isPositionAhead(
        position({ paragraph: 42, offset: 0.5 }),
        position({ paragraph: 42, offset: 0.4 }),
      ),
    ).toBe(true);
    expect(
      isPositionAhead(
        position({ paragraph: 42, offset: 0.4 }),
        position({ paragraph: 42, offset: 0.4 }),
      ),
    ).toBe(false);
  });
});

describe("scaleParagraphIndex", () => {
  it("keeps the index when counts match", () => {
    expect(
      scaleParagraphIndex(
        position({ paragraph: 42, paragraph_count: 180 }),
        180,
      ),
    ).toBe(42);
  });

  it("scales proportionally when the chapter was edited", () => {
    expect(
      scaleParagraphIndex(
        position({ paragraph: 50, paragraph_count: 100 }),
        120,
      ),
    ).toBe(60);
  });

  it("clamps to the live paragraph range", () => {
    expect(
      scaleParagraphIndex(
        position({ paragraph: 99, paragraph_count: 100 }),
        10,
      ),
    ).toBe(9);
    expect(scaleParagraphIndex(position({ paragraph: 5 }), 0)).toBe(0);
  });
});

describe("positionPercent", () => {
  it("rounds paragraph progress to a percent", () => {
    expect(
      positionPercent(
        position({ paragraph: 45, paragraph_count: 180, offset: 0 }),
      ),
    ).toBe(25);
  });

  it("is zero for an empty chapter", () => {
    expect(positionPercent(position({ paragraph_count: 0 }))).toBe(0);
  });
});

describe("collectChapterBodies", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("maps chapter containers by their chapter-N ids", () => {
    document.body.innerHTML = `
      <div id="chapters">
        <div class="chapter" id="chapter-6"><div class="userstuff"><p>a</p></div></div>
        <div class="chapter" id="chapter-7"><div class="userstuff"><p>b</p></div></div>
      </div>`;

    const bodies = collectChapterBodies(document, null);

    expect(bodies.map((body) => body.chapter)).toEqual([6, 7]);
  });

  it("falls back to document order without usable ids", () => {
    document.body.innerHTML = `
      <div id="chapters">
        <div class="chapter"><div class="userstuff"><p>a</p></div></div>
        <div class="chapter"><div class="userstuff"><p>b</p></div></div>
      </div>`;

    expect(collectChapterBodies(document, null).map((b) => b.chapter)).toEqual([
      1, 2,
    ]);
  });

  it("prefers the fallback chapter for a lone unlabeled container", () => {
    document.body.innerHTML = `
      <div id="chapters">
        <div class="chapter"><div class="userstuff"><p>a</p></div></div>
      </div>`;

    expect(collectChapterBodies(document, 5)[0].chapter).toBe(5);
  });

  it("treats an oneshot body as the fallback chapter", () => {
    document.body.innerHTML = `
      <div id="chapters">
        <h3 class="landmark heading">Work Text:</h3>
        <div class="userstuff"><p>a</p></div>
      </div>`;

    const bodies = collectChapterBodies(document, null);

    expect(bodies).toHaveLength(1);
    expect(bodies[0].chapter).toBe(1);
  });

  it("skips summary and notes userstuff blocks in favor of the chapter text", () => {
    document.body.innerHTML = `
      <div id="chapters">
        <div class="chapter" id="chapter-3">
          <div class="chapter preface group">
            <div class="summary module">
              <blockquote class="userstuff"><p>summary</p></blockquote>
            </div>
            <div class="notes module">
              <blockquote class="userstuff"><p>notes</p></blockquote>
            </div>
          </div>
          <div class="userstuff module"><p>chapter text</p></div>
          <div class="chapter preface group">
            <div class="end notes module">
              <blockquote class="userstuff"><p>endnotes</p></blockquote>
            </div>
          </div>
        </div>
      </div>`;

    const bodies = collectChapterBodies(document, null);

    expect(bodies).toHaveLength(1);
    expect(bodies[0].body.textContent).toBe("chapter text");
  });

  it("returns nothing off work pages", () => {
    document.body.innerHTML = "<div><p>listing page</p></div>";

    expect(collectChapterBodies(document, null)).toEqual([]);
  });
});

describe("getParagraphs", () => {
  it("excludes landmark headings from the paragraph list", () => {
    const body = document.createElement("div");
    body.className = "userstuff";
    body.innerHTML = `
      <h3 class="landmark heading">Chapter Text</h3>
      <p>one</p>
      <p>two</p>`;

    expect(getParagraphs(body)).toHaveLength(2);
  });
});

describe("resolveChapterUrl", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("resolves the chapter id from the navigation select labels", () => {
    document.body.innerHTML = `
      <select id="selected_id">
        <option value="111">1. Beginnings</option>
        <option value="222">2. Middles</option>
        <option value="333">3. Ends</option>
      </select>`;

    expect(resolveChapterUrl(document, "123", 2)).toBe(
      "/works/123/chapters/222#toybox-resume",
    );
  });

  it("falls back to option order when labels are unnumbered", () => {
    document.body.innerHTML = `
      <select id="selected_id">
        <option value="111">Beginnings</option>
        <option value="222">Middles</option>
      </select>`;

    expect(resolveChapterUrl(document, "123", 2)).toBe(
      "/works/123/chapters/222#toybox-resume",
    );
  });

  it("falls back to the full-work view without a select", () => {
    expect(resolveChapterUrl(document, "123", 7)).toBe(
      "/works/123?view_full_work=true#toybox-resume",
    );
  });

  it("falls back when the option value is not a numeric chapter id", () => {
    document.body.innerHTML = `
      <select id="selected_id">
        <option value="../../evil">1. Beginnings</option>
      </select>`;

    expect(resolveChapterUrl(document, "123", 1)).toBe(
      "/works/123?view_full_work=true#toybox-resume",
    );
  });
});
