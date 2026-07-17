<script setup lang="ts">
import { RouterLink } from "vue-router";

defineProps<{
  label: string;
  to: string;
}>();
</script>

<template>
  <li>
    <RouterLink
      :to="to"
      v-slot="{ isActive }"
      class="flex items-center py-2 px-3 text-base font-medium rounded-lg hover:bg-surface-700 dark:text-white group"
      active-class="bg-surface-200 dark:bg-surface-800"
    >
      <slot></slot>
      <span class="ml-3">{{ label }}</span>
    </RouterLink>
  </li>
</template>
