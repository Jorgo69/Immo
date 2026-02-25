<script setup lang="ts">
/**
 * Layout Espace pro : sidebar (collapse + sous-menus flottants) + nav bar + zone content.
 * Design Frijo/MallOS : sidebar fine, icônes minimalistes, thème sémantique Tailwind.
 */
import { useI18n } from 'vue-i18n'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import {
  Home,
  Building2,
  Key,
  Wallet,
  Settings2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Users,
  Menu,
  Plus,
  FileText,
  Globe,
} from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import AppLink from '../components/ui/AppLink.vue'
import AppButton from '../components/ui/AppButton.vue'
import { LanguageSwitcher, ThemeToggle, CurrencySwitcher } from '../components/ui'

const SIDEBAR_COLLAPSED_KEY = 'immo_sidebar_collapsed'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const sidebarOpen = ref(true)
const sidebarCollapsed = ref(false)
const expandedAccordion = ref<string | null>(null)
const floatingSubmenu = ref<string | null>(null)

function loadSidebarCollapsed() {
  try {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    sidebarCollapsed.value = stored === 'true'
  } catch {
    sidebarCollapsed.value = false
  }
}

function toggleSidebarCollapsed() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed.value))
  } catch {}
}

onMounted(loadSidebarCollapsed)

const pageTitle = computed(() => (route.meta.title as string) ?? t('admin.title'))
const userLabel = computed(() => appStore.displayName() || t('nav.profile'))
const isLandlord = computed(() => appStore.userRole === 'landlord')
const isAgent = computed(() => appStore.userRole === 'agent')
const isAdmin = computed(() => appStore.userRole === 'admin')
const canAddOrManageProperties = computed(() => isLandlord.value || isAgent.value || isAdmin.value)

const navItems = computed(() => {
  if (appStore.userRole === 'tenant') {
    return [
      { path: '/admin', label: t('admin.navHome'), icon: Home },
      { path: '/my-requests', label: t('admin.proMyRequests'), icon: FileText },
      { path: '/profile/edit', label: t('admin.navSettings'), icon: Settings2 },
    ]
  }
  return [
    { path: '/admin', label: t('admin.navHome'), icon: Home },
    ...(canAddOrManageProperties.value ? [{
      key: 'biens',
      label: t('admin.navMyAssets'),
      icon: Building2,
      children: [
        { path: '/admin/landlord/properties', label: t('landlord.myProperties') },
        { path: '/admin/landlord/properties?openAdd=property', label: t('landlord.addProperty') },
        { path: '/admin/landlord/requests', label: t('rental.requestsTitle') },
        ...(isAdmin.value ? [{ path: '/admin/properties', label: t('admin.navPropertiesList') }] : []),
      ],
    }] : []),
    ...(canAddOrManageProperties.value ? [{ path: '/admin/landlord/units', label: t('admin.navUnits'), icon: Key }] : []),
    {
      key: 'finances',
      label: t('admin.navFinances'),
      icon: Wallet,
      children: [
        { path: '/admin/wallets', label: t('admin.navWallets') },
        { path: '/admin/transactions', label: t('admin.navTransactions') },
      ],
    },
    { path: '/profile/edit', label: t('admin.navSettings'), icon: Settings2 },
    ...(isAdmin.value ? [
      { path: '/admin/users', label: t('admin.navUsers'), icon: Users },
      { path: '/admin/location', label: t('admin.navLocation'), icon: Globe },
      { path: '/admin/references', label: t('admin.navReferences'), icon: Settings2 },
    ] : []),
  ]
})

function isActive(path: string) {
  const pathBase = path.split('?')[0]
  if (pathBase === '/admin') return route.path === '/admin'
  return route.path.startsWith(pathBase)
}

function hasActiveChild(children: { path: string }[]) {
  return children?.some((c) => isActive(c.path)) ?? false
}

function toggleAccordion(key: string) {
  expandedAccordion.value = expandedAccordion.value === key ? null : key
}

function closeSidebarOnMobile() {
  if (typeof window !== 'undefined' && window.innerWidth < 768) sidebarOpen.value = false
}

onMounted(() => {
  if (appStore.token && !appStore.currentUser) {
    appStore.refreshMe().catch(() => {})
  }
})

function logout() {
  appStore.setToken(null)
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex bg-ui-background dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <!-- Overlay mobile -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 md:hidden"
      aria-hidden="true"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar : thème global — light = claire, dark = sombre (ARCHITECTURE §2) -->
    <aside
      class="fixed md:static inset-y-0 left-0 z-50 shrink-0 flex flex-col border-r transition-[width] duration-200 ease-out md:translate-x-0 bg-ui-surface dark:bg-brand-dark border-ui-border dark:border-gray-800"
      :class="[
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        sidebarCollapsed ? 'w-sidebar-collapsed md:w-sidebar-collapsed' : 'w-sidebar-expanded md:w-60',
      ]"
    >
      <!-- Header sidebar -->
      <div class="flex items-center justify-between h-14 px-3 border-b border-ui-border dark:border-gray-800 shrink-0 min-w-0">
        <AppLink
          to="/"
          class="flex items-center gap-2 min-w-0 overflow-hidden text-primary-emerald font-semibold"
        >
          <span class="shrink-0 w-8 h-8 rounded-lg bg-primary-emerald/20 flex items-center justify-center text-primary-emerald">
            {{ t('app.name').charAt(0) }}
          </span>
          <span
            v-show="!sidebarCollapsed"
            class="truncate text-sm"
          >
            {{ t('app.name') }}
          </span>
        </AppLink>
        <div class="flex items-center gap-0.5 shrink-0">
          <button
            v-if="!sidebarCollapsed"
            type="button"
            class="hidden md:flex p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            :aria-label="sidebarCollapsed ? t('common.expand') : t('common.collapse')"
            @click="toggleSidebarCollapsed"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            v-else
            type="button"
            class="hidden md:flex p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            :aria-label="t('common.expand')"
            @click="toggleSidebarCollapsed"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
          <button
            type="button"
            class="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
            :aria-label="t('common.cancel')"
            @click="sidebarOpen = false"
          >
            <ChevronDown class="w-4 h-4 rotate-90" />
          </button>
        </div>
      </div>

      <nav class="p-2 flex-1 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
        <template v-for="(item, idx) in navItems" :key="'path' in item ? item.path : (item as { key?: string }).key ?? idx">
          <!-- Lien simple -->
          <AppLink
            v-if="'path' in item && item.path"
            :to="item.path"
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors min-w-0"
            :class="isActive(item.path)
              ? 'bg-primary-emerald/10 dark:bg-primary-emerald/20 text-primary-emerald font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-gray-200'"
            @click="closeSidebarOnMobile"
          >
            <component :is="item.icon" class="w-5 h-5 shrink-0" />
            <span v-show="!sidebarCollapsed" class="truncate">{{ item.label }}</span>
          </AppLink>

          <!-- Section avec enfants : accordéon (étendu) ou flottant (réduit) -->
          <template v-else-if="'children' in item && item.children?.length">
            <div
              v-if="!sidebarCollapsed"
              class="rounded-xl"
            >
              <button
                type="button"
                class="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors min-w-0"
                :class="hasActiveChild(item.children)
                  ? 'bg-primary-emerald/10 dark:bg-primary-emerald/20 text-primary-emerald'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-gray-200'"
                @click="toggleAccordion((item as { key: string }).key ?? String(idx))"
              >
                <component :is="item.icon" class="w-5 h-5 shrink-0" />
                <span class="truncate flex-1 text-left">{{ item.label }}</span>
                <ChevronDown
                  class="w-4 h-4 shrink-0 transition-transform"
                  :class="expandedAccordion === ((item as { key?: string }).key ?? String(idx)) ? 'rotate-180' : ''"
                />
              </button>
              <div
                v-show="expandedAccordion === ((item as { key?: string }).key ?? String(idx))"
                class="pl-4 pr-2 pb-1 space-y-0.5"
              >
                <AppLink
                  v-for="(child, cIdx) in item.children"
                  :key="cIdx"
                  :to="child.path"
                  class="flex items-center gap-2 py-2 px-2 rounded-lg text-sm transition-colors"
                  :class="isActive(child.path)
                    ? 'bg-primary-emerald/10 dark:bg-primary-emerald/20 text-primary-emerald font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-gray-200'"
                  @click="closeSidebarOnMobile"
                >
                  <Plus v-if="child.path && child.path.includes('openAdd')" class="w-4 h-4 shrink-0" />
                  <span class="truncate">{{ child.label }}</span>
                </AppLink>
              </div>
            </div>

            <!-- Mode réduit : icône + sous-menu flottant au survol -->
            <div
              v-else
              class="relative"
              @mouseenter="floatingSubmenu = (item as { key: string }).key ?? String(idx)"
              @mouseleave="floatingSubmenu = null"
            >
              <div
                class="flex items-center justify-center w-full py-2.5 rounded-xl text-sm transition-colors"
                :class="hasActiveChild(item.children)
                  ? 'bg-primary-emerald/10 dark:bg-primary-emerald/20 text-primary-emerald'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-gray-200'"
              >
                <component :is="item.icon" class="w-5 h-5 shrink-0" />
              </div>
              <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 translate-x-1"
                enter-to-class="opacity-100 translate-x-0"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100 translate-x-0"
                leave-to-class="opacity-0 translate-x-1"
              >
                <div
                  v-show="floatingSubmenu === ((item as { key: string }).key ?? String(idx))"
                  class="absolute left-full top-0 ml-1 py-1 min-w-[180px] rounded-xl border border-ui-border dark:border-gray-700 bg-ui-surface dark:bg-brand-dark shadow-soft-lg z-[60]"
                  role="menu"
                >
                  <AppLink
                    v-for="(child, cIdx) in item.children"
                    :key="cIdx"
                    :to="child.path"
                    class="flex items-center gap-2 px-3 py-2 mx-1 rounded-lg text-sm transition-colors"
                    :class="isActive(child.path)
                      ? 'bg-primary-emerald/10 dark:bg-primary-emerald/20 text-primary-emerald'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'"
                    @click="closeSidebarOnMobile"
                  >
                    <Plus v-if="child.path && child.path.includes('openAdd')" class="w-4 h-4 shrink-0" />
                    <span>{{ child.label }}</span>
                  </AppLink>
                </div>
              </Transition>
            </div>
          </template>
        </template>
      </nav>
    </aside>

    <!-- Zone contenu : fond explicite pour light/dark -->
    <div class="flex-1 flex flex-col min-w-0 bg-ui-background dark:bg-gray-900">
      <header class="h-14 shrink-0 border-b border-ui-border dark:border-gray-700 bg-ui-surface dark:bg-gray-900 px-4 md:px-6 flex items-center justify-between gap-2">
        <div class="flex items-center gap-3 min-w-0">
          <button
            type="button"
            class="md:hidden p-2 rounded-lg text-ui-muted hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
            :aria-label="t('admin.navProperties')"
            @click="sidebarOpen = true"
          >
            <Menu class="w-6 h-6" />
          </button>
          <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {{ pageTitle }}
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <LanguageSwitcher />
          <CurrencySwitcher />
          <ThemeToggle />
          <AppLink
            to="/profile"
            class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <User class="w-5 h-5 shrink-0 text-ui-muted" />
            <span class="hidden sm:inline">{{ userLabel || t('nav.profile') }}</span>
            <ChevronDown class="w-5 h-5 shrink-0 text-ui-muted" />
          </AppLink>
          <AppButton type="button" variant="ghost" size="sm" @click="logout">
            <LogOut class="w-5 h-5 shrink-0" />
          </AppButton>
        </div>
      </header>

      <main class="flex-1 overflow-auto p-6 bg-ui-background dark:bg-gray-900">
        <RouterView />
      </main>
    </div>
  </div>
</template>
