<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterView } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import { Home, Search, WifiOff, Play } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import AppLink from '../components/ui/AppLink.vue'
import { LanguageSwitcher, ThemeToggle, CurrencySwitcher, UserMenu } from '../components/ui'
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
  <div class="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
    <header class="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div class="max-w-layout mx-auto px-6 md:px-8 h-14 flex items-center justify-between gap-4">
        <AppLink to="/" class="font-semibold text-[var(--color-text)] text-base shrink-0">
          {{ t('app.name') }}
        </AppLink>
        <nav class="flex items-center gap-2 flex-wrap justify-end">
          <LanguageSwitcher />
          <CurrencySwitcher />
          <ThemeToggle />
          <AppLink to="/" variant="nav" class="text-sm">
            <Home class="w-5 h-5 shrink-0" />
            {{ t('nav.home') }}
          </AppLink>
          <AppLink to="/property" variant="nav" class="text-sm">
            <Search class="w-5 h-5 shrink-0" />
            {{ t('nav.search') }}
          </AppLink>
          <AppLink to="/reels" variant="nav" class="text-sm">
            <Play class="w-5 h-5 shrink-0" />
            {{ t('nav.reels') }}
          </AppLink>
          <template v-if="appStore.token">
            <NotificationBell />
          </template>
          <UserMenu />
        </nav>
      </div>
    </header>
    <RouterView />
    <!-- Indication hors ligne (PWA) -->
    <div
      v-if="!isOnline"
      class="fixed bottom-0 left-0 right-0 bg-amber-100 border-t border-amber-300 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-sm z-50"
    >
      <WifiOff class="w-5 h-5 shrink-0" />
      {{ t('app.offline') }}
    </div>
  </div>
</template>

