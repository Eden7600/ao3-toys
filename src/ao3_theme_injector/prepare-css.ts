import coreTheme from "./theme/index.scss?inline";

import blue from "./theme-profiles/blue.scss?inline";
import disabled from "./theme-profiles/disabled.scss?inline";
import green from "./theme-profiles/green.scss?inline";
import oled from "./theme-profiles/oled.scss?inline";
import orange from "./theme-profiles/orange.scss?inline";
import pink from "./theme-profiles/pink.scss?inline";
import purple from "./theme-profiles/purple.scss?inline";
import red from "./theme-profiles/red.scss?inline";
import teal from "./theme-profiles/teal.scss?inline";

/**
 * Assembles the theme CSS exactly as injected into AO3: accent profile
 * variables, optional OLED overrides, optional core theme. Shared by the
 * injector entry and the options-page blurb preview.
 *
 * The theme itself (./theme and ./theme-profiles) is adapted from
 * ReversiPlusPlus (https://github.com/galaxygrotesque/ReversiPlusPlus) by
 * galaxygrotesque, licensed GPL-2.0. See /NOTICE.md.
 */
export function prepareCss(
  enableTheme: boolean,
  enableOled: boolean,
  accent: string,
): string {
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

  if (accent === "disabled") {
    output = disabled;
  } else {
    const cssVariables = themeMap[accent] || "";
    output = `${cssVariables}\n`;
  }

  if (enableOled) {
    output += `${oled}\n`;
  }

  if (enableTheme) {
    output += `${coreTheme}\n`;
  }

  return output;
}
