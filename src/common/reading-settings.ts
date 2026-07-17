export type ReadingFontFamily =
  | "default"
  | "serif"
  | "sans-serif"
  | "monospace";

export type ReadingTextAlign = "left" | "justify" | "right";

/**
 * V2 settings shape. Null (and "default"/100 for their fields) means
 * "unset" — the setting emits no CSS and the work renders with
 * AO3/work-skin native styling. fontSizePercent uses 100 as its identity
 * value instead of null since 100% is a no-op.
 */
export type ReadingSettings = {
  fontFamily: ReadingFontFamily;
  textAlign: ReadingTextAlign | null;
  fontSizePercent: number;
  maxWidthEm: number | null;
  lineHeight: number | null;
  paragraphSpacingEm: number | null;
  standardizeLineBreaks: boolean;
};

export const READING_SETTINGS_STORAGE_KEY = "reader_toybox_work_settings";

/** Attribute stamped on author-inserted spacer paragraphs. */
export const SPACER_PARAGRAPH_ATTR = "data-rt-spacer";

export const DEFAULT_READING_SETTINGS: ReadingSettings = {
  fontFamily: "default",
  textAlign: null,
  fontSizePercent: 100,
  maxWidthEm: null,
  lineHeight: null,
  paragraphSpacingEm: null,
  standardizeLineBreaks: false,
};

export type ReadingSettingsOption = {
  id: string;
  value: string;
  label: string;
};

export type ReadingSettingsGroup = {
  key: keyof ReadingSettings;
  label: string;
  options: ReadingSettingsOption[];
};

export const READING_FONT_FAMILY_GROUP: ReadingSettingsGroup = {
  key: "fontFamily",
  label: "Font Family",
  options: [
    { id: "fontFamily-default", value: "default", label: "Default" },
    { id: "fontFamily-serif", value: "serif", label: "Serif" },
    { id: "fontFamily-sans-serif", value: "sans-serif", label: "Sans" },
    { id: "fontFamily-monospace", value: "monospace", label: "Mono" },
  ],
};

/**
 * The "default" option maps to null in storage — same unset convention as
 * the numeric sliders.
 */
export const READING_TEXT_ALIGN_GROUP: ReadingSettingsGroup = {
  key: "textAlign",
  label: "Alignment",
  options: [
    { id: "textAlign-default", value: "default", label: "Default" },
    { id: "textAlign-left", value: "left", label: "Left" },
    { id: "textAlign-justify", value: "justify", label: "Justify" },
    { id: "textAlign-right", value: "right", label: "Right" },
  ],
};

export const FONT_FAMILY_CSS: Record<
  Exclude<ReadingFontFamily, "default">,
  string
> = {
  serif: "'Georgia', 'Times New Roman', serif",
  "sans-serif": "'Arial', 'Helvetica', sans-serif",
  monospace: "'Courier New', monospace",
};

export type ReadingSliderKey =
  | "fontSizePercent"
  | "maxWidthEm"
  | "lineHeight"
  | "paragraphSpacingEm";

export type ReadingSliderConfig = {
  key: ReadingSliderKey;
  label: string;
  min: number;
  max: number;
  step: number;
  /** Value the reset affordance restores; null = the unset state. */
  defaultValue: number | null;
  /** Readout text while the value is unset/default. */
  unsetLabel: string;
  /** Where the thumb parks while the value is unset. */
  unsetPosition: number;
  format: (value: number) => string;
};

export const READING_SLIDERS: ReadingSliderConfig[] = [
  {
    key: "fontSizePercent",
    label: "Font Size",
    min: 70,
    max: 150,
    step: 5,
    defaultValue: 100,
    unsetLabel: "100%",
    unsetPosition: 100,
    format: (value) => `${String(value)}%`,
  },
  {
    key: "maxWidthEm",
    label: "Max Width",
    min: 40,
    max: 90,
    step: 5,
    defaultValue: null,
    unsetLabel: "Full",
    unsetPosition: 90,
    format: (value) => `${String(value)}em`,
  },
  {
    key: "lineHeight",
    label: "Line Height",
    min: 1,
    max: 2.2,
    step: 0.05,
    defaultValue: null,
    unsetLabel: "Default",
    unsetPosition: 1.3,
    format: (value) => value.toFixed(2),
  },
  {
    key: "paragraphSpacingEm",
    label: "Paragraph Spacing",
    min: 0,
    max: 2.5,
    step: 0.05,
    defaultValue: null,
    unsetLabel: "Default",
    unsetPosition: 1.3,
    format: (value) => `${value.toFixed(2)}em`,
  },
];

/**
 * Builds the page-facing stylesheet for the given reading settings.
 * Unset/default settings emit no CSS at all, so all-defaults returns ""
 * and the work renders exactly as AO3/work skins would natively.
 * Non-default declarations use !important so the reader's explicit choice
 * wins over work-skin rules.
 */
export function buildReadingCss(settings: ReadingSettings): string {
  const workskin: string[] = [];

  if (settings.fontFamily !== "default") {
    workskin.push(
      `font-family: ${FONT_FAMILY_CSS[settings.fontFamily]} !important;`,
    );
  }

  if (settings.fontSizePercent !== 100) {
    workskin.push(
      `font-size: ${String(settings.fontSizePercent)}% !important;`,
    );
  }

  if (settings.lineHeight !== null) {
    workskin.push(`line-height: ${String(settings.lineHeight)} !important;`);
  }

  if (settings.maxWidthEm !== null) {
    workskin.push(`max-width: ${String(settings.maxWidthEm)}em !important;`);
  }

  const rules: string[] = [];

  if (workskin.length > 0) {
    rules.push(`#workskin {\n  ${workskin.join("\n  ")}\n}`);
  }

  if (settings.textAlign !== null) {
    rules.push(
      `#workskin .userstuff {\n  text-align: ${settings.textAlign} !important;\n}`,
    );
  }

  if (settings.paragraphSpacingEm !== null) {
    rules.push(
      `#workskin .userstuff p {\n  margin-top: 0 !important;\n  margin-bottom: ${String(settings.paragraphSpacingEm)}em !important;\n}`,
    );
  }

  if (settings.standardizeLineBreaks) {
    rules.push(
      `#workskin .userstuff p[${SPACER_PARAGRAPH_ATTR}] {\n  display: none !important;\n}`,
    );
  }

  return rules.join("\n\n");
}

/**
 * True for author-inserted spacer paragraphs: no text after stripping
 * whitespace and non-breaking spaces, and no child elements other than <br>.
 * Paragraphs containing images or any other element are never spacers.
 */
export function isSpacerParagraph(paragraph: Element): boolean {
  for (const child of paragraph.children) {
    if (child.tagName !== "BR") {
      return false;
    }
  }

  return paragraph.textContent.replace(/[\s\u00a0]/gu, "") === "";
}

/**
 * Stamps SPACER_PARAGRAPH_ATTR on spacer paragraphs inside .userstuff blocks.
 * Idempotent; visibility is controlled by the generated stylesheet, so
 * marking alone changes nothing.
 */
export function markSpacerParagraphs(root: ParentNode): number {
  let count = 0;

  root.querySelectorAll(".userstuff p").forEach((paragraph) => {
    if (isSpacerParagraph(paragraph)) {
      paragraph.setAttribute(SPACER_PARAGRAPH_ATTR, "");
      count += 1;
    }
  });

  return count;
}

const V1_FONT_SIZE: Record<string, number | undefined> = {
  small: 90,
  medium: 100,
  large: 115,
};
const V1_MAX_WIDTH: Record<string, number | null> = {
  narrow: 45,
  medium: null,
  wide: 85,
};
const V1_LINE_SPACING: Record<string, number | null> = {
  compact: 1.4,
  comfortable: null,
  spacious: 1.8,
};
const V1_PARAGRAPH_SPACING: Record<string, number | null> = {
  minimal: 0.8,
  standard: null,
  generous: 1.6,
};

function isFontFamily(value: unknown): value is ReadingFontFamily {
  return (
    value === "default" ||
    value === "serif" ||
    value === "sans-serif" ||
    value === "monospace"
  );
}

function isTextAlign(value: unknown): value is ReadingTextAlign {
  return value === "left" || value === "justify" || value === "right";
}

/**
 * Converts whatever is in storage into the v2 settings shape. Handles the
 * v1 enum shape (fontSize: "small" | ... etc.), partial v2 shapes, and
 * garbage (returns defaults).
 */
export function migrateReadingSettings(saved: unknown): ReadingSettings {
  if (!saved || typeof saved !== "object") {
    return { ...DEFAULT_READING_SETTINGS };
  }

  const record = saved as Record<string, unknown>;
  const settings: ReadingSettings = { ...DEFAULT_READING_SETTINGS };

  if (isFontFamily(record.fontFamily)) {
    settings.fontFamily = record.fontFamily;
  }

  if (isTextAlign(record.textAlign)) {
    settings.textAlign = record.textAlign;
  }

  // V1 shape: enum strings under fontSize/maxWidth/lineSpacing/paragraphSpacing
  if (typeof record.fontSize === "string") {
    settings.fontSizePercent = V1_FONT_SIZE[record.fontSize] ?? 100;
    settings.maxWidthEm =
      typeof record.maxWidth === "string"
        ? (V1_MAX_WIDTH[record.maxWidth] ?? null)
        : null;
    settings.lineHeight =
      typeof record.lineSpacing === "string"
        ? (V1_LINE_SPACING[record.lineSpacing] ?? null)
        : null;
    settings.paragraphSpacingEm =
      typeof record.paragraphSpacing === "string"
        ? (V1_PARAGRAPH_SPACING[record.paragraphSpacing] ?? null)
        : null;

    return settings;
  }

  if (typeof record.fontSizePercent === "number") {
    settings.fontSizePercent = record.fontSizePercent;
  }

  if (typeof record.maxWidthEm === "number") {
    settings.maxWidthEm = record.maxWidthEm;
  }

  if (typeof record.lineHeight === "number") {
    settings.lineHeight = record.lineHeight;
  }

  if (typeof record.paragraphSpacingEm === "number") {
    settings.paragraphSpacingEm = record.paragraphSpacingEm;
  }

  if (typeof record.standardizeLineBreaks === "boolean") {
    settings.standardizeLineBreaks = record.standardizeLineBreaks;
  }

  return settings;
}
