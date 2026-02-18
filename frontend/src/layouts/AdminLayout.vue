<script setup lang="ts">
/**
 * Layout Espace pro : sidebar + nav bar + zone content.
 * Desktop-first, charte Immo (accent #059669, fond #F9FAFB).
 */
import { useI18n } from 'vue-i18n'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { computed, onMounted } from 'vue'
import {
  LayoutDashboard,
  Building2,
  Home,
  ChevronDown,
  LogOut,
  User,
  Users,
  DoorOpen,
  Wallet,
  UserCircle,
} from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import { getMe } from '../services/auth.service'
import AppLink from '../components/ui/AppLink.vue'
import AppButton from '../components/ui/AppButton.vue'
import { LanguageSwitcher, ThemeToggle, CurrencySwitcher } from '../components/ui'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const pageTitle = computed(() => (route.meta.title as string) ?? t('admin.title'))
const userLabel = computed(() => appStore.userId ? t('nav.profile') : '')

// Rafraîchir l’utilisateur depuis l’API pour avoir un owner_id UUID valide (évite 400 sur création bien).
const navItems = computed(() => [
  { path: '/', label: t('nav.home'), icon: Home },
  { path: '/admin', label: t('admin.navDashboard'), icon: LayoutDashboard },
  { path: '/admin/users', label: t('admin.navUsers'), icon: Users },
  {
    label: t('admin.navProperties'),
    icon: Building2,
    children: [{ path: '/admin/properties', label: t('admin.navPropertiesList') }],
  },
  { path: '/admin/rooms', label: t('admin.navRooms'), icon: DoorOpen },
  {
    label: t('admin.navFinances'),
    icon: Wallet,
    children: [
      { path: '/admin/wallets', label: t('admin.navWallets') },
      { path: '/admin/transactions', label: t('admin.navTransactions') },
    ],
  },
  { path: '/admin/profiles', label: t('admin.navProfiles'), icon: UserCircle },
])

function isActive(path: string) {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

onMounted(async () => {
  if (appStore.token) {
    try {
      const user = await getMe()
      appStore.setUser(user.id, user.role)
    } catch {
      // Token invalide ou expiré
    }
  }
})

function logout() {
  appStore.setToken(null)
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex bg-[var(--color-bg)] text-[var(--color-text)]">
    <!-- Sidebar : nav + subnav, ligne par ligne, sous-menus indentés -->
    <aside class="w-60 shrink-0 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 flex flex-col">
      <div class="p-4 border-b border-gray-100 dark:border-gray-700">
        <AppLink to="/" class="font-semibold text-[var(--color-accent)] text-lg">
          {{ t('app.name') }}
        </AppLink>
      </div>
      <nav class="p-3 flex-1 flex flex-col gap-0.5">
        <template v-for="(item, idx) in navItems" :key="idx">
          <AppLink
            v-if="'path' in item && item.path"
            :to="item.path"
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors"
            :class="isActive(item.path) ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium' : 'text-[var(--color-muted)] hover:bg-gray-100 hover:text-[var(--color-text)] dark:hover:bg-gray-800'"
          >
            <component :is="item.icon" class="w-4 h-4 shrink-0" />
            <span>{{ item.label }}</span>
          </AppLink>
          <template v-else-if="'children' in item && item.children?.length">
            <div class="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-[var(--color-text)]">
              <component :is="item.icon" class="w-4 h-4 shrink-0 text-[var(--color-muted)]" />
              <span>{{ item.label }}</span>
            </div>
            <div v-for="(child, cIdx) in item.children" :key="cIdx" class="pl-9 pr-2">
              <AppLink
                :to="child.path"
                class="flex items-center gap-2 py-2 px-2 rounded-lg text-sm transition-colors"
                :class="isActive(child.path) ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium' : 'text-[var(--color-muted)] hover:bg-gray-100 hover:text-[var(--color-text)] dark:hover:bg-gray-800'"
              >
                <span>{{ child.label }}</span>
              </AppLink>
            </div>
          </template>
        </template>
      </nav>
    </aside>

    <!-- Content area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Nav bar -->
      <header class="h-14 shrink-0 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-6 flex items-center justify-between">
        <h1 class="text-lg font-semibold text-[var(--color-text)] truncate">
          {{ pageTitle }}
        </h1>
        <div class="flex items-center gap-2">
          <LanguageSwitcher />
          <CurrencySwitcher />
          <ThemeToggle />
          <AppLink to="/profile" class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-[var(--color-text)] hover:bg-gray-100 dark:hover:bg-gray-800">
            <User class="w-5 h-5 shrink-0 text-[var(--color-muted)]" />
            <span class="hidden sm:inline">{{ userLabel || t('nav.profile') }}</span>
            <ChevronDown class="w-5 h-5 shrink-0 text-[var(--color-muted)]" />
          </AppLink>
          <AppButton type="button" variant="ghost" size="sm" @click="logout">
            <LogOut class="w-5 h-5 shrink-0" />
          </AppButton>
        </div>
      </header>

      <!-- Main content -->
      <main class="flex-1 overflow-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
