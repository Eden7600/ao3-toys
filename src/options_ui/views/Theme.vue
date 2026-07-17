<script setup lang="ts">
import { accentProfiles } from "@src/ao3_theme_injector/theme-profiles/accents";
import {
  catppuccinAccentProfiles,
  catppuccinFlavors,
} from "@src/ao3_theme_injector/theme-profiles/catppuccin";
import SettingsDropdown from "@src/options_ui/components/SettingsDropdown.vue";
import SettingsToggle from "@src/options_ui/components/SettingsToggle.vue";
import WorkBlurbPreviewDisplay from "@src/options_ui/components/WorkBlurbPreviewDisplay.vue";
import { useOptionsSettings } from "@src/options_ui/useOptionsSettings";
import { computed } from "vue";

const { settings } = useOptionsSettings("Theme");

const themeFamilyOptions = [
  { value: "classic", label: "Classic" },
  { value: "catppuccin", label: "Catppuccin" },
];

const themeAccentOptions = accentProfiles.map((profile) => ({
  value: profile.id,
  label: profile.label,
}));

const catppuccinFlavorOptions = catppuccinFlavors.map((flavor) => ({
  value: flavor.id,
  label: flavor.label,
}));

const catppuccinAccentOptions = catppuccinAccentProfiles.map((profile) => ({
  value: profile.id,
  label: profile.label,
}));

const isCatppuccin = computed(
  () => settings.value.ao3ThemeFamily === "catppuccin",
);
</script>

<template>
  <div class="p-4 bg-surface-900 rounded-lg flex items-center justify-between">
    <div class="flex flex-col">
      <h1 class="text-2xl font-bold text-white">Theme</h1>
      <p class="text-gray-400 text-lg">
        The look of AO3 itself — dark theme, accent color, and contrast
      </p>
    </div>
  </div>

  <!-- Live Preview -->
  <div class="px-4 pb-4 bg-surface-900 rounded-lg mt-3">
    <h2 class="text-xl font-semibold text-white pt-4 pb-2">Live Preview</h2>
    <p class="text-gray-400 text-sm mb-4">
      Two sample work blurbs rendered with AO3's layout and your theme — they
      update as you change anything below.
    </p>
    <WorkBlurbPreviewDisplay :settings="settings" />
  </div>

  <!-- Theme -->
  <div class="px-4 pb-4 bg-surface-900 rounded-lg mt-3">
    <h2 class="text-xl font-semibold text-white pt-4 pb-2">Theme</h2>
    <div class="divide-y divide-surface-800 text-white">
      <SettingsToggle
        v-model="settings.ao3ThemeEnabled"
        label="Enable Custom Theme"
        description="Replace the default AO3 theme with the customized one"
      />
      <SettingsDropdown
        v-model="settings.ao3ThemeFamily"
        label="Palette"
        description="Classic is the original hand-tuned dark theme; Catppuccin follows the community palette's style guide"
        :options="themeFamilyOptions"
      />
      <SettingsToggle
        v-model="settings.ao3ThemeOled"
        label="Enable OLED / High Contrast Mode"
        :description="
          isCatppuccin
            ? 'Classic palette only — Catppuccin defines its own background depths'
            : 'Enable High Contrast Mode. On OLED screens this helps to compensate for the mura effect, and will generally make the site look better.'
        "
        :disabled="isCatppuccin"
      />
      <SettingsDropdown
        v-if="!isCatppuccin"
        v-model="settings.ao3ThemeAccent"
        label="Accent Color"
        description="Choose the accent color for the theme"
        :options="themeAccentOptions"
      />
      <SettingsDropdown
        v-if="isCatppuccin"
        v-model="settings.ao3ThemeFlavor"
        label="Flavor"
        description="Latte is light; Frappé, Macchiato, and Mocha get progressively darker"
        :options="catppuccinFlavorOptions"
      />
      <SettingsDropdown
        v-if="isCatppuccin"
        v-model="settings.ao3ThemeCatppuccinAccent"
        label="Accent Color"
        description="All fourteen official Catppuccin accents"
        :options="catppuccinAccentOptions"
      />
    </div>
  </div>
</template>
