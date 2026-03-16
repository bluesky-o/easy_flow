<template>
  <div class="w-80 bg-gray-950 text-gray-100 font-sans overflow-hidden">

    <!-- Header -->
    <div class="px-4 pt-4 pb-3 border-b border-gray-800 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold tracking-tight text-white">Easy Flow</span>
      </div>
      <span
        v-if="isAlreadySaved"
        class="text-xs bg-emerald-900 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full"
      >
        ✓ Saved
      </span>
    </div>

    <div class="px-4 py-3 space-y-3">

      <!-- Error -->
      <div
        v-if="errorMsg"
        class="text-xs bg-red-950 text-red-400 border border-red-900 px-3 py-2 rounded-lg"
      >
        {{ errorMsg }}
      </div>

      <!-- URL chip -->
      <div
        class="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 min-w-0"
        :title="url"
      >
        <img
          v-if="faviconUrl"
          :src="faviconUrl"
          width="14"
          height="14"
          class="shrink-0 rounded-sm"
          @error="faviconUrl = ''"
        />
        <span class="text-xs text-gray-500 truncate">{{ url || '—' }}</span>
      </div>

      <!-- Title -->
      <div>
        <label class="block text-xs text-gray-500 mb-1 uppercase tracking-widest font-medium">
          Title
        </label>
        <input
          type="text"
          v-model="title"
          placeholder="Page title"
          class="w-full bg-gray-900 border border-gray-800 hover:border-gray-700 focus:border-blue-600 focus:outline-none rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 transition-colors"
        />
      </div>

      <!-- Group dropdown -->
      <div>
        <label class="block text-xs text-gray-500 mb-1 uppercase tracking-widest font-medium">
          Collection
        </label>
        <div class="relative">
          <select
            v-model="group"
            class="w-full appearance-none bg-gray-900 border border-gray-800 hover:border-gray-700 focus:border-blue-600 focus:outline-none rounded-lg px-3 py-2 text-sm transition-colors pr-8"
            :class="group ? 'text-gray-100' : 'text-gray-600'"
          >
            <option value="" disabled>Select a collection…</option>
            <option
              v-for="col in collections"
              :key="col"
              :value="col"
              class="bg-gray-900 text-gray-100"
            >
              {{ col }}
            </option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
            <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <p v-if="!collections.length" class="text-xs text-gray-600 mt-1">
          No collections yet — create one on the dashboard.
        </p>
      </div>

      <!-- Tags -->
      <div>
        <label class="block text-xs text-gray-500 mb-1 uppercase tracking-widest font-medium">
          Tags
          <span class="normal-case font-normal text-gray-600 ml-1">comma separated</span>
        </label>
        <input
          type="text"
          v-model="tags"
          placeholder="vue, dev, reference…"
          class="w-full bg-gray-900 border border-gray-800 hover:border-gray-700 focus:border-blue-600 focus:outline-none rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 transition-colors"
        />
        <div v-if="parsedTags.length" class="flex flex-wrap gap-1 mt-2">
          <span
            v-for="tag in parsedTags"
            :key="tag"
            class="text-xs bg-blue-950 text-blue-400 border border-blue-900 px-2 py-0.5 rounded-full"
          >
            #{{ tag }}
          </span>
        </div>
      </div>

    </div>

    <!-- Actions -->
    <div class="px-4 pb-4 flex gap-2">
      <button
        @click="handleSave"
        :disabled="isLoading || !url"
        class="flex-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
      >
        {{ isLoading ? 'Saving…' : 'Save' }}
      </button>
      <button
        @click="handleRemove"
        :disabled="isLoading || !isAlreadySaved"
        class="flex-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 hover:text-red-300 text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
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
import { getCollections } from '../services/collections';
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
    const collections = ref<string[]>([]);
    const faviconUrl = ref<string>('');

    const parsedTags = computed(() => parseTags(tags.value));

    function clearError(): void {
      errorMsg.value = '';
    }

    function showError(msg: string): void {
      errorMsg.value = msg;
      setTimeout(clearError, 3000);
    }

    async function syncSavedState(): Promise<void> {
      const match = await findBookmarkByUrl(url.value);
      isAlreadySaved.value = match !== null;
    }

    function buildFaviconUrl(pageUrl: string): string {
      try {
        const { origin } = new URL(pageUrl);
        return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
      } catch {
        return '';
      }
    }

    onMounted(async () => {
      const [tab, cols] = await Promise.all([
        getActiveTab(),
        getCollections(),
      ]);

      collections.value = cols;

      if (!tab) return;
      title.value = tab.title ?? '';
      url.value = tab.url ?? '';
      faviconUrl.value = buildFaviconUrl(url.value);
      await syncSavedState();
    });

    async function handleSave(): Promise<void> {
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
          parsedTags.value,
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

    async function handleRemove(): Promise<void> {
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
      collections,
      faviconUrl,
      parsedTags,
      handleSave,
      handleRemove,
    };
  },
});
</script>