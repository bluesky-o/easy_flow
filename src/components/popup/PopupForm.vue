<template>
  <div class="space-y-3">
    <div>
      <label class="mb-1 block text-xs font-medium uppercase tracking-widest text-gray-500">
        Title
      </label>
      <input
        :value="title"
        type="text"
        placeholder="Page title"
        class="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 transition-colors hover:border-gray-700 focus:border-blue-600 focus:outline-none"
        @input="$emit('update:title', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div>
      <label class="mb-1 block text-xs font-medium uppercase tracking-widest text-gray-500">
        Collection
      </label>
      <div class="relative">
        <select
          :value="group"
          class="w-full appearance-none rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 pr-8 text-sm transition-colors hover:border-gray-700 focus:border-blue-600 focus:outline-none"
          :class="group ? 'text-gray-100' : 'text-gray-600'"
          @change="$emit('update:group', ($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>Select a collection…</option>
          <option
            v-for="collection in collections"
            :key="collection"
            :value="collection"
            class="bg-gray-900 text-gray-100"
          >
            {{ collection }}
          </option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
          <svg class="h-3.5 w-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <p v-if="!collections.length" class="mt-1 text-xs text-gray-600">
        No collections yet — create one on the dashboard.
      </p>
    </div>

    <div>
      <label class="mb-1 block text-xs font-medium uppercase tracking-widest text-gray-500">
        Tags
        <span class="ml-1 normal-case font-normal text-gray-600">comma separated</span>
      </label>
      <input
        :value="tags"
        type="text"
        placeholder="vue, dev, reference…"
        class="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 transition-colors hover:border-gray-700 focus:border-blue-600 focus:outline-none"
        @input="$emit('update:tags', ($event.target as HTMLInputElement).value)"
      />
      <div v-if="parsedTags.length" class="mt-2 flex flex-wrap gap-1">
        <span
          v-for="tag in parsedTags"
          :key="tag"
          class="rounded-full border border-blue-900 bg-blue-950 px-2 py-0.5 text-xs text-blue-400"
        >
          #{{ tag }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  collections: string[]
  group: string
  parsedTags: string[]
  tags: string
  title: string
}>()

defineEmits<{
  'update:group': [value: string]
  'update:tags': [value: string]
  'update:title': [value: string]
}>()
</script>