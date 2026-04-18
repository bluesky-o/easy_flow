<template>
  <div class="flex items-center justify-between border-b border-gray-800 px-4 pt-4 pb-3">
    <div class="flex items-center gap-2">
      <span class="text-sm font-semibold tracking-tight text-white">Easy Flow</span>
    </div>
    <span
      v-if="isAlreadySaved"
      class="rounded-full border border-emerald-800 bg-emerald-900 px-2 py-0.5 text-xs text-emerald-400"
    >
      ✓ Saved
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isAlreadySaved: boolean
}>()
</script>