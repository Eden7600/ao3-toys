import { defaultHideModes } from "@src/common/hide-modes";
import {
  defaultSettings,
  normalizeStoredSettings,
} from "@src/common/settings-schema";
import { describe, expect, it } from "vitest";

describe("normalizeStoredSettings", () => {
  it("returns defaults for empty storage", () => {
    expect(normalizeStoredSettings(null)).toEqual(defaultSettings);
  });

  it("passes new-shape settings through unchanged", () => {
    const normalized = normalizeStoredSettings({
      hideWorks: false,
      hideModes: { ...defaultHideModes, visited: "collapse" },
    });

    expect(normalized.hideWorks).toBe(false);
    expect(normalized.hideModes.visited).toBe("collapse");
    expect(normalized.hideModes.language).toBe("none");
  });

  it("fills missing mode keys from defaults", () => {
    const normalized = normalizeStoredSettings({
      hideModes: { "excluded-tags": "remove" },
    });

    expect(normalized.hideModes["excluded-tags"]).toBe("remove");
    expect(normalized.hideModes.visited).toBe("none");
    expect(normalized.hideModes.subscribed).toBe("none");
  });

  it("migrates a disabled legacy language filter to none", () => {
    const normalized = normalizeStoredSettings({
      hideLanguages: false,
      hideModes: { ...defaultHideModes, language: "collapse" },
    });

    expect(normalized.hideModes.language).toBe("none");
  });

  it("preserves the stored mode for enabled legacy filters", () => {
    const normalized = normalizeStoredSettings({
      hideLanguages: true,
      hideExcessiveFandoms: true,
      hideModes: { ...defaultHideModes, language: "remove", fandom: "remove" },
    });

    expect(normalized.hideModes.language).toBe("remove");
    expect(normalized.hideModes.fandom).toBe("remove");
  });

  it("defaults enabled legacy filters without a stored mode to collapse", () => {
    const normalized = normalizeStoredSettings({ hideExcessiveFandoms: true });

    expect(normalized.hideModes.fandom).toBe("collapse");
  });

  it("migrates a disabled legacy tag toggle to none for excluded tags", () => {
    const normalized = normalizeStoredSettings({ hideTags: false });

    expect(normalized.hideModes["excluded-tags"]).toBe("none");
  });

  it("keeps the master switch and does not fold it into modes", () => {
    const normalized = normalizeStoredSettings({
      hideWorks: false,
      hideModes: { ...defaultHideModes, "excluded-tags": "remove" },
    });

    expect(normalized.hideWorks).toBe(false);
    expect(normalized.hideModes["excluded-tags"]).toBe("remove");
  });

  it("strips legacy keys from the normalized object", () => {
    const normalized = normalizeStoredSettings({
      hideTags: true,
      hideLanguages: true,
      hideExcessiveFandoms: false,
    });

    expect("hideTags" in normalized).toBe(false);
    expect("hideLanguages" in normalized).toBe(false);
    expect("hideExcessiveFandoms" in normalized).toBe(false);
  });

  it("keeps a valid stored accent", () => {
    const normalized = normalizeStoredSettings({ ao3ThemeAccent: "teal" });

    expect(normalized.ao3ThemeAccent).toBe("teal");
  });

  it("falls back to the default accent for removed accent ids", () => {
    const normalized = normalizeStoredSettings({ ao3ThemeAccent: "amber" });

    expect(normalized.ao3ThemeAccent).toBe(defaultSettings.ao3ThemeAccent);
  });

  it("strips the reverted theme-customization key", () => {
    const normalized = normalizeStoredSettings({
      ao3ThemeCustom: { fontScale: 1.1 },
    });

    expect("ao3ThemeCustom" in normalized).toBe(false);
  });

  it("defaults pre-family storage to classic with the accent preserved", () => {
    const normalized = normalizeStoredSettings({ ao3ThemeAccent: "teal" });

    expect(normalized.ao3ThemeFamily).toBe("classic");
    expect(normalized.ao3ThemeAccent).toBe("teal");
    expect(normalized.ao3ThemeFlavor).toBe("mocha");
    expect(normalized.ao3ThemeCatppuccinAccent).toBe("mauve");
  });

  it("keeps valid stored family, flavor, and catppuccin accent", () => {
    const normalized = normalizeStoredSettings({
      ao3ThemeFamily: "catppuccin",
      ao3ThemeFlavor: "latte",
      ao3ThemeCatppuccinAccent: "sapphire",
    });

    expect(normalized.ao3ThemeFamily).toBe("catppuccin");
    expect(normalized.ao3ThemeFlavor).toBe("latte");
    expect(normalized.ao3ThemeCatppuccinAccent).toBe("sapphire");
  });

  it("coerces invalid family, flavor, and catppuccin accent independently", () => {
    const normalized = normalizeStoredSettings({
      ao3ThemeFamily: "nord",
      ao3ThemeFlavor: "espresso",
      ao3ThemeCatppuccinAccent: "amber",
    });

    expect(normalized.ao3ThemeFamily).toBe("classic");
    expect(normalized.ao3ThemeFlavor).toBe("mocha");
    expect(normalized.ao3ThemeCatppuccinAccent).toBe("mauve");
  });

  it("preserves both accent choices across a family switch", () => {
    const normalized = normalizeStoredSettings({
      ao3ThemeFamily: "classic",
      ao3ThemeAccent: "pink",
      ao3ThemeFlavor: "frappe",
      ao3ThemeCatppuccinAccent: "peach",
    });

    expect(normalized.ao3ThemeAccent).toBe("pink");
    expect(normalized.ao3ThemeFlavor).toBe("frappe");
    expect(normalized.ao3ThemeCatppuccinAccent).toBe("peach");
  });

  it("coerces an invalid classic accent without touching catppuccin keys", () => {
    const normalized = normalizeStoredSettings({
      ao3ThemeAccent: "amber",
      ao3ThemeFamily: "catppuccin",
      ao3ThemeCatppuccinAccent: "teal",
    });

    expect(normalized.ao3ThemeAccent).toBe(defaultSettings.ao3ThemeAccent);
    expect(normalized.ao3ThemeFamily).toBe("catppuccin");
    expect(normalized.ao3ThemeCatppuccinAccent).toBe("teal");
  });
});
