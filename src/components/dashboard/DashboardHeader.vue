<template>
  <div class="mb-2 flex items-start justify-between gap-4">
    <div class="flex items-center gap-3">
      <h1 class="text-xl font-bold tracking-tight text-white">Easy Flow</h1>
      <span class="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-500">
        {{ count }} saved
      </span>
    </div>

    <div class="relative flex items-center gap-2">
      <div class="relative flex items-center">
        <button
          class="rounded p-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
          type="button"
          title="Search bookmarks"
          @click="toggleSearch"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <div
          class="overflow-hidden transition-all duration-200"
          :class="isSearchOpen ? 'ml-2 w-48 opacity-100 sm:w-56' : 'w-0 opacity-0'"
        >
          <input
            ref="searchInputRef"
            :value="searchQuery"
            class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            placeholder="Search by title or URL…"
            @blur="handleSearchBlur"
            @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
            @keydown.enter="$emit('open-best-match')"
          />
        </div>
      </div>

      <button
        class="flex flex-col gap-[3px] rounded p-2 hover:bg-gray-800"
        type="button"
        @click="$emit('open-settings')"
      >
        <span class="h-[2px] w-5 bg-gray-300"></span>
        <span class="h-[2px] w-5 bg-gray-300"></span>
        <span class="h-[2px] w-5 bg-gray-300"></span>
      </button>

      <div
        v-if="isSearchOpen && searchQuery && filteredBookmarks.length"
        class="absolute right-0 top-full z-50 mt-2 w-72 rounded border border-gray-700 bg-gray-900 shadow-lg"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Bookmark } from '../../storage/storageAdapter'

const props = defineProps<{
  count: number
  filteredBookmarks: Bookmark[]
  searchQuery: string
}>()

const emit = defineEmits<{
  'open-settings': []
  'open-best-match': []
  'open-bookmark': [bookmark: Bookmark]
  'update:searchQuery': [value: string]
}>()

const isSearchOpen = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

function toggleSearch(): void {
  isSearchOpen.value = !isSearchOpen.value
  if (isSearchOpen.value) {
    requestAnimationFrame(() => {
      searchInputRef.value?.focus()
      searchInputRef.value?.select()
    })
  }
}

function focusSearch(): void {
  if (!isSearchOpen.value) {
    isSearchOpen.value = true
  }

  requestAnimationFrame(() => {
    searchInputRef.value?.focus()
    searchInputRef.value?.select()
  })
}

function handleSearchBlur(): void {
  emit('update:searchQuery', '')
  isSearchOpen.value = false
}

watch(
  () => props.searchQuery,
  (nextQuery) => {
    if (nextQuery && !isSearchOpen.value) {
      isSearchOpen.value = true
    }
  }
)

defineExpose({
  focusSearch,
})
</script>