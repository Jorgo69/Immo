<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  User,
  Pencil,
  CheckCircle2,
  Wallet,
  Heart,
  FileText,
  CalendarDays,
  ShieldCheck,
  Settings,
  Home,
  Megaphone,
} from 'lucide-vue-next'
import gsap from 'gsap'
import { getMe } from '../services/auth.service'
import { getMyWallet } from '../services/wallet.service'
import { useAppStore } from '../stores/app'
import { LanguageSwitcher, ThemeToggle } from '../components/ui'
import type { AuthUserDto } from '../services/auth.service'
import type { WalletDto } from '../services/wallet.service'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const user = ref<AuthUserDto | null>(null)
const wallet = ref<WalletDto | null>(null)
const loading = ref(true)
const profileViewRole = ref<'tenant' | 'landlord'>('tenant')
const gridRef = ref<HTMLElement | null>(null)

const displayName = computed(() => {
  if (!user.value) return t('profile.title')
  const first = user.value.first_name?.trim()
  const last = user.value.last_name?.trim()
  if (first && last) return `${first} ${last}`
  if (first) return first
  if (last) return last
  return user.value.phone_number || t('profile.title')
})

const tenantActions = [
  { key: 'favorites', icon: Heart, color: 'text-rose-500', to: '/property' },
  { key: 'myRequests', icon: FileText, color: 'text-amber-500', to: '/dashboard' },
  { key: 'myVisits', icon: CalendarDays, color: 'text-emerald-500', to: '/dashboard' },
  { key: 'kyc', icon: ShieldCheck, color: 'text-blue-500', to: { name: 'profile-edit' } },
  { key: 'settings', icon: Settings, color: 'text-gray-500', to: { name: 'profile-edit' } },
]
const landlordActions = [
  { key: 'myListings', icon: Megaphone, color: 'text-violet-500', to: '/admin/properties' },
  { key: 'myProperties', icon: Home, color: 'text-teal-500', to: '/admin/properties' },
  { key: 'myVisits', icon: CalendarDays, color: 'text-emerald-500', to: '/dashboard' },
  { key: 'kyc', icon: ShieldCheck, color: 'text-blue-500', to: { name: 'profile-edit' } },
  { key: 'settings', icon: Settings, color: 'text-gray-500', to: { name: 'profile-edit' } },
]

const currentActions = computed(() =>
  profileViewRole.value === 'tenant' ? tenantActions : landlordActions,
)

function formatAmount(value: string) {
  return new Intl.NumberFormat('fr-FR').format(Number(value)) + ' FCFA'
}

async function load() {
  loading.value = true
  try {
    const [me, walletData] = await Promise.all([getMe(), getMyWallet().catch(() => null)])
    user.value = me
    wallet.value = walletData ?? null
    const role = appStore.userRole as string
    if (role === 'landlord' || role === 'agent' || role === 'admin') {
      profileViewRole.value = 'landlord'
    } else {
      profileViewRole.value = 'tenant'
    }
  } finally {
    loading.value = false
  }
}

function goTo(to: string | { name: string }) {
  if (typeof to === 'string') router.push(to)
  else router.push(to)
}

function logout() {
  appStore.setToken(null)
  router.push({ name: 'auth' })
}

function runCardsStagger() {
  nextTick(() => {
    const cards = gridRef.value?.querySelectorAll('[data-profile-card]')
    if (cards?.length) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 0.1 },
      )
    }
  })
}

onMounted(() => {
  load()
})

watch(loading, (isLoading) => {
  if (!isLoading) runCardsStagger()
})

watch(
  () => profileViewRole.value,
  () => {
    if (!gridRef.value || loading.value) return
    const cards = gridRef.value.querySelectorAll('[data-profile-card]')
    gsap.fromTo(
      cards,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' },
    )
  },
)
</script>

<template>
  <main class="min-h-screen bg-[#F9FAFB] pb-32 pt-10 dark:bg-gray-950">
    <div class="mx-auto max-w-lg px-5 sm:px-8">
      <!-- Loading -->
      <p v-if="loading" class="py-12 text-center text-[var(--color-muted)]">
        {{ t('profile.loading') }}
      </p>

      <template v-else>
        <!-- 1. Header immersif -->
        <header class="mb-12 text-center">
          <div class="relative inline-block">
            <div
              class="h-24 w-24 overflow-hidden rounded-full border-2 border-white bg-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-700"
            >
              <img
                v-if="user?.avatar_url"
                :src="user.avatar_url"
                :alt="displayName"
                class="h-full w-full object-cover"
              />
              <User v-else class="mx-auto h-12 w-12 text-gray-400" />
            </div>
            <span
              v-if="user?.is_verified"
              class="absolute -bottom-0.5 -right-0.5 rounded-full bg-[var(--color-accent)] p-1 text-white"
              :title="t('profile.verified')"
            >
              <CheckCircle2 class="h-5 w-5" />
            </span>
          </div>
          <h1 class="mt-6 text-2xl font-bold text-[var(--color-text)]">
            {{ displayName }}
          </h1>
          <RouterLink
            :to="{ name: 'profile-edit' }"
            class="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
          >
            <Pencil class="h-4 w-4" />
            {{ t('profile.editProfile') }}
          </RouterLink>
        </header>

        <!-- 2. Carte Tirelire (élément central) -->
        <section class="mb-12">
          <div
            class="overflow-hidden rounded-2xl bg-gray-900 px-6 py-6 shadow-sm dark:bg-gray-900"
          >
            <div class="flex items-center gap-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white"
              >
                <Wallet class="h-6 w-6" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-400">
                  {{ t('profile.tirelire') }}
                </p>
                <p class="text-xl font-bold text-white">
                  {{ wallet ? formatAmount(wallet.balance_savings) : '0 FCFA' }}
                </p>
              </div>
            </div>
            <RouterLink
              :to="{ name: 'dashboard' }"
              class="mt-4 block text-center text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              {{ t('profile.viewDashboard') }} →
            </RouterLink>
          </div>
        </section>

        <!-- 3. Sélecteur de rôle -->
        <section class="mb-10">
          <div
            class="flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <button
              type="button"
              :class="[
                'flex-1 rounded-xl py-3 text-sm font-medium transition-all duration-200',
                profileViewRole === 'tenant'
                  ? 'bg-[var(--color-accent)] text-white shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]',
              ]"
              @click="profileViewRole = 'tenant'"
            >
              {{ t('profile.roleTenant') }}
            </button>
            <button
              type="button"
              :class="[
                'flex-1 rounded-xl py-3 text-sm font-medium transition-all duration-200',
                profileViewRole === 'landlord'
                  ? 'bg-[var(--color-accent)] text-white shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]',
              ]"
              @click="profileViewRole = 'landlord'"
            >
              {{ t('profile.roleLandlord') }}
            </button>
          </div>
        </section>

        <!-- 4. Grille d'actions (Menu Cards) -->
        <section ref="gridRef" class="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
          <button
            v-for="action in currentActions"
            :key="action.key"
            type="button"
            data-profile-card
            class="flex flex-col items-start rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-[var(--color-accent)]/30 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-[var(--color-accent)]/30"
            @click="goTo(action.to)"
          >
            <component
              :is="action.icon"
              :class="['mb-3 h-7 w-7 shrink-0', action.color]"
            />
            <span class="text-sm font-semibold text-[var(--color-text)]">
              {{ t(`profile.menu${action.key.charAt(0).toUpperCase() + action.key.slice(1)}`) }}
            </span>
            <span class="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
              {{ t(`profile.menu${action.key.charAt(0).toUpperCase() + action.key.slice(1)}Desc`) }}
            </span>
          </button>
        </section>

        <!-- 5. Footer de profil -->
        <footer class="mt-16 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div>
            <p class="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              {{ t('profile.sectionLanguage') }}
            </p>
            <div class="min-h-[2.75rem] w-full">
              <LanguageSwitcher />
            </div>
          </div>

          <div class="flex items-center justify-between border-t border-gray-100 pt-6 dark:border-gray-700">
            <span class="text-sm text-[var(--color-muted)]">{{ t('profile.sectionTheme') }}</span>
            <ThemeToggle />
          </div>

          <div class="border-t border-gray-100 pt-8 dark:border-gray-700">
            <button
              type="button"
              class="w-full rounded-xl py-4 text-center text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
              @click="logout"
            >
              {{ t('profile.logout') }}
            </button>
          </div>
        </footer>
      </template>
    </div>
  </main>
</template>
