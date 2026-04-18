<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between rounded-sm bg-gray-800 px-2 py-1">
      <div class="flex min-w-0 items-center gap-2">
        <button
          class="cursor-grab text-xs text-gray-500 active:cursor-grabbing"
          data-collection-drag-handle
          title="Drag group"
          type="button"
        >
          ⋮⋮
        </button>
        <h3 class="truncate text-sm font-semibold tracking-wide text-gray-100">
          {{ collection }}
        </h3>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500">{{ items.length }}</span>
        <button
          class="text-xs text-gray-600 transition-colors hover:text-red-400"
          title="Delete collection"
          @click="$emit('delete-collection', collection)"
        >
          ✕
        </button>
      </div>
    </div>

    <draggable
      v-model="localItems"
      item-key="id"
      tag="ul"
      class="min-h-10 rounded-sm"
      group="bookmarks"
      ghost-class="opacity-40"
      handle="[data-bookmark-drag-handle]"
      @change="emitBookmarkOrder"
    >
      <template #item="{ element }">
        <BookmarkListItem
          :bookmark="element"
          :is-compact="isCompact"
          @delete-bookmark="$emit('delete-bookmark', $event)"
        />
      </template>

      <template #footer>
        <li v-if="!localItems.length" class="py-4 text-center text-xs text-gray-600">
          No bookmarks here yet.
        </li>
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import type { Bookmark } from '../../storage/storageAdapter'
import BookmarkListItem from './BookmarkListItem.vue'

const props = defineProps<{
  collection: string
  isCompact: boolean
  items: Bookmark[]
}>()

const emit = defineEmits<{
  'delete-bookmark': [id: string]
  'delete-collection': [collection: string]
  'reorder-bookmarks': [collection: string, items: Bookmark[]]
}>()

const localItems = ref<Bookmark[]>([])

watch(
  () => props.items,
  (items) => {
    localItems.value = [...items]
  },
  { immediate: true }
)

function emitBookmarkOrder(): void {
  emit('reorder-bookmarks', props.collection, [...localItems.value])
}
</script>