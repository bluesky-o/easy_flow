<template>
  <li class="group flex items-center gap-2 rounded-sm px-2 py-1 transition-colors hover:bg-gray-800">
    <button
      class="shrink-0 cursor-grab text-xs text-gray-600 opacity-0 transition-all active:cursor-grabbing group-hover:opacity-100"
      title="Drag bookmark"
      data-bookmark-drag-handle
      type="button"
    >
      ⋮⋮
    </button>

    <img
      v-if="isCompact"
      :src="faviconUrl(bookmark.url)"
      width="16"
      height="16"
      class="shrink-0 rounded-sm"
      @error="($event.target as HTMLImageElement).style.display = 'none'"
    />

    <div v-else class="rounded-full bg-gray-50 p-0.5"></div>

    <div class="min-w-0 flex-1">
      <a
        :href="bookmark.url"
        target="_blank"
        rel="noopener noreferrer"
        class="block truncate text-sm text-white hover:text-blue-300"
        :title="bookmark.title"
      >
        {{ bookmark.title }}
      </a>

      <div v-if="isCompact" class="mt-0.5 flex items-center gap-2">
        <span class="truncate text-xs text-gray-600">{{ formatBookmarkDate(bookmark.createdAt) }}</span>
        <span
          v-for="tag in (bookmark.tags ?? []).slice(0, 2)"
          :key="tag"
          class="rounded-full bg-gray-700 px-1.5 py-0.5 text-xs text-gray-500"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <button
      class="shrink-0 text-xs text-gray-600 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
      title="Remove bookmark"
      @click="$emit('delete-bookmark', bookmark.id)"
    >
      ✕
    </button>
  </li>
</template>

<script setup lang="ts">
import type { Bookmark } from '../../storage/storageAdapter'
import { faviconUrl, formatBookmarkDate } from '../../utils/bookmarkPresentation'

defineProps<{
  bookmark: Bookmark
  isCompact: boolean
}>()

defineEmits<{
  'delete-bookmark': [id: string]
}>()
</script>