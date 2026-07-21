/**
 * Commentary-tag classifier.
 *
 * AO3 tag lists mix informative tags ("Fluff", "Slow Burn", "Autistic Eva
 * Stratt") with author commentary written as if the tag box were a
 * conversation ("i mean probably", "but suspend your disbelief and enjoy
 * the fic"). Each tag is scored by commentary factors (positive points)
 * and informative factors (negative points); tags whose total clears the
 * sensitivity threshold get faded.
 *
 * Shared by the clean-tags content script and the options-page blurb
 * preview so the two can't drift.
 */

export type FadeSensitivity = "conservative" | "balanced" | "aggressive";

export type TagType =
  | "warning"
  | "fandom"
  | "relationship"
  | "character"
  | "freeform";

export type TagFadingContext = {
  tagType?: TagType;
  // Character/ship/fandom names scraped from the same work's tags. A tag
  // mentioning one ("Eva Stratt Needs a Hug", "Olesya Ilyukhina has ADHD")
  // is usually describing the work, not the author talking.
  knownNames?: readonly string[];
  // Whether the preceding tag of the same type in the same list faded —
  // commentary runs on across tags in sentence fragments.
  previousFaded?: boolean;
  // Whether this tag also appears on other works on the current page —
  // repeated tags are curated; commentary is unique to its work.
  repeatedOnPage?: boolean;
};

export const FADED_TAG_CLASS = "toybox-tag-faded";

// Shared by the clean-tags content script and the options-page blurb
// preview so the faded look can't drift between them.
export const FADED_TAG_CSS = `.${FADED_TAG_CLASS} { opacity: 0.55; }`;

// Fade when the commentary score reaches the threshold
const SENSITIVITY_THRESHOLDS: Record<FadeSensitivity, number> = {
  conservative: 4,
  balanced: 2,
  aggressive: 1,
};

// Words that are conventionally lowercase inside Title Case tags, so their
// casing carries no signal either way
const TITLE_STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "of",
  "to",
  "in",
  "on",
  "at",
  "by",
  "for",
  "with",
  "from",
  "as",
  "and",
  "or",
  "nor",
  "vs",
]);

const FIRST_PERSON = new Set([
  "i",
  "i'm",
  "i've",
  "i'll",
  "i'd",
  "me",
  "my",
  "mine",
  "we",
  "we're",
  "we've",
  "we'll",
  "us",
  "our",
  "ours",
]);

const SECOND_PERSON = new Set([
  "you",
  "you're",
  "you've",
  "you'll",
  "your",
  "yours",
  "y'all",
  "yourself",
]);

// A tag starting mid-sentence is a continuation of the previous tag
const LEADING_CONJUNCTIONS = new Set([
  "and",
  "but",
  "or",
  "so",
  "also",
  "because",
  "if",
  "unless",
  "except",
  "anyway",
  "then",
]);

// A tag phrased as a question is addressed at the reader
const QUESTION_STARTERS = new Set([
  "am",
  "are",
  "can",
  "could",
  "did",
  "do",
  "does",
  "how",
  "is",
  "should",
  "was",
  "were",
  "what",
  "when",
  "where",
  "who",
  "why",
  "will",
  "would",
]);

// Acronyms that legitimately appear in caps inside curated tags, so they
// don't count as shouting (matched on letters only, lowercase)
const CAPS_ACRONYMS = new Set([
  "ptsd",
  "adhd",
  "add",
  "ocd",
  "did",
  "bpd",
  "pov",
  "aus",
  "ocs",
  "abo",
  "iss",
  "nasa",
  "nsfw",
  "sfw",
  "wip",
  "bamf",
  "ust",
  "tlc",
  "lgbt",
  "lgbtq",
  "lgbtqia",
  "ace",
  "aro",
  "poc",
  "cpr",
  "dna",
  "ceo",
  "fbi",
  "cia",
  "usa",
  "afab",
  "amab",
  "mtf",
  "ftm",
  "hrt",
  "rpf",
  "irl",
  "asl",
  "bdsm",
  "ooc",
  "mcu",
]);

// Pronoun+verb contractions read as prose, not tag vocabulary
const SENTENCE_CONTRACTIONS = new Set([
  "it's",
  "that's",
  "there's",
  "he's",
  "she's",
  "what's",
  "who's",
  "let's",
  "here's",
]);

// Phrases that are nearly always the author talking. Matched against the
// tag's normalized lowercase tokens, so they must be written lowercase
// with plain apostrophes.
const STRONG_COMMENTARY_PHRASES = [
  "no beta",
  "beta read",
  "we die like",
  "author",
  "wrote this",
  "why did i write",
  "i'm sorry",
  "im sorry",
  "not sorry",
  "don't judge",
  "dont judge",
  "no spoilers",
];

// Phrases that lean commentary but appear in some real tags too
const WEAK_COMMENTARY_PHRASES = [
  "probably",
  "maybe",
  "i mean",
  "i guess",
  "kind of",
  "sort of",
  "kinda",
  "sorta",
  "or something",
  "or not",
  "who knows",
  "who cares",
  "on that note",
  "oops",
  "whoops",
  "idk",
  "lol",
  "lmao",
  "okay",
  "trust me",
  "just in case",
  "to be safe",
  "no thoughts",
  "we'll see",
  "as a treat",
];

// Tone indicators are the author annotating their own delivery
const TONE_INDICATORS = new Set([
  "/j",
  "/hj",
  "/s",
  "/srs",
  "/lh",
  "/gen",
  "/pos",
  "/neg",
  "/nm",
  "/ref",
]);

// Compared against raw whitespace-split words, lowercased
const EMOTICONS = new Set([
  ":)",
  ":(",
  ":d",
  ":3",
  ":p",
  ":o",
  ";)",
  ";(",
  ":')",
  ":'(",
  "<3",
  "^^",
  "xd",
  "t_t",
  "-_-",
  "._.",
  "uwu",
  "owo",
]);

// The author talking about the fic's apparatus (notes, tags, chapters,
// title) rather than its content
const META_REFERENCE_PHRASES = [
  "see notes",
  "see the notes",
  "read the notes",
  "in the notes",
  "end notes",
  "tags to be added",
  "tags to come",
  "tags may change",
  "tags will be added",
  "tags will change",
  "title from",
  "rated for",
  "don't like don't read",
  "dont like dont read",
];

// Wrangler vocabulary is heavily templated; matching one of these shapes
// is strong evidence the tag is curated. Tested on the original
// (pre-cleaning) text so "- Freeform" still counts.
const CANONICAL_TEMPLATES: readonly RegExp[] = [
  /^alternate universe\b/i,
  /^pov /i,
  /^implied\/referenced /i,
  /^minor /i,
  /^past /i,
  /^background /i,
  /^canon-typical /i,
  /^post-canon\b/i,
  /^pre-canon\b/i,
  /^mentioned /i,
  /^referenced /i,
  /^original /i,
  /^inspired by /i,
  /- freeform$/i,
];

export type TagCommentaryAssessment = {
  score: number;
  // Names of the factors that fired, for tests and debugging
  factors: string[];
};

// Pre-parsed tag text the factor evaluators share
type TagTextView = {
  text: string;
  rawWords: string[];
  tokens: string[];
  lowerTokens: string[];
  // Words whose casing is meaningful for the Title Case judgement
  significant: string[];
  knownNames: readonly string[];
  previousFaded: boolean;
  repeatedOnPage: boolean;
};

function startsWithLowercase(word: string): boolean {
  const letter = /\p{L}/u.exec(word)?.[0];

  return letter !== undefined && /\p{Ll}/u.test(letter);
}

// Words shouted in all caps for emphasis ("ONLY", "POSSIBLY"). Legit
// acronyms are excluded by the vowel requirement (PTSD, PWP) or the
// allowlist (ADHD, BAMF); both are best-effort.
function isShoutedWord(token: string): boolean {
  const letters = token.replace(/'/g, "");

  return (
    /^\p{Lu}{3,}$/u.test(letters) &&
    /[AEIOUY]/.test(letters) &&
    !CAPS_ACRONYMS.has(letters.toLowerCase())
  );
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsKnownName(
  text: string,
  knownNames: readonly string[],
): boolean {
  return knownNames.some((name) => {
    if (name.length < 3) {
      return false;
    }

    // A tag can't vouch for itself — otherwise a commentary character tag
    // in the known-name list would rescue its own entry
    if (name.toLowerCase() === text.toLowerCase()) {
      return false;
    }

    const pattern = new RegExp(
      `(?<!\\p{L})${escapeRegExp(name)}(?!\\p{L})`,
      "iu",
    );

    return pattern.test(text);
  });
}

/**
 * Extracts plausible names from a work's relationship, character, and
 * fandom tags for use as TagFadingContext.knownNames. Relationship tags
 * are split into their participants; fandom discriminators and "- Fandom"
 * suffixes are stripped. Entries longer than a plausible name (commentary
 * masquerading as a character tag) are dropped.
 */
export function buildKnownNames(nameTags: readonly string[]): string[] {
  const names = new Set<string>();

  for (const tag of nameTags) {
    const stripped = tag
      .replace(/\([^)]*\)/g, " ")
      .replace(/\s*- Fandom\s*$/, "");

    // "/" joins romantic participants, "&" platonic ones, and "|" a
    // wrangled alias to its canonical name ("Cale Henituse | Kim Rok Soo")
    // — every side is a name in its own right
    for (const part of stripped.split(/[/&,|]/)) {
      const candidate = part.trim();

      if (
        candidate.length >= 3 &&
        candidate.split(/\s+/).length <= 4 &&
        /\p{L}/u.test(candidate)
      ) {
        names.add(candidate);
      }
    }
  }

  return [...names];
}

function phrasePoints(view: TagTextView): number {
  const padded = ` ${view.lowerTokens.join(" ")} `;

  if (STRONG_COMMENTARY_PHRASES.some((p) => padded.includes(` ${p} `))) {
    return 2;
  }

  return WEAK_COMMENTARY_PHRASES.some((p) => padded.includes(` ${p} `)) ? 1 : 0;
}

// Long tags are commentary evidence; medium and short tags are neutral
// (there is deliberately no informative credit for being short). Length is
// measured three ways: word count, total characters, and the longest
// unbroken character run (keysmashes and screaming).
function lengthPoints({ rawWords, text, tokens }: TagTextView): number {
  let points = 0;

  if (rawWords.length >= 7 || text.length >= 50) {
    points = 1;
  }

  if (rawWords.length >= 11 || text.length >= 70) {
    points = 2;
  }

  if (tokens.some((token) => token.length >= 18)) {
    points = 2;
  }

  return points;
}

// ™, tone indicators, ellipses, doubled punctuation, and emoticons
// essentially never appear in wrangled tags. ™ and tone indicators are
// unambiguous, the rest merely very strong.
function expressivePoints({ text, rawWords }: TagTextView): number {
  const rawLower = rawWords.map((word) => word.toLowerCase());

  if (
    text.includes("™") ||
    rawLower.some((word) => TONE_INDICATORS.has(word))
  ) {
    return 3;
  }

  if (/\.\.\.|…|[!?]{2,}/.test(text)) {
    return 2;
  }

  return rawLower.some((word) => EMOTICONS.has(word)) ? 2 : 0;
}

function metaReferencePoints({ text, lowerTokens }: TagTextView): number {
  const padded = ` ${lowerTokens.join(" ")} `;

  if (META_REFERENCE_PHRASES.some((p) => padded.includes(` ${p} `))) {
    return 2;
  }

  return /\bchapter\s+\d/i.test(text) ? 2 : 0;
}

// Each factor returns the points it contributes (0 when it doesn't apply);
// commentary factors are positive, informative factors negative.
const FACTORS: ReadonlyArray<[string, (view: TagTextView) => number]> = [
  [
    "starts-lowercase",
    ({ text }) => {
      const firstLetter = /\p{L}/u.exec(text)?.[0];

      return firstLetter !== undefined && /\p{Ll}/u.test(firstLetter) ? 2 : 0;
    },
  ],
  [
    "mostly-lowercase",
    ({ significant }) =>
      significant.length >= 2 &&
      significant.filter(startsWithLowercase).length * 2 > significant.length
        ? 1
        : 0,
  ],
  [
    "first-person",
    ({ lowerTokens }) =>
      lowerTokens.some((token) => FIRST_PERSON.has(token)) ? 2 : 0,
  ],
  [
    "second-person",
    ({ lowerTokens }) =>
      lowerTokens.some((token) => SECOND_PERSON.has(token)) ? 2 : 0,
  ],
  [
    "leading-conjunction",
    ({ lowerTokens }) =>
      lowerTokens.length > 0 && LEADING_CONJUNCTIONS.has(lowerTokens[0])
        ? 2
        : 0,
  ],
  ["trailing-punctuation", ({ text }) => (/[?!]\s*$/.test(text) ? 2 : 0)],
  [
    "question-start",
    ({ lowerTokens }) =>
      lowerTokens.length > 1 && QUESTION_STARTERS.has(lowerTokens[0]) ? 1 : 0,
  ],
  [
    "contraction",
    ({ lowerTokens }) =>
      lowerTokens.some(
        (token) =>
          SENTENCE_CONTRACTIONS.has(token) || /n't$|'re$|'ll$|'ve$/.test(token),
      )
        ? 1
        : 0,
  ],
  ["length", lengthPoints],
  ["commentary-phrase", phrasePoints],
  ["expressive-punctuation", expressivePoints],
  ["meta-reference", metaReferencePoints],
  ["conversation-momentum", ({ previousFaded }) => (previousFaded ? 1 : 0)],
  [
    "shouty-caps",
    ({ tokens }) => {
      const shouted = tokens.filter(isShoutedWord).length;

      if (shouted >= 2) {
        return 2;
      }

      return shouted === 1 ? 1 : 0;
    },
  ],
  [
    "known-name",
    ({ text, knownNames }) => (containsKnownName(text, knownNames) ? -3 : 0),
  ],
  [
    "canonical-template",
    ({ text }) =>
      CANONICAL_TEMPLATES.some((template) => template.test(text)) ? -2 : 0,
  ],
  ["page-repetition", ({ repeatedOnPage }) => (repeatedOnPage ? -2 : 0)],
  // "|" joins a wrangled synonym to its canonical form ("ISS | International
  // Space Station", "The Convict | Simon (Iron Lung)") and never shows up
  // in commentary
  ["canonical-pipe", ({ text }) => (text.includes("|") ? -3 : 0)],
  [
    // Wrangler-style Each Word Capitalized — an ALL CAPS tag doesn't
    // qualify, so at least one word must have a lowercase letter in it
    "title-case",
    ({ significant }) =>
      significant.length >= 1 &&
      !significant.some(startsWithLowercase) &&
      significant.some((word) => /\p{Ll}/u.test(word))
        ? -1
        : 0,
  ],
];

/**
 * Scores how much a tag reads as author commentary. Positive factors push
 * toward commentary, negative factors toward real information; the final
 * score is compared against the sensitivity threshold by shouldFadeTag.
 */
export function scoreTagCommentary(
  name: string,
  context: TagFadingContext = {},
): TagCommentaryAssessment {
  const text = name.trim().replace(/[’‘]/g, "'");
  const rawWords = text.split(/\s+/).filter(Boolean);
  const tokens = rawWords
    .map((word) =>
      word
        .replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, "")
        .replace(/^'+|'+$/g, ""),
    )
    .filter((word) => word.length > 0);
  const lowerTokens = tokens.map((token) => token.toLowerCase());

  const view: TagTextView = {
    text,
    rawWords,
    tokens,
    lowerTokens,
    significant: tokens.filter(
      (token, index) =>
        /\p{L}/u.test(token) && !TITLE_STOPWORDS.has(lowerTokens[index]),
    ),
    knownNames: context.knownNames ?? [],
    previousFaded: context.previousFaded ?? false,
    repeatedOnPage: context.repeatedOnPage ?? false,
  };

  const factors: string[] = [];
  let score = 0;

  for (const [factor, evaluate] of FACTORS) {
    const points = evaluate(view);

    if (points !== 0) {
      score += points;
      factors.push(factor);
    }
  }

  return { score, factors };
}

/**
 * Decides whether a tag should be visually de-emphasized. Evaluate on the
 * ORIGINAL (pre-cleaning) text — suffixes like "- Freeform" that the
 * cleaning options strip are themselves canonicality evidence. Warnings
 * are safety-critical and fandom tags navigational, so neither ever fades
 * regardless of how they're written.
 */
export function shouldFadeTag(
  name: string,
  sensitivity: FadeSensitivity,
  context: TagFadingContext = {},
): boolean {
  const tagType = context.tagType ?? "freeform";

  if (tagType === "warning" || tagType === "fandom") {
    return false;
  }

  return (
    scoreTagCommentary(name, context).score >=
    SENSITIVITY_THRESHOLDS[sensitivity]
  );
}
