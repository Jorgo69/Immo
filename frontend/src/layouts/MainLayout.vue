<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterView } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import { Home, Search, WifiOff, Play } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import AppLink from '../components/ui/AppLink.vue'
import { LanguageSwitcher, ThemeToggle, CurrencySwitcher, UserMenu, AppBottomNav } from '../components/ui'
import NotificationBell from '../components/NotificationBell.vue'

const { t } = useI18n()
const appStore = useAppStore()
const isOnline = ref(navigator.onLine)

function updateOnline() {
  isOnline.value = navigator.onLine
}
onMounted(() => {
  window.addEventListener('online', updateOnline)
  window.addEventListener('offline', updateOnline)
})
onUnmounted(() => {
  window.removeEventListener('online', updateOnline)
  window.removeEventListener('offline', updateOnline)
})
</script>

<template>
  <div class="min-h-[100dvh] flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
    <!-- Header desktop : masqué sur mobile (Bottom Nav), visible à partir de lg. Contraste et ordre clairs. -->
    <header class="hidden border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 lg:block">
      <div class="max-w-layout mx-auto flex h-14 items-center justify-between gap-6 px-6 md:px-8">
        <AppLink
          to="/"
          class="shrink-0 text-base font-semibold text-gray-800 dark:text-gray-100"
        >
          {{ t('app.name') }}
        </AppLink>
        <nav class="flex items-center gap-1 md:gap-2" aria-label="Navigation principale">
          <AppLink
            to="/"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[var(--color-accent)] dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-[var(--color-accent)]"
          >
            <Home class="h-5 w-5 shrink-0" />
            <span class="hidden xl:inline">{{ t('nav.home') }}</span>
          </AppLink>
          <AppLink
            to="/property"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[var(--color-accent)] dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-[var(--color-accent)]"
          >
            <Search class="h-5 w-5 shrink-0" />
            <span class="hidden xl:inline">{{ t('nav.search') }}</span>
          </AppLink>
          <AppLink
            to="/reels"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[var(--color-accent)] dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-[var(--color-accent)]"
          >
            <Play class="h-5 w-5 shrink-0" />
            <span class="hidden xl:inline">{{ t('nav.reels') }}</span>
          </AppLink>
        </nav>
        <div class="flex items-center gap-2 shrink-0">
          <LanguageSwitcher />
          <CurrencySwitcher />
          <ThemeToggle />
          <template v-if="appStore.token">
            <NotificationBell />
          </template>
          <UserMenu />
        </div>
      </div>
    </header>
    <!-- Contenu principal : padding-bottom 80px sur mobile pour ne rien cacher sous la Bottom Nav -->
    <main class="flex-1 pb-[80px] lg:pb-0">
      <RouterView />
    </main>
    <AppBottomNav />
    <!-- Indication hors ligne (PWA) : au-dessus de la Bottom Nav -->
    <div
      v-if="!isOnline"
      class="fixed bottom-0 left-0 right-0 z-[60] bg-amber-100 border-t border-amber-300 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-sm"
    >
      <WifiOff class="w-5 h-5 shrink-0" />
      {{ t('app.offline') }}
    </div>
  </div>
</template>

