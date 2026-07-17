import type { RegexTagResponse } from "@src/background/handlers/regex-tag-handler";
import { Color } from "@src/common/color";
import { messaging } from "@src/common/messaging";
import type { CommonTag } from "@src/common/models/CommonTag";
import { enrichTag } from "@src/common/services/tag-enrichment";
import { mergeEnrichedTag } from "@src/common/tag-enrichment";

export { TAG_HIGHLIGHT_COLORS } from "@src/common/tag-color-summary";

export type TagConfigLookup = {
  /** Stored common-tag row, direct or reached through an alias. */
  row: CommonTag | null;
  /** Regex rule currently matching this tag name, if any. */
  regex: RegexTagResponse | null;
};

/**
 * Finds the stored configuration covering a tag name: the common-tag row
 * (stored directly under that name or reachable as an alias of a canonical
 * row) plus any regex rule that matches it.
 */
export async function loadTagConfig(tagName: string): Promise<TagConfigLookup> {
  const [direct, regexMatches] = await Promise.all([
    messaging.sendMessage("fetchCommonTag", tagName),
    messaging.sendMessage("processRegexTags", [tagName]),
  ]);
  const regex = regexMatches.find((m) => m.original === tagName) ?? null;

  if (direct) {
    return { row: direct, regex };
  }

  const matches = await messaging.sendMessage("processCommonTags", [tagName]);
  const match = matches.find((m) => m.original === tagName);

  if (!match) {
    return { row: null, regex };
  }

  return {
    row:
      (await messaging.sendMessage("fetchCommonTag", match.realName)) ?? null,
    regex,
  };
}

export type TagConfigPatch = Partial<
  Pick<CommonTag, "color" | "hideWork" | "hideTag">
>;

/**
 * Upserts the row for a tag, creating it name-only when unstored. When
 * `pageAliases` is provided (tag page mount — the synonyms are on screen),
 * it fills missing alias data for free.
 */
export async function saveTagConfig(
  existing: CommonTag | null,
  tagName: string,
  patch: TagConfigPatch,
  pageAliases?: string[],
): Promise<CommonTag> {
  const now = new Date();
  const row: CommonTag = {
    id: existing?.id,
    name: existing?.name ?? tagName,
    color: existing?.color ?? null,
    hideWork: existing?.hideWork ?? false,
    hideTag: existing?.hideTag ?? false,
    aliases: existing?.aliases ?? pageAliases,
    created_at: existing?.created_at ?? now,
    updated_at: now,
    ...patch,
  };

  row.id = await messaging.sendMessage("upsertCommonTag", row);

  return row;
}

export async function clearTagConfig(row: CommonTag): Promise<void> {
  await messaging.sendMessage("deleteCommonTag", row.name);
}

/**
 * Async alias enrichment for a just-saved row: resolves the canonical
 * name + synonyms from the tag's page and merges them into storage.
 * Returns the final row, or null when enrichment failed (the name-only
 * row stays in place).
 */
export async function enrichSavedTag(
  saved: CommonTag,
  tagPath: string,
): Promise<CommonTag | null> {
  const enrichment = await enrichTag(tagPath, saved.name);

  if (!enrichment) {
    return null;
  }

  // Re-read the row — it may have changed while enrichment was in flight.
  const fresh =
    (await messaging.sendMessage("fetchCommonTag", saved.name)) ?? saved;

  if (fresh.aliases !== undefined && fresh.name === enrichment.canonicalName) {
    return fresh;
  }

  const existingCanonical =
    enrichment.canonicalName === fresh.name
      ? undefined
      : await messaging.sendMessage("fetchCommonTag", enrichment.canonicalName);

  const { upsert, deleteName } = mergeEnrichedTag(
    fresh,
    existingCanonical,
    enrichment,
  );

  if (deleteName) {
    await messaging.sendMessage("deleteCommonTag", deleteName);
  }

  upsert.id = await messaging.sendMessage("upsertCommonTag", upsert);

  return upsert;
}

/** Every name a row covers, plus the name the user actually clicked. */
export function namesForRow(row: CommonTag, clickedName?: string): string[] {
  const names = new Set([row.name, ...(row.aliases ?? [])]);

  if (clickedName) {
    names.add(clickedName);
  }

  return [...names];
}

/**
 * Immediately restyles every visible occurrence of the given tag names,
 * mirroring tag-highlighter's rendering. Pass null config to clear.
 * allowHideTag gates the hide-tag display:none treatment — false in
 * contexts that must keep the links visible (e.g. the tag's own page) or
 * when the master hide switch is off.
 * (Alias text replacement is left to the next natural page load.)
 */
export function restyleTags(
  names: string[],
  config: { color: string | null; hideTag: boolean } | null,
  allowHideTag: boolean,
): void {
  const nameSet = new Set(names);
  const tagElements = document.querySelectorAll<HTMLAnchorElement>("a.tag");

  tagElements.forEach((tagElement) => {
    if (!nameSet.has(tagElement.textContent)) {
      return;
    }

    if (!config) {
      tagElement.style.backgroundColor = "";
      tagElement.style.color = "";
      tagElement.style.opacity = "";
      tagElement.style.display = "";
      delete tagElement.dataset.toyboxHideTag;

      return;
    }

    if (config.hideTag && allowHideTag) {
      tagElement.dataset.toyboxHideTag = "true";
      tagElement.style.display = "none";

      return;
    }

    tagElement.style.display = "";
    delete tagElement.dataset.toyboxHideTag;

    if (config.color === "fade") {
      tagElement.style.backgroundColor = "";
      tagElement.style.color = "";
      tagElement.style.opacity = "0.5";
    } else if (config.color) {
      tagElement.style.backgroundColor = Color.getBackgroundColor(config.color);
      tagElement.style.color = Color.getForegroundColor(config.color);
      tagElement.style.opacity = "";
    } else {
      tagElement.style.backgroundColor = "";
      tagElement.style.color = "";
      tagElement.style.opacity = "";
    }
  });
}
