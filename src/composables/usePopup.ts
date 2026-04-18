import { computed, onMounted, ref } from 'vue'
import { addBookmark, createBookmark, findBookmarkByUrl, removeBookmark } from '../core/bookmarkService'
import { getCollections } from '../services/collections'
import { getActiveTab } from '../storage/browserAPI'
import { parseTags } from '../utils/utils'
import { faviconUrl as buildFaviconUrl } from '../utils/bookmarkPresentation'

export function usePopup() {
  const title = ref('')
  const url = ref('')
  const group = ref('')
  const tags = ref('')
  const isLoading = ref(false)
  const errorMsg = ref('')
  const isAlreadySaved = ref(false)
  const collections = ref<string[]>([])
  const faviconUrl = ref('')

  const parsedTags = computed(() => parseTags(tags.value))

  function clearError(): void {
    errorMsg.value = ''
  }

  function showError(msg: string): void {
    errorMsg.value = msg
    setTimeout(clearError, 3000)
  }

  async function syncSavedState(): Promise<void> {
    const match = await findBookmarkByUrl(url.value)
    isAlreadySaved.value = match !== null
  }

  async function loadPopupData(): Promise<void> {
    const [tab, collectionList] = await Promise.all([
      getActiveTab(),
      getCollections(),
    ])

    collections.value = collectionList

    if (!tab) return

    title.value = tab.title ?? ''
    url.value = tab.url ?? ''
    faviconUrl.value = buildFaviconUrl(url.value)
    await syncSavedState()
  }

  async function handleSave(): Promise<void> {
    clearError()
    if (!url.value) {
      showError('No URL detected for this tab.')
      return
    }

    isLoading.value = true
    try {
      const bookmark = createBookmark(
        title.value,
        url.value,
        group.value,
        parsedTags.value,
      )
      const saved = await addBookmark(bookmark)
      if (saved) {
        isAlreadySaved.value = true
      } else {
        showError('This page is already bookmarked.')
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save bookmark.')
    } finally {
      isLoading.value = false
    }
  }

  async function handleRemove(): Promise<void> {
    clearError()
    if (!url.value) return

    isLoading.value = true
    try {
      const match = await findBookmarkByUrl(url.value)
      if (!match) {
        showError('Bookmark not found.')
        return
      }

      await removeBookmark(match.id)
      isAlreadySaved.value = false
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to remove bookmark.')
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    void loadPopupData()
  })

  return {
    collections,
    errorMsg,
    faviconUrl,
    group,
    handleRemove,
    handleSave,
    isAlreadySaved,
    isLoading,
    parsedTags,
    tags,
    title,
    url,
  }
}