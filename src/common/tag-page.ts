import { cleanTagUrl } from "@src/common/clean-urls";
import { TagType } from "@src/types/tags";

export type ParsedTagRef = {
  name: string;
  url: string;
  type: TagType;
};

export type ParsedTagPage = {
  /** The tag the page is about (the heading). */
  name: string;
  type: TagType;
  /** True when the profile text marks this as a canonical tag. */
  canonical: boolean;
  /** Set when the page says the tag "has been made a synonym of" another. */
  synonymOf: ParsedTagRef | null;
  /** Synonyms listed on a canonical tag's page. */
  synonyms: ParsedTagRef[];
  parents: ParsedTagRef[];
  children: ParsedTagRef[];
  metas: ParsedTagRef[];
};

const TYPE_BY_DESCRIPTION: Record<string, TagType> = {
  "Archive Warning Category": TagType.WARNING,
  "Category Category": TagType.CATEGORY,
  "Rating Category": TagType.RATING,
  "Fandom Category": TagType.FANDOM,
  "Character Category": TagType.CHARACTER,
  "Relationship Category": TagType.RELATIONSHIP,
  "Additional Tags": TagType.FREEFORM,
  "Media Category": TagType.MEDIA,
};

function determineRootTagType(description: string): TagType | null {
  for (const [key, value] of Object.entries(TYPE_BY_DESCRIPTION)) {
    if (description.includes(key)) {
      return value;
    }
  }

  return null;
}

function collectTagRefs(
  elements: Iterable<Element>,
  type: TagType,
): ParsedTagRef[] {
  const refs: ParsedTagRef[] = [];

  for (const element of elements) {
    const name = element.textContent.trim();
    const href = element.getAttribute("href") ?? "";
    const url = cleanTagUrl(href);

    if (name && url) {
      refs.push({ name, url, type });
    }
  }

  return refs;
}

function collectListbox(
  container: Element,
  selector: string,
  type: TagType,
): ParsedTagRef[] {
  const list = container.querySelector(`${selector} ul.tags`);

  if (!list) {
    return [];
  }

  return collectTagRefs(list.querySelectorAll("a.tag"), type);
}

function collectParents(container: Element, rootType: TagType): ParsedTagRef[] {
  // Fandom tags list their media under a dedicated parent box
  if (rootType === TagType.FANDOM) {
    const parentFandomBox = container.querySelector(
      "div.parent.fandom.listbox",
    );

    if (parentFandomBox) {
      return collectTagRefs(
        parentFandomBox.querySelectorAll("ul.tags a.tag"),
        TagType.MEDIA,
      );
    }
  }

  const parentBox = container.querySelector("div.parent.listbox");

  if (!parentBox) {
    return [];
  }

  return collectTagRefs(
    parentBox.querySelectorAll("ul.tags a.tag"),
    TagType.UNKNOWN,
  );
}

function collectChildren(container: Element): ParsedTagRef[] {
  // Untyped sub-tag list plus the typed sections of the child listbox —
  // the same two sources tag-details-observer has always read.
  const children = collectListbox(
    container,
    "div.sub.listbox",
    TagType.UNKNOWN,
  );
  const childBox = container.querySelector("div.child.listbox");

  if (!childBox) {
    return children;
  }

  const typedSections: Array<[string, TagType]> = [
    ["div.characters", TagType.CHARACTER],
    ["div.relationships", TagType.RELATIONSHIP],
    ["div.freeforms", TagType.FREEFORM],
  ];

  for (const [selector, type] of typedSections) {
    const section = childBox.querySelector(selector);

    if (section) {
      children.push(
        ...collectTagRefs(section.querySelectorAll("ul.tags a.tag"), type),
      );
    }
  }

  return children;
}

/**
 * Locates the "has been made a synonym of <canonical>" declaration. Current
 * AO3 markup puts it in a dedicated Mergers module (div.merger); older
 * markup had it in the profile description paragraph — check both.
 */
function findSynonymOf(container: Element, type: TagType): ParsedTagRef | null {
  const candidates = [
    container.querySelector("div.merger p"),
    container.querySelector("p"),
  ];

  for (const candidate of candidates) {
    if (!candidate?.textContent.includes("has been made a synonym of")) {
      continue;
    }

    const link = candidate.querySelector("a");
    const name = link?.textContent.trim();
    const url = cleanTagUrl(link?.getAttribute("href") ?? "");

    if (name && url) {
      return { name, url, type };
    }
  }

  return null;
}

/**
 * Parses an AO3 tag page document into structured tag data. Pure: no
 * fetching, no globals — takes any Document (live page or DOMParser
 * output). Returns null when the document is not a tag page.
 */
export function parseTagPage(doc: Document): ParsedTagPage | null {
  const container = doc.querySelector("div.tag.home.profile");

  if (!container) {
    return null;
  }

  const name = container.querySelector("h2.heading")?.textContent.trim();

  if (!name) {
    return null;
  }

  const descriptionEl = container.querySelector("p");
  const description = descriptionEl?.textContent ?? "";
  const type = determineRootTagType(description) ?? TagType.UNKNOWN;
  const canonical = description.includes("canonical tag");

  return {
    name,
    type,
    canonical,
    synonymOf: findSynonymOf(container, type),
    synonyms: collectListbox(container, "div.synonym", type),
    parents: collectParents(container, type),
    children: collectChildren(container),
    metas: collectListbox(container, "div.meta.listbox", TagType.UNKNOWN),
  };
}

/** Alias names a canonical tag covers, per its parsed page. */
export function synonymNames(parsed: ParsedTagPage): string[] {
  return parsed.synonyms.map((synonym) => synonym.name);
}
