<template>
  <div class="mb-6 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <h1 class="text-xl font-bold tracking-tight text-white">Easy Flow x</h1>
      <span class="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-500">
        {{ count }} saved
      </span>
    </div>

    <button
      class="flex flex-col gap-[3px] rounded p-2 hover:bg-gray-800"
      @click="$emit('open-settings')"
    >
      <span class="h-[2px] w-5 bg-gray-300"></span>
      <span class="h-[2px] w-5 bg-gray-300"></span>
      <span class="h-[2px] w-5 bg-gray-300"></span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  count: number
}>()

defineEmits<{
  'open-settings': []
}>()
</script>