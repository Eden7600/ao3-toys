<script setup lang="ts">
import {
  progressBarFillBackground,
  progressBarGeometry,
  progressBarLabelText,
  remainingReadingMinutes,
} from "@src/common/progress-bar";
import type { Settings } from "@src/common/settings";
import { computed, ref } from "vue";

// Renders the real bar math (geometry, fill, label) inside a mock reading
// page, absolutely positioned instead of fixed. The theme-accent fill is
// mapped onto the options UI's own primary tokens so "Theme accent"
// previews truthfully.

const props = defineProps<{ settings: Settings }>();

const previewProgress = ref(42);

// Fake work: marker positions and word counts driving the time label
const DEMO_MARKERS = [32, 68];
const DEMO_WORK_WORDS = 9000;
const DEMO_CHAPTER_WORDS = 3200;

// Varied skeleton line widths, fixed so the preview doesn't shimmer
const SKELETON_WIDTHS = [92, 100, 97, 88, 100, 95, 62, 90, 100, 84];

const geometry = computed(() =>
  progressBarGeometry(
    props.settings.progressBarPosition,
    props.settings.progressBarThickness,
    props.settings.progressBarOffset,
  ),
);

const accentVars = {
  "--ao3-accent-color": "var(--color-primary-500)",
  "--ao3-accent-color-hover": "var(--color-primary-600)",
  "--box-background-color": "var(--color-surface-800)",
  "--box-border-color-subtle": "var(--color-surface-700)",
  "--text-color": "var(--color-surface-100)",
};

const trackStyle = computed(() => ({
  position: "absolute",
  ...geometry.value.anchor,
  backgroundColor: "#e2e8f0",
  opacity: "0.25",
  cursor: props.settings.progressBarClickToSeek ? "pointer" : "default",
}));

const fillStyle = computed(() => ({
  position: "absolute",
  ...geometry.value.anchor,
  [geometry.value.fillProperty]: `${String(previewProgress.value)}%`,
  background: progressBarFillBackground(
    props.settings.progressBarStyle,
    geometry.value.gradientDirection,
    props.settings.progressBarColor,
  ),
  pointerEvents: "none",
}));

const showMarkers = computed(
  () =>
    props.settings.progressBarShowChapterMarkers &&
    props.settings.progressBarScope === "work",
);

const markerStyle = (position: number) => ({
  position: "absolute",
  ...geometry.value.anchor,
  [geometry.value.fillProperty]: `${String(props.settings.progressBarThickness)}px`,
  [geometry.value.markerOffsetProperty]: `${String(position)}%`,
  [geometry.value.markerBorderProperty]: "2px solid #64748b",
  opacity: "0.7",
  backgroundColor: "rgba(0,0,0,0)",
  pointerEvents: "none",
});

const labelText = computed(() =>
  progressBarLabelText(
    props.settings.progressBarLabelMode,
    previewProgress.value,
    remainingReadingMinutes(
      props.settings.progressBarScope === "chapter"
        ? DEMO_CHAPTER_WORDS
        : DEMO_WORK_WORDS,
      previewProgress.value,
      props.settings.readingWpm,
    ),
  ),
);

const labelStyle = computed(() => ({
  position: "absolute",
  ...geometry.value.labelAnchor,
  [geometry.value.markerOffsetProperty]: `${String(Math.min(Math.max(previewProgress.value, 8), 92))}%`,
  transform: geometry.value.labelCenterTransform,
  padding: "1px 8px",
  borderRadius: "999px",
  fontSize: "11px",
  lineHeight: "1.6",
  whiteSpace: "nowrap",
  background: "var(--box-background-color)",
  color: "var(--text-color)",
  border: "1px solid var(--box-border-color-subtle)",
  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
  pointerEvents: "none",
}));

// Mirrors the content script's click-to-seek, scoped to the preview box
const onTrackClick = (event: MouseEvent) => {
  if (!props.settings.progressBarClickToSeek) return;

  const track = event.currentTarget as HTMLElement;
  const rect = track.getBoundingClientRect();
  const fraction = geometry.value.horizontal
    ? (event.clientX - rect.left) / rect.width
    : (event.clientY - rect.top) / rect.height;

  previewProgress.value = Math.round(
    Math.min(Math.max(fraction, 0), 1) * 100,
  );
};
</script>

<template>
  <div class="py-4">
    <!-- Mock reading page -->
    <div
      class="relative overflow-hidden rounded-lg border border-surface-700 bg-surface-950 h-48"
      :class="{ 'opacity-60': !settings.enableProgressBar }"
      :style="accentVars"
    >
      <!-- Skeleton text -->
      <div class="px-10 py-8 flex flex-col gap-2.5" aria-hidden="true">
        <div
          v-for="(width, index) in SKELETON_WIDTHS"
          :key="index"
          class="h-2 rounded bg-surface-800"
          :style="{ width: `${width}%` }"
        ></div>
      </div>

      <template v-if="settings.enableProgressBar">
        <div :style="trackStyle" @click="onTrackClick"></div>
        <div :style="fillStyle"></div>
        <template v-if="showMarkers">
          <div
            v-for="position in DEMO_MARKERS"
            :key="position"
            role="presentation"
            :style="markerStyle(position)"
          ></div>
        </template>
        <div v-if="labelText && previewProgress > 0" :style="labelStyle">
          {{ labelText }}
        </div>
      </template>
      <p
        v-else
        class="absolute inset-0 flex items-center justify-center text-sm text-gray-500"
      >
        Progress bar disabled
      </p>
    </div>

    <!-- Scrub control -->
    <div class="flex items-center gap-3 mt-3">
      <label
        for="progress-bar-preview-scrub"
        class="text-sm text-gray-400 shrink-0"
      >
        Preview progress
      </label>
      <input
        id="progress-bar-preview-scrub"
        v-model.number="previewProgress"
        type="range"
        min="0"
        max="100"
        :disabled="!settings.enableProgressBar"
        class="w-full accent-primary-500 disabled:opacity-50"
      />
      <span class="text-sm text-gray-400 w-10 text-right shrink-0"
        >{{ previewProgress }}%</span
      >
    </div>
  </div>
</template>
