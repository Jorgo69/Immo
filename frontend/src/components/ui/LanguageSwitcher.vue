<script setup lang="ts">
/**
 * Sélecteur de langue : Français / English. Synchronisé avec le store Pinia (localStorage) et i18n.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../../stores/app'
import { Globe } from 'lucide-vue-next'

const { locale } = useI18n()
const appStore = useAppStore()

const currentLocale = computed({
  get: () => appStore.locale === 'en' ? 'en' : 'fr',
  set: (value: 'fr' | 'en') => {
    locale.value = value
    appStore.setLocale(value)
  },
})

function onChange(ev: Event) {
  const value = (ev.target as HTMLSelectElement).value as 'fr' | 'en'
  if (value === 'fr' || value === 'en') {
    locale.value = value
    appStore.setLocale(value)
  }
}
</script>

<template>
  <div class="relative flex w-full min-w-0 items-center gap-2 rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-10 dark:border-gray-600 dark:bg-gray-800">
    <Globe class="h-5 w-5 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
    <select
      :value="currentLocale"
      class="min-h-[2.25rem] min-w-[8rem] flex-1 cursor-pointer appearance-none rounded-lg bg-transparent text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-0 dark:bg-transparent"
      aria-label="Choisir la langue"
      @change="onChange"
    >
      <option value="fr">Français</option>
      <option value="en">English</option>
    </select>
    <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">▼</span>
  </div>
</template>
