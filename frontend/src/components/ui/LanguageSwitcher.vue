<script setup lang="ts">
/**
 * Sélecteur de langue : Français / English. Réactivité immédiate via i18n.global.locale, pas de rechargement.
 * Persiste la préférence dans le store Pinia (localStorage).
 */
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../../stores/app'
import { Globe } from 'lucide-vue-next'

const { locale } = useI18n()
const appStore = useAppStore()

function setLocale(value: 'fr' | 'en') {
  locale.value = value
  appStore.setLocale(value)
}
</script>

<template>
  <div class="relative flex items-center gap-1 rounded-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800">
    <Globe class="ml-2 h-5 w-5 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
    <select
      :value="locale"
      class="min-w-[7rem] cursor-pointer appearance-none rounded-lg bg-transparent py-2 pl-1 pr-8 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] dark:bg-transparent"
      aria-label="Langue"
      @change="setLocale(($event.target as HTMLSelectElement).value as 'fr' | 'en')"
    >
      <option value="fr">Français</option>
      <option value="en">English</option>
    </select>
    <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">▼</span>
  </div>
</template>
