<template>
  <div v-if="tags.length" class="mb-6 flex flex-wrap gap-2">
    <button
      v-for="tag in tags"
      :key="tag"
      class="rounded-full border px-2.5 py-1 text-xs transition-colors"
      :class="
        activeTag === tag
          ? 'border-blue-500 bg-blue-600 text-white'
          : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-blue-500 hover:text-gray-200'
      "
      @click="$emit('toggle-tag', tag)"
    >
      # {{ tag }}
    </button>
    <button
      v-if="activeTag"
      class="rounded-full border border-gray-700 px-2.5 py-1 text-xs text-gray-500 transition-colors hover:text-gray-300"
      @click="$emit('clear-tag')"
    >
      ✕ clear
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  activeTag: string
  tags: string[]
}>()

defineEmits<{
  'clear-tag': []
  'toggle-tag': [tag: string]
}>()
</script>