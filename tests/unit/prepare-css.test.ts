import catppuccinTheme from "@src/ao3_theme_injector/catppuccin/index.scss?inline";
import {
  prepareCss,
  type PrepareCssOptions,
} from "@src/ao3_theme_injector/prepare-css";
import coreTheme from "@src/ao3_theme_injector/theme/index.scss?inline";
import { buildCatppuccinCss } from "@src/ao3_theme_injector/theme-profiles/catppuccin";
import oled from "@src/ao3_theme_injector/theme-profiles/oled.scss?inline";
import red from "@src/ao3_theme_injector/theme-profiles/red.scss?inline";
import { describe, expect, it } from "vitest";

const baseOptions: PrepareCssOptions = {
  enableTheme: true,
  enableOled: false,
  family: "classic",
  accent: "red",
  flavor: "mocha",
  catppuccinAccent: "mauve",
};

describe("prepareCss", () => {
  it("assembles the classic layers exactly as before: profile, oled, core", () => {
    const output = prepareCss({ ...baseOptions, enableOled: true });

    expect(output.startsWith(`${red}\n`)).toBe(true);
    expect(output).toContain(oled);
    expect(output.indexOf(oled)).toBeGreaterThan(output.indexOf(red));
    // Core theme follows the variable layers
    expect(output.length).toBeGreaterThan(red.length + oled.length);
  });

  it("emits nothing when the theme is disabled so light fallbacks apply", () => {
    expect(prepareCss({ ...baseOptions, enableTheme: false })).toBe("");
    // Regardless of family or OLED — the page keeps AO3's default skin
    expect(
      prepareCss({ ...baseOptions, enableTheme: false, enableOled: true }),
    ).toBe("");
    expect(
      prepareCss({ ...baseOptions, enableTheme: false, family: "catppuccin" }),
    ).toBe("");
  });

  it("uses the generated catppuccin block instead of classic profiles", () => {
    const output = prepareCss({ ...baseOptions, family: "catppuccin" });

    expect(output.startsWith(`${buildCatppuccinCss("mocha", "mauve")}\n`)).toBe(
      true,
    );
    // No classic profile variables (red backgrounds) leak in
    expect(output).not.toContain("#221b1b");
  });

  it("composes the isolated catppuccin core theme, not the classic one", () => {
    const catppuccinOutput = prepareCss({
      ...baseOptions,
      family: "catppuccin",
    });
    const classicOutput = prepareCss(baseOptions);

    expect(catppuccinOutput).toContain(catppuccinTheme);
    expect(catppuccinOutput).not.toContain(coreTheme);
    expect(classicOutput).toContain(coreTheme);
    expect(classicOutput).not.toContain(catppuccinTheme);
  });

  it("follows flavor and accent selection", () => {
    const output = prepareCss({
      ...baseOptions,
      family: "catppuccin",
      flavor: "latte",
      catppuccinAccent: "peach",
    });

    expect(output.startsWith(`${buildCatppuccinCss("latte", "peach")}\n`)).toBe(
      true,
    );
  });

  it("ignores the OLED override under catppuccin", () => {
    const output = prepareCss({
      ...baseOptions,
      family: "catppuccin",
      enableOled: true,
    });

    expect(output).not.toContain(oled);
    expect(output).not.toContain("#000000");
  });

  it("layers the OLED override between profile and core for classic", () => {
    const output = prepareCss({ ...baseOptions, enableOled: true });

    expect(output.startsWith(`${red}\n${oled}\n`)).toBe(true);
  });
});
