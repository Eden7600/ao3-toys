import type { CommonTag } from "./models/CommonTag";
import { synonymNames, type ParsedTagPage } from "./tag-page";

/**
 * Outcome of classifying a tag-page HTTP response.
 * - "ok": the body parsed as a tag page.
 * - "challenge": Cloudflare interfered — escalate to the background-tab tier.
 * - "transient": failed for now (rate limit, network, not a tag page);
 *   retry later, do not escalate.
 */
export type TagPageResponseVerdict = "ok" | "challenge" | "transient";

/** Heuristics for Cloudflare challenge HTML. */
export function looksLikeChallengeBody(body: string): boolean {
  return /just a moment|cf-chl|challenge-platform|cf_chl_|turnstile/i.test(
    body,
  );
}

export function classifyTagPageResponse(input: {
  status: number;
  cfMitigated: string | null;
  parsed: boolean;
  body: string;
}): TagPageResponseVerdict {
  if (input.cfMitigated?.includes("challenge")) {
    return "challenge";
  }

  if (input.status === 403 || input.status === 503) {
    return "challenge";
  }

  if (input.status === 429 || input.status >= 400) {
    return "transient";
  }

  if (input.parsed) {
    return "ok";
  }

  return looksLikeChallengeBody(input.body) ? "challenge" : "transient";
}

export type TagEnrichment = {
  canonicalName: string;
  aliases: string[];
};

/**
 * Builds the enrichment payload from the (canonical) tag page that was
 * ultimately acquired. The originally-saved name is preserved as an alias
 * when it differs from the canonical name, so existing highlights keep
 * matching.
 */
export function buildEnrichment(
  canonicalPage: ParsedTagPage,
  savedName: string,
): TagEnrichment {
  const aliases = new Set(synonymNames(canonicalPage));

  if (savedName !== canonicalPage.name) {
    aliases.add(savedName);
  }

  aliases.delete(canonicalPage.name);

  return { canonicalName: canonicalPage.name, aliases: [...aliases] };
}

/**
 * Merges an enrichment result into the stored state. `savedRow` is the row
 * the user just saved (possibly under a synonym name); `existingCanonicalRow`
 * is a pre-existing row stored under the canonical name, if any and distinct.
 * The user's fresh color/hide choices always win; the row is re-keyed to the
 * canonical name, deleting the synonym-keyed row when a distinct canonical
 * row absorbs it.
 */
export function mergeEnrichedTag(
  savedRow: CommonTag,
  existingCanonicalRow: CommonTag | undefined,
  enrichment: TagEnrichment,
): { upsert: CommonTag; deleteName: string | null } {
  const aliases = [...new Set(enrichment.aliases)].filter(
    (alias) => alias !== enrichment.canonicalName,
  );

  if (existingCanonicalRow && existingCanonicalRow.id !== savedRow.id) {
    return {
      upsert: {
        ...existingCanonicalRow,
        color: savedRow.color,
        hideWork: savedRow.hideWork,
        hideTag: savedRow.hideTag,
        aliases,
      },
      deleteName:
        savedRow.name === enrichment.canonicalName ? null : savedRow.name,
    };
  }

  return {
    upsert: { ...savedRow, name: enrichment.canonicalName, aliases },
    deleteName: null,
  };
}
