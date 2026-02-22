<script setup lang="ts">
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
import { AppCard, AppTitle, AppParagraph, AppButton, StatCard } from '../components/ui'
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
const totalUnits = computed(() =>
  properties.value.reduce((acc, p) => acc + (p.units?.length ?? 0), 0),
)
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

function formatPrice(value: string | number) {
  return new Intl.NumberFormat('fr-FR').format(Number(value)) + ' FCFA'
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
  <main class="max-w-layout mx-auto px-6 md:px-8 py-8 bg-ui-background dark:bg-gray-900 min-h-full">
    <header class="mb-8">
      <div class="flex items-center gap-2">
        <Home class="w-7 h-7 text-primary-emerald" />
        <div>
          <AppTitle :level="2" class="text-gray-900 dark:text-gray-100">
            {{ isTenant ? t('admin.title') : t('admin.navHome') }}
          </AppTitle>
          <AppParagraph muted small class="text-ui-muted dark:text-gray-400">
            {{ isTenant ? t('rental.myRequestsSubtitle') : t('admin.hint') }}
          </AppParagraph>
        </div>
      </div>
    </header>

    <!-- Locataire : uniquement Mes demandes -->
    <section v-if="isTenant" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl">
      <AppCard
        class="p-5 cursor-pointer transition border border-ui-border dark:border-gray-600 hover:border-primary-emerald hover:shadow-soft-lg"
        @click="router.push('/my-requests')"
      >
        <div class="flex items-start gap-3">
          <div class="p-2 rounded-lg bg-primary-emerald/10">
            <FileText class="w-6 h-6 text-primary-emerald" />
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">
              {{ t('admin.proMyRequests') }}
            </h2>
            <p class="text-sm text-ui-muted dark:text-gray-400 mt-1">
              {{ t('admin.proMyRequestsSubtitle') }}
            </p>
            <AppButton variant="primary" size="sm" class="mt-3">
              {{ t('rental.myRequestsTitle') }}
            </AppButton>
          </div>
        </div>
      </AppCard>
    </section>

    <!-- Bailleur / Pro : KPIs + Activité + Biens performants -->
    <template v-if="isLandlordOrPro">
      <section v-if="loading" class="mb-8 text-ui-muted dark:text-gray-400">
        {{ t('admin.loading') }}
      </section>
      <template v-else>
        <!-- 4 cartes KPI (StatCard avec icônes, alerte si Alertes > 0) -->
        <section class="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            :label="t('admin.dashboardKpiRevenue')"
            :value="formatPrice(walletBalance)"
            :icon="TrendingUp"
          />
          <StatCard
            :label="t('admin.dashboardKpiProperties')"
            :value="String(totalProperties)"
            :icon="Building2"
          />
          <StatCard
            :label="t('admin.dashboardKpiOccupied')"
            :value="String(occupiedUnits)"
            :icon="Building2"
          />
          <StatCard
            :label="t('admin.dashboardKpiAlerts')"
            :value="String(alertsCount)"
            :icon="AlertCircle"
            :alert="alertsCount > 0"
          />
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Activité récente (AppCard) -->
          <AppCard class="p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText class="w-5 h-5 text-primary-emerald" />
                {{ t('admin.dashboardRecentActivity') }}
              </h3>
              <AppButton
                v-if="requests.length > 0"
                variant="ghost"
                size="sm"
                @click="router.push('/admin/landlord/requests')"
              >
                {{ t('rental.requestsTitle') }}
              </AppButton>
            </div>
            <p v-if="recentActivity.length === 0" class="text-sm text-ui-muted dark:text-gray-400">
              {{ t('admin.dashboardNoActivity') }}
            </p>
            <ul v-else class="space-y-2">
              <li
                v-for="r in recentActivity"
                :key="r.id"
                class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 text-sm"
              >
                <span class="text-gray-900 dark:text-gray-100 truncate">
                  {{ r.unit?.name ?? r.unit_id?.slice(0, 8) }} — {{ r.status }}
                </span>
                <span class="text-ui-muted dark:text-gray-400 text-xs shrink-0 ml-2">
                  {{ formatDate(r.created_at) }}
                </span>
              </li>
            </ul>
          </AppCard>

          <!-- Biens les plus performants (AppCard) -->
          <AppCard class="p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Building2 class="w-5 h-5 text-primary-emerald" />
                {{ t('admin.dashboardTopProperties') }}
              </h3>
              <AppButton
                v-if="topProperties.length > 0"
                variant="ghost"
                size="sm"
                @click="router.push('/admin/landlord/properties')"
              >
                {{ t('landlord.myProperties') }}
              </AppButton>
            </div>
            <p v-if="topProperties.length === 0" class="text-sm text-ui-muted dark:text-gray-400">
              {{ t('admin.dashboardNoProperties') }}
            </p>
            <ul v-else class="space-y-2">
              <li
                v-for="p in topProperties"
                :key="p.id"
                class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg -mx-2 px-2"
                @click="router.push('/admin/landlord/properties')"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span class="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {{ typeof p.name === 'string' ? p.name : (p as PropertyListItemDto).title ?? p.id }}
                  </span>
                  <span class="text-xs text-ui-muted dark:text-gray-400 shrink-0">
                    {{ p.units?.length ?? 0 }} {{ t('landlord.unitCount') }}
                  </span>
                </div>
                <span class="text-xs text-ui-muted dark:text-gray-400 truncate min-w-0 max-w-card-cell">
                  {{ typeof p.city === 'object' && p.city?.name ? p.city.name : '' }}
                </span>
              </li>
            </ul>
          </AppCard>
        </div>
      </template>
    </template>
  </main>
</template>
