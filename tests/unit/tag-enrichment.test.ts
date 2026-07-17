import type { CommonTag } from "@src/common/models/CommonTag";
import {
  buildEnrichment,
  classifyTagPageResponse,
  looksLikeChallengeBody,
  mergeEnrichedTag,
} from "@src/common/tag-enrichment";
import type { ParsedTagPage } from "@src/common/tag-page";
import { TagType } from "@src/types/tags";
import { describe, expect, it } from "vitest";

const canonicalPage = (name: string, synonyms: string[]): ParsedTagPage => ({
  name,
  type: TagType.FREEFORM,
  canonical: true,
  synonymOf: null,
  synonyms: synonyms.map((synonym) => ({
    name: synonym,
    url: `/tags/${synonym}`,
    type: TagType.FREEFORM,
  })),
  parents: [],
  children: [],
  metas: [],
});

const row = (overrides: Partial<CommonTag>): CommonTag => ({
  id: undefined,
  name: "tag",
  color: "red",
  hideWork: false,
  hideTag: false,
  ...overrides,
});

describe("classifyTagPageResponse", () => {
  it("accepts parsed 200s", () => {
    expect(
      classifyTagPageResponse({
        status: 200,
        cfMitigated: null,
        parsed: true,
        body: "<html>...</html>",
      }),
    ).toBe("ok");
  });

  it("classifies 403 and 503 as challenges", () => {
    for (const status of [403, 503]) {
      expect(
        classifyTagPageResponse({
          status,
          cfMitigated: null,
          parsed: false,
          body: "",
        }),
      ).toBe("challenge");
    }
  });

  it("classifies cf-mitigated responses as challenges regardless of status", () => {
    expect(
      classifyTagPageResponse({
        status: 200,
        cfMitigated: "challenge",
        parsed: false,
        body: "",
      }),
    ).toBe("challenge");
  });

  it("classifies 429 and other errors as transient", () => {
    expect(
      classifyTagPageResponse({
        status: 429,
        cfMitigated: null,
        parsed: false,
        body: "",
      }),
    ).toBe("transient");
    expect(
      classifyTagPageResponse({
        status: 500,
        cfMitigated: null,
        parsed: false,
        body: "",
      }),
    ).toBe("transient");
  });

  it("classifies unparseable 200s by body content", () => {
    expect(
      classifyTagPageResponse({
        status: 200,
        cfMitigated: null,
        parsed: false,
        body: "<title>Just a moment...</title>",
      }),
    ).toBe("challenge");
    expect(
      classifyTagPageResponse({
        status: 200,
        cfMitigated: null,
        parsed: false,
        body: "<html>some other page</html>",
      }),
    ).toBe("transient");
  });

  it("recognizes challenge markers", () => {
    expect(looksLikeChallengeBody("cf-chl-widget")).toBe(true);
    expect(looksLikeChallengeBody("challenge-platform script")).toBe(true);
    expect(looksLikeChallengeBody("a perfectly normal page")).toBe(false);
  });
});

describe("buildEnrichment", () => {
  it("collects synonyms and keeps the saved name as an alias", () => {
    const enrichment = buildEnrichment(
      canonicalPage("Hurt/Comfort", ["HurtComfort", "H/C"]),
      "HurtComfort",
    );

    expect(enrichment.canonicalName).toBe("Hurt/Comfort");
    expect(enrichment.aliases.sort()).toEqual(["H/C", "HurtComfort"]);
  });

  it("does not alias the canonical name to itself", () => {
    const enrichment = buildEnrichment(
      canonicalPage("Hurt/Comfort", ["HurtComfort"]),
      "Hurt/Comfort",
    );

    expect(enrichment.aliases).toEqual(["HurtComfort"]);
  });
});

describe("mergeEnrichedTag", () => {
  it("re-keys a synonym-saved row to the canonical name in place", () => {
    const saved = row({ id: 7, name: "HurtComfort", color: "blue" });

    const { upsert, deleteName } = mergeEnrichedTag(saved, undefined, {
      canonicalName: "Hurt/Comfort",
      aliases: ["HurtComfort", "H/C"],
    });

    expect(deleteName).toBeNull();
    expect(upsert.id).toBe(7);
    expect(upsert.name).toBe("Hurt/Comfort");
    expect(upsert.color).toBe("blue");
    expect(upsert.aliases?.sort()).toEqual(["H/C", "HurtComfort"]);
  });

  it("absorbs into an existing canonical row and deletes the synonym row", () => {
    const saved = row({ id: 9, name: "HurtComfort", color: "green" });
    const existingCanonical = row({
      id: 3,
      name: "Hurt/Comfort",
      color: "red",
      hideWork: true,
    });

    const { upsert, deleteName } = mergeEnrichedTag(saved, existingCanonical, {
      canonicalName: "Hurt/Comfort",
      aliases: ["HurtComfort"],
    });

    expect(deleteName).toBe("HurtComfort");
    expect(upsert.id).toBe(3);
    expect(upsert.name).toBe("Hurt/Comfort");
    // The user's fresh choices win over the old canonical row's
    expect(upsert.color).toBe("green");
    expect(upsert.hideWork).toBe(false);
    expect(upsert.aliases).toEqual(["HurtComfort"]);
  });

  it("never lists the canonical name among the aliases", () => {
    const saved = row({ id: 1, name: "Hurt/Comfort" });

    const { upsert } = mergeEnrichedTag(saved, undefined, {
      canonicalName: "Hurt/Comfort",
      aliases: ["Hurt/Comfort", "H/C", "H/C"],
    });

    expect(upsert.aliases).toEqual(["H/C"]);
  });
});
