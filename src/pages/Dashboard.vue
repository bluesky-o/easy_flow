<template>
  <div class="min-h-screen bg-gray-950 text-gray-200 p-6 font-sans">
    <DashboardSettingsPanel
      v-model="isSettingsOpen"
      :is-compact="isCompact"
      @toggle-compact="isCompact = !isCompact"
    />

    <DashboardHeader
      :count="bookmarks.length"
      @open-settings="isSettingsOpen = true"
    />

    <div
      v-if="errorMsg"
      class="mb-4 text-sm bg-red-900 border border-red-700 text-red-300 px-3 py-2 rounded"
    >
      {{ errorMsg }}
    </div>

    <DashboardToolbar
      ref="toolbarRef"
      :filtered-bookmarks="filteredBookmarks"
      :new-collection="newCollection"
      :search-query="searchQuery"
      @blur-search="handleBlur"
      @create-collection="createCollection"
      @open-best-match="openBestMatch"
      @open-bookmark="openBookmark"
      @update:new-collection="newCollection = $event"
      @update:search-query="searchQuery = $event"
    />

    <TagFilterBar
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
      tag="div"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      ghost-class="opacity-40"
      handle="[data-collection-drag-handle]"
      @change="reorderCollections"
    >
      <template #item="{ element }">
        <CollectionColumn
          :collection="element"
          :is-compact="isCompact"
          :items="collectionItems[element] ?? []"
          @delete-bookmark="deleteBookmark"
          @delete-collection="deleteCollection"
          @reorder-bookmarks="reorderBookmarksInCollection"
        />
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import draggable from 'vuedraggable'
import CollectionColumn from '../components/dashboard/CollectionColumn.vue'
import DashboardHeader from '../components/dashboard/DashboardHeader.vue'
import DashboardSettingsPanel from '../components/dashboard/DashboardSettingsPanel.vue'
import DashboardToolbar from '../components/dashboard/DashboardToolbar.vue'
import TagFilterBar from '../components/dashboard/TagFilterBar.vue'
import { useDashboard } from '../composables/useDashboard'

type DashboardToolbarInstance = {
  focusSearch: () => void
}

const toolbarRef = ref<DashboardToolbarInstance | null>(null)

const collectionKey = (collection: string) => collection

const {
  activeTag,
  allTags,
  bookmarks,
  collectionItems,
  collections,
  createCollection,
  deleteBookmark,
  deleteCollection,
  errorMsg,
  filteredBookmarks,
  handleBlur,
  isCompact,
  isLoading,
  isSettingsOpen,
  newCollection,
  openBestMatch,
  openBookmark,
  reorderBookmarksInCollection,
  reorderCollections,
  searchQuery,
  toggleTag,
} = useDashboard(() => {
  toolbarRef.value?.focusSearch()
})
</script>
