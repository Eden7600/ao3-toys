import { catppuccinPalette } from "@src/ao3_theme_injector/theme-profiles/catppuccin";
import { Color } from "@src/common/color";
import { defaultSettings, type Settings } from "@src/common/settings-schema";
import { computeUiThemeVars } from "@src/common/ui-theme";
import { describe, expect, it } from "vitest";

const settingsWith = (overrides: Partial<Settings>): Settings => ({
  ...defaultSettings,
  ...overrides,
});

describe("computeUiThemeVars", () => {
  it("returns no overrides when the theme is disabled", () => {
    expect(settingsWith({}).ao3ThemeEnabled).toBe(true);
    expect(
      computeUiThemeVars(settingsWith({ ao3ThemeEnabled: false })),
    ).toEqual({});
  });

  it("maps classic accents onto the matching tailwind ramp", () => {
    const vars = computeUiThemeVars(settingsWith({ ao3ThemeAccent: "blue" }));

    expect(vars["--color-primary-500"]).toBe(Color.tailwind.blue[500]);
    expect(vars["--color-primary-950"]).toBe(Color.tailwind.blue[950]);
    // Classic keeps the stone surfaces untouched
    expect(vars["--color-surface-950"]).toBeUndefined();
  });

  it("reproduces the stock tokens for the default red accent", () => {
    const vars = computeUiThemeVars(settingsWith({}));

    // Matches src/assets/css/theme.css, so applying is a visual no-op
    expect(vars["--color-primary-500"]).toBe("#ef4444");
  });

  it("darkens surfaces to true black for classic OLED", () => {
    const vars = computeUiThemeVars(settingsWith({ ao3ThemeOled: true }));

    expect(vars["--color-surface-950"]).toBe("#000000");
  });

  it("ignores the OLED modifier under catppuccin, like the injector", () => {
    const vars = computeUiThemeVars(
      settingsWith({ ao3ThemeFamily: "catppuccin", ao3ThemeOled: true }),
    );

    expect(vars["--color-surface-950"]).toBe(catppuccinPalette.mocha.crust);
  });

  it("builds the catppuccin primary ramp around the accent at 500", () => {
    const vars = computeUiThemeVars(
      settingsWith({
        ao3ThemeFamily: "catppuccin",
        ao3ThemeFlavor: "mocha",
        ao3ThemeCatppuccinAccent: "mauve",
      }),
    );
    const { mauve } = catppuccinPalette.mocha;

    expect(vars["--color-primary-500"]).toBe(mauve);
    expect(vars["--color-primary-400"]).toContain(`${mauve} 80%, white`);
    expect(vars["--color-primary-600"]).toContain(`${mauve} 85%, black`);
  });

  it("retints dark surfaces for dark flavors and leaves the light half", () => {
    const vars = computeUiThemeVars(
      settingsWith({ ao3ThemeFamily: "catppuccin", ao3ThemeFlavor: "mocha" }),
    );

    expect(vars["--color-surface-950"]).toBe(catppuccinPalette.mocha.crust);
    expect(vars["--color-surface-900"]).toBe(catppuccinPalette.mocha.base);
    expect(vars["--color-surface-0"]).toBeUndefined();
    expect(vars["--color-surface-100"]).toBeUndefined();
  });

  it("retints light surfaces for latte and leaves the dark half", () => {
    const vars = computeUiThemeVars(
      settingsWith({ ao3ThemeFamily: "catppuccin", ao3ThemeFlavor: "latte" }),
    );

    expect(vars["--color-surface-0"]).toBe(catppuccinPalette.latte.base);
    expect(vars["--color-surface-100"]).toBe(catppuccinPalette.latte.crust);
    expect(vars["--color-surface-900"]).toBeUndefined();
    expect(vars["--color-surface-950"]).toBeUndefined();
  });
});
