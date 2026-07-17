// AO3's works-listing filter accepts any tag by NAME through the
// "Other tags to include/exclude" fields, regardless of category — the
// same mechanism the sidebar filter form submits. These helpers rewrite a
// listing URL the way that form would.

const INCLUDE_PARAM = "work_search[other_tag_names]";
const EXCLUDE_PARAM = "work_search[excluded_tag_names]";

export type TagFilterAction = "include" | "exclude";
export type TagFilterState = "included" | "excluded" | null;

/** Works-listing pages whose GET params drive AO3's Sort and Filter form. */
export function isFilterableWorksListing(url: URL): boolean {
  const { pathname } = url;

  return (
    pathname === "/works" ||
    /^\/tags\/[^/]+\/works\/?$/.test(pathname) ||
    /^\/users\/[^/]+(?:\/pseuds\/[^/]+)?\/works\/?$/.test(pathname) ||
    /^\/collections\/[^/]+\/works\/?$/.test(pathname)
  );
}

function parseTagList(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name !== "");
}

function setOrDelete(params: URLSearchParams, key: string, list: string[]) {
  if (list.length === 0) {
    params.delete(key);
  } else {
    params.set(key, list.join(","));
  }
}

export function tagFilterState(url: URL, tagName: string): TagFilterState {
  if (parseTagList(url.searchParams.get(INCLUDE_PARAM)).includes(tagName)) {
    return "included";
  }

  if (parseTagList(url.searchParams.get(EXCLUDE_PARAM)).includes(tagName)) {
    return "excluded";
  }

  return null;
}

/**
 * Returns the listing URL with the tag filter applied. Toggle semantics:
 * applying the state the tag already has removes it from that list, and
 * adding to one list always removes it from the other. Pagination resets
 * since the filtered result set repaginates; every other param survives.
 */
export function applyTagFilter(
  url: URL,
  tagName: string,
  action: TagFilterAction,
): URL {
  const next = new URL(url.href);
  const params = next.searchParams;
  const targetKey = action === "include" ? INCLUDE_PARAM : EXCLUDE_PARAM;
  const oppositeKey = action === "include" ? EXCLUDE_PARAM : INCLUDE_PARAM;

  const target = parseTagList(params.get(targetKey));
  const opposite = parseTagList(params.get(oppositeKey)).filter(
    (name) => name !== tagName,
  );
  const nextTarget = target.includes(tagName)
    ? target.filter((name) => name !== tagName)
    : [...target, tagName];

  setOrDelete(params, targetKey, nextTarget);
  setOrDelete(params, oppositeKey, opposite);
  params.delete("page");
  params.set("commit", "Sort and Filter");

  return next;
}
