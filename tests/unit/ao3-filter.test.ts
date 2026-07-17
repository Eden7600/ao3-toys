import {
  applyTagFilter,
  isFilterableWorksListing,
  tagFilterState,
} from "@src/common/ao3-filter";
import { describe, expect, it } from "vitest";

const INCLUDE = "work_search[other_tag_names]";
const EXCLUDE = "work_search[excluded_tag_names]";

function url(path: string, params: Record<string, string> = {}): URL {
  const result = new URL(`https://archiveofourown.org${path}`);

  for (const [key, value] of Object.entries(params)) {
    result.searchParams.set(key, value);
  }

  return result;
}

describe("isFilterableWorksListing", () => {
  it("accepts the works-listing shapes", () => {
    expect(isFilterableWorksListing(url("/works"))).toBe(true);
    expect(isFilterableWorksListing(url("/tags/Angst/works"))).toBe(true);
    expect(isFilterableWorksListing(url("/tags/K*a*rkat%20Vantas/works"))).toBe(
      true,
    );
    expect(isFilterableWorksListing(url("/users/someone/works"))).toBe(true);
    expect(
      isFilterableWorksListing(url("/users/someone/pseuds/pen/works")),
    ).toBe(true);
    expect(isFilterableWorksListing(url("/collections/fest/works"))).toBe(true);
  });

  it("rejects non-listing pages", () => {
    expect(isFilterableWorksListing(url("/works/12345"))).toBe(false);
    expect(isFilterableWorksListing(url("/works/12345/chapters/2"))).toBe(
      false,
    );
    expect(isFilterableWorksListing(url("/tags/Angst"))).toBe(false);
    expect(isFilterableWorksListing(url("/tags/Angst/bookmarks"))).toBe(false);
    expect(isFilterableWorksListing(url("/users/someone/bookmarks"))).toBe(
      false,
    );
  });
});

describe("tagFilterState", () => {
  it("reads membership from the comma-separated lists", () => {
    const listing = url("/tags/Angst/works", {
      [INCLUDE]: "Fluff, Slow Burn",
      [EXCLUDE]: "Major Character Death",
    });

    expect(tagFilterState(listing, "Fluff")).toBe("included");
    expect(tagFilterState(listing, "Slow Burn")).toBe("included");
    expect(tagFilterState(listing, "Major Character Death")).toBe("excluded");
    expect(tagFilterState(listing, "Angst")).toBeNull();
  });

  it("is null without filter params", () => {
    expect(tagFilterState(url("/works"), "Fluff")).toBeNull();
  });
});

describe("applyTagFilter", () => {
  it("adds the tag to the chosen list and sets the commit param", () => {
    const next = applyTagFilter(url("/tags/Angst/works"), "Fluff", "include");

    expect(next.searchParams.get(INCLUDE)).toBe("Fluff");
    expect(next.searchParams.get("commit")).toBe("Sort and Filter");
    expect(next.pathname).toBe("/tags/Angst/works");
  });

  it("appends to an existing list without duplicating", () => {
    const listing = url("/works", { [INCLUDE]: "Fluff" });

    expect(
      applyTagFilter(listing, "Slow Burn", "include").searchParams.get(INCLUDE),
    ).toBe("Fluff,Slow Burn");
  });

  it("toggles the tag off when it is already in the target list", () => {
    const listing = url("/works", { [INCLUDE]: "Fluff,Slow Burn" });
    const next = applyTagFilter(listing, "Fluff", "include");

    expect(next.searchParams.get(INCLUDE)).toBe("Slow Burn");

    const emptied = applyTagFilter(
      url("/works", { [INCLUDE]: "Fluff" }),
      "Fluff",
      "include",
    );

    expect(emptied.searchParams.get(INCLUDE)).toBeNull();
  });

  it("moves the tag between lists", () => {
    const listing = url("/works", { [INCLUDE]: "Fluff" });
    const next = applyTagFilter(listing, "Fluff", "exclude");

    expect(next.searchParams.get(INCLUDE)).toBeNull();
    expect(next.searchParams.get(EXCLUDE)).toBe("Fluff");
  });

  it("resets pagination and preserves unrelated params", () => {
    const listing = url("/tags/Angst/works", {
      page: "7",
      "work_search[sort_column]": "kudos_count",
      "work_search[complete]": "T",
    });
    const next = applyTagFilter(listing, "Fluff", "exclude");

    expect(next.searchParams.get("page")).toBeNull();
    expect(next.searchParams.get("work_search[sort_column]")).toBe(
      "kudos_count",
    );
    expect(next.searchParams.get("work_search[complete]")).toBe("T");
  });

  it("does not mutate the input URL", () => {
    const listing = url("/works");
    applyTagFilter(listing, "Fluff", "include");

    expect(listing.searchParams.get(INCLUDE)).toBeNull();
  });
});
