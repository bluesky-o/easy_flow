<template>
  <div>
    <div
      v-if="modelValue"
      class="fixed inset-0 z-40 bg-black/50"
      @click="$emit('update:modelValue', false)"
    ></div>

    <div
      class="fixed top-0 right-0 z-50 h-full w-[280px] transform border-l border-gray-800 bg-gray-900 transition-transform duration-300"
      :class="modelValue ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="flex h-full flex-col gap-6 p-4">
        <h2 class="text-lg font-semibold text-white">Settings</h2>

        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-300">Compact mode</span>

          <button
            class="relative h-6 w-10 rounded-full transition-colors"
            :class="isCompact ? 'bg-gray-700' : 'bg-rose-500'"
            @click="$emit('toggle-compact')"
          >
            <span
              class="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform"
              :class="isCompact ? 'translate-x-0' : 'translate-x-4'"
            ></span>
          </button>
        </div>

        <ul class="mt-auto rounded-sm border border-gray-500 p-2">
          <li class="flex justify-between border-bottom border-gray-500 pb-1 text-sm font-bold text-gray-500">
            <span>Key</span>
            <span>Description</span>
          </li>
          <li class="flex justify-between text-sm text-gray-600">
            <span class="ml-1 font-medium text-gray-400">'p'</span>
            <span>Focus search bar</span>
          </li>
          <li class="flex justify-between text-sm text-gray-600">
            <span class="ml-1 font-medium text-gray-400">'c'</span>
            <span>Toggle compact mode</span>
          </li>
          <li class="flex justify-between text-sm text-gray-600">
            <span class="ml-1 font-medium text-gray-400">'/'</span>
            <span>Open Settings</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  isCompact: boolean
}>()

defineEmits<{
  'toggle-compact': []
  'update:modelValue': [value: boolean]
}>()
</script>