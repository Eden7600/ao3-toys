import {
  buildKnownNames,
  scoreTagCommentary,
  shouldFadeTag,
  type TagFadingContext,
} from "@src/common/tag-fading";
import { describe, expect, it } from "vitest";

// Real tag set from a Project Hail Mary work — the motivating example for
// the commentary classifier.
const RELATIONSHIP_TAGS = [
  "Ryland Grace & Eva Stratt",
  "Ryland Grace & Rocky",
  "Ryland Grace & Olesya Ilyukhina & Yáo Li-Jie",
  "Ryland Grace & Olesya Ilyukhina & Rocky & Yáo Li-Jie",
];

const CHARACTER_TAGS = [
  "Ryland Grace",
  "Eva Stratt",
  "Carl (Project Hail Mary 2026)",
  "Yáo Li-Jie (Project Hail Mary)",
  "Olesya Ilyukhina",
  "Rocky (Project Hail Mary)",
  "Various Unnamed Ocs who are there for plot reasons",
  "and plot reasons ONLY",
];

const KNOWN_NAMES = buildKnownNames([...RELATIONSHIP_TAGS, ...CHARACTER_TAGS]);

const context: TagFadingContext = { knownNames: KNOWN_NAMES };

// Freeform tags from the sample work that carry real information
const INFORMATIVE_FREEFORMS = [
  "Team as Family",
  "Medical Inaccuracies",
  "Fluff",
  "Fluff and Humor",
  "Ryland Grace Is Not Graceful",
  "Ryland Grace Does Not Swear",
  "ISS | International Space Station",
  "Aromantic Asexual Ryland Grace",
  "Aromantic Asexual Eva Stratt",
  "Autistic Ryland Grace",
  "Autistic Eva Stratt",
  "Eva Stratt Needs a Hug",
  "Lesbian Olesya Ilyukhina",
  "Olesya Ilyukhina has ADHD",
];

// Freeform tags from the sample work that are the author talking
const COMMENTARY_FREEFORMS = [
  "i mean probably",
  "I don't know enough about medical accuracies so from that I'm assuming that there are inaccuracies",
  "But Maybe I have been accidentally Competent",
  "Name My OCs?",
  "Not in this Fandom!",
  "They might accidentally become important and thus get sent to space",
  "It's really better for them if they're one-dimensional",
  "and they don't have enough personality to care anyway",
  "I cannot stress enough how a lot of these happenings are probably just as innaccurate as the court room scene in the book",
  "but suspend your disbelief and enjoy the fic",
  "I mean there's an alien and he's literally a Rock so who cares?",
  "If the answer is 'you' then keep your mouth shut",
  "because the rest of us want to be as delusional as Lokken's crush on Ryland Grace",
  "No spoilers but she just might get one!",
  "she's an engineer this cannot POSSIBLY come as a surprise to you",
  "on that note",
  "probably statement",
];

describe("buildKnownNames", () => {
  it("splits relationship tags into participants", () => {
    expect(buildKnownNames(["Ryland Grace & Eva Stratt"])).toEqual([
      "Ryland Grace",
      "Eva Stratt",
    ]);
    expect(buildKnownNames(["Sherlock Holmes/John Watson"])).toEqual([
      "Sherlock Holmes",
      "John Watson",
    ]);
  });

  it("strips fandom discriminators and suffixes", () => {
    expect(buildKnownNames(["Rocky (Project Hail Mary)"])).toEqual(["Rocky"]);
    expect(
      buildKnownNames(["Sherlock Holmes & Related Fandoms - Fandom"]),
    ).toEqual(["Sherlock Holmes", "Related Fandoms"]);
  });

  it("splits wrangled aliases on the pipe", () => {
    expect(buildKnownNames(["Cale Henituse | Kim Rok Soo"])).toEqual([
      "Cale Henituse",
      "Kim Rok Soo",
    ]);
    expect(buildKnownNames(["Nagato | Pain (Naruto)"])).toEqual([
      "Nagato",
      "Pain",
    ]);
  });

  it("drops entries too long to be names", () => {
    expect(
      buildKnownNames(["Various Unnamed Ocs who are there for plot reasons"]),
    ).toEqual([]);
  });

  it("dedupes across tags", () => {
    const names = buildKnownNames(RELATIONSHIP_TAGS);

    expect(names.filter((name) => name === "Ryland Grace")).toHaveLength(1);
  });
});

describe("shouldFadeTag", () => {
  describe("on the sample work at balanced sensitivity", () => {
    it.each(INFORMATIVE_FREEFORMS)("keeps %j", (tag) => {
      expect(shouldFadeTag(tag, "balanced", context)).toBe(false);
    });

    it.each(COMMENTARY_FREEFORMS)("fades %j", (tag) => {
      expect(shouldFadeTag(tag, "balanced", context)).toBe(true);
    });

    it("fades the commentary character tags too", () => {
      expect(
        shouldFadeTag(
          "Various Unnamed Ocs who are there for plot reasons",
          "balanced",
          { ...context, tagType: "character" },
        ),
      ).toBe(true);
      expect(
        shouldFadeTag("and plot reasons ONLY", "balanced", {
          ...context,
          tagType: "character",
        }),
      ).toBe(true);
    });

    it("keeps real character and relationship tags", () => {
      expect(
        shouldFadeTag("Ryland Grace", "balanced", {
          ...context,
          tagType: "character",
        }),
      ).toBe(false);
      expect(
        shouldFadeTag("Ryland Grace & Eva Stratt", "balanced", {
          ...context,
          tagType: "relationship",
        }),
      ).toBe(false);
    });
  });

  describe("tag-type exemptions", () => {
    it("never fades warnings, however they are written", () => {
      expect(
        shouldFadeTag("no beta we die like men", "aggressive", {
          tagType: "warning",
        }),
      ).toBe(false);
    });

    it("never fades fandom tags", () => {
      expect(
        shouldFadeTag("the magnus archives and related fandoms", "aggressive", {
          tagType: "fandom",
        }),
      ).toBe(false);
    });
  });

  describe("known-name factor", () => {
    it("rescues lowercase tags that mention a character from the work", () => {
      const tag = "sephiroth is trying his best okay";

      expect(
        shouldFadeTag(tag, "balanced", { knownNames: ["Sephiroth"] }),
      ).toBe(false);
      expect(shouldFadeTag(tag, "balanced", { knownNames: [] })).toBe(true);
    });

    it("matches names on word boundaries only", () => {
      // "Rock" is not the known name "Rocky"
      const { factors } = scoreTagCommentary("he's literally a Rock", {
        knownNames: ["Rocky"],
      });

      expect(factors).not.toContain("known-name");
    });

    it("does not let a commentary tag vouch for itself", () => {
      const { factors } = scoreTagCommentary("and plot reasons ONLY", {
        knownNames: ["and plot reasons ONLY"],
      });

      expect(factors).not.toContain("known-name");
    });

    it("does not rescue commentary that merely name-drops", () => {
      expect(
        shouldFadeTag(
          "because the rest of us want to be as delusional as Lokken's crush on Ryland Grace",
          "balanced",
          context,
        ),
      ).toBe(true);
    });
  });

  describe("sensitivity levels", () => {
    it("fades blatant commentary at every level", () => {
      const tag = "no beta we die like men";

      expect(shouldFadeTag(tag, "conservative")).toBe(true);
      expect(shouldFadeTag(tag, "balanced")).toBe(true);
      expect(shouldFadeTag(tag, "aggressive")).toBe(true);
    });

    it("keeps borderline commentary at conservative", () => {
      const tag = "The Author Regrets Nothing And Will Not Be Taking Questions";

      expect(shouldFadeTag(tag, "conservative")).toBe(false);
      expect(shouldFadeTag(tag, "balanced")).toBe(true);
    });

    it("fades faint commentary only at aggressive", () => {
      const tag = "Why Did It Have To Be Bugs";

      expect(shouldFadeTag(tag, "balanced")).toBe(false);
      expect(shouldFadeTag(tag, "aggressive")).toBe(true);
    });
  });

  describe("expressive-punctuation factor", () => {
    it("fades ™ and tone-indicator tags", () => {
      expect(shouldFadeTag("One (1) Braincell™", "balanced")).toBe(true);
      expect(shouldFadeTag("That Was A Joke /j", "balanced")).toBe(true);
    });

    it("counts doubled punctuation, ellipses, and emoticons", () => {
      expect(scoreTagCommentary("Fluff and Angst!!").factors).toContain(
        "expressive-punctuation",
      );
      expect(scoreTagCommentary("and then... well").factors).toContain(
        "expressive-punctuation",
      );
      expect(scoreTagCommentary("happy ending i promise :)").factors).toContain(
        "expressive-punctuation",
      );
    });

    it("ignores ordinary single punctuation", () => {
      expect(scoreTagCommentary("Hurt/Comfort").factors).not.toContain(
        "expressive-punctuation",
      );
    });
  });

  describe("meta-reference factor", () => {
    it("fades tags about the fic's apparatus", () => {
      expect(shouldFadeTag("title from a hozier song", "balanced")).toBe(true);
      expect(shouldFadeTag("smut in chapter 3", "balanced")).toBe(true);
    });

    it("recognizes tag-list housekeeping", () => {
      expect(
        scoreTagCommentary("Other Additional Tags to Be Added").factors,
      ).toContain("meta-reference");
    });
  });

  describe("canonical-template factor", () => {
    it.each([
      "Angst - Freeform",
      "Alternate Universe - Coffee Shops & Cafés",
      "Minor Character Death",
      "Implied/Referenced Self-Harm",
      "Canon-Typical Violence",
      "Mentioned Uzumaki Naruto",
    ])("credits %j as wrangler-shaped", (tag) => {
      expect(scoreTagCommentary(tag).factors).toContain("canonical-template");
      expect(shouldFadeTag(tag, "balanced")).toBe(false);
    });
  });

  describe("conversation-momentum factor", () => {
    it("nudges a borderline tag over the line after a faded one", () => {
      const tag = "Naruto world is called Shinobi 3";

      expect(shouldFadeTag(tag, "balanced")).toBe(false);
      expect(shouldFadeTag(tag, "balanced", { previousFaded: true })).toBe(
        true,
      );
    });

    it("cannot fade a clearly informative tag on its own", () => {
      expect(
        shouldFadeTag("Slow Burn", "balanced", { previousFaded: true }),
      ).toBe(false);
    });
  });

  describe("page-repetition factor", () => {
    it("rescues a borderline tag that appears on multiple works", () => {
      const tag = "information on the Hunters plan from Boruto";

      expect(shouldFadeTag(tag, "balanced")).toBe(true);
      expect(shouldFadeTag(tag, "balanced", { repeatedOnPage: true })).toBe(
        false,
      );
    });
  });

  describe("length factor", () => {
    it("is neutral for short and medium tags", () => {
      expect(scoreTagCommentary("Slow Burn").factors).not.toContain("length");
      expect(
        scoreTagCommentary("Alternate Universe - Canon Divergence").factors,
      ).not.toContain("length");
    });

    it("counts many words as commentary evidence", () => {
      expect(
        scoreTagCommentary("Set between Central Plains arc and Aipotu").factors,
      ).toContain("length");
    });

    it("counts many characters even with few words", () => {
      expect(
        scoreTagCommentary(
          "unrepentant absolutely shameless self-indulgent nonsense",
        ).factors,
      ).toContain("length");
    });

    it("fades keysmash and scream tags", () => {
      expect(shouldFadeTag("SKDJFHSKDJFHSKDJFHSD", "balanced")).toBe(true);
      expect(shouldFadeTag("AAAAAAAAAAAAAAAAAAAH", "balanced")).toBe(true);
    });
  });

  describe("canonical-pipe factor", () => {
    it("treats a pipe as a wrangled-canonical marker even without spaces", () => {
      expect(
        scoreTagCommentary("ISS|International Space Station").factors,
      ).toContain("canonical-pipe");
    });

    it("keeps piped alias tags", () => {
      expect(
        shouldFadeTag("The Convict | Simon (Iron Lung)", "balanced", {
          tagType: "character",
        }),
      ).toBe(false);
      expect(
        shouldFadeTag("ISS | International Space Station", "balanced"),
      ).toBe(false);
    });
  });

  describe("shouty-caps factor", () => {
    it("counts emphasis caps as commentary", () => {
      const { factors } = scoreTagCommentary("and plot reasons ONLY");

      expect(factors).toContain("shouty-caps");
    });

    it("fades all-caps meme tags", () => {
      expect(shouldFadeTag("AND THEY WERE ROOMMATES", "balanced")).toBe(true);
      expect(shouldFadeTag("READ THE TAGS PLEASE", "balanced")).toBe(true);
    });

    it("denies all-caps tags the Title Case credit", () => {
      const { factors } = scoreTagCommentary("READ THE TAGS PLEASE");

      expect(factors).not.toContain("title-case");
    });

    it("does not count acronyms as shouting", () => {
      expect(
        scoreTagCommentary("Olesya Ilyukhina has ADHD").factors,
      ).not.toContain("shouty-caps");
      expect(scoreTagCommentary("BAMF Eva Stratt").factors).not.toContain(
        "shouty-caps",
      );
      // No vowels — can't be a shouted word
      expect(
        scoreTagCommentary("Porn Without Plot | PWP").factors,
      ).not.toContain("shouty-caps");
    });

    it("keeps acronym-bearing informative tags", () => {
      expect(shouldFadeTag("BAMF Eva Stratt", "balanced")).toBe(false);
      expect(
        shouldFadeTag(
          "Attention Deficit Hyperactivity Disorder - ADHD",
          "balanced",
        ),
      ).toBe(false);
    });
  });

  describe("common real-world freeforms stay untouched", () => {
    it.each([
      "Slow Burn",
      "Enemies to Lovers (eventual)",
      "Case Fic",
      "Hurt/Comfort",
      "Angst with a Happy Ending",
      "Alternate Universe - Canon Divergence",
      "Post-Traumatic Stress Disorder - PTSD",
      "Implied/Referenced Self-Harm",
      "5+1 Things",
      "POV Second Person",
    ])("keeps %j at balanced", (tag) => {
      expect(shouldFadeTag(tag, "balanced")).toBe(false);
    });
  });

  it("keeps tags without letters and empty tags", () => {
    expect(shouldFadeTag("5+1", "aggressive")).toBe(false);
    expect(shouldFadeTag("", "aggressive")).toBe(false);
  });
});
