<template>
  <div
    class="flex min-w-0 items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2"
    :title="url"
  >
    <img
      v-if="faviconUrl"
      :src="faviconUrl"
      width="14"
      height="14"
      class="shrink-0 rounded-sm"
      @error="$emit('favicon-error')"
    />
    <span class="truncate text-xs text-gray-500">{{ url || '—' }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  faviconUrl: string
  url: string
}>()

defineEmits<{
  'favicon-error': []
}>()
</script>