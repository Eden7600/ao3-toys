import { messaging } from "@src/common/messaging";
import { buildEnrichment, mergeEnrichedTag } from "@src/common/tag-enrichment";
import {
  parseTagPage,
  synonymNames,
  type ParsedTagPage,
} from "@src/common/tag-page";
import { ContentScript } from "../content-script";

/**
 * Runs on every tag page. Two jobs:
 * 1. Report the parsed page to the background so a pending background-tab
 *    enrichment (Cloudflare fallback tier) can complete and close its tab.
 * 2. Passive enrichment: complete stored alias-less CommonTag rows whose
 *    name matches this canonical tag or any of its synonyms.
 */
export default class TagPageReporter extends ContentScript {
  getEnabled(): boolean {
    if (!this.settings.enableTagHighlighter) {
      return false;
    }

    return /\/tags\/.+(?<!\/works)$/.test(window.location.pathname);
  }

  async onPostProcess(): Promise<void> {
    const parsed = parseTagPage(document);

    if (!parsed) {
      return;
    }

    try {
      await messaging.sendMessage("reportTagPageParse", parsed);
    } catch (error) {
      this.logger.error("Failed to report tag page parse:", error);
    }

    if (parsed.canonical) {
      await this.completeAliasLessRows(parsed);
    }
  }

  private async completeAliasLessRows(parsed: ParsedTagPage): Promise<void> {
    const names = [parsed.name, ...synonymNames(parsed)];
    const processedIds = new Set<number>();

    for (const name of names) {
      // eslint-disable-next-line no-await-in-loop
      await this.completeRow(name, parsed, processedIds);
    }
  }

  private async completeRow(
    name: string,
    parsed: ParsedTagPage,
    processedIds: Set<number>,
  ): Promise<void> {
    const row = await messaging.sendMessage("fetchCommonTag", name);

    if (!row || row.aliases !== undefined) {
      return;
    }

    if (row.id !== undefined && processedIds.has(row.id)) {
      return;
    }

    const enrichment = buildEnrichment(parsed, row.name);
    const existingCanonical =
      enrichment.canonicalName === row.name
        ? undefined
        : await messaging.sendMessage(
            "fetchCommonTag",
            enrichment.canonicalName,
          );

    const { upsert, deleteName } = mergeEnrichedTag(
      row,
      existingCanonical,
      enrichment,
    );

    if (deleteName) {
      await messaging.sendMessage("deleteCommonTag", deleteName);
    }

    upsert.id = await messaging.sendMessage("upsertCommonTag", upsert);
    processedIds.add(upsert.id);

    this.logger.log("Passively enriched tag", row.name, "→", upsert.name);
  }
}
