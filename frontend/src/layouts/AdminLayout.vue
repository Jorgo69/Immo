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
  MapPin,
  BookOpen,
  Banknote,
  History,
  ShieldCheck,
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
      { path: '/admin/profile/edit', label: t('nav.profile'), icon: User },
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
    ...(canAddOrManageProperties.value ? [{
      key: 'patrimoine',
      label: 'Patrimoine (Nouveau)',
      icon: Home,
      children: [
        { path: '/admin/assets/properties', label: 'Biens immobiliers' },
        { path: '/admin/assets/units', label: 'Unités' },
      ],
    }] : []),

    {
      key: 'finances',
      label: t('admin.navFinances'),
      icon: Wallet,
      children: [
        { path: '/admin/wallets', label: t('admin.navWallets') },
        { path: '/admin/transactions', label: t('admin.navTransactions') },
      ],
    },

    // ── Paramètres système (Admin uniquement) ───────────────────────
    ...(isAdmin.value ? [{
      key: 'parametres',
      label: t('admin.navSettings'),
      icon: Settings2,
      children: [
        { path: '/admin/settings', label: 'Paramètres globaux', icon: Settings2 },
        { path: '/admin/location', label: t('admin.navLocation'), icon: MapPin },
        { path: '/admin/references', label: t('admin.navReferences'), icon: BookOpen },
        { path: '/admin/currencies', label: 'Devises', icon: Banknote },
        { path: '/admin/users', label: t('admin.navUsers'), icon: Users },
        { path: '/admin/kyc', label: 'Validation KYC', icon: ShieldCheck },
        { path: '/admin/roles', label: 'Rôles & Permissions', icon: Key },
        { path: '/admin/activity-logs', label: "Trace d'Audit", icon: History },
      ],
    }] : []),

    // ── Profil utilisateur (visible par tous en bas) ───────────────
    { path: '/admin/profile/edit', label: t('nav.profile'), icon: User },
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

    <!-- Sidebar : thème global — Apple Glass Style -->
    <aside
      class="fixed md:static inset-y-0 left-0 z-50 shrink-0 flex flex-col border-r transition-[width] duration-300 ease-in-out md:translate-x-0 bg-white/70 dark:bg-brand-dark/70 backdrop-blur-xl border-ui-border/50 dark:border-white/5"
      :class="[
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        sidebarCollapsed ? 'w-sidebar-collapsed md:w-sidebar-collapsed' : 'w-sidebar-expanded md:w-64',
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

      <nav class="p-3 flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <template v-for="(item, idx) in navItems" :key="'path' in item ? item.path : (item as { key?: string }).key ?? idx">
          <!-- Lien simple -->
          <AppLink
            v-if="'path' in item && item.path"
            :to="item.path"
            class="group flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm transition-all duration-300 min-w-0 relative overflow-hidden"
            :class="isActive(item.path)
              ? 'bg-primary-emerald text-white shadow-glow-emerald font-bold'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-100'"
            @click="closeSidebarOnMobile"
          >
            <component :is="item.icon" class="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
            <span v-show="!sidebarCollapsed" class="truncate relative z-10">{{ item.label }}</span>
            <div v-if="isActive(item.path)" class="absolute inset-0 bg-gradient-to-tr from-primary-emerald to-emerald-400 opacity-20" />
          </AppLink>

          <!-- Section avec enfants : accordéon (étendu) ou flottant (réduit) -->
          <template v-else-if="'children' in item && item.children?.length">
            <div
              v-if="!sidebarCollapsed"
              class="rounded-2xl overflow-hidden"
            >
              <button
                type="button"
                class="group flex w-full items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 min-w-0"
                :class="hasActiveChild(item.children)
                  ? 'text-primary-emerald bg-primary-emerald/5 dark:bg-primary-emerald/10'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-100'"
                @click="toggleAccordion((item as { key: string }).key ?? String(idx))"
              >
                <component :is="item.icon" class="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span class="truncate flex-1 text-left">{{ item.label }}</span>
                <ChevronDown
                  class="w-4 h-4 shrink-0 transition-transform duration-300"
                  :class="expandedAccordion === ((item as { key: string }).key ?? String(idx)) ? 'rotate-180 text-primary-emerald' : ''"
                />
              </button>
              <div
                v-show="expandedAccordion === ((item as { key?: string }).key ?? String(idx))"
                class="pl-11 pr-2 pb-2 space-y-1 animate-in slide-in-from-top-2 duration-300"
              >
                <AppLink
                  v-for="(child, cIdx) in item.children"
                  :key="cIdx"
                  :to="child.path"
                  class="flex items-center gap-2 py-2 px-3 rounded-xl text-sm transition-all duration-200"
                  :class="isActive(child.path)
                    ? 'text-primary-emerald font-bold bg-primary-emerald/5'
                    : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-white/5'"
                  @click="closeSidebarOnMobile"
                >
                  <Plus v-if="child.path && child.path.includes('openAdd')" class="w-3.5 h-3.5 shrink-0" />
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
    <div class="flex-1 flex flex-col min-w-0 bg-ui-background dark:bg-gray-900 relative">
      <header class="sticky top-0 z-30 h-16 shrink-0 border-b border-ui-border/50 dark:border-white/5 bg-white/80 dark:bg-brand-dark/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between gap-4 transition-all duration-300">
        <div class="flex items-center gap-4 min-w-0">
          <button
            type="button"
            class="md:hidden p-2 rounded-xl text-ui-muted hover:bg-gray-100 dark:hover:bg-white/5 transition-colors shrink-0"
            :aria-label="t('admin.navProperties')"
            @click="sidebarOpen = true"
          >
            <Menu class="w-6 h-6" />
          </button>
          <h1 class="text-xl font-extrabold text-gray-900 dark:text-gray-100 truncate tracking-tight">
            {{ pageTitle }}
          </h1>
        </div>
        <div class="flex items-center gap-3">
          <div class="hidden lg:flex items-center gap-2 p-1 rounded-2xl bg-gray-100/50 dark:bg-white/5 border border-ui-border/50 dark:border-white/5">
            <LanguageSwitcher />
            <div class="w-px h-4 bg-ui-border dark:bg-white/10 mx-1" />
            <CurrencySwitcher />
          </div>
          <ThemeToggle />
          <AppLink
            to="/admin/profile"
            class="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-100/50 dark:bg-white/5 border border-transparent hover:border-ui-border/50 dark:hover:border-white/10 transition-all"
          >
            <div class="h-7 w-7 rounded-full bg-primary-emerald/10 flex items-center justify-center text-primary-emerald">
              <User class="w-4 h-4" />
            </div>
            <span class="hidden sm:inline">{{ userLabel || t('nav.profile') }}</span>
          </AppLink>
          <AppButton type="button" variant="ghost" size="none" class="h-10 w-10 !rounded-2xl hover:bg-danger-red/10 hover:text-danger-red transition-all" @click="logout" v-tooltip="t('common.logout')">
            <LogOut class="w-5 h-5" />
          </AppButton>
        </div>
      </header>

      <main class="flex-1 overflow-auto p-6 bg-ui-background dark:bg-gray-900">
        <RouterView />
      </main>
    </div>
  </div>
</template>
