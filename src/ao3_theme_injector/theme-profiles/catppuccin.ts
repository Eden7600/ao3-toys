// Catppuccin palette family: vendored palette data plus the generator that
// maps it onto the theme variable contract. Pure module (no scss imports,
// no extension APIs) so settings-schema and unit tests can import it.

export type CatppuccinFlavorId = "latte" | "frappe" | "macchiato" | "mocha";

export type CatppuccinAccentId =
  | "rosewater"
  | "flamingo"
  | "pink"
  | "mauve"
  | "red"
  | "maroon"
  | "peach"
  | "yellow"
  | "green"
  | "teal"
  | "sky"
  | "sapphire"
  | "blue"
  | "lavender";

type CatppuccinNeutral =
  | "text"
  | "subtext1"
  | "subtext0"
  | "overlay2"
  | "overlay1"
  | "overlay0"
  | "surface2"
  | "surface1"
  | "surface0"
  | "base"
  | "mantle"
  | "crust";

type CatppuccinColorName = CatppuccinAccentId | CatppuccinNeutral;

type FlavorColors = Record<CatppuccinColorName, string>;

// Official palette v1.8.0 — https://github.com/catppuccin/palette (MIT)
export const catppuccinPalette: Record<CatppuccinFlavorId, FlavorColors> = {
  latte: {
    rosewater: "#dc8a78",
    flamingo: "#dd7878",
    pink: "#ea76cb",
    mauve: "#8839ef",
    red: "#d20f39",
    maroon: "#e64553",
    peach: "#fe640b",
    yellow: "#df8e1d",
    green: "#40a02b",
    teal: "#179299",
    sky: "#04a5e5",
    sapphire: "#209fb5",
    blue: "#1e66f5",
    lavender: "#7287fd",
    text: "#4c4f69",
    subtext1: "#5c5f77",
    subtext0: "#6c6f85",
    overlay2: "#7c7f93",
    overlay1: "#8c8fa1",
    overlay0: "#9ca0b0",
    surface2: "#acb0be",
    surface1: "#bcc0cc",
    surface0: "#ccd0da",
    base: "#eff1f5",
    mantle: "#e6e9ef",
    crust: "#dce0e8",
  },
  frappe: {
    rosewater: "#f2d5cf",
    flamingo: "#eebebe",
    pink: "#f4b8e4",
    mauve: "#ca9ee6",
    red: "#e78284",
    maroon: "#ea999c",
    peach: "#ef9f76",
    yellow: "#e5c890",
    green: "#a6d189",
    teal: "#81c8be",
    sky: "#99d1db",
    sapphire: "#85c1dc",
    blue: "#8caaee",
    lavender: "#babbf1",
    text: "#c6d0f5",
    subtext1: "#b5bfe2",
    subtext0: "#a5adce",
    overlay2: "#949cbb",
    overlay1: "#838ba7",
    overlay0: "#737994",
    surface2: "#626880",
    surface1: "#51576d",
    surface0: "#414559",
    base: "#303446",
    mantle: "#292c3c",
    crust: "#232634",
  },
  macchiato: {
    rosewater: "#f4dbd6",
    flamingo: "#f0c6c6",
    pink: "#f5bde6",
    mauve: "#c6a0f6",
    red: "#ed8796",
    maroon: "#ee99a0",
    peach: "#f5a97f",
    yellow: "#eed49f",
    green: "#a6da95",
    teal: "#8bd5ca",
    sky: "#91d7e3",
    sapphire: "#7dc4e4",
    blue: "#8aadf4",
    lavender: "#b7bdf8",
    text: "#cad3f5",
    subtext1: "#b8c0e0",
    subtext0: "#a5adcb",
    overlay2: "#939ab7",
    overlay1: "#8087a2",
    overlay0: "#6e738d",
    surface2: "#5b6078",
    surface1: "#494d64",
    surface0: "#363a4f",
    base: "#24273a",
    mantle: "#1e2030",
    crust: "#181926",
  },
  mocha: {
    rosewater: "#f5e0dc",
    flamingo: "#f2cdcd",
    pink: "#f5c2e7",
    mauve: "#cba6f7",
    red: "#f38ba8",
    maroon: "#eba0ac",
    peach: "#fab387",
    yellow: "#f9e2af",
    green: "#a6e3a1",
    teal: "#94e2d5",
    sky: "#89dceb",
    sapphire: "#74c7ec",
    blue: "#89b4fa",
    lavender: "#b4befe",
    text: "#cdd6f4",
    subtext1: "#bac2de",
    subtext0: "#a6adc8",
    overlay2: "#9399b2",
    overlay1: "#7f849c",
    overlay0: "#6c7086",
    surface2: "#585b70",
    surface1: "#45475a",
    surface0: "#313244",
    base: "#1e1e2e",
    mantle: "#181825",
    crust: "#11111b",
  },
};

export type CatppuccinFlavorProfile = {
  id: CatppuccinFlavorId;
  label: string;
};

export const catppuccinFlavors: CatppuccinFlavorProfile[] = [
  { id: "latte", label: "Latte" },
  { id: "frappe", label: "Frappé" },
  { id: "macchiato", label: "Macchiato" },
  { id: "mocha", label: "Mocha" },
];

export type CatppuccinAccentProfile = {
  id: CatppuccinAccentId;
  label: string;
};

export const catppuccinAccentProfiles: CatppuccinAccentProfile[] = [
  { id: "rosewater", label: "Rosewater" },
  { id: "flamingo", label: "Flamingo" },
  { id: "pink", label: "Pink" },
  { id: "mauve", label: "Mauve" },
  { id: "red", label: "Red" },
  { id: "maroon", label: "Maroon" },
  { id: "peach", label: "Peach" },
  { id: "yellow", label: "Yellow" },
  { id: "green", label: "Green" },
  { id: "teal", label: "Teal" },
  { id: "sky", label: "Sky" },
  { id: "sapphire", label: "Sapphire" },
  { id: "blue", label: "Blue" },
  { id: "lavender", label: "Lavender" },
];

/** Flavor-accurate swatch hex for the accent pickers. */
export function catppuccinSwatch(
  flavor: CatppuccinFlavorId,
  accent: CatppuccinAccentId,
): string {
  return catppuccinPalette[flavor][accent];
}

export function isCatppuccinFlavorId(
  value: unknown,
): value is CatppuccinFlavorId {
  return catppuccinFlavors.some((flavor) => flavor.id === value);
}

export function isCatppuccinAccentId(
  value: unknown,
): value is CatppuccinAccentId {
  return catppuccinAccentProfiles.some((profile) => profile.id === value);
}

export type ThemeFamilyId = "classic" | "catppuccin";

export function isThemeFamilyId(value: unknown): value is ThemeFamilyId {
  return value === "classic" || value === "catppuccin";
}

// Color-mix ratios for the derived accent variants. Centralized so the
// verification pass can tune every flavor×accent cell at once.
const HOVER_ACCENT_SHARE = 85; // Accent mixed toward base
const LIGHT_ACCENT_SHARE = 55; // Accent mixed toward text
const HEADER_ACCENT_SHARE = 25; // Accent mixed toward crust
// Pure lavender fails WCAG 3:1 against the Latte base, and the style guide
// puts legibility above palette purity — pull visited links toward text
const VISITED_LINK_SHARE = 70; // Lavender mixed toward text

function mix(colorA: string, share: number, colorB: string): string {
  return `color-mix(in srgb, ${colorA} ${String(share)}%, ${colorB})`;
}

// WCAG relative luminance/contrast, used to pick a legible on-accent text
// color at generation time (dark-flavor accents are pastel, Latte accents
// are mid-luminance — no single palette color works for all 56 cells)
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;

    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(hexA: string, hexB: string): number {
  const lumA = luminance(hexA);
  const lumB = luminance(hexB);
  const [lighter, darker] = lumA > lumB ? [lumA, lumB] : [lumB, lumA];

  return (lighter + 0.05) / (darker + 0.05);
}

/** Base per the style guide, unless text reads better on this accent. */
function onAccentColor(colors: FlavorColors, accentHex: string): string {
  return contrast(colors.base, accentHex) >= contrast(colors.text, accentHex)
    ? colors.base
    : colors.text;
}

/**
 * Emits the full variable block for a flavor×accent combination.
 *
 * Two variable sets come out of this:
 * - The classic contract variables, valued per the Catppuccin spec's
 *   elevation model (darkest at the bottom: crust chrome, mantle
 *   secondary panes, base main pane, surface0 cards, surface1/2
 *   controls). Shared surfaces — injected shadow UI, blurb cards, the
 *   options preview — read these.
 * - The full `--ctp-*` palette plus resolved accent, which the isolated
 *   Catppuccin core theme (src/ao3_theme_injector/catppuccin/) consumes
 *   directly for decisions the classic contract can't express.
 *
 * `color-scheme` is emitted per flavor so native widgets and scrollbars
 * follow Latte's lightness.
 */
export function buildCatppuccinCss(
  flavor: CatppuccinFlavorId,
  accent: CatppuccinAccentId,
): string {
  const c = catppuccinPalette[flavor];
  const accentHex = c[accent];
  const paletteLines = Object.entries(c)
    .map(([name, hex]) => `  --ctp-${name}: ${hex};`)
    .join("\n");

  return `:root {
  color-scheme: ${flavor === "latte" ? "light" : "dark"};
${paletteLines}
  --ctp-accent: ${accentHex};
  --ctp-on-accent: ${onAccentColor(c, accentHex)};
  --input-border-color: ${accentHex};
  --ao3-header-color: ${mix(accentHex, HEADER_ACCENT_SHARE, c.crust)};
  --ao3-accent-color: ${accentHex};
  --ao3-accent-color-hover: ${mix(accentHex, HOVER_ACCENT_SHARE, c.base)};
  --ao3-accent-color-light: ${mix(accentHex, LIGHT_ACCENT_SHARE, c.text)};
  --background-color: ${c.crust};
  --background-color-dark: ${c.mantle};
  --box-background-color: ${c.mantle};
  --card-background-color: ${c.mantle};
  --box-border-color: ${c.overlay0};
  --box-border-color-alt: ${c.overlay1};
  --box-border-color-subtle: ${c.surface0};
  --button-background-color: ${c.surface0};
  --button-current-color: ${c.crust};
  --button-highlight-color: ${c.surface1};
  --tag-bubble-color-visited-hover: ${c.surface1};
  --text-focus-color: ${c.subtext1};
  --text-color: ${c.text};
  --text-link-color: ${c.blue};
  --text-link-visited-color: ${mix(c.lavender, VISITED_LINK_SHARE, c.text)};
  --textbox-background-color: ${c.mantle};
  --tag-character-border: ${c.green};
  --tag-character-fill: ${c.green}33;
  --tag-relationship-border: ${c.blue};
  --tag-relationship-fill: ${c.blue}33;
  --editor-focus-background: ${c.surface0};
  --on-accent-color: ${onAccentColor(c, accentHex)};
}
`;
}
