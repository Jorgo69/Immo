<script setup lang="ts">
/** Placeholder affiché pendant le chargement lazy du MapLocationPicker (Leaflet). */
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div
    class="flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-[var(--color-muted)] text-sm"
    style="height: 320px"
  >
    {{ t('landlord.mapLoading') }}
  </div>
</template>
