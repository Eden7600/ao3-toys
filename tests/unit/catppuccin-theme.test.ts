import blue from "@src/ao3_theme_injector/theme-profiles/blue.scss?inline";
import {
  buildCatppuccinCss,
  catppuccinAccentProfiles,
  catppuccinFlavors,
  catppuccinPalette,
  catppuccinSwatch,
  isCatppuccinAccentId,
  isCatppuccinFlavorId,
  isThemeFamilyId,
} from "@src/ao3_theme_injector/theme-profiles/catppuccin";
import disabled from "@src/ao3_theme_injector/theme-profiles/disabled.scss?inline";
import green from "@src/ao3_theme_injector/theme-profiles/green.scss?inline";
import orange from "@src/ao3_theme_injector/theme-profiles/orange.scss?inline";
import pink from "@src/ao3_theme_injector/theme-profiles/pink.scss?inline";
import purple from "@src/ao3_theme_injector/theme-profiles/purple.scss?inline";
import red from "@src/ao3_theme_injector/theme-profiles/red.scss?inline";
import teal from "@src/ao3_theme_injector/theme-profiles/teal.scss?inline";
import { describe, expect, it } from "vitest";

const classicProfiles: Record<string, string> = {
  red,
  blue,
  green,
  purple,
  teal,
  orange,
  pink,
  disabled,
};

function variableNames(css: string): string[] {
  return [...css.matchAll(/--[\w-]+(?=\s*:)/g)].map((m) => m[0]).sort();
}

function variableEntries(css: string): Map<string, string> {
  const entries = new Map<string, string>();

  for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    entries.set(match[1], match[2].trim());
  }

  return entries;
}

const allCombinations = catppuccinFlavors.flatMap((flavor) =>
  catppuccinAccentProfiles.map((accent) => [flavor.id, accent.id] as const),
);

describe("classic profile contract", () => {
  it("defines the identical variable set in every classic profile", () => {
    const reference = variableNames(classicProfiles.blue);

    expect(reference.length).toBeGreaterThan(0);

    for (const [name, css] of Object.entries(classicProfiles)) {
      expect(variableNames(css), `profile ${name}`).toEqual(reference);
    }
  });
});

describe("buildCatppuccinCss", () => {
  it("emits the full classic contract plus only --ctp-* extras, every flavor×accent", () => {
    const contract = variableNames(classicProfiles.blue);

    for (const [flavor, accent] of allCombinations) {
      const names = variableNames(buildCatppuccinCss(flavor, accent));

      for (const name of contract) {
        expect(names, `${flavor}/${accent} missing ${name}`).toContain(name);
      }

      const extras = names.filter((name) => !contract.includes(name));

      for (const extra of extras) {
        expect(
          extra.startsWith("--ctp-"),
          `${flavor}/${accent} unexpected extra ${extra}`,
        ).toBe(true);
      }
    }
  });

  it("exposes the full palette as --ctp-* variables plus resolved accent", () => {
    for (const [flavor, accent] of allCombinations) {
      const palette = catppuccinPalette[flavor];
      const vars = variableEntries(buildCatppuccinCss(flavor, accent));

      for (const [name, hex] of Object.entries(palette)) {
        expect(vars.get(`--ctp-${name}`), `${flavor}/${accent}`).toBe(hex);
      }

      expect(vars.get("--ctp-accent")).toBe(palette[accent]);
    }
  });

  it("emits a per-flavor color-scheme", () => {
    for (const flavor of catppuccinFlavors) {
      const css = buildCatppuccinCss(flavor.id, "mauve");

      expect(css).toContain(
        `color-scheme: ${flavor.id === "latte" ? "light" : "dark"};`,
      );
    }
  });

  it("maps contract variables per the spec elevation model", () => {
    for (const flavor of catppuccinFlavors) {
      const palette = catppuccinPalette[flavor.id];
      const vars = variableEntries(buildCatppuccinCss(flavor.id, "mauve"));

      expect(vars.get("--background-color")).toBe(palette.crust);
      expect(vars.get("--background-color-dark")).toBe(palette.mantle);
      expect(vars.get("--textbox-background-color")).toBe(palette.mantle);
      expect(vars.get("--card-background-color")).toBe(palette.mantle);
      expect(vars.get("--box-background-color")).toBe(palette.mantle);
      expect(vars.get("--button-background-color")).toBe(palette.surface0);
      expect(vars.get("--button-highlight-color")).toBe(palette.surface1);
      expect(vars.get("--button-current-color")).toBe(palette.crust);
      expect(vars.get("--box-border-color")).toBe(palette.overlay0);
      expect(vars.get("--text-color")).toBe(palette.text);
      expect(vars.get("--text-focus-color")).toBe(palette.subtext1);
      expect(vars.get("--ao3-accent-color")).toBe(palette.mauve);
      expect(vars.get("--editor-focus-background")).toBe(palette.surface0);
    }
  });

  it("uses blue links and lavender visited links for every accent", () => {
    for (const [flavor, accent] of allCombinations) {
      const palette = catppuccinPalette[flavor];
      const vars = variableEntries(buildCatppuccinCss(flavor, accent));

      expect(vars.get("--text-link-color"), `${flavor}/${accent}`).toBe(
        palette.blue,
      );
      // Visited links pull lavender toward text so they clear WCAG 3:1 on
      // the light Latte base
      expect(vars.get("--text-link-visited-color"), `${flavor}/${accent}`).toBe(
        `color-mix(in srgb, ${palette.lavender} 70%, ${palette.text})`,
      );
    }
  });

  it("keeps semantic tag hues independent of the accent choice", () => {
    for (const [flavor, accent] of allCombinations) {
      const palette = catppuccinPalette[flavor];
      const vars = variableEntries(buildCatppuccinCss(flavor, accent));

      expect(vars.get("--tag-character-border")).toBe(palette.green);
      expect(vars.get("--tag-character-fill")).toBe(`${palette.green}33`);
      expect(vars.get("--tag-relationship-border")).toBe(palette.blue);
      expect(vars.get("--tag-relationship-fill")).toBe(`${palette.blue}33`);
    }
  });

  it("emits only palette hexes, alpha'd palette hexes, or color-mixes of them", () => {
    for (const [flavor, accent] of allCombinations) {
      const paletteHexes = new Set(Object.values(catppuccinPalette[flavor]));

      for (const [name, value] of variableEntries(
        buildCatppuccinCss(flavor, accent),
      )) {
        const context = `${flavor}/${accent} ${name}: ${value}`;

        if (value.startsWith("color-mix(")) {
          const [, hexA, hexB] =
            /^color-mix\(in srgb, (#[0-9a-f]{6}) \d+%, (#[0-9a-f]{6})\)$/.exec(
              value,
            ) ?? [];

          expect(hexA, context).toBeDefined();
          expect(paletteHexes.has(hexA), context).toBe(true);
          expect(paletteHexes.has(hexB), context).toBe(true);
        } else {
          // Bare hex, optionally with a two-digit alpha suffix
          const [, hex] = /^(#[0-9a-f]{6})([0-9a-f]{2})?$/.exec(value) ?? [];

          expect(hex, context).toBeDefined();
          expect(paletteHexes.has(hex), context).toBe(true);
        }
      }
    }
  });
});

// WCAG relative-luminance contrast, with color-mix(in srgb, ...) resolved
// the way browsers do: per-channel linear interpolation of sRGB components.
function channels(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function resolveColor(value: string): [number, number, number] {
  const mixed =
    /^color-mix\(in srgb, (#[0-9a-f]{6}) (\d+)%, (#[0-9a-f]{6})\)$/.exec(value);

  if (mixed) {
    const share = Number(mixed[2]) / 100;
    const a = channels(mixed[1]);
    const b = channels(mixed[3]);

    return [0, 1, 2].map((i) => a[i] * share + b[i] * (1 - share)) as [
      number,
      number,
      number,
    ];
  }

  return channels(value);
}

function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;

    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(valueA: string, valueB: string): number {
  const lumA = luminance(resolveColor(valueA));
  const lumB = luminance(resolveColor(valueB));
  const [lighter, darker] = lumA > lumB ? [lumA, lumB] : [lumB, lumA];

  return (lighter + 0.05) / (darker + 0.05);
}

describe("catppuccin legibility", () => {
  it("keeps body text readable on every background layer, all flavors", () => {
    for (const flavor of catppuccinFlavors) {
      const vars = variableEntries(buildCatppuccinCss(flavor.id, "mauve"));
      const text = vars.get("--text-color") ?? "";

      // Reading layers hold WCAG AA (4.5); the control layer (surface1
      // buttons) gets 4.3 — Latte's text-on-surface1 is 4.39, the pairing
      // official Latte ports use, and button labels are short bold UI text
      for (const [layer, floor] of [
        ["--background-color", 4.5],
        ["--background-color-dark", 4.5],
        ["--card-background-color", 4.5],
        ["--button-background-color", 4.3],
        ["--textbox-background-color", 4.5],
      ] as const) {
        const ratio = contrast(text, vars.get(layer) ?? "");

        expect(ratio, `${flavor.id} text on ${layer}`).toBeGreaterThanOrEqual(
          floor,
        );
      }

      // Tag hover inverts: button-current-color text on text-color bubble
      expect(
        contrast(vars.get("--button-current-color") ?? "", text),
        `${flavor.id} inverted tag hover`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps on-accent text legible for every flavor×accent", () => {
    for (const [flavor, accent] of allCombinations) {
      const vars = variableEntries(buildCatppuccinCss(flavor, accent));
      const palette = catppuccinPalette[flavor];
      const onAccent = vars.get("--on-accent-color") ?? "";

      // Generator picks base or text, whichever contrasts better. All
      // dark flavors clear 3:1; six of Latte's mid-luminance accents
      // cap out between 2.67 and 2.96 — no palette neutral can do
      // better there, so the floor guards regressions instead.
      expect([palette.base, palette.text], `${flavor}/${accent}`).toContain(
        onAccent,
      );

      const ratio = contrast(onAccent, vars.get("--ao3-accent-color") ?? "");
      const floor = flavor === "latte" ? 2.6 : 3;

      expect(ratio, `${flavor}/${accent} on-accent`).toBeGreaterThanOrEqual(
        floor,
      );
    }
  });

  it("keeps links and accent-derived text visible on the page background", () => {
    for (const [flavor, accent] of allCombinations) {
      const vars = variableEntries(buildCatppuccinCss(flavor, accent));
      const base = vars.get("--background-color") ?? "";

      for (const name of [
        "--text-link-color",
        "--text-link-visited-color",
        "--ao3-accent-color-light",
      ]) {
        const ratio = contrast(vars.get(name) ?? "", base);

        expect(ratio, `${flavor}/${accent} ${name}`).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe("catppuccin exports", () => {
  it("exposes 4 flavors and 14 accents", () => {
    expect(catppuccinFlavors).toHaveLength(4);
    expect(catppuccinAccentProfiles).toHaveLength(14);
  });

  it("returns flavor-accurate swatches", () => {
    expect(catppuccinSwatch("mocha", "mauve")).toBe(
      catppuccinPalette.mocha.mauve,
    );
    expect(catppuccinSwatch("latte", "mauve")).toBe(
      catppuccinPalette.latte.mauve,
    );
    expect(catppuccinSwatch("mocha", "mauve")).not.toBe(
      catppuccinSwatch("latte", "mauve"),
    );
  });

  it("validates ids", () => {
    expect(isCatppuccinFlavorId("latte")).toBe(true);
    expect(isCatppuccinFlavorId("espresso")).toBe(false);
    expect(isCatppuccinAccentId("rosewater")).toBe(true);
    expect(isCatppuccinAccentId("amber")).toBe(false);
    expect(isThemeFamilyId("classic")).toBe(true);
    expect(isThemeFamilyId("catppuccin")).toBe(true);
    expect(isThemeFamilyId("nord")).toBe(false);
  });
});
