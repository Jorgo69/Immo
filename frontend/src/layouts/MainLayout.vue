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
  if (appStore.token && !appStore.currentUser) {
    appStore.refreshMe().catch(() => {})
  }
})
onUnmounted(() => {
  window.removeEventListener('online', updateOnline)
  window.removeEventListener('offline', updateOnline)
})
</script>

<template>
  <div class="min-h-[100dvh] flex flex-col bg-ui-background text-gray-900 dark:bg-ui-surface-dark dark:text-gray-100">
    <header class="hidden border-b border-ui-border bg-ui-surface shadow-soft-sm dark:border-ui-border-dark dark:bg-ui-surface-dark lg:block">
      <div class="max-w-layout mx-auto flex h-14 items-center justify-between gap-6 px-6 md:px-8">
        <AppLink
          to="/"
          class="shrink-0 text-base font-semibold text-gray-900 dark:text-gray-100"
        >
          {{ t('app.name') }}
        </AppLink>
        <nav class="flex items-center gap-1 md:gap-2" aria-label="Navigation principale">
          <AppLink
            to="/"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ui-muted hover:bg-ui-background hover:text-primary-emerald dark:hover:bg-ui-border-dark"
          >
            <Home :size="20" class="shrink-0 text-current" />
            <span class="hidden xl:inline">{{ t('nav.home') }}</span>
          </AppLink>
          <AppLink
            to="/explore"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ui-muted hover:bg-ui-background hover:text-primary-emerald dark:hover:bg-ui-border-dark"
          >
            <Search :size="20" class="shrink-0 text-current" />
            <span class="hidden xl:inline">{{ t('nav.explorer') }}</span>
          </AppLink>
          <AppLink
            to="/reels"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ui-muted hover:bg-ui-background hover:text-primary-emerald dark:hover:bg-ui-border-dark"
          >
            <Play :size="20" class="shrink-0 text-current" />
            <span class="hidden xl:inline">{{ t('nav.reels') }}</span>
          </AppLink>
        </nav>
        <div class="flex items-center gap-2 shrink-0">
          <AppLink
            v-if="appStore.token"
            to="/admin"
            class="hidden rounded-lg px-3 py-2 text-sm font-medium text-ui-muted hover:bg-ui-background hover:text-primary-emerald md:inline-flex dark:hover:bg-ui-border-dark"
          >
            {{ t('nav.dashboard') }}
          </AppLink>
          <AppLink
            v-else
            to="/auth"
            class="rounded-lg px-3 py-2 text-sm font-medium text-primary-emerald hover:bg-primary-emerald/10"
          >
            {{ t('nav.devenirLandlord') }}
          </AppLink>
          <template v-if="appStore.token">
            <NotificationBell />
          </template>
          <LanguageSwitcher />
          <CurrencySwitcher />
          <ThemeToggle />
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

