<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useAppStore } from './stores/app'
import { i18n } from './i18n'

// Au chargement : aligner la locale i18n sur le store (persistée dans localStorage).
const appStore = useAppStore()
onMounted(() => {
  const stored = appStore.locale
  if (stored === 'en' || stored === 'fr') {
    i18n.global.locale.value = stored
  }
})
</script>

<template>
  <RouterView />
  <Toaster position="top-center" rich-colors />
</template>
