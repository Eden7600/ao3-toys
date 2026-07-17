// Reader-insert placeholder replacement ("Y/N" → the reader's name).
// Pure string transforms — the content script walks text nodes and runs
// these per node.

export type YnNames = {
  firstName: string;
  lastName: string;
};

// Longest-first alternation; lookarounds instead of \b because the "/"
// inside tokens breaks word-boundary semantics. "/" in the boundary
// classes keeps slash-joined runs (ship-tag shapes like "A/YN") intact.
// Bare FN/LN are excluded as too collision-prone; bare YN is ubiquitous
// in practice.
const TOKEN_PATTERN =
  /(?<![A-Za-z0-9/])(Y\/L\/N|Y\/F\/N|Y\/N|F\/N|L\/N|YN)(?![A-Za-z0-9/])/gi;

const LAST_NAME_TOKENS = new Set(["Y/L/N", "L/N"]);

export function hasConfiguredNames(names: YnNames): boolean {
  return names.firstName.trim() !== "" || names.lastName.trim() !== "";
}

/**
 * Cheap pre-test so tree walks skip the vast majority of text nodes
 * before paying for the full token regex.
 */
export function mightContainPlaceholder(text: string): boolean {
  return /[yfl]\/n|yn/i.test(text);
}

/**
 * Replace placeholder tokens with the configured names (verbatim — no
 * case mirroring). Tokens whose target name is unset stay as written.
 */
export function replacePlaceholders(text: string, names: YnNames): string {
  const first = names.firstName.trim();
  const last = names.lastName.trim();

  if (first === "" && last === "") {
    return text;
  }

  return text.replace(TOKEN_PATTERN, (match) => {
    const replacement = LAST_NAME_TOKENS.has(match.toUpperCase())
      ? last
      : first;

    return replacement === "" ? match : replacement;
  });
}
