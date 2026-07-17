import {
  chapterIndexUrl,
  chapterJumpHref,
  chapterJumpTarget,
  parseChapterIndex,
  resolveChapterUrl,
} from "@src/common/chapter-index";
import { describe, expect, it } from "vitest";

function parseDocument(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

// Mirrors otwarchive navigate.html.erb output
const NAVIGATE_PAGE = `
  <h2 class="heading"><a href="/works/123">Some Work</a> by author</h2>
  <ol class="chapter index group" role="navigation">
    <li><a href="/works/123/chapters/1001">1. Beginnings</a> <span class="datetime">(2024-01-01)</span></li>
    <li><a href="/works/123/chapters/1002">2. Middles</a> <span class="datetime">(2024-01-08)</span></li>
    <li><a href="/works/123/chapters/1007">3. Endings</a> <span class="datetime">(2024-01-15)</span></li>
  </ol>`;

describe("parseChapterIndex", () => {
  it("parses navigate-page markup into ordered entries", () => {
    const entries = parseChapterIndex(parseDocument(NAVIGATE_PAGE));

    expect(entries).toEqual([
      { chapter: 1, url: "/works/123/chapters/1001" },
      { chapter: 2, url: "/works/123/chapters/1002" },
      { chapter: 3, url: "/works/123/chapters/1007" },
    ]);
  });

  it("prefers the link-text number prefix over list position", () => {
    const entries = parseChapterIndex(
      parseDocument(`
        <ol class="chapter index group">
          <li><a href="/works/123/chapters/1002">2. Second</a></li>
          <li><a href="/works/123/chapters/1007">3. Third</a></li>
        </ol>`),
    );

    expect(entries.map((entry) => entry.chapter)).toEqual([2, 3]);
  });

  it("falls back to list position without a number prefix", () => {
    const entries = parseChapterIndex(
      parseDocument(`
        <ol class="chapter index group">
          <li><a href="/works/123/chapters/1001">1. First</a></li>
          <li><a href="/works/123/chapters/1002">Untitled</a></li>
        </ol>`),
    );

    expect(entries[1]).toEqual({
      chapter: 2,
      url: "/works/123/chapters/1002",
    });
  });

  it("ignores non-chapter links inside the index", () => {
    const entries = parseChapterIndex(
      parseDocument(`
        <ol class="chapter index group">
          <li><a href="/works/123">Full work</a></li>
          <li><a href="/works/123/chapters/1001">1. First</a></li>
        </ol>`),
    );

    expect(entries).toHaveLength(1);
  });

  it("yields no entries for challenge or unrelated HTML", () => {
    const challenge = parseDocument(
      "<title>Just a moment...</title><div id='challenge-platform'></div>",
    );

    expect(parseChapterIndex(challenge)).toEqual([]);
    expect(parseChapterIndex(parseDocument("<p>not ao3</p>"))).toEqual([]);
  });
});

describe("resolveChapterUrl", () => {
  const entries = parseChapterIndex(parseDocument(NAVIGATE_PAGE));

  it("resolves an exact chapter number", () => {
    expect(resolveChapterUrl(entries, 3)).toBe("/works/123/chapters/1007");
  });

  it("returns null when the chapter is absent", () => {
    expect(resolveChapterUrl(entries, 7)).toBeNull();
    expect(resolveChapterUrl([], 1)).toBeNull();
  });
});

describe("chapterJumpTarget", () => {
  it("prefers the highest chapter", () => {
    expect(chapterJumpTarget({ last_chapter: 3, highest_chapter: 7 })).toBe(7);
  });

  it("falls back to the last-read chapter", () => {
    expect(chapterJumpTarget({ last_chapter: 3, highest_chapter: null })).toBe(
      3,
    );
  });

  it("is null without any progress", () => {
    expect(
      chapterJumpTarget({ last_chapter: null, highest_chapter: null }),
    ).toBeNull();
  });
});

describe("chapterJumpHref", () => {
  it("links chapter 1 straight to the work", () => {
    expect(chapterJumpHref("123", 1)).toBe("/works/123");
  });

  it("links higher chapters to the index page", () => {
    expect(chapterJumpHref("123", 7)).toBe("/works/123/navigate");
    expect(chapterJumpHref("123", 7)).toBe(chapterIndexUrl("123"));
  });
});
