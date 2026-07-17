import { db } from "@src/common/db/Database";
import { Logger } from "@src/common/logger";
import type { RegexTag } from "@src/common/models/RegexTag";

const logger = new Logger("BG-RegexTag");

export type RegexTagResponse = {
  original: string;
  regexName: string;
  color: string | null;
  hideWork: boolean;
  hideTag: boolean;
};

export class RegexTagHandler {
  // Cache compiled regex patterns to avoid recompilation
  private compiledRegexCache = new Map<number, RegExp>();

  async fetchRegexTag(name: string): Promise<RegexTag | null> {
    logger.log("Fetching regex tag:", name);

    const result = await db.regexTags.where({ name }).first();

    return result ?? null;
  }

  async upsertRegexTag(tag: RegexTag): Promise<number> {
    logger.log("Upserting regex tag:", tag);
    const now = new Date();

    // Create a new object with only the properties we want to store
    const sanitizedTag: RegexTag = {
      id: tag.id,
      name: tag.name,
      regex: tag.regex,
      color: tag.color,
      hideWork: tag.hideWork,
      hideTag: tag.hideTag,
      caseInsensitive: tag.caseInsensitive ?? false,
      updated_at: now,
      created_at: tag.id ? tag.created_at : now,
    };

    if (!sanitizedTag.id) {
      const newId = await db.regexTags.add(sanitizedTag);
      // Clear cache when tags are modified
      this.compiledRegexCache.clear();

      return newId;
    }

    await db.regexTags.update(sanitizedTag.id, sanitizedTag);
    // Clear cache when tags are modified
    this.compiledRegexCache.clear();

    return sanitizedTag.id;
  }

  async deleteRegexTag(name: string): Promise<void> {
    logger.log("Deleting regex tag:", name);
    await db.regexTags.where({ name }).delete();
    // Clear cache when tags are modified
    this.compiledRegexCache.clear();
  }

  async processPageTags(tags: string[]): Promise<RegexTagResponse[]> {
    logger.time("Finished processing regex tags in");

    const regexTags = await db.regexTags.toArray();

    // Pre-compile all regex patterns once
    const compiledPatterns: Array<{
      id: number;
      regex: RegExp;
      name: string;
      color: string | null;
      hideWork: boolean;
      hideTag: boolean;
    }> = [];

    for (const regexTag of regexTags) {
      try {
        if (!regexTag.id) {
          continue;
        }

        // Use cache or compile new regex
        let regex = this.compiledRegexCache.get(regexTag.id);

        if (!regex) {
          // Apply case-insensitive flag if specified
          const flags = regexTag.caseInsensitive ? "i" : "";
          regex = new RegExp(regexTag.regex, flags);
          this.compiledRegexCache.set(regexTag.id, regex);
        }

        compiledPatterns.push({
          id: regexTag.id,
          regex,
          name: regexTag.name,
          color: regexTag.color,
          hideWork: regexTag.hideWork,
          hideTag: regexTag.hideTag,
        });
      } catch (error) {
        logger.error(
          `Invalid regex pattern for "${regexTag.name}": ${regexTag.regex}`,
          error,
        );
      }
    }

    // Use a Map to track matches by tag (prevents duplicates and enables fast lookup)
    const matchesMap = new Map<string, RegexTagResponse>();

    for (const tag of tags) {
      // Test against each compiled pattern
      for (const pattern of compiledPatterns) {
        if (pattern.regex.test(tag)) {
          // Only store first match per tag (or update if you want last match to win)
          if (!matchesMap.has(tag)) {
            matchesMap.set(tag, {
              original: tag,
              regexName: pattern.name,
              color: pattern.color,
              hideWork: pattern.hideWork,
              hideTag: pattern.hideTag,
            });
            break; // Early exit after first match - remove if you want to test all patterns
          }
        }
      }
    }

    const matches = Array.from(matchesMap.values());

    logger.timeEnd("Finished processing regex tags in");
    logger.log(`Matched ${String(matches.length)} regex tags`);

    return matches;
  }
}
