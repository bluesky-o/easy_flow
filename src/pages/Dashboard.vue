<template>
  <div class="min-h-screen bg-gray-950 text-gray-200 p-6 font-sans">
    <DashboardSettingsPanel
      v-model="isSettingsOpen"
      :is-compact="isCompact"
      @toggle-compact="toggleCompactMode"
    />

    <DashboardHeader
      ref="headerRef"
      :count="bookmarks.length"
      :filtered-bookmarks="filteredBookmarks"
      :search-query="searchQuery"
      @reload-page="reloadPage"
      @open-settings="isSettingsOpen = true"
      @open-best-match="openBestMatch"
      @open-bookmark="openBookmark"
      @update:searchQuery="searchQuery = $event"
    />

    <div
      v-if="errorMsg"
      class="mb-4 text-sm bg-red-900 border border-red-700 text-red-300 px-3 py-2 rounded"
    >
      {{ errorMsg }}
    </div>

    <DashboardToolbar />

    <TagFilterBar
      v-if="!isCompact"
      :active-tag="activeTag"
      :tags="allTags"
      @clear-tag="activeTag = ''"
      @toggle-tag="toggleTag"
    />

    <div v-if="isLoading" class="text-center py-16 text-gray-500 text-sm">
      Loading…
    </div>

    <draggable
      v-else
      v-model="collections"
      :item-key="collectionKey"
      filter="a,button,input"
      tag="div"
      :class="['grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5', isCompact ? 'mt-10' : '']"
      :disabled="isEditingCollection"
      ghost-class="opacity-40"
      handle=".collection-drag-handle"
      @change="reorderCollections"
    >
      <template #item="{ element }">
        <CollectionColumn
          :collection="element.name"
          :is-compact="isCompact"
          :items="collectionItems[element.name] ?? []"
          :is-collapsed="element.isCollapsed"
          :editing-bookmark-id="editingBookmarkId"
          @delete-bookmark="deleteBookmark"
          @delete-collection="deleteCollection"
          @close-bookmark-editor="closeBookmarkEditor"
          @open-bookmark-editor="openBookmarkEditor"
          @edit-bookmark="updateBookmark"
          @toggle-collapse="toggleCollectionCollapse"
          @edit-collection="renameCollection"
          @editing-collection-change="isEditingCollection = $event"
          @reorder-bookmarks="reorderBookmarksInCollection"
        />
      </template>
    </draggable>

    <div class="fixed bottom-5 left-5 z-50 flex flex-row items-center gap-0">
      <div class="relative flex items-center">
        <button
          class="flex h-12 w-12 items-center justify-center rounded-l-md border border-gray-700 bg-gray-900 text-2xl text-blue-300 shadow-lg transition-colors hover:border-blue-500 hover:bg-gray-800 hover:text-blue-200"
          type="button"
          title="New collection"
          @click="toggleQuickCollection"
        >
          +
        </button>

        <transition name="quick-fade">
          <form
            v-if="isQuickCollectionOpen"
            class="absolute bottom-full left-0 mb-2 w-72 rounded-xl border border-gray-700 bg-gray-900 p-3 shadow-2xl z-50"
            @submit.prevent="submitQuickCollection"
          >
            <label class="block text-xs font-medium uppercase tracking-widest text-gray-500">
              New collection
              <input
                ref="quickCollectionInputRef"
                v-model="quickCollectionName"
                class="mt-2 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-500"
                placeholder="Collection name"
                type="text"
                @keydown.esc.prevent="closeQuickCollection"
              />
            </label>
            <div class="mt-3 flex justify-end gap-2">
              <button
                class="rounded border border-gray-700 px-3 py-2 text-xs text-gray-300 transition-colors hover:bg-gray-800"
                type="button"
                @click="closeQuickCollection"
              >
                Esc
              </button>
              <button
                class="rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-500"
                type="submit"
              >
                Save
              </button>
            </div>
          </form>
        </transition>
      </div>
      <div class="relative flex items-center">
        <button
          class="flex h-12 w-12 items-center justify-center rounded-r-md border border-gray-700 bg-gray-900 text-lg text-blue-300 shadow-lg transition-colors hover:border-blue-500 hover:bg-gray-800 hover:text-blue-200"
          type="button"
          title="New tab"
          @click="toggleQuickBookmark"
        >
          ↗
        </button>

        <transition name="quick-fade">
          <form
            v-if="isQuickBookmarkOpen"
            class="absolute bottom-full left-0 mb-2 w-[22rem] rounded-xl border border-gray-700 bg-gray-900 p-3 shadow-2xl sm:w-[26rem] z-50"
            @submit.prevent="submitQuickBookmark"
          >
            <div class="grid gap-2">
              <label class="block text-xs font-medium uppercase tracking-widest text-gray-500">
                Title
                <input
                  ref="quickBookmarkTitleRef"
                  v-model="quickBookmarkTitle"
                  class="mt-2 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-500"
                  placeholder="Page title"
                  type="text"
                  @keydown.esc.prevent="closeQuickBookmark"
                />
              </label>

              <label class="block text-xs font-medium uppercase tracking-widest text-gray-500">
                URL
                <input
                  v-model="quickBookmarkUrl"
                  class="mt-2 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-500"
                  placeholder="https://example.com"
                  type="url"
                  @keydown.esc.prevent="closeQuickBookmark"
                />
              </label>

              <label class="block text-xs font-medium uppercase tracking-widest text-gray-500">
                Group
                <select
                  v-model="quickBookmarkGroupId"
                  class="mt-2 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-500"
                  @keydown.esc.prevent="closeQuickBookmark"
                >
                  <option value="">Uncategorised</option>
                  <option v-for="collection in collections" :key="collection.name" :value="collection.name">
                    {{ collection.name }}
                  </option>
                </select>
              </label>

              <label class="block text-xs font-medium uppercase tracking-widest text-gray-500">
                Tags
                <input
                  v-model="quickBookmarkTags"
                  class="mt-2 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-500"
                  placeholder="tag1, tag2"
                  type="text"
                  @keydown.esc.prevent="closeQuickBookmark"
                />
              </label>
            </div>

            <div class="mt-3 flex justify-end gap-2">
              <button
                class="rounded border border-gray-700 px-3 py-2 text-xs text-gray-300 transition-colors hover:bg-gray-800"
                type="button"
                @click="closeQuickBookmark"
              >
                Esc
              </button>
              <button
                class="rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-500"
                type="submit"
              >
                Save
              </button>
            </div>
          </form>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, onMounted, onBeforeUnmount } from 'vue'
import draggable from 'vuedraggable'
import CollectionColumn from '../components/dashboard/CollectionColumn.vue'
import DashboardHeader from '../components/dashboard/DashboardHeader.vue'
import DashboardSettingsPanel from '../components/dashboard/DashboardSettingsPanel.vue'
import DashboardToolbar from '../components/dashboard/DashboardToolbar.vue'
import TagFilterBar from '../components/dashboard/TagFilterBar.vue'
import { useDashboard } from '../composables/useDashboard'

type DashboardHeaderInstance = {
  focusSearch: () => void
}

const headerRef = ref<DashboardHeaderInstance | null>(null)
const editingBookmarkId = ref<number | null>(null)
const isEditingCollection = ref(false)
const isQuickCollectionOpen = ref(false)
const isQuickBookmarkOpen = ref(false)
const quickCollectionName = ref('')
const quickBookmarkTitle = ref('')
const quickBookmarkUrl = ref('')
const quickBookmarkGroupId = ref('')
const quickBookmarkTags = ref('')
const quickCollectionInputRef = ref<HTMLInputElement | null>(null)
const quickBookmarkTitleRef = ref<HTMLInputElement | null>(null)

const collectionKey = (collection: { name: string }) => collection.name

function openBookmarkEditor(bookmarkId: number): void {
  editingBookmarkId.value = bookmarkId
}

function closeBookmarkEditor(): void {
  editingBookmarkId.value = null
}

function reloadPage(): void {
  window.location.reload()
}

function closeQuickCollection(): void {
  isQuickCollectionOpen.value = false
  quickCollectionName.value = ''
}

function closeQuickBookmark(): void {
  isQuickBookmarkOpen.value = false
  quickBookmarkTitle.value = ''
  quickBookmarkUrl.value = ''
  quickBookmarkGroupId.value = ''
  quickBookmarkTags.value = ''
}

function toggleQuickCollection(): void {
  isQuickBookmarkOpen.value = false
  if (isQuickCollectionOpen.value) {
    closeQuickCollection()
    return
  }

  isQuickCollectionOpen.value = true
  void nextTick(() => {
    quickCollectionInputRef.value?.focus()
    quickCollectionInputRef.value?.select()
  })
}

function toggleQuickBookmark(): void {
  isQuickCollectionOpen.value = false
  if (isQuickBookmarkOpen.value) {
    closeQuickBookmark()
    return
  }

  isQuickBookmarkOpen.value = true
  void nextTick(() => {
    quickBookmarkTitleRef.value?.focus()
    quickBookmarkTitleRef.value?.select()
  })
}

function handleGlobalKeydown(e: KeyboardEvent): void {
  if (e.defaultPrevented) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const active = document.activeElement as HTMLElement | null
  const tag = active?.tagName?.toLowerCase() ?? ''
  if (tag === 'input' || tag === 'textarea' || active?.isContentEditable) return

  if (e.key === 'm') {
    e.preventDefault()
    toggleQuickCollection()
  } else if (e.key === 'n') {
    e.preventDefault()
    toggleQuickBookmark()
  }
}

onMounted(() => window.addEventListener('keydown', handleGlobalKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleGlobalKeydown))

async function submitQuickCollection(): Promise<void> {
  const saved = await createCollectionFromName(quickCollectionName.value)
  if (saved) {
    closeQuickCollection()
  }
}

async function submitQuickBookmark(): Promise<void> {
  const saved = await createBookmarkFromFields(
    quickBookmarkTitle.value,
    quickBookmarkUrl.value,
    quickBookmarkGroupId.value,
    quickBookmarkTags.value
  )

  if (saved) {
    closeQuickBookmark()
  }
}

const {
  activeTag,
  allTags,
  bookmarks,
  collectionItems,
  collections,
  createCollectionFromName,
  createBookmarkFromFields,
  deleteBookmark,
  deleteCollection,
  errorMsg,
  filteredBookmarks,
  isCompact,
  isLoading,
  isSettingsOpen,
  openBestMatch,
  openBookmark,
  toggleCollectionCollapse,
  updateBookmark,
  reorderBookmarksInCollection,
  reorderCollections,
  searchQuery,
  toggleTag,
  renameCollection,
  toggleCompactMode,
} = useDashboard(() => {
  headerRef.value?.focusSearch()
})
</script>

<style scoped>
.quick-fade-enter-active,
.quick-fade-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.quick-fade-enter-from,
.quick-fade-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}
</style>
