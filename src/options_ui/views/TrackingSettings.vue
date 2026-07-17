<script setup lang="ts">
import SettingsToggle from "@src/options_ui/components/SettingsToggle.vue";
import { useOptionsSettings } from "@src/options_ui/useOptionsSettings";

const { settings } = useOptionsSettings("TrackingSettings");
</script>

<template>
  <div class="p-4 bg-surface-900 rounded-lg flex items-center justify-between">
    <div class="flex flex-col">
      <h1 class="text-2xl font-bold text-white">Reading History</h1>
      <p class="text-gray-400 text-lg">
        Remember what you've read, how far you got, and pick up where you left off
      </p>
    </div>
  </div>

  <div class="px-4 pb-4 bg-surface-900 rounded-lg mt-3">
    <div class="divide-y divide-surface-800 text-white">
      <SettingsToggle
        v-model="settings.trackVisitedWorks"
        label="Track Visited Works"
        description="Remember works you've read and your chapter progress. A page only counts as visited once you've actually read into the chapter — just opening a tab doesn't count"
      />

      <SettingsToggle
        v-model="settings.showSubscriptionStatus"
        label="Show Reading Status on Listings"
        description="Highlight subscribed and visited works in listings, with badges for when you subscribed, when you last visited, your chapter progress, and fresh chapters"
      />

      <SettingsToggle
        v-model="settings.showChapterProgress"
        label="Show Chapter Progress on Works"
        description="Show your last and highest read chapter while reading, with a button to reset progress to the current chapter"
      />

      <SettingsToggle
        v-model="settings.showIgnoreControl"
        label="Show Ignore Button on Works"
        description="Add an ignore toggle to work pages; ignored works are hidden from listings using your hide behavior settings"
      />

      <SettingsToggle
        v-model="settings.trackReadingPosition"
        label="Track Reading Position"
        description="Remember how far into a chapter you scrolled, so you can pick up mid-chapter where you left off"
      />

      <SettingsToggle
        v-model="settings.showResumePrompt"
        label="Offer to Resume Reading"
        description="Show a 'pick up where you left off' prompt on works with a saved reading position"
      />
    </div>
  </div>

  <div class="px-4 py-3 bg-surface-900 rounded-lg mt-3">
    <p class="text-gray-400 text-sm">
      Reading history is stored in this browser. Use
      <RouterLink to="/export" class="text-blue-400 hover:underline">Import / Export</RouterLink>
      to back it up or move it to another browser.
    </p>
  </div>
</template>
