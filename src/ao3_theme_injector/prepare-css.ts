import catppuccinTheme from "./catppuccin/index.scss?inline";
import coreTheme from "./theme/index.scss?inline";

import blue from "./theme-profiles/blue.scss?inline";
import {
  buildCatppuccinCss,
  type CatppuccinAccentId,
  type CatppuccinFlavorId,
  type ThemeFamilyId,
} from "./theme-profiles/catppuccin";
import disabled from "./theme-profiles/disabled.scss?inline";
import green from "./theme-profiles/green.scss?inline";
import oled from "./theme-profiles/oled.scss?inline";
import orange from "./theme-profiles/orange.scss?inline";
import pink from "./theme-profiles/pink.scss?inline";
import purple from "./theme-profiles/purple.scss?inline";
import red from "./theme-profiles/red.scss?inline";
import teal from "./theme-profiles/teal.scss?inline";

export type PrepareCssOptions = {
  enableTheme: boolean;
  enableOled: boolean;
  family: ThemeFamilyId;
  accent: string;
  flavor: CatppuccinFlavorId;
  catppuccinAccent: CatppuccinAccentId;
};

/**
 * Assembles the theme CSS exactly as injected into AO3: variable layer for
 * the active palette family, optional OLED overrides (classic only —
 * true-black would break Catppuccin's layer hierarchy), then the family's
 * own core theme — the classic tree or the isolated Catppuccin tree.
 * Shared by the injector entry and the options-page blurb preview.
 */
export function prepareCss(opts: PrepareCssOptions): string {
  const { enableTheme, enableOled, family, accent, flavor, catppuccinAccent } =
    opts;

  // With the theme off the page keeps AO3's default light skin. The palette
  // variables all carry dark values, and consumers (blurb card, shadow-UI
  // bridge, progress bar) fall back to defaults only when they're absent —
  // so emit nothing rather than dragging those surfaces dark.
  if (!enableTheme) {
    return "";
  }

  let output: string;

  const themeMap: Record<string, string> = {
    red,
    blue,
    green,
    purple,
    teal,
    orange,
    pink,
    oled,
    disabled,
  };

  if (family === "catppuccin") {
    output = `${buildCatppuccinCss(flavor, catppuccinAccent)}\n`;
  } else if (accent === "disabled") {
    output = disabled;
  } else {
    const cssVariables = themeMap[accent] || "";
    output = `${cssVariables}\n`;
  }

  if (enableOled && family === "classic") {
    output += `${oled}\n`;
  }

  output += `${family === "catppuccin" ? catppuccinTheme : coreTheme}\n`;

  return output;
}
