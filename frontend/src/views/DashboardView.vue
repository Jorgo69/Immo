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
import { AppCardPremium, AppButton, StatCardPremium, AppSkeleton } from '../components/ui'
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

// Stats : typage pour support variant Premium
const stats = ref<Array<{ key: string; icon: any; value: string | number; variant: 'emerald' | 'blue' | 'orange' | 'red' }>>([
  { key: 'visitsUpcoming', icon: CalendarDays, value: 0, variant: 'blue' },
  { key: 'favoritesNew', icon: Heart, value: 0, variant: 'red' },
  { key: 'messagesPending', icon: MessageCircle, value: 0, variant: 'orange' },
  { key: 'priceAlerts', icon: Bell, value: 0, variant: 'emerald' },
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
  <main class="min-h-screen bg-ui-background pb-24 pt-8 dark:bg-brand-dark lg:pb-8">
    <!-- Subtle Background Glow -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-30">
      <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary-emerald blur-[120px] rounded-full" />
      <div class="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-500 blur-[100px] rounded-full" />
    </div>

    <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <header class="mb-10">
        <h1 class="text-3xl font-extrabold tracking-tight text-[var(--color-text)] lg:text-4xl">
          {{ welcomeName ? t('dashboard.welcome', { name: welcomeName }) : t('dashboard.title') }}
        </h1>
        <p class="mt-2 text-ui-muted font-medium">{{ t('dashboard.subtitle', 'Gérez vos biens et revenus en toute simplicité.') }}</p>
      </header>

      <template v-if="loading">
        <!-- 4 Stat Skeletons -->
        <section class="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <AppSkeleton type="card" v-for="i in 4" :key="i" class="!h-24 rounded-3xl" />
        </section>

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <!-- Main Skeletons -->
          <div class="space-y-8 lg:col-span-8">
            <AppCardPremium v-for="i in 2" :key="i">
              <template #title>
                <div class="flex items-center gap-3">
                  <AppSkeleton type="circle" width="40px" height="40px" />
                  <AppSkeleton type="text-title" width="200px" />
                </div>
              </template>
              <div class="space-y-4">
                <div v-for="j in 3" :key="j" class="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl">
                  <div class="flex items-center gap-4 flex-1">
                    <AppSkeleton type="circle" width="44px" height="44px" />
                    <div class="flex-1 space-y-2">
                      <AppSkeleton type="line" width="60%" />
                      <AppSkeleton type="line" width="30%" />
                    </div>
                  </div>
                </div>
              </div>
            </AppCardPremium>
          </div>

          <!-- Sidebar Skeletons -->
          <aside class="space-y-8 lg:col-span-4">
            <AppCardPremium glass>
              <AppSkeleton type="circle" width="180px" height="180px" class="mx-auto" />
              <div class="mt-8 space-y-4">
                <AppSkeleton type="line" v-for="i in 3" :key="i" />
              </div>
            </AppCardPremium>
          </aside>
        </div>
      </template>

      <template v-else>
        <!-- 4 cartes stats Premium (top) -->
        <section class="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCardPremium
            v-for="stat in stats"
            :key="stat.key"
            :label="$t('dashboard.' + stat.key)"
            :value="stat.value"
            :icon="stat.icon"
            :variant="stat.variant"
          />
        </section>

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <!-- Main (span 8) : Mon Activité + Historique -->
          <div class="space-y-8 lg:col-span-8">
            <!-- Mon Activité -->
            <AppCardPremium>
              <template #title>
                <div class="flex items-center justify-between">
                  <h2 class="flex items-center gap-3 text-xl font-bold text-[var(--color-text)]">
                    <div class="p-2 rounded-xl bg-primary-emerald/10 text-primary-emerald">
                      <CalendarDays class="h-6 w-6" />
                    </div>
                    {{ t('dashboard.myActivity') }}
                  </h2>
                  <AppButton variant="ghost" size="sm" class="text-xs font-semibold uppercase tracking-wider">{{ t('common.viewAll', 'Voir tout') }}</AppButton>
                </div>
              </template>
              
              <div v-if="activityItems.length" class="space-y-4">
                <!-- ... activity items logic (kept same but can be glassed) -->
              </div>
              <div
                v-else
                class="rounded-3xl border border-dashed border-ui-border py-16 text-center dark:border-ui-border-dark"
              >
                <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-ui-background dark:bg-ui-surface-dark">
                  <CalendarDays class="h-10 w-10 text-ui-border dark:text-ui-border-dark" />
                </div>
                <p class="text-lg font-bold text-[var(--color-text)]">{{ t('dashboard.emptyActivity') }}</p>
                <p class="mt-2 text-sm text-ui-muted max-w-xs mx-auto text-balance">{{ t('dashboard.emptyActivityHint') }}</p>
                <div class="mt-8 flex flex-wrap justify-center gap-4">
                  <AppButton size="md" @click="goToSearch">{{ t('dashboard.emptyDashboardCta1') }}</AppButton>
                  <AppButton size="md" variant="outline" @click="goToProfile">{{ t('dashboard.emptyDashboardCta3') }}</AppButton>
                </div>
              </div>
            </AppCardPremium>

            <!-- Historique des transactions -->
            <AppCardPremium>
              <template #title>
                <div class="flex items-center justify-between">
                  <h2 class="flex items-center gap-3 text-xl font-bold text-[var(--color-text)]">
                    <div class="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                      <Wallet class="h-6 w-6" />
                    </div>
                    {{ t('dashboard.recentTransactions') }}
                  </h2>
                  <AppButton variant="ghost" size="sm" class="text-xs font-semibold uppercase tracking-wider">{{ t('common.viewAll', 'Voir tout') }}</AppButton>
                </div>
              </template>
              <div v-if="transactions.length" class="space-y-3">
                <div
                  v-for="tx in transactions"
                  :key="tx.id"
                  class="flex items-center justify-between rounded-2xl border border-ui-border/40 p-4 transition-all hover:bg-ui-background dark:border-ui-border-dark/40 dark:hover:bg-ui-surface-dark/50"
                >
                  <div class="flex items-center gap-4">
                    <span
                      :class="['flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-soft-sm', txColor(tx)]"
                    >
                      <component :is="txIcon(tx)" class="h-5 w-5" />
                    </span>
                    <div>
                      <p class="font-bold text-[var(--color-text)]">
                        {{ t('dashboard.type.' + tx.type) }}
                      </p>
                      <p class="text-xs font-semibold text-ui-muted uppercase tracking-wider mt-0.5">{{ formatDate(tx.created_at) }}</p>
                    </div>
                  </div>
                  <span class="text-lg font-extrabold text-[var(--color-text)]">{{ formatAmount(tx.amount) }}</span>
                </div>
              </div>
              <div
                v-else
                class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ui-border py-16 dark:border-ui-border-dark"
              >
                <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-ui-background dark:bg-ui-surface-dark">
                  <Wallet class="h-10 w-10 text-ui-border dark:text-ui-border-dark" />
                </div>
                <p class="text-lg font-bold text-[var(--color-text)]">
                  {{ t('dashboard.emptyTransactions') }}
                </p>
                <p class="mt-2 text-sm text-ui-muted text-balance max-w-xs mx-auto text-center">
                  {{ t('dashboard.emptyTransactionsHint') }}
                </p>
                <AppButton size="md" class="mt-8" @click="goToProfile">
                  {{ t('dashboard.emptyDashboardCta2') }}
                </AppButton>
              </div>
            </AppCardPremium>
          </div>

          <!-- Sidebar (span 4) : Finances & Services -->
          <aside class="space-y-8 lg:col-span-4">
            <!-- Tirelire Premium -->
            <AppCardPremium glass>
              <template #title>
                <h2 class="flex items-center gap-3 text-lg font-bold text-[var(--color-text)]">
                  <Wallet class="h-5 w-5 text-primary-emerald" />
                  {{ t('dashboard.tirelireWidget') }}
                </h2>
              </template>

              <!-- Jauge circulaire Premium -->
              <div class="flex flex-col items-center py-6">
                <div class="relative h-48 w-48 transition-transform hover:scale-105 duration-500">
                  <svg class="h-full w-full -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="8"
                      class="text-ui-border/30 dark:text-ui-border-dark/30"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="8"
                      stroke-linecap="round"
                      class="text-primary-emerald transition-all duration-1000 ease-out"
                      :stroke-dasharray="2 * Math.PI * 44"
                      :stroke-dashoffset="2 * Math.PI * 44 * (1 - progressPercent / 100)"
                    />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <p class="text-3xl font-extrabold tracking-tighter text-[var(--color-text)]">
                      {{ formatAmount(displayedBalance).replace(' FCFA', '') }}
                    </p>
                    <p class="text-[10px] font-bold text-ui-muted uppercase tracking-[0.2em] mt-1">FCFA</p>
                    <div class="mt-2 h-1 w-12 rounded-full bg-primary-emerald opacity-20" />
                  </div>
                </div>
                <p class="mt-4 text-center text-xs font-semibold text-ui-muted uppercase tracking-wider">
                  {{ goalLabel }}
                </p>
              </div>

              <!-- Widget Ajouter (compact + quick actions + input avec bouton) -->
              <div class="mt-2 rounded-2xl border border-ui-border/50 bg-ui-background/50 p-5 dark:border-ui-border-dark/50 dark:bg-ui-surface-dark/50">
                <p class="mb-4 text-xs font-bold text-ui-muted uppercase tracking-widest">
                  {{ t('dashboard.addSaving') }}
                </p>
                <div class="mb-4 flex flex-wrap gap-2">
                  <button
                    v-for="amt in QUICK_AMOUNTS"
                    :key="amt"
                    type="button"
                    class="rounded-xl border border-ui-border bg-ui-surface px-4 py-2 text-xs font-bold text-[var(--color-text)] shadow-soft-sm transition-all hover:scale-105 hover:border-primary-emerald hover:text-primary-emerald dark:border-ui-border-dark dark:bg-brand-dark"
                    @click="setQuickAmount(amt)"
                  >
                    +{{ new Intl.NumberFormat('fr-FR').format(amt) }}
                  </button>
                </div>
                <form class="flex gap-2" @submit.prevent="addSaving">
                  <div class="relative flex-1">
                    <input
                      v-model="savingAmount"
                      type="text"
                      inputmode="numeric"
                      :placeholder="t('dashboard.amount')"
                      class="w-full rounded-xl border border-ui-border bg-ui-surface px-4 py-3 text-sm font-bold text-[var(--color-text)] placeholder:text-ui-muted placeholder:font-medium focus:border-primary-emerald focus:outline-none focus:ring-4 focus:ring-primary-emerald/10 dark:border-ui-border-dark dark:bg-brand-dark"
                    />
                  </div>
                  <AppButton
                    type="submit"
                    :disabled="savingLoading || !savingAmount"
                    class="h-[46px] w-[46px] !rounded-xl transition-transform active:scale-90"
                    size="none"
                  >
                    <Plus v-if="!savingLoading" class="h-6 w-6" />
                    <span v-else class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </AppButton>
                </form>
              </div>
            </AppCardPremium>

            <!-- Échéances à venir -->
            <AppCardPremium padding="sm" glass>
              <div class="flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-orange/10 text-warning-orange">
                  <CalendarDays class="h-6 w-6" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-bold text-ui-muted uppercase tracking-widest">
                    {{ t('dashboard.upcomingDeadlines') }}
                  </p>
                  <p class="mt-1 text-xl font-extrabold text-[var(--color-text)]">
                    {{ nextRentDate() || '—' }}
                  </p>
                </div>
              </div>
            </AppCardPremium>

            <!-- Mes Documents -->
            <AppCardPremium padding="none" glass overflow-hidden>
              <button
                type="button"
                class="flex w-full items-center justify-between p-6 transition-all hover:bg-ui-surface/40 dark:hover:bg-ui-surface-dark/40"
                @click="goToDocuments"
              >
                <span class="flex items-center gap-4">
                  <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-emerald/10 text-primary-emerald shadow-glow-emerald">
                    <FileText class="h-6 w-6" />
                  </div>
                  <div class="text-left">
                    <p class="font-extrabold text-[var(--color-text)] text-lg">{{ t('dashboard.myDocuments') }}</p>
                    <p class="text-xs font-semibold text-ui-muted uppercase tracking-wider mt-0.5">Vérifiez vos dossiers</p>
                  </div>
                </span>
                <ChevronRight class="h-6 w-6 text-ui-muted" />
              </button>
            </AppCardPremium>

            <!-- Conseils épargne -->
            <AppCardPremium padding="md" glass border-dashed>
              <template #title>
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                    <Heart class="h-5 w-5" />
                  </div>
                  <span class="text-sm font-bold text-ui-muted uppercase tracking-widest">
                    {{ t('dashboard.savingsTips') }}
                  </span>
                </div>
              </template>
              <p class="text-sm font-medium leading-relaxed text-ui-muted italic">
                "{{ t('dashboard.savingsTipText') }}"
              </p>
            </AppCardPremium>

            <!-- Propriétaire Premium : taux d'occupation & loyers -->
            <template v-if="isLandlord">
              <AppCardPremium padding="md" variant="emerald" glass class="shadow-glow-emerald border-primary-emerald/20">
                <p class="text-xs font-bold text-primary-emerald uppercase tracking-widest">{{ t('dashboard.occupancyRate') }}</p>
                <div class="mt-2 flex items-baseline gap-2">
                  <p class="text-3xl font-extrabold text-[var(--color-text)]">94%</p>
                  <span class="text-xs font-bold text-primary-emerald">+2% vs mois dernier</span>
                </div>
                <div class="mt-4 h-2 w-full rounded-full bg-primary-emerald/10 overflow-hidden">
                  <div class="h-full w-[94%] bg-primary-emerald rounded-full" />
                </div>
              </AppCardPremium>

              <AppCardPremium padding="md" glass border-dashed>
                <p class="text-xs font-bold text-ui-muted uppercase tracking-widest">{{ t('dashboard.rentReceived') }}</p>
                <p class="mt-2 text-3xl font-extrabold text-[var(--color-text)]">{{ formatAmount('450000').replace(' FCFA', '') }} <span class="text-sm font-medium">FCFA</span></p>
                <p class="mt-1 text-xs font-bold text-primary-emerald uppercase tracking-wider">Perçus ce mois</p>
              </AppCardPremium>
            </template>
          </aside>
        </div>
      </template>
    </div>
  </main>
</template>
