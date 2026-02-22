<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useAppStore } from './stores/app'
import { useReferenceStore } from './stores/references'
import { i18n } from './i18n'

const appStore = useAppStore()
const referenceStore = useReferenceStore()

onMounted(async () => {
  const stored = appStore.locale
  if (stored === 'en' || stored === 'fr') {
    i18n.global.locale.value = stored
  }
  await referenceStore.fetch()
})
</script>

<template>
  <RouterView />
  <Toaster position="top-center" rich-colors />
</template>
