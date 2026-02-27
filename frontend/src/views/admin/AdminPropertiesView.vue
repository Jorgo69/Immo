<script setup lang="ts">
import { useCurrency } from '../../composables/useCurrency'
/**
 * Liste des biens (admin) : recherche, filtres (ville, statut, prix), tableau, lien vers détail.
 */
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Building2, ChevronRight, Search } from 'lucide-vue-next'
import { searchProperties, type PropertyListItemDto, type PropertySearchFilters } from '../../services/property.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppTitle, AppButton, AppCard } from '../../components/ui'
import { AppPagination } from '../../components/ui'

const { t } = useI18n()
const router = useRouter()

const PAGE_SIZE = 15
const properties = ref<PropertyListItemDto[]>([])
const total = ref(0)
const totalPages = ref(0)
const currentPage = ref(1)
const loading = ref(true)
const searchQuery = ref('')
const filterCity = ref('')
const filterStatus = ref('')
const filterPriceMin = ref('')
const filterPriceMax = ref('')

const statusOptions = [
  { value: '', labelKey: 'admin.properties.filterStatusAll' },
  { value: 'available', labelKey: 'admin.status.available' },
  { value: 'coming_soon', labelKey: 'admin.status.coming_soon' },
  { value: 'occupied', labelKey: 'admin.status.occupied' },
  { value: 'maintenance', labelKey: 'admin.status.maintenance' },
]

async function fetchList(page = 1) {
  loading.value = true
  currentPage.value = page
  try {
    const filters: PropertySearchFilters = {
      page,
      limit: PAGE_SIZE,
      q: searchQuery.value.trim() || undefined,
      city: filterCity.value.trim() || undefined,
      status: filterStatus.value || undefined,
      min_price: filterPriceMin.value.trim() || undefined,
      max_price: filterPriceMax.value.trim() || undefined,
    }
    const result = await searchProperties(filters)
    properties.value = result.data
    total.value = result.total
    totalPages.value = result.totalPages
  } catch (e) {
    toast.error(getApiErrorMessage(e))
    properties.value = []
    total.value = 0
    totalPages.value = 0
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  fetchList(1)
}

watch([filterCity, filterStatus, filterPriceMin, filterPriceMax], () => {
  applyFilters()
})

let searchDebounce: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => applyFilters(), 300)
})

function statusLabel(status: string): string {
  return t('admin.status.' + status)
}

function formatDate(iso: string | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const { formatPrice: formatPriceC } = useCurrency()
function formatPrice(val: any) {
  if (!val && val !== 0) return formatPriceC(0)
  const v = Number(val)
  return isNaN(v) ? formatPriceC(0) : formatPriceC(v)
}

function openDetail(property: PropertyListItemDto) {
  router.push({ name: 'admin-property-detail', params: { id: property.id } })
}

fetchList(1)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <AppTitle :level="2">{{ t('admin.properties.title') }}</AppTitle>
    </div>

    <!-- Recherche + Filtres -->
    <div class="flex flex-wrap items-end gap-3">
      <div class="flex min-w-[200px] flex-1 flex-col gap-1">
        <label class="text-xs font-medium text-[var(--color-muted)]">{{ t('admin.properties.searchLabel') }}</label>
        <div class="relative">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden="true" />
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="t('admin.properties.searchPlaceholder')"
            class="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-[var(--color-text)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            autocomplete="off"
          />
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-[var(--color-muted)]">{{ t('admin.properties.filterCity') }}</label>
        <input
          v-model="filterCity"
          type="text"
          :placeholder="t('admin.properties.filterCityPlaceholder')"
          class="w-36 rounded-lg border border-gray-200 px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-[var(--color-muted)]">{{ t('admin.properties.filterStatus') }}</label>
        <select
          v-model="filterStatus"
          class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        >
          <option v-for="opt in statusOptions" :key="String(opt.value)" :value="opt.value">
            {{ t(opt.labelKey) }}
          </option>
        </select>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-[var(--color-muted)]">{{ t('admin.properties.filterPriceMin') }}</label>
        <input
          v-model="filterPriceMin"
          type="number"
          min="0"
          placeholder="0"
          class="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-[var(--color-muted)]">{{ t('admin.properties.filterPriceMax') }}</label>
        <input
          v-model="filterPriceMax"
          type="number"
          min="0"
          placeholder="—"
          class="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
      </div>
    </div>

    <!-- Tableau -->
    <AppCard class="overflow-hidden p-0">
      <div v-if="loading" class="p-8 text-center text-[var(--color-muted)] text-sm">
        {{ t('admin.properties.loading') }}
      </div>
      <div v-else-if="!properties.length" class="p-8 text-center text-[var(--color-muted)] text-sm">
        {{ t('admin.properties.empty') }}
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50">
            <tr>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.properties.tableTitle') }}</th>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.properties.tableCity') }}</th>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.properties.tablePrice') }}</th>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.properties.tableStatus') }}</th>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.properties.tableOwner') }}</th>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.properties.tableAgent') }}</th>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.properties.tableCreated') }}</th>
              <th class="w-20 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="p in properties"
              :key="p.id"
              class="cursor-pointer transition-colors hover:bg-gray-50"
              @click="openDetail(p)"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[var(--color-muted)]"
                  >
                    <Building2 class="h-5 w-5" />
                  </div>
                  <span class="font-medium text-[var(--color-text)]">{{ p.name ?? p.title }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-[var(--color-text)]">{{ typeof p.city === 'string' ? p.city : p.city?.name }}</td>
              <td class="px-4 py-3 text-[var(--color-text)]">{{ formatPrice((p.price_monthly ?? p.units?.[0]?.price) ?? '0') }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-800': p.status === 'available',
                    'bg-amber-100 text-amber-800': p.status === 'coming_soon',
                    'bg-gray-100 text-gray-700': p.status === 'occupied',
                    'bg-orange-100 text-orange-800': p.status === 'maintenance',
                  }"
                >
                  {{ statusLabel(p.status) }}
                </span>
              </td>
              <td class="px-4 py-3 font-mono text-xs text-[var(--color-muted)]">{{ p.owner_id?.slice(0, 8) }}…</td>
              <td class="px-4 py-3 font-mono text-xs text-[var(--color-muted)]">
                {{ p.agent_id ? p.agent_id.slice(0, 8) + '…' : '—' }}
              </td>
              <td class="px-4 py-3 text-[var(--color-muted)]">{{ formatDate(p.created_at) }}</td>
              <td class="px-4 py-3">
                <AppButton variant="ghost" size="sm" class="text-[var(--color-accent)]" @click.stop="openDetail(p)">
                  <ChevronRight class="h-4 w-4" />
                </AppButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="total > PAGE_SIZE" class="border-t border-gray-100 p-3">
        <AppPagination
          :page="currentPage"
          :total-pages="totalPages"
          :total="total"
          :limit="PAGE_SIZE"
          @page-change="fetchList"
        />
      </div>
    </AppCard>
  </div>
</template>
