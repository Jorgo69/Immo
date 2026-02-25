<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  User,
  Pencil,
  CheckCircle2,
  Wallet,
  CreditCard,
  FileText,
  Heart,
  CalendarDays,
  ShieldCheck,
  Settings,
  Home,
  Megaphone,
  MessageCircle,
  HelpCircle,
  Plus,
} from 'lucide-vue-next'
import gsap from 'gsap'
import { getMyWallet, getMyTransactions } from '../services/wallet.service'
import { getMyPaymentMethods } from '../services/profile.service'
import { useAppStore } from '../stores/app'
import { AppCard, AppImage, LanguageSwitcher, ThemeToggle } from '../components/ui'
import type { AuthUserDto } from '../services/auth.service'
import type { WalletDto } from '../services/wallet.service'
import type { WalletTransactionDto } from '../services/wallet.service'
import type { PaymentMethodDto } from '../services/profile.service'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const user = ref<AuthUserDto | null>(null)
const wallet = ref<WalletDto | null>(null)
const transactions = ref<WalletTransactionDto[]>([])
const paymentMethods = ref<PaymentMethodDto[]>([])
const loading = ref(true)
const profileViewRole = ref<'tenant' | 'landlord'>('tenant')
const gridRef = ref<HTMLElement | null>(null)

/** Nom + Prénom, sinon Email, sinon téléphone ; pas de placeholder générique si une donnée existe. */
const displayName = computed(() => {
  if (!user.value) return t('profile.title')
  const first = user.value.first_name?.trim()
  const last = user.value.last_name?.trim()
  if (first || last) return [first, last].filter(Boolean).join(' ')
  const email = user.value.email?.trim()
  if (email) return email
  return user.value.phone_number || t('profile.title')
})

const kycStatus = computed(() => user.value?.profile?.kyc_status ?? 'pending')
const kycBadgeClass = computed(() => {
  const s = kycStatus.value?.toLowerCase()
  if (s === 'verified') return 'bg-kyc-verified/15 text-kyc-verified dark:bg-kyc-verified/25'
  if (s === 'rejected') return 'bg-kyc-rejected/15 text-kyc-rejected dark:bg-kyc-rejected/25'
  return 'bg-kyc-pending/15 text-kyc-pending dark:bg-kyc-pending/25'
})

const tenantActions = [
  { key: 'favorites', icon: Heart, to: '/property' },
  { key: 'myRequests', icon: FileText, to: '/my-requests' },
  { key: 'myVisits', icon: CalendarDays, to: '/admin' },
  { key: 'kyc', icon: ShieldCheck, to: { name: 'profile-edit' } },
  { key: 'settings', icon: Settings, to: { name: 'profile-edit' } },
]
const landlordActions = [
  { key: 'myListings', icon: Megaphone, to: '/admin/properties' },
  { key: 'myProperties', icon: Home, to: '/admin/properties' },
  { key: 'myVisits', icon: CalendarDays, to: '/admin' },
  { key: 'kyc', icon: ShieldCheck, to: { name: 'profile-edit' } },
  { key: 'settings', icon: Settings, to: { name: 'profile-edit' } },
]
const currentActions = computed(() =>
  profileViewRole.value === 'tenant' ? tenantActions : landlordActions,
)

function formatAmount(value: string) {
  return new Intl.NumberFormat('fr-FR').format(Number(value)) + ' FCFA'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function transactionTypeLabel(type: string) {
  return t(`dashboard.type.${type}`) || type
}

async function load() {
  loading.value = true
  try {
    const [me, walletData, txRes, methods] = await Promise.all([
      appStore.refreshMe(),
      getMyWallet().catch(() => null),
      getMyTransactions(1, 10).catch(() => ({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 })),
      getMyPaymentMethods().catch(() => []),
    ])
    user.value = me ?? null
    wallet.value = walletData ?? null
    transactions.value = txRes?.data ?? []
    paymentMethods.value = Array.isArray(methods) ? methods : []
    const role = appStore.userRole as string
    profileViewRole.value = role === 'landlord' || role === 'agent' || role === 'admin' ? 'landlord' : 'tenant'
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

function onAddPaymentMethod() {
  // TODO: ouvrir modal / page d'ajout carte ou Mobile Money
  router.push({ name: 'profile-edit' })
}

const WHATSAPP_SUPPORT_URL = 'https://wa.me/22900000000'

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
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <p v-if="loading" class="py-12 text-center text-[var(--color-muted)]">
        {{ t('profile.loading') }}
      </p>

      <template v-else>
        <!-- Layout: 1 col mobile, 3 cols desktop (30% 45% 25%) -->
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <!-- Colonne gauche (30%) : Identité, KYC, Sécurité -->
          <aside class="lg:col-span-4 xl:col-span-3 space-y-6">
            <div
              data-profile-card
              class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div class="flex flex-col items-center text-center">
                <div
                  class="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white bg-gray-200 shadow-md dark:border-gray-700 dark:bg-gray-700"
                >
                  <AppImage
                    v-if="user?.avatar_url"
                    :src="user.avatar_url"
                    :alt="displayName"
                    fit="cover"
                    class="h-full w-full object-cover"
                  />
                  <User v-else class="mx-auto h-12 w-12 text-gray-400" />
                  <span
                    v-if="user?.is_verified"
                    class="absolute -bottom-0.5 -right-0.5 rounded-full bg-[var(--color-accent)] p-1 text-white"
                    :title="t('profile.verified')"
                  >
                    <CheckCircle2 class="h-5 w-5" />
                  </span>
                </div>
                <h1 class="mt-4 text-xl font-bold text-[var(--color-text)]">
                  {{ displayName }}
                </h1>
                <RouterLink
                  :to="{ name: 'profile-edit' }"
                  class="mt-2 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
                >
                  <Pencil class="h-4 w-4" />
                  {{ t('profile.editProfile') }}
                </RouterLink>
                <div class="mt-4 w-full">
                  <span
                    :class="['inline-flex rounded-full px-3 py-1 text-xs font-medium', kycBadgeClass]"
                  >
                    {{ t('profile.kycStatus') }} : {{ kycStatus }}
                  </span>
                </div>
                <div class="mt-4 w-full border-t border-gray-100 pt-4 dark:border-gray-700">
                  <p class="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                    {{ t('profile.securityLevel') }}
                  </p>
                  <p class="mt-1 text-sm text-[var(--color-text)]">
                    {{ t('profile.twoFA') }} — Bientôt
                  </p>
                </div>
              </div>
            </div>

            <!-- Rôle + préférences (repliés sur desktop, garde langue / thème) -->
            <div
              data-profile-card
              class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div class="flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-600 dark:bg-gray-800">
                <button
                  type="button"
                  :class="[
                    'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
                    profileViewRole === 'tenant'
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]',
                  ]"
                  @click="profileViewRole = 'tenant'"
                >
                  {{ t('profile.roleTenant') }}
                </button>
                <button
                  type="button"
                  :class="[
                    'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
                    profileViewRole === 'landlord'
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]',
                  ]"
                  @click="profileViewRole = 'landlord'"
                >
                  {{ t('profile.roleLandlord') }}
                </button>
              </div>
              <div class="mt-4 space-y-3">
                <div>
                  <p class="text-xs font-medium text-[var(--color-muted)]">{{ t('profile.sectionLanguage') }}</p>
                  <div class="mt-1"><LanguageSwitcher /></div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-[var(--color-muted)]">{{ t('profile.sectionTheme') }}</span>
                  <ThemeToggle />
                </div>
              </div>
              <div class="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  class="w-full rounded-xl py-3 text-center text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  @click="logout"
                >
                  {{ t('profile.logout') }}
                </button>
              </div>
            </div>
          </aside>

          <!-- Colonne centrale (45%) : Tirelire + Historique + Contrats -->
          <section class="lg:col-span-5 xl:col-span-6 space-y-6">
            <!-- Tirelire agrandie -->
            <div
              data-profile-card
              class="overflow-hidden rounded-2xl bg-gray-900 px-6 py-8 shadow-lg dark:bg-gray-900"
            >
              <div class="flex items-center gap-4">
                <div
                  class="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-white"
                >
                  <Wallet class="h-7 w-7" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-400">{{ t('profile.tirelire') }}</p>
                  <p class="text-2xl font-bold text-white">
                    {{ wallet ? formatAmount(wallet.balance_savings) : '0 FCFA' }}
                  </p>
                </div>
              </div>
              <RouterLink
                :to="{ name: 'admin' }"
                class="mt-5 block text-center text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                {{ t('profile.viewDashboard') }} →
              </RouterLink>
            </div>

            <!-- Historique des transactions -->
            <AppCard data-profile-card>
              <template #title>
                <h2 class="text-lg font-semibold text-[var(--color-text)]">
                  {{ t('profile.recentTransactions') }}
                </h2>
              </template>
              <div v-if="transactions.length" class="space-y-2">
                <div
                  v-for="tx in transactions"
                  :key="tx.id"
                  class="flex items-center justify-between rounded-lg border border-gray-100 py-3 px-4 dark:border-gray-700"
                >
                  <div>
                    <p class="font-medium text-[var(--color-text)]">{{ transactionTypeLabel(tx.type) }}</p>
                    <p class="text-xs text-[var(--color-muted)]">{{ formatDate(tx.created_at) }}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold text-[var(--color-text)]">{{ formatAmount(tx.amount) }}</p>
                    <span
                      :class="[
                        'text-xs',
                        tx.status === 'completed'
                          ? 'text-kyc-verified'
                          : tx.status === 'failed'
                            ? 'text-kyc-rejected'
                            : 'text-kyc-pending',
                      ]"
                    >
                      {{ tx.status }}
                    </span>
                  </div>
                </div>
              </div>
              <div
                v-else
                class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12 dark:border-gray-700"
              >
                <Wallet class="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p class="text-sm font-medium text-[var(--color-text)]">{{ t('profile.noTransactions') }}</p>
                <p class="mt-1 text-xs text-[var(--color-muted)]">{{ t('profile.noTransactionsHint') }}</p>
              </div>
            </AppCard>

            <!-- Mes Contrats -->
            <AppCard data-profile-card>
              <template #title>
                <h2 class="text-lg font-semibold text-[var(--color-text)]">
                  {{ t('profile.myContracts') }}
                </h2>
              </template>
              <div
                class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12 dark:border-gray-700"
              >
                <FileText class="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p class="text-sm font-medium text-[var(--color-text)]">{{ t('profile.noContracts') }}</p>
                <p class="mt-1 text-xs text-[var(--color-muted)]">{{ t('profile.noContractsHint') }}</p>
              </div>
            </AppCard>
          </section>

          <!-- Colonne droite (25%) : Méthodes de paiement + Raccourcis -->
          <aside class="lg:col-span-3 space-y-6">
            <!-- Méthodes de paiement (style Apple Wallet) -->
            <AppCard data-profile-card padding="md">
              <template #title>
                <h2 class="text-base font-semibold text-[var(--color-text)]">
                  {{ t('profile.paymentMethods') }}
                </h2>
              </template>
              <div v-if="paymentMethods.length" class="space-y-3">
                <div
                  v-for="pm in paymentMethods"
                  :key="pm.id"
                  class="flex items-center justify-between rounded-xl bg-gray-900 px-4 py-3 text-white shadow"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15"
                    >
                      <CreditCard class="h-5 w-5" />
                    </div>
                    <div>
                      <p class="font-medium">{{ pm.brand_display }}</p>
                      <p class="text-xs text-gray-400">{{ pm.last4_display }}</p>
                    </div>
                  </div>
                  <span
                    class="rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize"
                  >
                    {{ pm.type === 'mobile_money' ? 'Mobile Money' : 'Carte' }}
                  </span>
                </div>
              </div>
              <div
                v-else
                class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10 dark:border-gray-700"
              >
                <CreditCard class="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                <p class="text-center text-sm font-medium text-[var(--color-text)]">
                  {{ t('profile.noPaymentMethods') }}
                </p>
                <p class="mt-1 text-center text-xs text-[var(--color-muted)]">
                  {{ t('profile.noPaymentMethodsHint') }}
                </p>
              </div>
              <button
                type="button"
                class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] dark:border-gray-600 dark:hover:border-[var(--color-accent)]"
                @click="onAddPaymentMethod"
              >
                <Plus class="h-4 w-4" />
                {{ t('profile.addPaymentMethod') }}
              </button>
            </AppCard>

            <!-- Raccourcis -->
            <AppCard data-profile-card padding="md">
              <template #title>
                <h2 class="text-base font-semibold text-[var(--color-text)]">Raccourcis</h2>
              </template>
              <div class="space-y-2">
                <a
                  :href="WHATSAPP_SUPPORT_URL"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-3 rounded-xl border border-gray-200 py-3 px-4 transition hover:border-[var(--color-accent)] hover:bg-emerald-50/50 dark:border-gray-700 dark:hover:bg-emerald-950/20"
                >
                  <MessageCircle class="h-5 w-5 text-emerald-600" />
                  <span class="text-sm font-medium text-[var(--color-text)]">
                    {{ t('profile.supportWhatsApp') }}
                  </span>
                </a>
                <button
                  type="button"
                  class="flex w-full items-center gap-3 rounded-xl border border-gray-200 py-3 px-4 text-left transition hover:border-[var(--color-accent)] dark:border-gray-700"
                  @click="() => {}"
                >
                  <HelpCircle class="h-5 w-5 text-[var(--color-muted)]" />
                  <span class="text-sm font-medium text-[var(--color-text)]">
                    {{ t('profile.help') }}
                  </span>
                </button>
              </div>
            </AppCard>
          </aside>
        </div>

        <!-- Grille d'actions (menu cards) - en bas sur mobile, optionnel sur desktop -->
        <section ref="gridRef" class="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <button
            v-for="action in currentActions"
            :key="action.key"
            type="button"
            data-profile-card
            class="flex flex-col items-start rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-[var(--color-accent)]/30 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-[var(--color-accent)]/30"
            @click="goTo(action.to)"
          >
            <component
              :is="action.icon"
              class="mb-2 h-6 w-6 shrink-0 text-[var(--color-accent)]"
            />
            <span class="text-sm font-semibold text-[var(--color-text)]">
              {{ t(`profile.menu${action.key.charAt(0).toUpperCase() + action.key.slice(1)}`) }}
            </span>
            <span class="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
              {{ t(`profile.menu${action.key.charAt(0).toUpperCase() + action.key.slice(1)}Desc`) }}
            </span>
          </button>
        </section>
      </template>
    </div>
  </main>
</template>
