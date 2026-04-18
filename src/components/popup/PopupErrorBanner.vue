<template>
  <div
    v-if="message"
    class="rounded-lg border border-red-900 bg-red-950 px-3 py-2 text-xs text-red-400"
  >
    {{ message }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
}>()
</script>