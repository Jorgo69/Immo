<script setup lang="ts">
import { useCurrency } from '../composables/useCurrency'
/**
 * Accueil unifié (ex-Espace Pro) — Dashboard type SaaS Premium.
 * Admin : KPIs globaux (users, KYC, inscriptions), activité récente, accès rapides.
 * Bailleur / Agent : KPIs (Revenu, Biens, Unités occupées, Alertes), Activité récente.
 * Locataire : uniquement "Mes demandes".
 */
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import {
  Home, Building2, FileText, TrendingUp, AlertCircle,
  Users, CheckCircle2, XCircle, ShieldCheck, ArrowRight
} from 'lucide-vue-next'
import { AppCardPremium, AppButton, StatCardPremium, AppSkeleton } from '../components/ui'
import { getMyProperties } from '../services/property.service'
import type { PropertyListItemDto } from '../services/property.service'
import { getRentalRequestsForLandlord } from '../services/rental.service'
import type { RentalRequestDto } from '../services/rental.service'
import { getMyWallet } from '../services/wallet.service'
import { getAdminDashboardStats, type AdminDashboardStats } from '../services/admin-stats.service'
import { getApiErrorMessage } from '../services/http'
import { toast } from 'vue-sonner'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const role = computed(() => appStore.userRole)
const isTenant = computed(() => role.value === 'tenant')
const isAdmin = computed(() => role.value === 'admin')
const isLandlordOrPro = computed(() =>
  role.value === 'landlord' || role.value === 'agent' || role.value === 'admin',
)

const loading = ref(true)

// Non-admin (landlord/agent)
const properties = ref<PropertyListItemDto[]>([])
const requests = ref<RentalRequestDto[]>([])
const walletBalance = ref<string>('0')

// Admin
const adminStats = ref<AdminDashboardStats | null>(null)

const totalProperties = computed(() => properties.value.length)
const occupiedUnits = computed(() =>
  properties.value.reduce(
    (acc, p) =>
      acc + (p.units?.filter((u) => u.unit_status === 'occupied').length ?? 0),
    0,
  ),
)
const pendingRequests = computed(() => requests.value.filter((r) => r.status === 'pending'))
const alertsCount = computed(() => pendingRequests.value.length)
const recentActivity = computed(() =>
  requests.value.slice(0, 8).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  ),
)
const topProperties = computed(() =>
  [...properties.value].sort((a, b) => (b.units?.length ?? 0) - (a.units?.length ?? 0)).slice(0, 5),
)

const { formatPrice: formatPriceC } = useCurrency()
function formatPrice(val: any) {
  if (!val && val !== 0) return formatPriceC(0)
  const v = Number(val)
  return isNaN(v) ? formatPriceC(0) : formatPriceC(v)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function roleLabel(r: string) {
  const map: Record<string, string> = {
    admin: 'Admin', agent: 'Agent', landlord: 'Propriétaire', tenant: 'Locataire'
  }
  return map[r] ?? r
}

function statusClass(s: string) {
  if (s === 'active') return 'text-green-600 bg-green-100'
  if (s === 'restricted') return 'text-amber-600 bg-amber-100'
  if (s === 'banned') return 'text-red-600 bg-red-100'
  return 'text-gray-500 bg-gray-100'
}

async function load() {
  loading.value = true
  try {
    if (isAdmin.value) {
      // Dashboard admin : stats globales
      adminStats.value = await getAdminDashboardStats()
    } else if (isLandlordOrPro.value) {
      const [propsRes, reqs, wallet] = await Promise.all([
        getMyProperties({ limit: 100 }).catch(() => ({ data: [], total: 0 })),
        getRentalRequestsForLandlord().catch(() => []),
        getMyWallet().catch(() => ({ balance_total: '0', balance_savings: '0' })),
      ])
      properties.value = propsRes.data ?? []
      requests.value = Array.isArray(reqs) ? reqs : []
      walletBalance.value = (wallet as { balance_total?: string })?.balance_total ?? '0'
    }
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    loading.value = false
  }
}

onMounted(() => load())
</script>

<template>
  <main class="min-h-screen bg-ui-background pb-24 pt-8 dark:bg-brand-dark lg:pb-8">
    <!-- Background Glow -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-30">
      <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary-emerald blur-[120px] rounded-full" />
      <div class="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-500 blur-[100px] rounded-full" />
    </div>

    <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header class="mb-10">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-2xl bg-primary-emerald shadow-glow-emerald text-white">
            <Home class="w-8 h-8" />
          </div>
          <div>
            <h1 class="text-3xl font-extrabold tracking-tight text-[var(--color-text)] lg:text-4xl">
              {{ isTenant ? t('admin.title') : t('admin.navHome') }}
            </h1>
            <p class="mt-1 text-ui-muted font-medium">
              {{ isTenant ? t('rental.myRequestsSubtitle') : t('admin.hint') }}
            </p>
          </div>
        </div>
      </header>

      <!-- === LOCATAIRE === -->
      <section v-if="isTenant" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
        <AppCardPremium
          class="cursor-pointer transition-all hover:scale-105 hover:shadow-glow-emerald"
          @click="router.push('/my-requests')"
        >
          <div class="flex items-start gap-4">
            <div class="p-3 rounded-2xl bg-primary-emerald/10 text-primary-emerald">
              <FileText class="w-8 h-8" />
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ t('admin.proMyRequests') }}</h2>
              <p class="text-sm text-ui-muted dark:text-gray-400 mt-2 font-medium">{{ t('admin.proMyRequestsSubtitle') }}</p>
              <AppButton variant="primary" size="md" class="mt-6 font-bold shadow-glow-emerald">
                {{ t('rental.myRequestsTitle') }}
              </AppButton>
            </div>
          </div>
        </AppCardPremium>
      </section>

      <!-- === ADMIN : Dashboard Global === -->
      <template v-if="isAdmin">
        <div v-if="loading" class="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AppSkeleton type="card" v-for="i in 4" :key="i" class="!h-32 rounded-3xl" />
        </div>

        <template v-else-if="adminStats">
          <!-- KPIs Utilisateurs -->
          <section class="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCardPremium
              label="Total Utilisateurs"
              :value="String(adminStats.users.total)"
              :icon="Users"
              variant="blue"
            />
            <StatCardPremium
              label="Actifs"
              :value="String(adminStats.users.active)"
              :icon="CheckCircle2"
              variant="emerald"
            />
            <StatCardPremium
              label="KYC en attente"
              :value="String(adminStats.kyc.pending)"
              :icon="ShieldCheck"
              :variant="adminStats.kyc.pending > 0 ? 'orange' : 'emerald'"
            />
            <StatCardPremium
              label="Inscrits (30j)"
              :value="String(adminStats.users.newLast30Days)"
              :icon="TrendingUp"
              variant="blue"
            />
          </section>

          <!-- KPIs Comptes Problématiques + KYC -->
          <section class="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div class="rounded-3xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 p-5 flex items-center gap-4">
              <div class="p-3 rounded-2xl bg-amber-100 dark:bg-amber-800/40 text-amber-600">
                <AlertCircle class="w-6 h-6" />
              </div>
              <div>
                <p class="text-2xl font-bold text-amber-700 dark:text-amber-400">{{ adminStats.users.restricted }}</p>
                <p class="text-sm text-amber-600 dark:text-amber-500 font-medium">Restreints</p>
              </div>
            </div>
            <div class="rounded-3xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 p-5 flex items-center gap-4">
              <div class="p-3 rounded-2xl bg-red-100 dark:bg-red-800/40 text-red-600">
                <XCircle class="w-6 h-6" />
              </div>
              <div>
                <p class="text-2xl font-bold text-red-700 dark:text-red-400">{{ adminStats.users.banned }}</p>
                <p class="text-sm text-red-600 dark:text-red-500 font-medium">Bannis</p>
              </div>
            </div>
            <div class="rounded-3xl border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 p-5 flex items-center gap-4">
              <div class="p-3 rounded-2xl bg-green-100 dark:bg-green-800/40 text-green-600">
                <CheckCircle2 class="w-6 h-6" />
              </div>
              <div>
                <p class="text-2xl font-bold text-green-700 dark:text-green-400">{{ adminStats.kyc.verified }}</p>
                <p class="text-sm text-green-600 dark:text-green-500 font-medium">KYC Vérifiés</p>
              </div>
            </div>
          </section>

          <!-- Listes : KYC En Attente + Derniers Inscrits -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- KYC en attente -->
            <AppCardPremium>
              <template #title>
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <div class="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                      <ShieldCheck class="w-6 h-6" />
                    </div>
                    KYC en attente
                    <span v-if="adminStats.kycPendingList.length" class="ml-1 px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full">
                      {{ adminStats.kycPendingList.length }}
                    </span>
                  </h3>
                  <AppButton
                    variant="ghost" size="sm"
                    class="font-bold uppercase tracking-wider text-xs"
                    @click="router.push('/admin/kyc')"
                  >
                    Tout voir <ArrowRight class="ml-1 h-3 w-3" />
                  </AppButton>
                </div>
              </template>
              <p v-if="adminStats.kycPendingList.length === 0" class="py-10 text-center text-sm text-ui-muted italic">
                Aucun dossier en attente 🎉
              </p>
              <div v-else class="space-y-2">
                <div
                  v-for="p in adminStats.kycPendingList.slice(0, 5)"
                  :key="p.userId"
                  class="flex items-center justify-between p-3 rounded-xl border border-ui-border/40 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  @click="router.push('/admin/users/' + p.userId)"
                >
                  <div>
                    <p class="font-semibold text-sm text-gray-900 dark:text-gray-100">{{ p.phone_number }}</p>
                    <p class="text-xs text-ui-muted mt-0.5">{{ roleLabel(p.role) }}</p>
                  </div>
                  <div class="text-right">
                    <span class="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full">PENDING</span>
                    <p class="text-xs text-ui-muted mt-0.5">{{ p.submittedAt ? formatDate(p.submittedAt) : '—' }}</p>
                  </div>
                </div>
              </div>
            </AppCardPremium>

            <!-- Derniers inscrits -->
            <AppCardPremium>
              <template #title>
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <div class="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                      <Users class="w-6 h-6" />
                    </div>
                    Dernières inscriptions
                  </h3>
                  <AppButton
                    variant="ghost" size="sm"
                    class="font-bold uppercase tracking-wider text-xs"
                    @click="router.push('/admin/users')"
                  >
                    Tout voir <ArrowRight class="ml-1 h-3 w-3" />
                  </AppButton>
                </div>
              </template>
              <p v-if="adminStats.recentSignups.length === 0" class="py-10 text-center text-sm text-ui-muted italic">
                Aucune inscription récente
              </p>
              <div v-else class="space-y-2">
                <div
                  v-for="u in adminStats.recentSignups"
                  :key="u.id"
                  class="flex items-center justify-between p-3 rounded-xl border border-ui-border/40 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  @click="router.push('/admin/users/' + u.id)"
                >
                  <div class="flex items-center gap-3">
                    <div class="h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 text-xs font-bold">
                      {{ u.phone_number.slice(-2) }}
                    </div>
                    <div>
                      <p class="font-semibold text-sm text-gray-900 dark:text-gray-100">{{ u.phone_number }}</p>
                      <p class="text-xs text-ui-muted">{{ roleLabel(u.role) }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="px-2 py-0.5 text-xs font-medium rounded-full" :class="statusClass(u.status)">
                      {{ u.status }}
                    </span>
                    <p class="text-xs text-ui-muted mt-0.5">{{ formatDate(u.created_at) }}</p>
                  </div>
                </div>
              </div>
            </AppCardPremium>
          </div>
        </template>
      </template>

      <!-- === BAILLEUR / AGENT (non-admin) === -->
      <template v-if="isLandlordOrPro && !isAdmin">
        <template v-if="loading">
          <div class="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AppSkeleton type="card" v-for="i in 4" :key="i" class="!h-32 rounded-3xl" />
          </div>
        </template>
        <template v-else>
          <section class="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCardPremium :label="t('admin.dashboardKpiRevenue')" :value="formatPrice(walletBalance)" :icon="TrendingUp" variant="emerald" />
            <StatCardPremium :label="t('admin.dashboardKpiProperties')" :value="String(totalProperties)" :icon="Building2" variant="blue" />
            <StatCardPremium :label="t('admin.dashboardKpiOccupied')" :value="String(occupiedUnits)" :icon="Building2" variant="emerald" />
            <StatCardPremium :label="t('admin.dashboardKpiAlerts')" :value="String(alertsCount)" :icon="AlertCircle" :variant="alertsCount > 0 ? 'orange' : 'blue'" />
          </section>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AppCardPremium>
              <template #title>
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <div class="p-2 rounded-xl bg-primary-emerald/10 text-primary-emerald">
                      <FileText class="w-6 h-6" />
                    </div>
                    {{ t('admin.dashboardRecentActivity') }}
                  </h3>
                  <AppButton v-if="requests.length > 0" variant="ghost" size="sm" class="font-bold uppercase tracking-wider text-xs" @click="router.push('/admin/landlord/requests')">
                    {{ t('rental.requestsTitle') }}
                  </AppButton>
                </div>
              </template>
              <p v-if="recentActivity.length === 0" class="text-sm text-ui-muted font-medium py-10 text-center italic">{{ t('admin.dashboardNoActivity') }}</p>
              <div v-else class="space-y-3">
                <div v-for="r in recentActivity" :key="r.id" class="flex items-center justify-between p-4 rounded-2xl border border-ui-border/40 transition-all hover:bg-ui-background dark:border-ui-border-dark/40">
                  <div class="min-w-0">
                    <p class="font-bold text-gray-900 dark:text-gray-100 truncate">{{ r.unit?.name ?? r.unit_id?.slice(0, 8) }}</p>
                    <p class="text-xs font-bold text-ui-muted uppercase tracking-wider mt-1">{{ r.status }}</p>
                  </div>
                  <span class="text-xs font-semibold text-ui-muted shrink-0 ml-4">{{ formatDate(r.created_at) }}</span>
                </div>
              </div>
            </AppCardPremium>

            <AppCardPremium>
              <template #title>
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <div class="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                      <Building2 class="w-6 h-6" />
                    </div>
                    {{ t('admin.dashboardTopProperties') }}
                  </h3>
                  <AppButton v-if="topProperties.length > 0" variant="ghost" size="sm" class="font-bold uppercase tracking-wider text-xs" @click="router.push('/admin/landlord/properties')">
                    {{ t('landlord.myProperties') }}
                  </AppButton>
                </div>
              </template>
              <p v-if="topProperties.length === 0" class="text-sm text-ui-muted font-medium py-10 text-center italic">{{ t('admin.dashboardNoProperties') }}</p>
              <div v-else class="space-y-3">
                <div v-for="p in topProperties" :key="p.id" class="flex items-center justify-between p-4 rounded-2xl border border-ui-border/40 transition-all hover:bg-ui-background cursor-pointer" @click="router.push('/admin/landlord/properties')">
                  <div class="flex items-center gap-4 min-w-0">
                    <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40">
                      <Home class="h-5 w-5" />
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-gray-900 dark:text-gray-100 truncate">{{ typeof p.name === 'string' ? p.name : (p as PropertyListItemDto).title ?? p.id }}</p>
                      <p class="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5">{{ p.units?.length ?? 0 }} {{ t('landlord.unitCount') }}</p>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-ui-muted uppercase tracking-widest shrink-0 ml-4">{{ typeof p.city === 'object' && p.city?.name ? p.city.name : '' }}</span>
                </div>
              </div>
            </AppCardPremium>
          </div>
        </template>
      </template>
    </div>
  </main>
</template>
