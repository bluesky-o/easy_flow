import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  fetchBookmarks,
  removeBookmark,
  saveBookmarkOrder,
} from '../core/bookmarkService'
import {
  getCollections,
  removeCollection,
  saveCollection,
  setCollections,
} from '../services/collections'
import type { Bookmark } from '../storage/storageAdapter'

function mergeCollectionNames(
  collectionNames: string[],
  bookmarkList: Bookmark[]
): string[] {
  const orderedNames = [...collectionNames]

  bookmarkList.forEach((bookmark) => {
    const groupName = bookmark.groupId?.trim() || 'Uncategorised'
    if (!orderedNames.includes(groupName)) {
      orderedNames.push(groupName)
    }
  })

  return orderedNames
}

function toStoredGroupId(collectionName: string): string {
  return collectionName === 'Uncategorised' ? '' : collectionName
}

async function persistCollections(collectionNames: string[]): Promise<void> {
  await setCollections(collectionNames)
}

export function useDashboard(focusSearch: () => void) {
  const bookmarks = ref<Bookmark[]>([])
  const collections = ref<string[]>([])
  const isCollectionsReady = ref(false)
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
        break
      case 'p':
        focusSearch()
        break
      case '/':
        isSettingsOpen.value = !isSettingsOpen.value
        break
    }
  }

  function handleBlur() {
    searchQuery.value = ''
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
        !query ||
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query)

      const matchesTag =
        !activeTag.value || (bookmark.tags ?? []).includes(activeTag.value)

      return matchesSearch && matchesTag
    })
  })

  const collectionItems = computed<Record<string, Bookmark[]>>(() => {
    const groups: Record<string, Bookmark[]> = {}

    collections.value.forEach((collection) => {
      groups[collection] = []
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

  async function loadAll(): Promise<void> {
    isLoading.value = true
    try {
      const [bookmarkList, collectionList] = await Promise.all([
        fetchBookmarks(),
        getCollections(),
      ])
      bookmarks.value = bookmarkList
      collections.value = mergeCollectionNames(collectionList, bookmarkList)

      if (JSON.stringify(collections.value) !== JSON.stringify(collectionList)) {
        await persistCollections(collections.value)
      }

      isCollectionsReady.value = true
    } catch {
      showError('Failed to load bookmarks.')
    } finally {
      isLoading.value = false
    }
  }

  async function deleteBookmark(id: string): Promise<void> {
    try {
      await removeBookmark(id)
      bookmarks.value = await fetchBookmarks()
      collections.value = mergeCollectionNames(collections.value, bookmarks.value)
      await persistCollections(collections.value)
    } catch {
      showError('Failed to delete bookmark.')
    }
  }

  async function createCollection(): Promise<void> {
    const nextCollection = newCollection.value.trim()
    const added = await saveCollection(nextCollection)
    if (added) {
      collections.value = [...collections.value, nextCollection]
      await persistCollections(collections.value)
      newCollection.value = ''
    } else {
      showError(`"${nextCollection}" already exists.`)
    }
  }

  async function deleteCollection(name: string): Promise<void> {
    await removeCollection(name)
    collections.value = collections.value.filter((collection) => collection !== name)
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

    const orderedCollectionNames = mergeCollectionNames(collections.value, bookmarks.value)
    const nextBookmarks = orderedCollectionNames.flatMap(
      (name) => nextCollectionItems[name] ?? []
    )

    bookmarks.value = nextBookmarks
    collections.value = mergeCollectionNames(collections.value, nextBookmarks)

    try {
      await saveBookmarkOrder(nextBookmarks)
      await persistCollections(collections.value)
    } catch {
      showError('Failed to save bookmark order.')
      bookmarks.value = await fetchBookmarks()
      collections.value = mergeCollectionNames(collections.value, bookmarks.value)
    }
  }

  function toggleTag(tag: string): void {
    activeTag.value = activeTag.value === tag ? '' : tag
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
    void loadAll()
  })

  watch(
    collections,
    async (nextCollections) => {
      if (!isCollectionsReady.value) return
      try {
        await persistCollections(nextCollections)
      } catch {
        showError('Failed to save collection order.')
      }
    },
    { deep: true }
  )

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    activeTag,
    allTags,
    bookmarks,
    collections,
    collectionItems,
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
  }
}