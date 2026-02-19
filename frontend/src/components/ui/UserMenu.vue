<script setup lang="ts">
/**
 * Menu utilisateur : regroupe profil, dashboard, espace pro et déconnexion.
 * Si non connecté : bouton unique « Connexion ».
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { User, LayoutDashboard, LogOut, LogIn, ChevronDown } from 'lucide-vue-next'
import { useAppStore } from '../../stores/app'
// import AppButton from './AppButton.vue'
import AppLink from './AppLink.vue'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const loggedIn = computed(() => !!appStore.token)
const isPro = computed(() => {
  const role = appStore.userRole
  return role === 'admin' || role === 'agent' || role === 'landlord'
})

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function logout() {
  appStore.setToken(null)
  close()
  router.push('/')
}

function handleGlobalClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (!menuRef.value || !target) return
  if (!menuRef.value.contains(target)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
})
</script>

<template>
  <!-- Non connecté : bouton Connexion bien visible en header -->
  <div v-if="!loggedIn" class="flex items-center">
    <AppLink
      to="/auth"
      class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[var(--color-accent)] dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-[var(--color-accent)]"
    >
      <LogIn class="h-5 w-5 shrink-0" />
      {{ t('nav.auth') }}
    </AppLink>
  </div>

  <!-- Connecté : menu utilisateur compact -->
  <div v-else ref="menuRef" class="relative">
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800 px-3 py-1.5 text-sm text-[var(--color-text)] shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
      @click.stop="toggle"
    >
      <User class="w-5 h-5 shrink-0 text-[var(--color-muted)]" />
      <span class="hidden sm:inline">{{ t('nav.profile') }}</span>
      <ChevronDown class="w-4 h-4 shrink-0 text-[var(--color-muted)]" />
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-52 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-2 text-sm z-40"
    >
      <AppLink
        to="/dashboard"
        class="flex w-full items-center gap-2 px-3 py-2 text-[var(--color-text)] hover:bg-gray-100 dark:hover:bg-gray-800"
        @click="close"
      >
        <LayoutDashboard class="w-4 h-4 shrink-0 text-[var(--color-muted)]" />
        <span>{{ t('nav.dashboard') }}</span>
      </AppLink>
      <AppLink
        to="/profile"
        class="flex w-full items-center gap-2 px-3 py-2 text-[var(--color-text)] hover:bg-gray-100 dark:hover:bg-gray-800"
        @click="close"
      >
        <User class="w-4 h-4 shrink-0 text-[var(--color-muted)]" />
        <span>{{ t('nav.profile') }}</span>
      </AppLink>
      <AppLink
        v-if="isPro"
        to="/admin"
        class="flex w-full items-center gap-2 px-3 py-2 text-[var(--color-text)] hover:bg-gray-100 dark:hover:bg-gray-800"
        @click="close"
      >
        <LayoutDashboard class="w-4 h-4 shrink-0 text-[var(--color-muted)]" />
        <span>{{ t('nav.admin') }}</span>
      </AppLink>
      <div class="my-2 border-t border-gray-200 dark:border-gray-700" />
      <button
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        @click.stop="logout"
      >
        <LogOut class="w-4 h-4 shrink-0" />
        <span>{{ t('nav.logout') }}</span>
      </button>
    </div>
  </div>
</template>

