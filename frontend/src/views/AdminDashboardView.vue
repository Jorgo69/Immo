<script setup lang="ts">
import { useCurrency } from '../composables/useCurrency'
/**
 * Accueil unifié (ex-Espace Pro) — Dashboard type SaaS Premium.
 * Locataire : uniquement "Mes demandes".
 * Bailleur / Agent / Admin : KPIs (Revenu, Biens, Unités occupées, Alertes), Activité récente, Biens performants.
 * ARCHITECTURE §2 : tokens Tailwind uniquement, mode dark, StatCard + AppCard.
 */
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { Home, Building2, FileText, TrendingUp, AlertCircle } from 'lucide-vue-next'
import { AppCardPremium, AppButton, StatCardPremium, AppSkeleton } from '../components/ui'
import { getMyProperties } from '../services/property.service'
import type { PropertyListItemDto } from '../services/property.service'
import { getRentalRequestsForLandlord } from '../services/rental.service'
import type { RentalRequestDto } from '../services/rental.service'
import { getMyWallet } from '../services/wallet.service'
import { getApiErrorMessage } from '../services/http'
import { toast } from 'vue-sonner'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const role = computed(() => appStore.userRole)
const isTenant = computed(() => role.value === 'tenant')
const isLandlordOrPro = computed(() =>
  role.value === 'landlord' || role.value === 'agent' || role.value === 'admin',
)

const loading = ref(true)
const properties = ref<PropertyListItemDto[]>([])
const requests = ref<RentalRequestDto[]>([])
const walletBalance = ref<string>('0')

const totalProperties = computed(() => properties.value.length)
const occupiedUnits = computed(() =>
  properties.value.reduce(
    (acc, p) =>
      acc +
      (p.units?.filter((u) => u.unit_status === 'occupied').length ?? 0),
    0,
  ),
)
const pendingRequests = computed(() =>
  requests.value.filter((r) => r.status === 'pending'),
)
const alertsCount = computed(() => pendingRequests.value.length)

const recentActivity = computed(() =>
  requests.value
    .slice(0, 8)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
)

const topProperties = computed(() =>
  [...properties.value]
    .sort((a, b) => (b.units?.length ?? 0) - (a.units?.length ?? 0))
    .slice(0, 5),
)

const { formatPrice: formatPriceC } = useCurrency()
function formatPrice(val: any) {
  if (!val && val !== 0) return formatPriceC(0)
  const v = Number(val)
  return isNaN(v) ? formatPriceC(0) : formatPriceC(v)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function load() {
  if (!isLandlordOrPro.value) return
  loading.value = true
  try {
    const [propsRes, reqs, wallet] = await Promise.all([
      getMyProperties({ limit: 100 }).catch(() => ({ data: [], total: 0 })),
      getRentalRequestsForLandlord().catch(() => []),
      getMyWallet().catch(() => ({ balance_total: '0', balance_savings: '0' })),
    ])
    properties.value = propsRes.data ?? []
    requests.value = Array.isArray(reqs) ? reqs : []
    walletBalance.value = (wallet as { balance_total?: string })?.balance_total ?? '0'
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (isLandlordOrPro.value) load()
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

      <!-- Locataire : uniquement Mes demandes -->
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
              <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
                {{ t('admin.proMyRequests') }}
              </h2>
              <p class="text-sm text-ui-muted dark:text-gray-400 mt-2 font-medium">
                {{ t('admin.proMyRequestsSubtitle') }}
              </p>
              <AppButton variant="primary" size="md" class="mt-6 font-bold shadow-glow-emerald">
                {{ t('rental.myRequestsTitle') }}
              </AppButton>
            </div>
          </div>
        </AppCardPremium>
      </section>

      <!-- Bailleur / Pro : KPIs + Activité + Biens performants -->
      <template v-if="isLandlordOrPro">
        <!-- Skeleton Loading State -->
        <template v-if="loading">
          <div class="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AppSkeleton type="card" v-for="i in 4" :key="i" class="!h-32 rounded-3xl" />
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AppCardPremium v-for="i in 2" :key="i">
              <template #title>
                <div class="flex items-center gap-3">
                  <AppSkeleton type="circle" width="40px" height="40px" />
                  <AppSkeleton type="text-title" width="200px" />
                </div>
              </template>
              <div class="space-y-4">
                <div v-for="j in 5" :key="j" class="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl">
                  <div class="flex items-center gap-4 flex-1">
                    <AppSkeleton type="circle" width="40px" height="40px" />
                    <div class="flex-1 space-y-2">
                      <AppSkeleton type="line" width="60%" />
                      <AppSkeleton type="line" width="30%" />
                    </div>
                  </div>
                  <AppSkeleton type="line" width="60px" />
                </div>
              </div>
            </AppCardPremium>
          </div>
        </template>

        <template v-else>
          <!-- 4 cartes KPI Premium -->
          <section class="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCardPremium
              :label="t('admin.dashboardKpiRevenue')"
              :value="formatPrice(walletBalance)"
              :icon="TrendingUp"
              variant="emerald"
            />
            <StatCardPremium
              :label="t('admin.dashboardKpiProperties')"
              :value="String(totalProperties)"
              :icon="Building2"
              variant="blue"
            />
            <StatCardPremium
              :label="t('admin.dashboardKpiOccupied')"
              :value="String(occupiedUnits)"
              :icon="Building2"
              variant="emerald"
            />
            <StatCardPremium
              :label="t('admin.dashboardKpiAlerts')"
              :value="String(alertsCount)"
              :icon="AlertCircle"
              :variant="alertsCount > 0 ? 'orange' : 'blue'"
            />
          </section>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Activité récente (AppCardPremium) -->
            <AppCardPremium>
              <template #title>
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <div class="p-2 rounded-xl bg-primary-emerald/10 text-primary-emerald">
                      <FileText class="w-6 h-6" />
                    </div>
                    {{ t('admin.dashboardRecentActivity') }}
                  </h3>
                  <AppButton
                    v-if="requests.length > 0"
                    variant="ghost"
                    size="sm"
                    class="font-bold uppercase tracking-wider text-xs"
                    @click="router.push('/admin/landlord/requests')"
                  >
                    {{ t('rental.requestsTitle') }}
                  </AppButton>
                </div>
              </template>
              <p v-if="recentActivity.length === 0" class="text-sm text-ui-muted font-medium py-10 text-center italic">
                {{ t('admin.dashboardNoActivity') }}
              </p>
              <div v-else class="space-y-3">
                <div
                  v-for="r in recentActivity"
                  :key="r.id"
                  class="flex items-center justify-between p-4 rounded-2xl border border-ui-border/40 transition-all hover:bg-ui-background dark:border-ui-border-dark/40 dark:hover:bg-ui-surface-dark/50"
                >
                  <div class="min-w-0">
                    <p class="font-bold text-gray-900 dark:text-gray-100 truncate">
                      {{ r.unit?.name ?? r.unit_id?.slice(0, 8) }}
                    </p>
                    <p class="text-xs font-bold text-ui-muted uppercase tracking-wider mt-1">{{ r.status }}</p>
                  </div>
                  <span class="text-xs font-semibold text-ui-muted shrink-0 ml-4">
                    {{ formatDate(r.created_at) }}
                  </span>
                </div>
              </div>
            </AppCardPremium>

            <!-- Biens les plus performants (AppCardPremium) -->
            <AppCardPremium>
              <template #title>
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <div class="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                      <Building2 class="w-6 h-6" />
                    </div>
                    {{ t('admin.dashboardTopProperties') }}
                  </h3>
                  <AppButton
                    v-if="topProperties.length > 0"
                    variant="ghost"
                    size="sm"
                    class="font-bold uppercase tracking-wider text-xs"
                    @click="router.push('/admin/landlord/properties')"
                  >
                    {{ t('landlord.myProperties') }}
                  </AppButton>
                </div>
              </template>
              <p v-if="topProperties.length === 0" class="text-sm text-ui-muted font-medium py-10 text-center italic">
                {{ t('admin.dashboardNoProperties') }}
              </p>
              <div v-else class="space-y-3">
                <div
                  v-for="p in topProperties"
                  :key="p.id"
                  class="flex items-center justify-between p-4 rounded-2xl border border-ui-border/40 transition-all hover:bg-ui-background dark:border-ui-border-dark/40 dark:hover:bg-ui-surface-dark/50 cursor-pointer"
                  @click="router.push('/admin/landlord/properties')"
                >
                  <div class="flex items-center gap-4 min-w-0">
                    <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40">
                      <Home class="h-5 w-5" />
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-gray-900 dark:text-gray-100 truncate">
                        {{ typeof p.name === 'string' ? p.name : (p as PropertyListItemDto).title ?? p.id }}
                      </p>
                      <p class="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5">
                        {{ p.units?.length ?? 0 }} {{ t('landlord.unitCount') }}
                      </p>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-ui-muted uppercase tracking-widest shrink-0 ml-4">
                    {{ typeof p.city === 'object' && p.city?.name ? p.city.name : '' }}
                  </span>
                </div>
              </div>
            </AppCardPremium>
          </div>
        </template>
      </template>
    </div>
  </main>
</template>
