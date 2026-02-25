<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Heart,
  MessageCircle,
  Bell,
  FileText,
  ChevronRight,
} from 'lucide-vue-next'
import gsap from 'gsap'
import { getMyWallet, getMyTransactions, recordSaving } from '../services/wallet.service'
import { getApiErrorMessage } from '../services/http'
import { toast } from 'vue-sonner'
import { AppCard, AppButton, StatCard } from '../components/ui'
import { useAppStore } from '../stores/app'
import type { WalletTransactionDto } from '../services/wallet.service'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const user = ref<{ first_name?: string; role?: string } | null>(null)
const wallet = ref<{ balance_total: string; balance_savings: string } | null>(null)
const transactions = ref<WalletTransactionDto[]>([])
const loading = ref(true)
const error = ref('')
const savingAmount = ref('')
const savingLoading = ref(false)
const displayedBalance = ref(0)

const TARGET_RENT = 100000
const QUICK_AMOUNTS = [2000, 5000, 10000]
const TX_PAGE_SIZE = 8

const welcomeName = computed(() => {
  const first = user.value?.first_name?.trim()
  return first || ''
})

const isLandlord = computed(() => {
  const role = appStore.userRole ?? user.value?.role ?? ''
  return role === 'landlord' || role === 'agent' || role === 'admin'
})

const progressPercent = computed(() => {
  if (!wallet.value) return 0
  const current = Number(wallet.value.balance_savings || 0)
  if (!TARGET_RENT) return 0
  return Math.min(100, (current / TARGET_RENT) * 100)
})

const goalLabel = computed(() =>
  t('dashboard.goalLabel', { amount: new Intl.NumberFormat('fr-FR').format(TARGET_RENT) + ' FCFA' }),
)

// Stats mock (à brancher sur de vrais endpoints plus tard)
const stats = ref([
  { key: 'visitsUpcoming', icon: CalendarDays, value: 0, color: 'text-blue-600' },
  { key: 'favoritesNew', icon: Heart, value: 0, color: 'text-rose-500' },
  { key: 'messagesPending', icon: MessageCircle, value: 0, color: 'text-amber-500' },
  { key: 'priceAlerts', icon: Bell, value: 0, color: 'text-emerald-600' },
])

// Activité immo mock (dossiers, visites)
const activityItems = ref<Array<{ label: string; date: string; badge: 'info' | 'success' | 'pending' }>>([])

async function fetchUser() {
  const me = await appStore.refreshMe()
  user.value = me ? { first_name: me.first_name, role: me.role } : null
}

async function fetchWallet() {
  const data = await getMyWallet()
  wallet.value = data
}

async function fetchTransactions() {
  const result = await getMyTransactions(1, TX_PAGE_SIZE)
  transactions.value = result.data ?? []
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    await Promise.all([fetchUser(), fetchWallet(), fetchTransactions()])
  } catch (e) {
    const msg = getApiErrorMessage(e)
    toast.error(msg)
    error.value = msg
  } finally {
    loading.value = false
  }
}

// GSAP: compteur du solde 0 → valeur réelle (objet pour que GSAP puisse animer .value)
const balanceTween = { value: 0 }

function animateBalance() {
  const target = wallet.value ? Number(wallet.value.balance_savings || 0) : 0
  balanceTween.value = displayedBalance.value
  gsap.to(balanceTween, {
    value: target,
    duration: 1.2,
    ease: 'power2.out',
    onUpdate: () => {
      displayedBalance.value = Math.round(balanceTween.value)
    },
  })
}

watch(wallet, (w) => {
  if (w) animateBalance()
}, { immediate: true })

function setQuickAmount(amount: number) {
  savingAmount.value = String(amount)
}

async function addSaving() {
  const amount = Number(savingAmount.value.replace(/\s/g, ''))
  if (!amount || amount <= 0) return
  savingLoading.value = true
  error.value = ''
  try {
    await recordSaving(amount)
    savingAmount.value = ''
    await fetchWallet()
    await fetchTransactions()
    animateBalance()
  } catch (e) {
    const msg = getApiErrorMessage(e)
    toast.error(msg)
    error.value = msg
  } finally {
    savingLoading.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatAmount(value: string | number) {
  return new Intl.NumberFormat('fr-FR').format(Number(value)) + ' FCFA'
}

function txIcon(tx: WalletTransactionDto) {
  const type = (tx.type || '').toLowerCase()
  if (type === 'saving' || type === 'rent') return ArrowDownLeft
  return ArrowUpRight
}

function txColor(tx: WalletTransactionDto) {
  const type = (tx.type || '').toLowerCase()
  if (type === 'saving') return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
  if (type === 'withdrawal') return 'text-red-600 bg-red-50 dark:bg-red-950/30'
  return 'text-kyc-pending bg-gray-100 dark:bg-gray-800'
}

function nextRentDate(): string | null {
  const rentTx = transactions.value.find((tx) => tx.type === 'rent')
  if (!rentTx) return null
  const d = new Date(rentTx.created_at)
  d.setMonth(d.getMonth() + 1)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function goToProfile() {
  router.push({ name: 'profile-edit' })
}
function goToSearch() {
  router.push('/property')
}
function goToDocuments() {
  router.push({ name: 'profile' })
}

onMounted(() => {
  load()
})
</script>

<template>
  <main class="min-h-screen bg-[#F9FAFB] pb-24 pt-8 dark:bg-gray-950 lg:pb-8">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <header class="mb-8">
        <h1 class="text-2xl font-bold text-[var(--color-text)] lg:text-3xl">
          {{ welcomeName ? t('dashboard.welcome', { name: welcomeName }) : t('dashboard.title') }}
        </h1>
      </header>

      <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
      <p v-if="loading" class="text-[var(--color-muted)]">{{ $t('profile.loading') }}</p>

      <template v-else>
        <!-- 4 cartes stats (top) -->
        <section class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            v-for="stat in stats"
            :key="stat.key"
            :label="$t('dashboard.' + stat.key)"
            :value="stat.value"
          >
            <template #label>
              <span class="inline-flex items-center gap-1.5">
                <component :is="stat.icon" :class="['h-4 w-4', stat.color]" />
                {{ $t('dashboard.' + stat.key) }}
              </span>
            </template>
          </StatCard>
        </section>

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <!-- Main (span 8) : Mon Activité + Historique -->
          <div class="space-y-6 lg:col-span-8">
            <!-- Mon Activité -->
            <AppCard class="bg-white shadow-sm">
              <template #title>
                <h2 class="flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
                  <CalendarDays class="h-5 w-5 text-[var(--color-accent)]" />
                  {{ t('dashboard.myActivity') }}
                </h2>
              </template>
              <div v-if="activityItems.length" class="space-y-3">
                <div
                  v-for="(item, i) in activityItems"
                  :key="i"
                  class="flex items-center justify-between rounded-lg border border-gray-100 py-3 px-4 dark:border-gray-700"
                >
                  <span class="text-sm text-[var(--color-text)]">{{ item.label }}</span>
                  <span
                    :class="[
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      item.badge === 'success' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
                      item.badge === 'info' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                      item.badge === 'pending' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                    ]"
                  >
                    {{ item.date }}
                  </span>
                </div>
              </div>
              <div
                v-else
                class="rounded-xl border border-dashed border-gray-200 py-12 text-center dark:border-gray-700"
              >
                <CalendarDays class="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p class="text-sm font-medium text-[var(--color-text)]">{{ t('dashboard.emptyActivity') }}</p>
                <p class="mt-1 text-xs text-[var(--color-muted)]">{{ t('dashboard.emptyActivityHint') }}</p>
                <div class="mt-6 flex flex-wrap justify-center gap-3">
                  <AppButton size="sm" @click="goToSearch">{{ t('dashboard.emptyDashboardCta1') }}</AppButton>
                  <AppButton size="sm" variant="outline" @click="goToProfile">{{ t('dashboard.emptyDashboardCta3') }}</AppButton>
                </div>
              </div>
            </AppCard>

            <!-- Historique des transactions -->
            <AppCard class="bg-white shadow-sm">
              <template #title>
                <h2 class="flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
                  <Wallet class="h-5 w-5 text-[var(--color-accent)]" />
                  {{ t('dashboard.recentTransactions') }}
                </h2>
              </template>
              <div v-if="transactions.length" class="space-y-2">
                <div
                  v-for="tx in transactions"
                  :key="tx.id"
                  class="flex items-center justify-between rounded-lg border border-gray-100 py-3 px-4 dark:border-gray-700"
                >
                  <div class="flex items-center gap-3">
                    <span
                      :class="['flex h-9 w-9 shrink-0 items-center justify-center rounded-full', txColor(tx)]"
                    >
                      <component :is="txIcon(tx)" class="h-4 w-4" />
                    </span>
                    <div>
                      <p class="text-sm font-medium text-[var(--color-text)]">
                        {{ t('dashboard.type.' + tx.type) }}
                      </p>
                      <p class="text-xs text-[var(--color-muted)]">{{ formatDate(tx.created_at) }}</p>
                    </div>
                  </div>
                  <span class="font-semibold text-[var(--color-text)]">{{ formatAmount(tx.amount) }}</span>
                </div>
              </div>
              <div
                v-else
                class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12 dark:border-gray-700"
              >
                <Wallet class="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p class="text-center text-sm font-medium text-[var(--color-text)]">
                  {{ t('dashboard.emptyTransactions') }}
                </p>
                <p class="mt-1 text-center text-xs text-[var(--color-muted)]">
                  {{ t('dashboard.emptyTransactionsHint') }}
                </p>
                <AppButton size="sm" class="mt-4" @click="goToProfile">
                  {{ t('dashboard.emptyDashboardCta2') }}
                </AppButton>
              </div>
            </AppCard>
          </div>

          <!-- Sidebar (span 4) : Finances & Services -->
          <aside class="space-y-6 lg:col-span-4">
            <!-- Tirelire : jauge + objectif + widget ajout -->
            <AppCard class="bg-white shadow-sm">
              <template #title>
                <h2 class="flex items-center gap-2 text-base font-semibold text-[var(--color-text)]">
                  <Wallet class="h-5 w-5 text-[var(--color-accent)]" />
                  {{ t('dashboard.tirelireWidget') }}
                </h2>
              </template>

              <!-- Jauge circulaire SVG -->
              <div class="flex flex-col items-center py-4">
                <div class="relative h-44 w-44">
                  <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="8"
                      class="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="8"
                      stroke-linecap="round"
                      class="text-[var(--color-accent)] transition-all duration-700"
                      :stroke-dasharray="2 * Math.PI * 42"
                      :stroke-dashoffset="2 * Math.PI * 42 * (1 - progressPercent / 100)"
                    />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <p class="text-2xl font-bold text-[var(--color-text)]">
                      {{ formatAmount(displayedBalance) }}
                    </p>
                    <p class="text-xs text-[var(--color-muted)]">solde</p>
                  </div>
                </div>
                <p class="mt-3 text-center text-xs text-[var(--color-muted)]">
                  {{ goalLabel }}
                </p>
              </div>

              <!-- Widget Ajouter (compact + quick actions + input avec bouton) -->
              <div class="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <p class="mb-3 text-xs font-medium text-[var(--color-muted)]">
                  {{ t('dashboard.addSaving') }}
                </p>
                <div class="mb-3 flex flex-wrap gap-2">
                  <button
                    v-for="amt in QUICK_AMOUNTS"
                    :key="amt"
                    type="button"
                    class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:border-[var(--color-accent)] hover:bg-emerald-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-[var(--color-accent)]"
                    @click="setQuickAmount(amt)"
                  >
                    +{{ new Intl.NumberFormat('fr-FR').format(amt) }}
                  </button>
                </div>
                <form class="flex gap-0 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800" @submit.prevent="addSaving">
                  <input
                    v-model="savingAmount"
                    type="text"
                    inputmode="numeric"
                    :placeholder="t('dashboard.amount')"
                    class="min-w-0 flex-1 px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none dark:bg-gray-800"
                  />
                  <button
                    type="submit"
                    :disabled="savingLoading || !savingAmount"
                    class="flex h-full items-center justify-center bg-[var(--color-accent)] px-4 text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    <Plus v-if="!savingLoading" class="h-5 w-5" />
                    <span v-else class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </button>
                </form>
              </div>
            </AppCard>

            <!-- Échéances à venir -->
            <AppCard class="bg-white shadow-sm" padding="sm">
              <template #title>
                <span class="text-sm font-medium text-[var(--color-muted)]">
                  {{ t('dashboard.upcomingDeadlines') }}
                </span>
              </template>
              <p class="text-lg font-semibold text-[var(--color-text)]">
                {{ nextRentDate() || '—' }}
              </p>
              <p class="mt-1 text-xs text-[var(--color-muted)]">
                {{ t('dashboard.nextRentEstimate') }}
              </p>
            </AppCard>

            <!-- Mes Documents -->
            <AppCard class="bg-white shadow-sm" padding="sm">
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-lg border border-gray-200 py-3 px-4 text-left transition hover:border-[var(--color-accent)] hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                @click="goToDocuments"
              >
                <span class="flex items-center gap-2">
                  <FileText class="h-5 w-5 text-[var(--color-accent)]" />
                  <span class="font-medium text-[var(--color-text)]">{{ t('dashboard.myDocuments') }}</span>
                </span>
                <ChevronRight class="h-5 w-5 text-[var(--color-muted)]" />
              </button>
              <p class="mt-2 text-xs text-[var(--color-muted)]">
                {{ t('dashboard.myDocumentsHint') }}
              </p>
            </AppCard>

            <!-- Conseils épargne -->
            <AppCard class="bg-white shadow-sm" padding="sm">
              <template #title>
                <span class="text-sm font-medium text-[var(--color-muted)]">
                  {{ t('dashboard.savingsTips') }}
                </span>
              </template>
              <p class="text-sm text-[var(--color-text)]">
                {{ t('dashboard.savingsTipText') }}
              </p>
            </AppCard>

            <!-- Propriétaire : taux d'occupation & loyers -->
            <template v-if="isLandlord">
              <AppCard class="bg-white shadow-sm" padding="sm">
                <template #title>
                  <span class="text-sm font-medium text-[var(--color-muted)]">
                    {{ t('dashboard.occupancyRate') }}
                  </span>
                </template>
                <p class="text-lg font-semibold text-[var(--color-text)]">—</p>
                <p class="mt-1 text-xs text-[var(--color-muted)]">À connecter à vos biens</p>
              </AppCard>
              <AppCard class="bg-white shadow-sm" padding="sm">
                <template #title>
                  <span class="text-sm font-medium text-[var(--color-muted)]">
                    {{ t('dashboard.rentReceived') }}
                  </span>
                </template>
                <p class="text-lg font-semibold text-[var(--color-text)]">—</p>
                <p class="mt-1 text-xs text-[var(--color-muted)]">Ce mois</p>
              </AppCard>
            </template>
          </aside>
        </div>
      </template>
    </div>
  </main>
</template>
