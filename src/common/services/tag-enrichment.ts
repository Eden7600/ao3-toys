import { Logger } from "@src/common/logger";
import { messaging } from "@src/common/messaging";
import {
  buildEnrichment,
  classifyTagPageResponse,
  type TagEnrichment,
} from "@src/common/tag-enrichment";
import { parseTagPage, type ParsedTagPage } from "@src/common/tag-page";

const logger = new Logger("TagEnrichment");

const inFlight = new Map<string, Promise<TagEnrichment | null>>();

type AcquireResult = ParsedTagPage | "challenge" | null;

async function fetchTagPage(url: string): Promise<AcquireResult> {
  try {
    const response = await fetch(url, { credentials: "include" });
    const body = await response.text();
    const doc = new DOMParser().parseFromString(body, "text/html");
    const parsed = parseTagPage(doc);
    const verdict = classifyTagPageResponse({
      status: response.status,
      cfMitigated: response.headers.get("cf-mitigated"),
      parsed: parsed !== null,
      body,
    });

    if (verdict === "ok") {
      return parsed;
    }

    logger.log(`Tag page fetch verdict "${verdict}" for`, url);

    return verdict === "challenge" ? "challenge" : null;
  } catch (error) {
    logger.error("Tag page fetch failed:", error);

    return null;
  }
}

async function acquireTagPage(url: string): Promise<ParsedTagPage | null> {
  const fetched = await fetchTagPage(url);

  if (fetched !== "challenge") {
    return fetched;
  }

  logger.log("Fetch challenged; falling back to background tab", url);

  try {
    return await messaging.sendMessage("enrichTagViaTab", url);
  } catch (error) {
    logger.error("Tab enrichment failed:", error);

    return null;
  }
}

function toAbsoluteTagUrl(tagPath: string): string {
  return new URL(tagPath, window.location.origin).href;
}

/**
 * Resolves a tag's canonical name and full synonym list from its page,
 * without user-visible navigation. Fetch first; background tab on Cloudflare
 * challenge; one extra hop when the tag is a synonym. Returns null on
 * failure — the caller's name-only row stays valid. Concurrent calls for
 * the same tag share one promise.
 */
export function enrichTag(
  tagPath: string,
  savedName: string,
): Promise<TagEnrichment | null> {
  const existing = inFlight.get(tagPath);

  if (existing) {
    return existing;
  }

  const run = (async (): Promise<TagEnrichment | null> => {
    let parsed = await acquireTagPage(toAbsoluteTagUrl(tagPath));

    if (!parsed) {
      return null;
    }

    if (parsed.synonymOf) {
      const canonical = await acquireTagPage(
        toAbsoluteTagUrl(parsed.synonymOf.url),
      );

      if (!canonical) {
        // We at least know the canonical name — link the saved name to it.
        return {
          canonicalName: parsed.synonymOf.name,
          aliases: savedName === parsed.synonymOf.name ? [] : [savedName],
        };
      }

      parsed = canonical;
    }

    return buildEnrichment(parsed, savedName);
  })().finally(() => {
    inFlight.delete(tagPath);
  });

  inFlight.set(tagPath, run);

  return run;
}
