<template>
  <div class="p-4 w-80 font-sans bg-gray-50">

    <!-- Header -->
    <div class="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
      <h2 class="text-base font-bold text-gray-800">Easy Flow</h2>
    </div>

    <!-- saved badge -->
    <div v-if="isAlreadySaved" class="mb-3 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1.5 rounded">
      This page is already bookmarked
    </div>

    <!-- Error message -->
    <div
      v-if="errorMsg"
      class="mb-3 text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1.5 rounded"
    >
      {{ errorMsg }}
    </div>

    <!-- Title -->
    <div class="mb-3">
      <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
        Title
      </label>
      <input
        type="text"
        v-model="title"
        placeholder="Page title"
        class="border border-gray-300 rounded px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
    </div>

    <!-- URL (read-only display) -->
    <div class="mb-3">
      <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
        URL
      </label>
      <p
        class="text-xs text-gray-400 bg-gray-100 border border-gray-200 rounded px-2 py-1.5 truncate"
        :title="url"
      >
        {{ url || '-' }}
      </p>
    </div>

    <!-- Group -->
    <div class="mb-3">
      <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
        Group
      </label>
      <input
        type="text"
        v-model="group"
        placeholder="e.g. work, personal"
        class="border border-gray-300 rounded px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
    </div>

    <!-- Tags -->
    <div class="mb-4">
      <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
        Tags
        <span class="normal-case font-normal text-gray-400">(comma separated)</span>
      </label>
      <input
        type="text"
        v-model="tags"
        placeholder="e.g. vue, dev, reference"
        class="border border-gray-300 rounded px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
      <!-- Live tag preview -->
      <div v-if="parsedTags.length" class="flex flex-wrap gap-1 mt-1.5">
        <span
          v-for="tag in parsedTags"
          :key="tag"
          class="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <button
        @click="handleSave"
        :disabled="isLoading || !url"
        class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
      >
        {{ isLoading ? 'Saving…' : 'Save' }}
      </button>
      <button
        @click="handleRemove"
        :disabled="isLoading || !isAlreadySaved"
        class="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
      >
        Remove
      </button>
    </div>

  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import {
  createBookmark,
  addBookmark,
  removeBookmark,
  findBookmarkByUrl,
} from '../core/bookmarkService';
import { getActiveTab } from '../storage/browserAPI';
import { parseTags } from '../utils/utils';

export default defineComponent({
  name: 'Popup',

  setup() {
    // State
    const title = ref<string>('');
    const url = ref<string>('');
    const group = ref<string>('');
    const tags = ref<string>('');
    const isLoading = ref<boolean>(false);
    const errorMsg = ref<string>('');
    const isAlreadySaved = ref<boolean>(false);

    const parsedTags = computed(() => parseTags(tags.value));

    /** Clears any previous error message */
    function clearError() {
      errorMsg.value = '';
    }

    /** Sets a temporary error message that auto-clears after 3 s */
    function showError(msg: string) {
      errorMsg.value = msg;
      setTimeout(clearError, 3000);
    }

    /**
     * Checks chrome.storage to see if the current URL is already bookmarked
     * and updates `isAlreadySaved` accordingly.
     */
    async function syncSavedState() {
      const match = await findBookmarkByUrl(url.value);
      isAlreadySaved.value = match !== null;
    }

    onMounted(async () => {
      const tab = await getActiveTab();
      if (!tab) return;
      title.value = tab.title ?? '';
      url.value = tab.url ?? '';
      await syncSavedState();
    });

    /**
     * Validates inputs, creates a bookmark object and persists it.
     * Shows feedback on success or duplicate.
     */
    async function handleSave() {
      clearError();
      if (!url.value) {
        showError('No URL detected for this tab.');
        return;
      }

      isLoading.value = true;
      try {
        const bookmark = createBookmark(
          title.value,
          url.value,
          group.value,
          parsedTags.value
        );
        const saved = await addBookmark(bookmark);

        if (saved) {
          isAlreadySaved.value = true;
        } else {
          showError('This page is already bookmarked.');
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to save bookmark.');
      } finally {
        isLoading.value = false;
      }
    }

    /**
     * Finds the bookmark matching the current URL and removes it from storage.
     */
    async function handleRemove() {
      clearError();
      if (!url.value) return;

      isLoading.value = true;
      try {
        const match = await findBookmarkByUrl(url.value);
        if (!match) {
          showError('Bookmark not found.');
          return;
        }
        await removeBookmark(match.id);
        isAlreadySaved.value = false;
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to remove bookmark.');
      } finally {
        isLoading.value = false;
      }
    }

    return {
      title,
      url,
      group,
      tags,
      isLoading,
      errorMsg,
      isAlreadySaved,
      parsedTags,
      handleSave,
      handleRemove,
    };
  },
});
</script>