import { messaging } from "@src/common/messaging";
import { CommonTagHandler } from "./handlers/common-tag-handler";
import { RegexTagHandler } from "./handlers/regex-tag-handler";
import { SubscriptionHandler } from "./handlers/subscription-handler";
import { TagEnrichmentHandler } from "./handlers/tag-enrichment-handler";
import { WorkStatusHandler } from "./handlers/work-status-handler";

const commonTagHandler = new CommonTagHandler();
const regexTagHandler = new RegexTagHandler();
const subscriptionHandler = new SubscriptionHandler();
const tagEnrichmentHandler = new TagEnrichmentHandler();
const workStatusHandler = new WorkStatusHandler();

// Local work status (local mode only)
messaging.onMessage("getLocalWorkStatuses", async (message) => {
  return workStatusHandler.getStatuses(message.data);
});

messaging.onMessage("recordLocalVisit", async (message) => {
  return workStatusHandler.recordVisit(message.data);
});

messaging.onMessage("setLocalSubscribed", async (message) => {
  return workStatusHandler.setSubscribed(message.data);
});

messaging.onMessage("setLocalIgnored", async (message) => {
  return workStatusHandler.setIgnored(message.data);
});

messaging.onMessage("resetLocalHighestChapter", async (message) => {
  return workStatusHandler.resetHighestChapter(message.data);
});

messaging.onMessage("setLocalReadingPosition", async (message) => {
  return workStatusHandler.setReadingPosition(message.data);
});

// Common Tag Handlers
messaging.onMessage("fetchCommonTag", async (message) => {
  return commonTagHandler.fetchCommonTag(message.data);
});

messaging.onMessage("upsertCommonTag", async (message) => {
  return commonTagHandler.upsertCommonTag(message.data);
});

messaging.onMessage("deleteCommonTag", async (message) => {
  return commonTagHandler.deleteCommonTag(message.data);
});

messaging.onMessage("processCommonTags", async (message) => {
  return commonTagHandler.processPageTags(message.data);
});

// Tag Enrichment Handlers
messaging.onMessage("enrichTagViaTab", async (message) => {
  return tagEnrichmentHandler.enrichViaTab(message.data);
});

messaging.onMessage("reportTagPageParse", async (message) => {
  // @webext-core/messaging's sender type resolves against the absent
  // webextension-polyfill types; narrow it to the piece we use.
  const sender = message.sender as unknown as { tab?: { id?: number } };
  tagEnrichmentHandler.reportParse(sender.tab?.id, message.data);
});

// Regex Tag Handlers
messaging.onMessage("fetchRegexTag", async (message) => {
  return regexTagHandler.fetchRegexTag(message.data);
});

messaging.onMessage("upsertRegexTag", async (message) => {
  return regexTagHandler.upsertRegexTag(message.data);
});

messaging.onMessage("deleteRegexTag", async (message) => {
  return regexTagHandler.deleteRegexTag(message.data);
});

messaging.onMessage("processRegexTags", async (message) => {
  return regexTagHandler.processPageTags(message.data);
});

// Subscription Handlers
messaging.onMessage("checkSubscriptionIds", async (message) => {
  return subscriptionHandler.checkIdsAgainstSubscriptions(message.data);
});

messaging.onMessage("scrapePageForSubscriptions", async (message) => {
  return subscriptionHandler.scrapeSubscriptionsPage(message.data);
});

messaging.onMessage("addSingleSubscription", async (message) => {
  return subscriptionHandler.addSingleSubscription(message.data);
});

messaging.onMessage("removeSingleSubscription", async (message) => {
  return subscriptionHandler.removeSingleSubscription(message.data);
});

messaging.onMessage("fetchAllSubscriptions", async () => {
  return subscriptionHandler.fetchAllSubscriptions();
});
