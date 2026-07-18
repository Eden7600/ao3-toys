/// <reference types="chrome" />
// Applies the selected AO3 theme to the extension's own UIs (popup and
// options page) by overriding the Tailwind tokens from
// src/assets/css/theme.css (--color-primary-*, --color-surface-*) as
// inline custom properties on <html>. Inline styles beat the @theme layer,
// so every bg-primary-600 / dark:bg-surface-900 utility follows along
// without touching any component.

import type { AccentId } from "@src/ao3_theme_injector/theme-profiles/accents";
import {
  catppuccinPalette,
  type CatppuccinFlavorId,
} from "@src/ao3_theme_injector/theme-profiles/catppuccin";
import { Color } from "@src/common/color";
import {
  normalizeStoredSettings,
  type Settings,
  type StoredSettings,
} from "@src/common/settings-schema";

// Mirrors the key settings.ts persists under; that module isn't imported
// here because its storage wrapper only loads inside an extension, and the
// pure parts of this file are unit-tested outside one.
const SETTINGS_STORAGE_KEY = "settings";

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

type Shade = (typeof SHADES)[number];

// Every variable this module may set — removal must cover the union of all
// families' overrides so switching themes never leaves stale values behind.
const MANAGED_VARS: string[] = [
  ...SHADES.map((shade) => `--color-primary-${String(shade)}`),
  "--color-surface-0",
  ...SHADES.map((shade) => `--color-surface-${String(shade)}`),
];

// White/black share mixed into the accent for the generated Catppuccin
// ramp; the accent itself sits at 500, matching how the Tailwind ramps
// place their reference color.
const ACCENT_WHITE_SHARE: Partial<Record<Shade, number>> = {
  50: 85,
  100: 70,
  200: 55,
  300: 40,
  400: 20,
};

const ACCENT_BLACK_SHARE: Partial<Record<Shade, number>> = {
  600: 15,
  700: 30,
  800: 45,
  900: 60,
  950: 75,
};

/** Full primary ramp for a single accent hex, via color-mix. */
function catppuccinAccentRamp(accentHex: string): Record<string, string> {
  const ramp: Record<string, string> = {};

  for (const shade of SHADES) {
    const whiteShare = ACCENT_WHITE_SHARE[shade];
    const blackShare = ACCENT_BLACK_SHARE[shade];

    let value = accentHex;

    if (whiteShare !== undefined) {
      value = `color-mix(in srgb, ${accentHex} ${String(100 - whiteShare)}%, white)`;
    } else if (blackShare !== undefined) {
      value = `color-mix(in srgb, ${accentHex} ${String(100 - blackShare)}%, black)`;
    }

    ramp[`--color-primary-${String(shade)}`] = value;
  }

  return ramp;
}

// Classic accent ids are named after Tailwind palettes on purpose, so the
// primary ramp is a straight lookup — red reproduces the stock tokens.
function classicAccentRamp(accent: AccentId): Record<string, string> {
  const shades = Color.tailwind[accent];
  const ramp: Record<string, string> = {};

  for (const shade of SHADES) {
    ramp[`--color-primary-${String(shade)}`] = shades[shade];
  }

  return ramp;
}

/**
 * Maps the flavor's neutrals onto the surface scale. Only the half of the
 * scale that matches the flavor's lightness is retinted: dark flavors
 * recolor the dark-mode shades (600–950), Latte the light-mode shades
 * (0–500). The other half keeps the stone defaults so the UI stays
 * coherent when the OS color scheme disagrees with the flavor.
 */
function catppuccinSurfaceVars(
  flavor: CatppuccinFlavorId,
): Record<string, string> {
  const c = catppuccinPalette[flavor];

  if (flavor === "latte") {
    return {
      "--color-surface-0": c.base,
      "--color-surface-50": c.mantle,
      "--color-surface-100": c.crust,
      "--color-surface-200": c.surface0,
      "--color-surface-300": c.surface1,
      "--color-surface-400": c.overlay0,
      "--color-surface-500": c.overlay1,
    };
  }

  return {
    "--color-surface-400": c.overlay2,
    "--color-surface-500": c.overlay1,
    "--color-surface-600": c.surface2,
    "--color-surface-700": c.surface1,
    "--color-surface-800": c.surface0,
    "--color-surface-900": c.base,
    "--color-surface-950": c.crust,
  };
}

// True-black page and near-black panels, mirroring the injected OLED
// profile's neutral (untinted) grays.
const OLED_SURFACE_VARS: Record<string, string> = {
  "--color-surface-800": "#1a1a1a",
  "--color-surface-900": "#0d0d0d",
  "--color-surface-950": "#000000",
};

/**
 * Token overrides for the current theme settings; empty when the theme is
 * disabled (the UIs keep their stock red/stone look).
 */
export function computeUiThemeVars(settings: Settings): Record<string, string> {
  if (!settings.ao3ThemeEnabled) {
    return {};
  }

  if (settings.ao3ThemeFamily === "catppuccin") {
    const palette = catppuccinPalette[settings.ao3ThemeFlavor];

    return {
      ...catppuccinAccentRamp(palette[settings.ao3ThemeCatppuccinAccent]),
      ...catppuccinSurfaceVars(settings.ao3ThemeFlavor),
    };
  }

  return {
    ...classicAccentRamp(settings.ao3ThemeAccent),
    // OLED is a classic-only modifier, same rule as the injected theme
    ...(settings.ao3ThemeOled ? OLED_SURFACE_VARS : {}),
  };
}

/** Writes the overrides to <html>, clearing anything no longer set. */
export function applyUiTheme(settings: Settings): void {
  const { style } = document.documentElement;
  const vars = computeUiThemeVars(settings);

  for (const name of MANAGED_VARS) {
    if (name in vars) {
      style.setProperty(name, vars[name]);
    } else {
      style.removeProperty(name);
    }
  }
}

// Extension pages: Chrome exposes chrome.*, Firefox exposes both
const extensionApi = () => (typeof chrome === "undefined" ? browser : chrome);

/**
 * Entry-point bootstrap: applies the theme once storage loads, then keeps
 * it live via storage events — the popup's own optimistic writes and
 * changes from other contexts (options page, popup) both land here. Page
 * lifetime only, so the listener is never torn down.
 */
export function initUiTheme(): void {
  const api = extensionApi();

  api.storage.local
    .get(SETTINGS_STORAGE_KEY)
    .then((items) => {
      applyUiTheme(
        normalizeStoredSettings(
          (items[SETTINGS_STORAGE_KEY] ?? null) as StoredSettings | null,
        ),
      );
    })
    .catch((error: unknown) => {
      console.error("Failed to apply UI theme", error);
    });

  api.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !(SETTINGS_STORAGE_KEY in changes)) return;

    applyUiTheme(
      normalizeStoredSettings(
        changes[SETTINGS_STORAGE_KEY].newValue as StoredSettings | null,
      ),
    );
  });
}
