import { db } from "@src/common/db/Database";
import { Logger } from "@src/common/logger";
import type { CommonTag } from "@src/common/models/CommonTag";

const logger = new Logger("BG-CommonTag");

export type CommonTagResponse = {
  original: string;
  realName: string;
  color: string | null;
  hideWork: boolean;
  hideTag: boolean;
};

export class CommonTagHandler {
  async fetchCommonTag(name: string): Promise<CommonTag | undefined> {
    logger.log("Fetching common tag:", name);

    return db.commonTags.where({ name }).first();
  }

  async upsertCommonTag(tag: CommonTag): Promise<number> {
    logger.log("Upserting common tag:", tag);
    const now = new Date();
    tag.updated_at = now;

    if (!tag.id) {
      tag.created_at = now;

      return db.commonTags.add(tag);
    }

    await db.commonTags.update(tag.id, tag);

    return tag.id;
  }

  async deleteCommonTag(name: string): Promise<void> {
    logger.log("Deleting common tag:", name);
    await db.commonTags.where({ name }).delete();
  }

  async processPageTags(pageTags: string[]): Promise<CommonTagResponse[]> {
    logger.time("Finished processing page tags in");

    const commonTags = await db.commonTags.toArray();
    const commonTagsMap = new Map<string, CommonTag>();

    commonTags.forEach((commonTag) => {
      commonTagsMap.set(commonTag.name, commonTag);

      if (commonTag.aliases) {
        commonTag.aliases.forEach((alias) => {
          commonTagsMap.set(alias, commonTag);
        });
      }
    });

    const matchesMap = new Map<
      string,
      {
        name: string;
        color: string | null;
        hideWork: boolean;
        hideTag: boolean;
      }
    >();

    pageTags.forEach((tag) => {
      const commonTag = commonTagsMap.get(tag);

      if (commonTag) {
        const { name, color, hideWork, hideTag } = commonTag;

        if (!matchesMap.has(name)) {
          matchesMap.set(tag, { name, color, hideWork, hideTag });
        }
      }
    });

    const matchedTags: CommonTagResponse[] = Array.from(
      matchesMap,
      ([original, { name, color, hideWork, hideTag }]) => ({
        original,
        realName: name,
        color,
        hideWork,
        hideTag,
      }),
    );

    logger.timeEnd("Finished processing page tags in");
    logger.log("Matched tags:", matchedTags);

    return matchedTags;
  }
}
