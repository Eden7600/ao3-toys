import type { CommonTagResponse } from "@src/background/handlers/common-tag-handler";
import type { RegexTagResponse } from "@src/background/handlers/regex-tag-handler";
import { defineExtensionMessaging } from "@webext-core/messaging";
import type { CommonTag } from "./models/CommonTag";
import type { RegexTag } from "./models/RegexTag";
import type { Subscription } from "./models/Subscription";
import type { ReadingPosition } from "./reading-position";
import type { ParsedTagPage } from "./tag-page";
import type { WorkStatus, WorkStatusMap } from "./work-status";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface ProtocolMap {
  fetchCommonTag(input: string): Promise<CommonTag | undefined>;
  upsertCommonTag(input: CommonTag): Promise<number>;
  deleteCommonTag(input: string): Promise<void>;
  processCommonTags(input: string[]): Promise<CommonTagResponse[]>;

  // Tag enrichment (Cloudflare-challenge fallback tier)
  enrichTagViaTab(input: string): Promise<ParsedTagPage | null>;
  reportTagPageParse(input: ParsedTagPage): Promise<void>;

  // Regex Tag Operations
  fetchRegexTag(input: string): Promise<RegexTag | null>;
  upsertRegexTag(input: RegexTag): Promise<number>;
  deleteRegexTag(input: string): Promise<void>;
  processRegexTags(input: string[]): Promise<RegexTagResponse[]>;

  // Local work status (local mode only — server mode talks to the API)
  getLocalWorkStatuses(input: string[]): Promise<WorkStatusMap>;
  recordLocalVisit(input: {
    workId: string;
    chapter: number | null;
    subscribed?: boolean;
  }): Promise<WorkStatus>;
  setLocalSubscribed(input: {
    workId: string;
    subscribed: boolean;
  }): Promise<WorkStatus>;
  setLocalIgnored(input: {
    workId: string;
    ignored: boolean;
  }): Promise<WorkStatus>;
  resetLocalHighestChapter(input: {
    workId: string;
    chapter: number;
  }): Promise<WorkStatus>;
  setLocalReadingPosition(input: {
    workId: string;
    position: ReadingPosition;
  }): Promise<WorkStatus>;

  // Subscription Operations
  checkSubscriptionIds(input: number[]): Promise<Subscription[]>;
  scrapePageForSubscriptions(input: Subscription[]): Promise<void>;
  addSingleSubscription(input: Subscription): Promise<void>;
  removeSingleSubscription(input: number): Promise<void>;
  fetchAllSubscriptions(): Promise<Subscription[]>;
}

export const messaging = defineExtensionMessaging<ProtocolMap>();
