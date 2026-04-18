<template>
  <div class="flex flex-col gap-2">
    <div class="collection-drag-handle group flex cursor-grab select-none items-center justify-between rounded-sm bg-gray-800 px-2 py-1 active:cursor-grabbing">
      <div class="flex min-w-0 items-center gap-2">
        <button
          class="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto"
          title="Drag group"
          type="button"
        >
          ⋮⋮
        </button>
        <div class="min-w-0">
          <template v-if="!isEditing">
            <h3
              class="truncate text-sm font-semibold tracking-wide text-gray-100"
              @dblclick.stop="startEditing"
            >
              {{ collection }}
            </h3>
          </template>
          <template v-else>
            <input
              ref="inputRef"
              v-model="editingName"
              @mousedown.stop
              @click.stop
              @keydown.enter.prevent="submitRename"
              @keydown.esc.prevent="cancelEditing"
              @blur="submitRename"
              class="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-100 outline-none focus:border-blue-500"
              type="text"
            />
          </template>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto hover:text-blue-300"
          :title="isCollapsed ? 'Expand group' : 'Collapse group'"
          type="button"
          @click.stop="$emit('toggle-collapse', collection)"
        >
          <svg
            class="h-4 w-4 transition-transform duration-200"
            :class="isCollapsed ? 'rotate-180' : 'rotate-0'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <button
          class="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto hover:text-blue-300"
          title="Edit collection"
          type="button"
          @click.stop.prevent="startEditing"
        >
          ✎
        </button>
        <button
          class="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto hover:text-red-400"
          title="Delete collection"
          type="button"
          @click.stop="$emit('delete-collection', collection)"
        >
          ✕
        </button>
        <span class="text-xs text-gray-500 ml-1">{{ items.length }}</span>
      </div>
    </div>

    <Transition name="group-collapse">
      <div v-show="!isCollapsed" class="overflow-hidden">
        <draggable
          v-model="localItems"
          item-key="id"
          tag="ul"
          class="min-h-10 rounded-sm"
          :disabled="isEditing"
          group="bookmarks"
          filter="button,input"
          ghost-class="opacity-40"
          handle=".bookmark-drag-handle"
          @change="emitBookmarkOrder"
        >
          <template #item="{ element }">
            <BookmarkListItem
              :bookmark="element"
              :is-compact="isCompact"
              :is-edit-open="editingBookmarkId === element.id"
              @close-edit-bookmark="$emit('close-bookmark-editor')"
              @delete-bookmark="$emit('delete-bookmark', $event)"
              @edit-bookmark="$emit('edit-bookmark', $event)"
              @open-edit-bookmark="$emit('open-bookmark-editor', $event)"
            />
          </template>

        </draggable>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import draggable from 'vuedraggable'
import type { Bookmark } from '../../storage/storageAdapter'
import BookmarkListItem from './BookmarkListItem.vue'

const editingName = ref('')
const isEditing = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const props = defineProps<{
  collection: string
  editingBookmarkId: number | null
  isCollapsed: boolean
  isCompact: boolean
  items: Bookmark[]
}>()

const emit = defineEmits<{
  'delete-bookmark': [id: number]
  'delete-collection': [collection: string]
  'edit-bookmark': [bookmark: Bookmark]
  'close-bookmark-editor': []
  'toggle-collapse': [collection: string]
  'open-bookmark-editor': [bookmarkId: number]
  'reorder-bookmarks': [collection: string, items: Bookmark[]]
  'edit-collection': [oldName: string, newName: string]
  'editing-collection-change': [isEditing: boolean]
}>()

const localItems = ref<Bookmark[]>([])

watch(
  () => props.items,
  (items) => {
    localItems.value = [...items]
  },
  { immediate: true }
)

watch(
  () => props.collection,
  (next) => {
    editingName.value = next
    isEditing.value = false
  },
  { immediate: true }
)

function startEditing(): void {
  editingName.value = props.collection
  isEditing.value = true
  emit('editing-collection-change', true)
}

watch(isEditing, (open) => {
  if (open) {
    void nextTick(() => {
      inputRef.value?.focus()
      inputRef.value?.select()
    })
  }
})

function cancelEditing(): void {
  isEditing.value = false
  editingName.value = props.collection
  emit('editing-collection-change', false)
}

function submitRename(): void {
  const next = editingName.value.trim()
  if (!next || next === props.collection) {
    cancelEditing()
    return
  }

  emit('edit-collection', props.collection, next)
  isEditing.value = false
  emit('editing-collection-change', false)
}

function emitBookmarkOrder(): void {
  emit('reorder-bookmarks', props.collection, [...localItems.value])
}
</script>

<style scoped>
.group-collapse-enter-active,
.group-collapse-leave-active {
  overflow: hidden;
  transition:
    max-height 220ms ease,
    opacity 180ms ease,
    transform 220ms ease;
}

.group-collapse-enter-from,
.group-collapse-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-4px);
}

.group-collapse-enter-to,
.group-collapse-leave-from {
  max-height: 1000px;
  opacity: 1;
  transform: translateY(0);
}
</style>