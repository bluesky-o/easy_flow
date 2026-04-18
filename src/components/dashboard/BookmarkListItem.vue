<template>
  <li class="bookmark-drag-handle group relative flex cursor-grab select-none items-center gap-2 rounded-sm px-2 py-1 transition-colors hover:bg-gray-800 active:cursor-grabbing">
    <button
      class="shrink-0 text-xs text-gray-600 opacity-0 transition-all group-hover:opacity-100"
      title="Drag bookmark"
      type="button"
    >
      ⋮⋮
    </button>

    <img
      v-if="!isCompact"
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
        class="block cursor-grab truncate select-none text-sm text-white hover:text-blue-300 active:cursor-grabbing"
        :title="bookmark.title"
      >
        {{ bookmark.title }}
      </a>

      <div v-if="!isCompact" class="mt-0.5 flex items-center gap-2">
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
      class="shrink-0 text-xs text-gray-600 opacity-0 transition-all hover:text-blue-300 group-hover:opacity-100"
      title="Edit bookmark"
      type="button"
      @click.stop="$emit('open-edit-bookmark', bookmark.id)"
    >
      ✎
    </button>

    <button
      class="shrink-0 text-xs text-gray-600 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
      title="Remove bookmark"
      type="button"
      @click.stop="$emit('delete-bookmark', bookmark.id)"
    >
      ✕
    </button>

    <teleport to="body">
      <div v-if="isEditOpen" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="$emit('close-edit-bookmark')"></div>

        <div
          ref="popoverRef"
          class="relative z-10 w-[min(640px,95%)] max-h-[90vh] overflow-auto rounded-lg border border-gray-700 bg-gray-900 p-4 shadow-2xl"
        >
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h4 class="text-sm font-semibold text-gray-100">Edit bookmark</h4>
                <p class="mt-0.5 text-xs text-gray-500">Update the tab info and save the changes.</p>
              </div>
              <button
                class="text-sm text-gray-500 transition-colors hover:text-gray-200"
                type="button"
                @click="$emit('close-edit-bookmark')"
              >
                ✕
              </button>
            </div>

            <label class="block text-xs font-medium uppercase tracking-widest text-gray-500">
              Title
              <input
                ref="titleInputRef"
                v-model="draftTitle"
                class="mt-2 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-500"
                type="text"
                @keydown.enter.prevent
              />
            </label>

            <label class="block text-xs font-medium uppercase tracking-widest text-gray-500">
              URL
              <input
                v-model="draftUrl"
                class="mt-2 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-500"
                type="url"
                @keydown.enter.prevent
              />
            </label>

            <label class="block text-xs font-medium uppercase tracking-widest text-gray-500">
              Tags
              <input
                v-model="draftTags"
                class="mt-2 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-500"
                type="text"
                placeholder="vue, reference, dev"
                @keydown.enter.prevent
              />
            </label>

            <p v-if="errorMessage" class="text-xs text-red-400">
              {{ errorMessage }}
            </p>

            <div class="flex justify-end gap-2 pt-1">
              <button
                class="rounded border border-gray-700 px-3 py-2 text-xs text-gray-300 transition-colors hover:bg-gray-800"
                type="button"
                @click="$emit('close-edit-bookmark')"
              >
                Cancel
              </button>
              <button
                class="rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-500"
                type="button"
                @click="submitEdit"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </li>
</template>

<script setup lang="ts">
  import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import type { Bookmark } from '../../storage/storageAdapter'
  import { faviconUrl } from '../../utils/bookmarkPresentation'

const props = defineProps<{
  bookmark: Bookmark
  isEditOpen: boolean
  isCompact: boolean
}>()

const emit = defineEmits<{
  'delete-bookmark': [id: number]
  'edit-bookmark': [bookmark: Bookmark]
  'close-edit-bookmark': []
  'open-edit-bookmark': [bookmarkId: number]
}>()

const draftTitle = ref(props.bookmark.title)
const draftUrl = ref(props.bookmark.url)
const draftTags = ref((props.bookmark.tags ?? []).join(', '))
const errorMessage = ref('')
const titleInputRef = ref<HTMLInputElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
// modal is now full-screen Teleport; placement no longer required

function resetDraft(): void {
  draftTitle.value = props.bookmark.title
  draftUrl.value = props.bookmark.url
  draftTags.value = (props.bookmark.tags ?? []).join(', ')
  errorMessage.value = ''
}

function parseTags(tagText: string): string[] {
  return tagText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

async function syncEditState(): Promise<void> {
  if (!props.isEditOpen) {
    errorMessage.value = ''
    return
  }

  resetDraft()
  await nextTick()
  titleInputRef.value?.focus()
  titleInputRef.value?.select()
}

watch(
  () => props.isEditOpen,
  (isOpen) => {
    void syncEditState()
    if (!isOpen) {
      errorMessage.value = ''
    }
  },
  { immediate: true }
)

function submitEdit(): void {
  const nextUrl = draftUrl.value.trim()
  if (!nextUrl) {
    errorMessage.value = 'URL is required.'
    return
  }

  try {
    new URL(nextUrl)
  } catch {
    errorMessage.value = 'Enter a valid URL.'
    return
  }

  emit('edit-bookmark', {
    ...props.bookmark,
    title: draftTitle.value.trim() || nextUrl,
    url: nextUrl,
    groupId: props.bookmark.groupId,
    tags: parseTags(draftTags.value),
  })

  emit('close-edit-bookmark')
}

function handleDocumentClick(event: MouseEvent): void {
  if (!props.isEditOpen) return

  const target = event.target as Node | null
  if (!target) return

  if (popoverRef.value?.contains(target)) return

  emit('close-edit-bookmark')
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>