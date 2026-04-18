<template>
  <div class="relative mb-5 flex flex-col gap-3 sm:flex-row">
    <input
      ref="searchInput"
      :value="searchQuery"
      class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
      placeholder="Search by title or URL…"
      @blur="$emit('blur-search')"
      @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      @keydown.enter="$emit('open-best-match')"
    />

    <div
      v-if="searchQuery && filteredBookmarks.length"
      class="absolute z-50 mt-11 w-1/2 rounded border border-gray-700 bg-gray-900 shadow-lg"
    >
      <ul class="max-h-64 space-y-1 overflow-y-auto p-3">
        <li
          v-for="bookmark in filteredBookmarks.slice(0, 6)"
          :key="bookmark.id"
          class="cursor-pointer text-sm font-medium hover:bg-gray-800"
          @click="$emit('open-bookmark', bookmark)"
        >
          {{ bookmark.title }}
        </li>
      </ul>
    </div>

    <div class="flex gap-2">
      <input
        :value="newCollection"
        class="w-44 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        placeholder="New collection…"
        @input="$emit('update:newCollection', ($event.target as HTMLInputElement).value)"
        @keyup.enter="$emit('create-collection')"
      />
      <button
        class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        @click="$emit('create-collection')"
      >
        + Add
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Bookmark } from '../../storage/storageAdapter'

defineProps<{
  filteredBookmarks: Bookmark[]
  newCollection: string
  searchQuery: string
}>()

defineEmits<{
  'blur-search': []
  'create-collection': []
  'open-best-match': []
  'open-bookmark': [bookmark: Bookmark]
  'update:newCollection': [value: string]
  'update:searchQuery': [value: string]
}>()

const searchInput = ref<HTMLInputElement | null>(null)

function focusSearch() {
  searchInput.value?.focus()
}

defineExpose({
  focusSearch,
})
</script>