<template>
  <div class="w-80 bg-gray-950 text-gray-100 font-sans overflow-hidden">
    <PopupHeader :is-already-saved="isAlreadySaved" />

    <div class="px-4 py-3 space-y-3">
      <PopupErrorBanner :message="errorMsg" />
      <PopupUrlChip
        :favicon-url="faviconUrl"
        :url="url"
        @favicon-error="faviconUrl = ''"
      />
      <PopupForm
        :collections="collections"
        :group="group"
        :parsed-tags="parsedTags"
        :tags="tags"
        :title="title"
        @update:group="group = $event"
        @update:tags="tags = $event"
        @update:title="title = $event"
      />
    </div>

    <PopupActions
      :is-already-saved="isAlreadySaved"
      :is-loading="isLoading"
      :url="url"
      @remove="handleRemove"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import PopupActions from '../components/popup/PopupActions.vue'
import PopupErrorBanner from '../components/popup/PopupErrorBanner.vue'
import PopupForm from '../components/popup/PopupForm.vue'
import PopupHeader from '../components/popup/PopupHeader.vue'
import PopupUrlChip from '../components/popup/PopupUrlChip.vue'
import { usePopup } from '../composables/usePopup'

const {
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
} = usePopup()
</script>