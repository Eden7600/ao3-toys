<script setup lang="ts">
import Checkbox from "primevue/checkbox";

defineProps({
  modelValue: Boolean,
  label: String,
  description: String,
  id: String,
});

const model = defineModel<boolean>();
</script>

<template>
  <div class="flex items-center py-2.5 px-2">
    <Checkbox :inputId="id" v-model="model" :binary="true" size="small" />
    <label :for="id" class="ml-2 text-sm text-gray-300 cursor-pointer">
      {{ label }}
    </label>
  </div>
</template>
