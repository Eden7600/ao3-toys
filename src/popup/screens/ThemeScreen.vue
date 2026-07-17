<script setup lang="ts">
import {
  accentProfiles,
  type AccentId,
} from "@src/ao3_theme_injector/theme-profiles/accents";
import type { Settings } from "@src/common/settings";

const props = defineProps<{
  settings: Settings | null;
  update: (patch: Partial<Settings>) => Promise<void>;
}>();

const emit = defineEmits<{
  (e: "options"): void;
}>();

const toggleTheme = () => {
  if (!props.settings) return;

  void props.update({ ao3ThemeEnabled: !props.settings.ao3ThemeEnabled });
};

const toggleOled = () => {
  if (!props.settings) return;

  void props.update({ ao3ThemeOled: !props.settings.ao3ThemeOled });
};

const pickAccent = (accent: AccentId) => {
  void props.update({ ao3ThemeAccent: accent });
};
</script>

<template>
  <!-- Theme + OLED toggles -->
  <div class="border-t border-surface-800">
    <button
      role="switch"
      :aria-checked="settings?.ao3ThemeEnabled ?? false"
      :disabled="!settings"
      class="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-900 transition-colors disabled:opacity-50"
      @click="toggleTheme"
    >
      <i class="pi pi-moon text-gray-400 text-sm w-4"></i>
      <span class="flex-1 min-w-0">
        <span class="block text-sm font-medium">AO3 theme</span>
        <span class="block text-[11px] text-gray-500 leading-snug"
          >Injected site theme</span
        >
      </span>
      <span
        class="relative w-9 h-5 rounded-full flex-shrink-0 transition-colors"
        :class="
          settings?.ao3ThemeEnabled ? 'bg-primary-600' : 'bg-surface-700'
        "
        aria-hidden="true"
      >
        <span
          class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
          :class="settings?.ao3ThemeEnabled ? 'translate-x-4' : ''"
        ></span>
      </span>
    </button>

    <button
      role="switch"
      :aria-checked="settings?.ao3ThemeOled ?? false"
      :disabled="!settings || !settings.ao3ThemeEnabled"
      class="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-900 transition-colors disabled:opacity-50"
      @click="toggleOled"
    >
      <i class="pi pi-circle-fill text-gray-400 text-sm w-4"></i>
      <span class="flex-1 min-w-0">
        <span class="block text-sm font-medium">OLED / high contrast</span>
        <span class="block text-[11px] text-gray-500 leading-snug"
          >True-black backgrounds</span
        >
      </span>
      <span
        class="relative w-9 h-5 rounded-full flex-shrink-0 transition-colors"
        :class="settings?.ao3ThemeOled ? 'bg-primary-600' : 'bg-surface-700'"
        aria-hidden="true"
      >
        <span
          class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
          :class="settings?.ao3ThemeOled ? 'translate-x-4' : ''"
        ></span>
      </span>
    </button>
  </div>

  <!-- Accent swatches -->
  <div class="px-4 py-2.5 border-t border-surface-800">
    <span class="block text-sm font-medium mb-2">Accent color</span>
    <div class="grid grid-cols-4 gap-2" role="group" aria-label="Accent color">
      <button
        v-for="profile in accentProfiles"
        :key="profile.id"
        class="flex flex-col items-center gap-1 py-1.5 rounded-md border transition-colors disabled:opacity-40"
        :class="
          settings?.ao3ThemeAccent === profile.id
            ? 'border-primary-600 bg-surface-800'
            : 'border-surface-700 hover:bg-surface-800'
        "
        :disabled="!settings || !settings.ao3ThemeEnabled"
        :aria-pressed="settings?.ao3ThemeAccent === profile.id"
        @click="pickAccent(profile.id)"
      >
        <span
          class="w-5 h-5 rounded-full border border-black/40"
          :style="{ background: profile.swatch }"
          aria-hidden="true"
        ></span>
        <span class="text-[10px] text-gray-400">{{ profile.label }}</span>
      </button>
    </div>
  </div>

  <!-- Footer -->
  <div class="p-3 border-t border-surface-800">
    <button
      class="w-full px-3 py-2 flex items-center justify-center gap-2 bg-surface-800 hover:bg-surface-700 rounded-md text-sm font-medium transition-colors"
      @click="emit('options')"
    >
      <i class="pi pi-palette"></i>
      Full customization in Options
    </button>
  </div>
</template>
