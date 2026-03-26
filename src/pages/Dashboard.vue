<template>
  <div class="min-h-screen bg-gray-950 text-gray-200 p-6 font-sans">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <h1 class="text-xl font-bold text-white tracking-tight">Easy Flow</h1>
        <span class="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
          {{ bookmarks.length }} saved
        </span>
      </div>
    </div>

    <!-- Error banner -->
    <div
      v-if="errorMsg"
      class="mb-4 text-sm bg-red-900 border border-red-700 text-red-300 px-3 py-2 rounded"
    >
      {{ errorMsg }}
    </div>

    <!-- Toolbar: search + new collection -->
    <div class="flex flex-col sm:flex-row gap-3 mb-5">
      <!-- Search -->
      <input
        ref="searchInput"
        v-model="searchQuery"
        placeholder="Search by title or URL…"
        class="flex-1 bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none px-3 py-2 rounded text-sm text-gray-200 placeholder-gray-500"
      />
      <!-- New collection -->
      <div class="flex gap-2">
        <input
          v-model="newCollection"
          placeholder="New collection…"
          @keyup.enter="createCollection"
          class="bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none px-3 py-2 rounded text-sm text-gray-200 placeholder-gray-500 w-44"
        />
        <button
          @click="createCollection"
          class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          + Add
        </button>
        <button @click="isCompact = !isCompact" class="bg-rose-400 hover:bg-rose-500 px-3 font-medium text-sm rounded-sm">
          Compact
        </button>

      </div>
    </div>

    <!-- Tag filter pills -->
    <div v-if="allTags.length" class="flex flex-wrap gap-2 mb-6">
      <button
        v-for="tag in allTags"
        :key="tag"
        @click="toggleTag(tag)"
        :class="[
          'text-xs px-2.5 py-1 rounded-full border transition-colors',
          activeTag === tag
            ? 'bg-blue-600 border-blue-500 text-white'
            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-blue-500 hover:text-gray-200'
        ]"
      >
        # {{ tag }}
      </button>
      <button
        v-if="activeTag"
        @click="activeTag = ''"
        class="text-xs px-2.5 py-1 rounded-full border border-gray-700 text-gray-500 hover:text-gray-300 transition-colors"
      >
        ✕ clear
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="text-center py-16 text-gray-500 text-sm">
      Loading…
    </div>

    <!-- Collections grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div
        v-for="(items, collection) in groupedBookmarks"
        :key="collection"
        class="flex flex-col gap-2"
      >
        <!-- Collection header -->
        <div class="flex items-center justify-between bg-slate-600 px-2 py-1 rounded-sm">
          <h3 class="font-semibold text-gray-100 text-sm tracking-wide">
            {{ collection }}
          </h3>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500">{{ items.length }}</span>
            <button
              @click="deleteCollection(String(collection))"
              class="text-gray-600 hover:text-red-400 text-xs transition-colors"
              title="Delete collection"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Bookmark items -->
        <ul v-if="items.length">
          <li
            v-for="bookmark in items"
            :key="bookmark.id"
            class="group flex items-center gap-2 rounded-sm px-2 py-1 hover:bg-gray-800 transition-colors"
          >
            <!-- Favicon -->
            <img v-if="isCompact"
              :src="faviconUrl(bookmark.url)"
              width="16"
              height="16"
              class="shrink-0 rounded-sm"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />

            <div v-else class="bg-gray-50 p-0.5 rounded-full"></div>

            <!-- Title + meta -->
            <div class="flex-1 min-w-0">
              <a
                :href="bookmark.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-white hover:text-blue-300 truncate block"
                :title="bookmark.title"
              >
                {{ bookmark.title }}
              </a>

              <div v-if="isCompact" class="flex items-center gap-2 mt-0.5">
                <span class="text-xs text-gray-600 truncate">{{ formatDate(bookmark.createdAt) }}</span>
                <span
                  v-for="tag in (bookmark.tags ?? []).slice(0, 2)"
                  :key="tag"
                  class="text-xs text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded-full"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- Delete -->
            <button
              @click="deleteBookmark(bookmark.id)"
              class="shrink-0 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
              title="Remove bookmark"
            >
              ✕
            </button>
          </li>
        </ul>

        <!-- Empty collection -->
        <p v-else class="text-xs text-gray-600 text-center py-4">
          No bookmarks here yet.
        </p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { fetchBookmarks, removeBookmark } from '../core/bookmarkService'
import { saveCollection, getCollections, removeCollection } from '../services/collections'
import type { Bookmark } from '../storage/storageAdapter'

const bookmarks = ref<Bookmark[]>([])
const collections = ref<string[]>([])
const searchQuery = ref('')
const activeTag = ref('')
const newCollection = ref('')
const errorMsg = ref('')
const isLoading = ref(true)
const isCompact = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)

function handleKeydown(e: KeyboardEvent) {
  // Ignore typing inside inputs/textareas
  const tag = (e.target as HTMLElement).tagName
  if (tag === "INPUT" || tag === "TEXTAREA") return

  switch (e.key.toLowerCase()) {
    case "c":
      isCompact.value = !isCompact.value
      break
    case "/":
      e.preventDefault()
      searchInput.value?.focus()
      break
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown)
  searchInput.value?.focus()
})

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown)
})

/** All unique tags across every bookmark */
const allTags = computed<string[]>(() => {
  const set = new Set<string>()
  bookmarks.value.forEach((b) => b.tags?.forEach((t) => set.add(t)))
  return [...set].sort()
})

/**
 * Bookmarks filtered by search query and active tag.
 * Search matches title or URL (case-insensitive).
 */
const filteredBookmarks = computed<Bookmark[]>(() => {
  return bookmarks.value.filter((b) => {
    const q = searchQuery.value.toLowerCase()
    const matchesSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.url.toLowerCase().includes(q)

    const matchesTag =
      !activeTag.value || (b.tags ?? []).includes(activeTag.value)

    return matchesSearch && matchesTag
  })
})

/**
 * Filtered bookmarks grouped by their groupId.
 * All known collections appear as columns even if empty.
 */
const groupedBookmarks = computed<Record<string, Bookmark[]>>(() => {
  const groups: Record<string, Bookmark[]> = {}
  collections.value.forEach((c) => {
    groups[c] = []
  })

  filteredBookmarks.value.forEach((bookmark) => {
    const group = bookmark.groupId?.trim() || 'Uncategorised'
    if (!groups[group]) groups[group] = []
    groups[group].push(bookmark)
  })

  return groups
})

/** Shows a temporary error that auto-clears after 3s */
function showError(msg: string): void {
  errorMsg.value = msg
  setTimeout(() => { errorMsg.value = '' }, 3000)
}

/** Extracts the hostname for favicon lookup; falls back gracefully */
function faviconUrl(url: string): string {
  try {
    const { origin } = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`
  } catch {
    return ''
  }
}

/** Formats an ISO date string to a short readable form e.g. "Mar 15" */
function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(iso))
  } catch {
    return ''
  }
}

async function loadAll(): Promise<void> {
  isLoading.value = true
  try {
    const [bm, col] = await Promise.all([fetchBookmarks(), getCollections()])
    bookmarks.value = bm
    collections.value = col
  } catch (err) {
    showError('Failed to load bookmarks.')
  } finally {
    isLoading.value = false
  }
}

onMounted(loadAll)

/**
 * Removes a bookmark by ID and refreshes the list.
 * @param {string} id - Bookmark UUID
 */
async function deleteBookmark(id: string): Promise<void> {
  try {
    await removeBookmark(id)
    bookmarks.value = await fetchBookmarks()
  } catch {
    showError('Failed to delete bookmark.')
  }
}

/**
 * Creates a new collection from the input field.
 * Clears the input on success; shows error on duplicate.
 */
async function createCollection(): Promise<void> {
  const added = await saveCollection(newCollection.value)
  if (added) {
    collections.value = await getCollections()
    newCollection.value = ''
  } else {
    showError(`"${newCollection.value.trim()}" already exists.`)
  }
}

/**
 * Deletes a collection. "General" is protected and cannot be removed.
 * @param {string} name - Collection name to delete
 */
async function deleteCollection(name: string): Promise<void> {
  await removeCollection(name)
  collections.value = await getCollections()
}

/** Toggles the active tag filter; clicking again clears it */
function toggleTag(tag: string): void {
  activeTag.value = activeTag.value === tag ? '' : tag
}
</script>
