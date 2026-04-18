import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  fetchBookmarks,
  addBookmark,
  createBookmark,
  removeBookmark,
  saveBookmarkOrder,
} from '../core/bookmarkService'
import {
  getCollections,
  removeCollection,
  saveCollection,
  setCollections,
} from '../services/collections'
import { getSettings, saveSettings } from '../services/settings'
import type { Bookmark } from '../storage/storageAdapter'
import type { CollectionState } from '../services/collections'
import { isValidUrl } from '../utils/utils'

function mergeCollectionStates(
  collectionStates: CollectionState[],
  bookmarkList: Bookmark[]
): CollectionState[] {
  const orderedStates = [...collectionStates.map((collection) => ({ ...collection }))]

  bookmarkList.forEach((bookmark) => {
    const groupName = bookmark.groupId?.trim() || 'Uncategorised'
    if (!orderedStates.some((collection) => collection.name === groupName)) {
      orderedStates.push({ name: groupName, isCollapsed: false })
    }
  })

  return orderedStates
}

function toStoredGroupId(collectionName: string): string {
  return collectionName === 'Uncategorised' ? '' : collectionName
}

function parseTags(tagText: string): string[] {
  return tagText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

async function persistCollections(collectionStates: CollectionState[]): Promise<void> {
  await setCollections(collectionStates)
}

export function useDashboard(focusSearch: () => void) {
  const bookmarks = ref<Bookmark[]>([])
  const collections = ref<CollectionState[]>([])
  const searchQuery = ref('')
  const activeTag = ref('')
  const newCollection = ref('')
  const errorMsg = ref('')
  const isLoading = ref(true)
  const isCompact = ref(false)
  const isSettingsOpen = ref(false)

  function showError(msg: string): void {
    errorMsg.value = msg
    setTimeout(() => {
      errorMsg.value = ''
    }, 3000)
  }

  function handleKeydown(event: KeyboardEvent) {
    const tag = (event.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    event.preventDefault()
    switch (event.key.toLowerCase()) {
      case 'c':
        isCompact.value = !isCompact.value
        void saveSettings({ isCompact: isCompact.value })
        break
      case 'p':
        focusSearch()
        break
      case '/':
        isSettingsOpen.value = !isSettingsOpen.value
        break
      case 'r':
        window.location.reload()
        break
    }
  }

  function openBookmark(bookmark: Bookmark) {
    window.open(bookmark.url, '_blank')
  }

  function openBestMatch() {
    if (!filteredBookmarks.value.length) return

    const bestMatch = filteredBookmarks.value[0]
    window.open(bestMatch.url, '_blank')
  }

  const allTags = computed<string[]>(() => {
    const set = new Set<string>()
    bookmarks.value.forEach((bookmark) => bookmark.tags?.forEach((tag) => set.add(tag)))
    return [...set].sort()
  })

  const filteredBookmarks = computed<Bookmark[]>(() => {
    return bookmarks.value.filter((bookmark) => {
      const query = searchQuery.value.toLowerCase()
      const matchesSearch =
        !query || bookmark.title.toLowerCase().includes(query)

      const matchesTag =
        !activeTag.value || (bookmark.tags ?? []).includes(activeTag.value)

      return matchesSearch && matchesTag
    })
  })

  const collectionItems = computed<Record<string, Bookmark[]>>(() => {
    const groups: Record<string, Bookmark[]> = {}

    collections.value.forEach((collection) => {
      groups[collection.name] = []
    })

    filteredBookmarks.value.forEach((bookmark) => {
      const group = bookmark.groupId?.trim() || 'Uncategorised'
      if (!groups[group]) {
        groups[group] = []
      }

      groups[group].push(bookmark)
    })

    return groups
  })

  async function updateBookmark(updatedBookmark: Bookmark): Promise<void> {
    const trimmedUrl = updatedBookmark.url.trim()
    if (!isValidUrl(trimmedUrl)) {
      showError('Enter a valid URL.')
      return
    }

    const existing = bookmarks.value.find((bookmark) => bookmark.id === updatedBookmark.id)
    if (!existing) return

    const duplicateUrl = bookmarks.value.some(
      (bookmark) => bookmark.id !== updatedBookmark.id && bookmark.url === trimmedUrl
    )

    if (duplicateUrl) {
      showError('That URL already exists.')
      return
    }

    const nextBookmarks = bookmarks.value.map((bookmark) =>
      bookmark.id === updatedBookmark.id
        ? {
            ...bookmark,
            title: updatedBookmark.title.trim() || trimmedUrl,
            url: trimmedUrl,
            groupId: updatedBookmark.groupId,
            tags: parseTags(updatedBookmark.tags.join(', ')),
          }
        : bookmark
    )

    bookmarks.value = nextBookmarks
    collections.value = mergeCollectionStates(collections.value, nextBookmarks)

    try {
      await saveBookmarkOrder(nextBookmarks)
      await persistCollections(collections.value)
    } catch {
      showError('Failed to save bookmark changes.')
      await loadAll()
    }
  }

  async function loadAll(): Promise<void> {
    isLoading.value = true
    try {
      const [bookmarkList, collectionList] = await Promise.all([
        fetchBookmarks(),
        getCollections(),
      ])
      bookmarks.value = bookmarkList
      collections.value = mergeCollectionStates(collectionList, bookmarkList)

      try {
        const settings = await getSettings()
        isCompact.value = !!settings.isCompact
      } catch {
        // ignore settings load failures
      }

      if (JSON.stringify(collections.value) !== JSON.stringify(collectionList)) {
        await persistCollections(collections.value)
      }

    } catch {
      showError('Failed to load bookmarks.')
    } finally {
      isLoading.value = false
    }
  }

  async function deleteBookmark(id: number): Promise<void> {
    try {
      await removeBookmark(id)
      bookmarks.value = await fetchBookmarks()
      collections.value = mergeCollectionStates(collections.value, bookmarks.value)
      await persistCollections(collections.value)
    } catch {
      showError('Failed to delete bookmark.')
    }
  }

  async function createCollection(): Promise<void> {
    const nextCollection = newCollection.value.trim()
    const added = await saveCollection(nextCollection)
    if (added) {
      collections.value = [...collections.value, { name: nextCollection, isCollapsed: false }]
      await persistCollections(collections.value)
      newCollection.value = ''
    }
  }

  async function createCollectionFromName(name: string): Promise<boolean> {
    const nextCollection = name.trim()
    if (!nextCollection) {
      showError('Collection name cannot be empty.')
      return false
    }

    const added = await saveCollection(nextCollection)
    if (!added) {
      return false
    }

    collections.value = [...collections.value, { name: nextCollection, isCollapsed: false }]
    await persistCollections(collections.value)
    return true
  }

  async function createBookmarkFromFields(
    title: string,
    url: string,
    groupId: string,
    tagsText: string
  ): Promise<boolean> {
    try {
      const bookmark = createBookmark(title, url, groupId, parseTags(tagsText))
      const saved = await addBookmark(bookmark)
      if (!saved) {
        showError('This page is already bookmarked.')
        return false
      }

      bookmarks.value = await fetchBookmarks()
      collections.value = mergeCollectionStates(collections.value, bookmarks.value)
      await persistCollections(collections.value)
      return true
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save bookmark.')
      return false
    }
  }

  async function deleteCollection(name: string): Promise<void> {
    await removeCollection(name)
    collections.value = collections.value.filter((collection) => collection.name !== name)
    await persistCollections(collections.value)
  }

  async function renameCollection(oldName: string, newName: string): Promise<void> {
    const trimmed = newName.trim()
    if (!trimmed) {
      showError('Collection name cannot be empty.')
      return
    }

    const isDuplicate = collections.value.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.name !== oldName
    )
      if (isDuplicate) {
        // Silently ignore duplicate rename requests to avoid noisy error messages
        return
      return
    }

    // Update bookmarks that reference the old collection
    const nextBookmarks = bookmarks.value.map((b) =>
      (b.groupId?.trim() || 'Uncategorised') === oldName
        ? { ...b, groupId: toStoredGroupId(trimmed) }
        : b
    )

    collections.value = collections.value.map((c) =>
      c.name === oldName ? { ...c, name: trimmed } : c
    )

    bookmarks.value = nextBookmarks

    try {
      await saveBookmarkOrder(nextBookmarks)
      await persistCollections(collections.value)
    } catch {
      showError('Failed to rename collection.')
      await loadAll()
    }
  }

  async function toggleCollectionCollapse(name: string): Promise<void> {
    collections.value = collections.value.map((collection) =>
      collection.name === name
        ? { ...collection, isCollapsed: !collection.isCollapsed }
        : collection
    )
    await persistCollections(collections.value)
  }

  async function reorderCollections(): Promise<void> {
    try {
      await persistCollections(collections.value)
    } catch {
      showError('Failed to save collection order.')
      collections.value = await getCollections()
    }
  }

  async function reorderBookmarksInCollection(
    collectionName: string,
    reorderedItems: Bookmark[]
  ): Promise<void> {
    const normalizedItems = reorderedItems.map((bookmark) => ({
      ...bookmark,
      groupId: toStoredGroupId(collectionName),
    }))
    const movedIds = new Set(normalizedItems.map((bookmark) => bookmark.id))
    const nextCollectionItems: Record<string, Bookmark[]> = {}

    Object.entries(collectionItems.value).forEach(([name, items]) => {
      if (name === collectionName) {
        nextCollectionItems[name] = normalizedItems
        return
      }

      nextCollectionItems[name] = items.filter((bookmark) => !movedIds.has(bookmark.id))
    })

    if (!nextCollectionItems[collectionName]) {
      nextCollectionItems[collectionName] = normalizedItems
    }

    const orderedCollectionNames = mergeCollectionStates(collections.value, bookmarks.value)
    const nextBookmarks = orderedCollectionNames.flatMap(
      (collection) => nextCollectionItems[collection.name] ?? []
    )

    bookmarks.value = nextBookmarks
    collections.value = mergeCollectionStates(collections.value, nextBookmarks)

    try {
      await saveBookmarkOrder(nextBookmarks)
      await persistCollections(collections.value)
    } catch {
      showError('Failed to save bookmark order.')
      bookmarks.value = await fetchBookmarks()
      collections.value = mergeCollectionStates(collections.value, bookmarks.value)
    }
  }

  function toggleTag(tag: string): void {
    activeTag.value = activeTag.value === tag ? '' : tag
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
    void loadAll()
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    activeTag,
    allTags,
    createCollectionFromName,
    bookmarks,
    collections,
    collectionItems,
    createCollection,
    createBookmarkFromFields,
    deleteBookmark,
    deleteCollection,
    renameCollection,
    errorMsg,
    filteredBookmarks,
    isCompact,
    isLoading,
    isSettingsOpen,
    newCollection,
    openBestMatch,
    openBookmark,
    toggleCollectionCollapse,
    updateBookmark,
    reorderBookmarksInCollection,
    reorderCollections,
    searchQuery,
    toggleTag,
    toggleCompactMode: async () => {
      isCompact.value = !isCompact.value
      try {
        await saveSettings({ isCompact: isCompact.value })
      } catch {
        // ignore save failures
      }
    },
  }
}