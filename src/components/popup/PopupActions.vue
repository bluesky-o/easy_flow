<template>
  <div class="flex gap-2 px-4 pb-4">
    <button
      class="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="isLoading || !url"
      @click="$emit('save')"
    >
      {{ isLoading ? 'Saving…' : 'Save' }}
    </button>
    <button
      class="flex-1 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-gray-800 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
      :disabled="isLoading || !isAlreadySaved"
      @click="$emit('remove')"
    >
      Remove
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isAlreadySaved: boolean
  isLoading: boolean
  url: string
}>()

defineEmits<{
  remove: []
  save: []
}>()
</script>