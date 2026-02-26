<script setup lang="ts">
import { useCurrency } from '../../composables/useCurrency'
/**
 * Gestion de Patrimoine Multi-vues (ARCHITECTURE §6 & §7).
 * Refonte Ultra-Premium : Style "Apple Glass" & Behance (Veri).
 * Utilise les Design Tokens officiels de tailwind.config.js.
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { 
  Building2, Plus, MapPin, Settings2, MoreVertical, 
  TrendingUp, PieChart, Home, Clock, Car, Users,
  ChevronDown, Check
} from 'lucide-vue-next'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { useProperty } from '../../composables/useProperty'
import { useViewMode } from '../../composables/useViewMode'
import type { PropertyListItemDto, PropertyDetailDto, UnitDto } from '../../services/property.service'
import { deleteProperty } from '../../services/property.service'
import { getCities } from '../../services/location.service'
import { AppButton, AppInput, ViewSwitcher, ConfirmModal, AppSkeleton } from '../../components/ui'
import PropertyCardImage from '../../components/landlord/PropertyCardImage.vue'
import PropertyTable from './PropertyTable.vue'
import AssetDetailPanel from './AssetDetailPanel.vue'
import AddPropertyModal from './AddPropertyModal.vue'
import EditPropertyModal from './EditPropertyModal.vue'
import AddUnitModal from './AddUnitModal.vue'
import EditUnitModal from './EditUnitModal.vue'
import QuickEditPropertyModal from './QuickEditPropertyModal.vue'

const ASSET_VIEW_KEY = 'immo_landlord_assets_view'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const { viewMode, setViewMode } = useViewMode(ASSET_VIEW_KEY, 'grid')
const { properties, loading, error, fetchList, getDetail, getPrimaryImageUrl } = useProperty({ fetchOnMount: false })

const showAddPropertyModal = ref(false)
const showAddUnitModal = ref(false)
const createdPropertyId = ref<string | null>(null)
const createdPropertyName = ref<string>('')

// Split-View / Asset Selection
const selectedAssetId = ref<string | null>(null)
const selectedAssetDetail = ref<PropertyDetailDto | null>(null)
const loadingAssetDetail = ref(false)

const quickEditProperty = ref<PropertyListItemDto | null>(null)
const editPropertyId = ref<string | null>(null)
const editUnitContext = ref<{ propertyId: string; unit: UnitDto } | null>(null)
const gridActionsOpenId = ref<string | null>(null)
const deleteConfirmPropertyId = ref<string | null>(null)
const deletingProperty = ref(false)

const searchQuery = ref('')
const filterCityId = ref('')
const filterVacanciesOnly = ref(false)
/** Référentiel villes (id → nom) pour afficher les noms au lieu des IDs. */
const cityNamesById = ref<Record<string, string>>({})

onMounted(async () => {
  fetchList().catch(() => {})
  try {
    const cities = await getCities()
    const map: Record<string, string> = {}
    for (const c of cities) map[c.id] = c.name ?? c.id
    cityNamesById.value = map
  } catch {
    // Ignorer : on garde les noms venant de p.city?.name
  }
  if (route.query.openAdd === 'property') {
    showAddPropertyModal.value = true
    router.replace({ path: route.path, query: {} })
  }
})

watch(properties, (list) => {
  try {
    const stored = localStorage.getItem(ASSET_VIEW_KEY)
    if (!stored && list.length > 5) setViewMode('table')
  } catch {}
}, { deep: true })

watch(error, (err) => { if (err) toast.error(err) })

function onDocClickGrid(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target?.closest?.('[data-grid-actions]')) return
  gridActionsOpenId.value = null
}

watch(gridActionsOpenId, (id) => {
  if (id) setTimeout(() => document.addEventListener('click', onDocClickGrid), 0)
  else document.removeEventListener('click', onDocClickGrid)
})

onBeforeUnmount(() => document.removeEventListener('click', onDocClickGrid))

/** Selection Logic */
async function selectAsset(p: PropertyListItemDto) {
  if (selectedAssetId.value === p.id) {
    selectedAssetId.value = null
    selectedAssetDetail.value = null
    return
  }
  
  selectedAssetId.value = p.id
  loadingAssetDetail.value = true
  selectedAssetDetail.value = null
  
  try {
    selectedAssetDetail.value = await getDetail(p.id)
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    loadingAssetDetail.value = false
  }
}

function closeAssetDetail() {
  selectedAssetId.value = null
  selectedAssetDetail.value = null
}

function onAssetActionAddUnit() {
  const p = filteredProperties.value.find((x: PropertyListItemDto) => x.id === selectedAssetId.value)
  if (p) openAddUnitForProperty(p)
}

function openAddPropertyModal() {
  showAddPropertyModal.value = true
}

function openAddUnitForProperty(p: PropertyListItemDto) {
  const name = typeof p.name === 'object' && p.name !== null && 'fr' in p.name
    ? (p.name as { fr?: string }).fr ?? (p.name as { en?: string }).en ?? ''
    : String(p.name ?? '')
  createdPropertyId.value = p.id
  createdPropertyName.value = name
  showAddUnitModal.value = true
}

function openQuickEdit(p: PropertyListItemDto) {
  quickEditProperty.value = p
}

function openEditProperty(p: PropertyListItemDto) {
  editPropertyId.value = p.id
}

function onEditPropertySaved() {
  fetchList().catch(() => {})
  if (selectedAssetId.value) {
    const p = filteredProperties.value.find(x => x.id === selectedAssetId.value)
    if (p) selectAsset(p)
  }
  editPropertyId.value = null
  toast.success(t('landlord.toast.propertyUpdateSuccess'))
}

function openEditUnit(propertyId: string, unit: UnitDto) {
  editUnitContext.value = { propertyId, unit }
}

function onEditUnitSaved() {
  fetchList().catch(() => {})
  if (selectedAssetId.value) {
    const p = filteredProperties.value.find(x => x.id === selectedAssetId.value)
    if (p) selectAsset(p)
  }
  editUnitContext.value = null
  toast.success(t('landlord.toast.unitUpdated'))
}

function onPropertyModalClosed(result?: { created: boolean; propertyId?: string; propertyName?: string }) {
  showAddPropertyModal.value = false
  if (result?.created) {
    toast.success(t('landlord.toast.propertyCreated'))
    fetchList().catch(() => {})
    if (result.propertyId) {
      createdPropertyId.value = result.propertyId
      createdPropertyName.value = result.propertyName ?? ''
      showAddUnitModal.value = true
    }
  }
}

function onUnitModalClosed(result?: { created: boolean }) {
  if (result?.created) {
    toast.success(t('landlord.toast.unitCreated'))
    fetchList().catch(() => {})
    if (selectedAssetId.value) {
       const p = filteredProperties.value.find(x => x.id === selectedAssetId.value)
       if (p) selectAsset(p)
    }
  }
  showAddUnitModal.value = false
  createdPropertyId.value = null
  createdPropertyName.value = ''
}

function onQuickEditSaved() {
  toast.success(t('landlord.toast.propertyUpdateSuccess'))
  fetchList().catch(() => {})
}

function onQuickEditClosed() {
  quickEditProperty.value = null
}

function statusLabel(status: string): string {
  const key =
    status === 'coming_soon'
      ? 'statusComingSoon'
      : 'status' + status.charAt(0).toUpperCase() + status.slice(1)
  return t('landlord.' + key)
}

const { formatPrice: formatPriceC } = useCurrency()
function formatPrice(val: any) {
  if (!val && val !== 0) return formatPriceC(0)
  const v = Number(val)
  return isNaN(v) ? formatPriceC(0) : formatPriceC(v)
}

function displayName(p: PropertyListItemDto): string {
  const n = p.name
  if (typeof n === 'object' && n !== null && 'fr' in n) return (n as { fr?: string }).fr ?? (n as { en?: string }).en ?? '—'
  return typeof n === 'string' ? n : '—'
}

function cityDisplay(p: PropertyListItemDto): string {
  return p.city?.name ?? '—'
}

function openDeleteConfirm(propertyId: string) {
  deleteConfirmPropertyId.value = propertyId
}

function closeDeleteConfirm() {
  deleteConfirmPropertyId.value = null
  deletingProperty.value = false
}

async function confirmDeleteProperty() {
  const id = deleteConfirmPropertyId.value
  if (!id) return
  deletingProperty.value = true
  try {
    await deleteProperty(id)
    toast.success(t('landlord.toast.propertyDeleted'))
    closeDeleteConfirm()
    if (selectedAssetId.value === id) closeAssetDetail()
    await fetchList()
  } catch (e) {
    toast.error(t('landlord.toast.apiError', { message: getApiErrorMessage(e) }))
  } finally {
    deletingProperty.value = false
  }
}

function unitCount(p: PropertyListItemDto): number {
  return p.units?.length ?? 0
}

function occupiedCount(p: PropertyListItemDto): number {
  return (p.units ?? []).filter((u: UnitDto) => u.unit_status !== 'available' && u.is_available !== true).length
}

function occupancyPercent(p: PropertyListItemDto): number {
  const total = unitCount(p)
  if (total === 0) return 0
  return Math.round((occupiedCount(p) / total) * 100)
}

function hasVehicleAccess(p: PropertyListItemDto): boolean {
  const re = /parking|vehicle|véhicule|voiture|accès\s*véhicule/i
  const propFeatures = (p as any).equipment ?? (p as any).features
  if (Array.isArray(propFeatures) && propFeatures.some((x: string) => re.test(String(x)))) return true
  const units = p.units ?? []
  for (const u of units) {
    if (Array.isArray(u.features) && u.features.some((x: string) => re.test(String(x)))) return true
  }
  return false
}

function getPropertyNameForSearch(p: PropertyListItemDto): string {
  const n = p.name
  if (typeof n === 'object' && n !== null) {
    const o = n as unknown as Record<string, string>
    return [o.fr, o.en].filter(Boolean).join(' ')
  }
  return typeof n === 'string' ? n : ''
}

const cityOptions = computed(() => {
  const seen = new Set<string>()
  const options: { id: string; name: string }[] = []
  const namesById = cityNamesById.value
  for (const p of properties.value) {
    const cid = p.city_id ?? ''
    if (!cid || seen.has(cid)) continue
    seen.add(cid)
    const name = p.city?.name ?? namesById[cid] ?? t('landlord.city')
    options.push({ id: cid, name: typeof name === 'string' ? name : t('landlord.city') })
  }
  options.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  return [{ id: '', name: t('landlord.filterCityAll') }, ...options]
})

const filteredProperties = computed(() => {
  let list = properties.value
  const q = searchQuery.value?.trim().toLowerCase()
  if (q) {
    list = list.filter((p) =>
      getPropertyNameForSearch(p).toLowerCase().includes(q) ||
      (p.city?.name?.toLowerCase().includes(q)) ||
      (p.address?.toLowerCase().includes(q))
    )
  }
  const cityFilter = filterCityId.value
  if (cityFilter != null && String(cityFilter).trim() !== '') {
    list = list.filter((p) => (p.city_id ?? '') === cityFilter)
  }
  if (filterVacanciesOnly.value) {
    list = list.filter((p) => (p.units ?? []).some((u: UnitDto) => u.unit_status === 'available' || u.is_available === true))
  }
  return list
})

/** Global KPIs */
const kpiMonthlyRevenue = computed(() => {
  let sum = 0
  for (const p of properties.value) {
    for (const u of (p.units ?? [])) {
      if (u.unit_status !== 'available' && u.is_available !== true) sum += Number(u.price || 0)
    }
  }
  return sum
})
const kpiTotalUnits = computed(() => properties.value.reduce((acc, p) => acc + (p.units?.length ?? 0), 0))
const kpiOccupiedUnits = computed(() => {
  let n = 0
  for (const p of properties.value) {
    for (const u of (p.units ?? [])) {
      if (u.unit_status !== 'available' && u.is_available !== true) n += 1
    }
  }
  return n
})
const kpiOccupancyRate = computed(() => kpiTotalUnits.value === 0 ? 0 : Math.round((kpiOccupiedUnits.value / kpiTotalUnits.value) * 100))
const kpiVacantUnits = computed(() => kpiTotalUnits.value - kpiOccupiedUnits.value)
const kpiPendingPayments = computed(() => 0)
</script>

<template>
  <main class="w-full h-full flex flex-col min-h-0 relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-700">
    <!-- Mesh Gradient Background Animé -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-60">
      <div class="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 bg-mesh-emerald blur-mesh-glow rounded-full animate-blob" />
      <div class="absolute top-0 -right-1/4 w-1/2 h-1/2 bg-mesh-blue blur-mesh-glow rounded-full animate-blob animation-delay-2000" />
      <div class="absolute -bottom-1/4 left-1/4 w-3/4 h-1/2 bg-mesh-purple blur-mesh-glow rounded-full animate-blob animation-delay-4000" />
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex min-h-0 overflow-hidden relative z-10">
      <!-- List Area -->
      <div 
        class="flex-1 flex flex-col h-full overflow-hidden transition-all duration-700 cubic-bezier"
        :class="selectedAssetId ? 'pr-0 lg:pr-[40%] xl:pr-asset-detail 2xl:pr-asset-detail-xl' : ''"
      >
        <div class="flex-1 overflow-y-auto custom-scrollbar px-6 lg:px-12 py-10 space-y-10">
          <!-- Header Moderniste -->
          <header class="flex flex-wrap items-center justify-between gap-6">
            <div class="space-y-1">
              <h1 class="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                {{ t('landlord.myProperties') }}
              </h1>
              <p class="text-slate-500 dark:text-slate-400 font-bold text-lg tracking-tight">{{ t('landlord.myPropertiesSubtitle') }}</p>
            </div>
            <div class="flex items-center gap-4 bg-white/40 dark:bg-white/5 backdrop-blur-md p-2 rounded-8xl border border-white/20 shadow-glass">
              <ViewSwitcher v-model="viewMode" :storage-key="ASSET_VIEW_KEY" />
              <AppButton variant="primary" size="lg" class="font-black rounded-6xl px-8 shadow-primary" @click="openAddPropertyModal">
                <Plus :size="24" class="mr-2" />
                {{ t('common.add') }} {{ t('landlord.addProperty') }}
              </AppButton>
            </div>
          </header>

          <!-- Glassy KPI Pods -->
          <section v-if="properties.length" class="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              v-for="(kpi, idx) in [
                { label: 'landlord.kpi.monthlyRevenue', value: formatPrice(String(kpiMonthlyRevenue)), icon: TrendingUp, color: 'emerald' },
                { label: 'landlord.kpi.occupancyRate', value: kpiOccupancyRate + '%', icon: PieChart, color: 'blue' },
                { label: 'landlord.kpi.vacantUnits', value: String(kpiVacantUnits), icon: Home, color: 'orange', alert: kpiVacantUnits > 0 },
                { label: 'landlord.kpi.pendingPayments', value: String(kpiPendingPayments), icon: Clock, color: 'purple' }
              ]"
              :key="idx"
              class="group relative p-6 rounded-5xl bg-white/40 dark:bg-white/5 backdrop-blur-ultra-glass border border-white/20 dark:border-white/10 shadow-glass transition-all duration-500 hover:scale-[1.05] hover:shadow-2xl overflow-hidden"
            >
              <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div class="flex flex-col gap-4">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors" :class="`bg-${kpi.color}-500/10 text-${kpi.color}-500 dark:text-${kpi.color}-400`">
                  <component :is="kpi.icon" :size="24" />
                </div>
                <div>
                  <p class="text-xs font-black uppercase tracking-widest-xl text-slate-500 dark:text-slate-400 mb-1">{{ t(kpi.label) }}</p>
                  <p class="text-2xl font-black text-slate-900 dark:text-white tracking-tighter" :class="kpi.alert ? 'text-rose-500 animate-pulse' : ''">{{ kpi.value }}</p>
                </div>
              </div>
            </div>
          </section>

          <!-- Global Filters Bar -->
          <div class="flex flex-wrap items-center gap-4 bg-white/30 dark:bg-white/[0.02] backdrop-blur-md p-3 rounded-8xl border border-white/10 shadow-inner">
            <div class="relative flex-1 max-w-md group">
              <AppInput 
                v-model="searchQuery" 
                :placeholder="t('landlord.searchPlaceholder')" 
                class="rounded-3xl border-transparent bg-white/40 dark:bg-white/5 pl-12 h-14 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:scale-[1.02] transition-all" 
              />
              <Settings2 class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-emerald transition-colors" />
            </div>
            
            <div class="relative h-14 flex-none min-w-48">
              <select v-model="filterCityId" class="w-full h-full rounded-3xl border-transparent bg-white/40 dark:bg-white/5 px-6 text-sm font-black text-slate-900 dark:text-white appearance-none cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 transition-all">
                <option v-for="c in cityOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
              <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-slate-900 dark:text-white">
                <ChevronDown :size="16" />
              </div>
            </div>

            <label class="flex items-center gap-3 px-6 h-14 rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-transparent hover:border-white/20 transition-all cursor-pointer group">
              <div class="relative w-6 h-6 flex items-center justify-center">
                <input v-model="filterVacanciesOnly" type="checkbox" class="peer absolute inset-0 opacity-0 cursor-pointer" />
                <div class="w-full h-full rounded-lg border-2 border-slate-300 dark:border-slate-700 peer-checked:bg-primary-emerald peer-checked:border-primary-emerald transition-all" />
                <Check :size="16" class="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span class="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{{ t('landlord.filterVacancies') }}</span>
            </label>
          </div>

          <div v-if="loading" class="grid grid-cols-12 gap-8">
            <div v-for="i in 6" :key="i" class="col-span-12 sm:col-span-6 xl:col-span-4">
              <AppSkeleton type="property-card" />
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="!properties.length" class="flex flex-col items-center justify-center py-32 rounded-8xl bg-white/20 dark:bg-white/[0.02] border border-dashed border-white/20 backdrop-blur-sm">
            <div class="w-32 h-32 rounded-7xl bg-primary-emerald/10 flex items-center justify-center text-primary-emerald mb-8 shadow-inner">
              <Building2 :size="60" />
            </div>
            <h2 class="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">{{ t('landlord.emptyTitle') }}</h2>
            <p class="text-slate-500 dark:text-slate-400 font-bold mb-10 text-center max-w-sm">{{ t('landlord.emptyBody') }}</p>
            <AppButton variant="primary" size="lg" class="font-black h-16 rounded-4xl px-12 shadow-primary scale-110 hover:scale-125 transition-transform" @click="openAddPropertyModal">
              <Plus :size="24" class="mr-2" />
              {{ t('landlord.emptyCta') }}
            </AppButton>
          </div>

          <template v-else-if="filteredProperties.length">
            <!-- Table View -->
            <div v-show="viewMode === 'table'" class="animate-in fade-in slide-in-from-bottom-10 duration-700">
              <PropertyTable
                :properties="filteredProperties"
                :primary-image-url="getPrimaryImageUrl"
                :display-name="displayName"
                :city-display="cityDisplay"
                :status-label="statusLabel"
                :format-price="formatPrice"
                :selected-id="selectedAssetId"
                @select-property="selectAsset"
                @select-property-units="selectAsset"
                @view-details="selectAsset"
                @add-unit="openAddUnitForProperty"
                @quick-edit="openQuickEdit"
                @edit-property="openEditProperty"
              />
            </div>

            <!-- Enhanced Grid View -->
            <div v-show="viewMode === 'grid'" class="grid grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-700">
              <div
                v-for="p in filteredProperties"
                :key="p.id"
                class="col-span-12 sm:col-span-6 xl:col-span-4"
              >
                <div 
                  class="group relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-ultra-glass rounded-6xl border border-white/20 dark:border-white/10 shadow-glass transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer overflow-hidden p-3"
                  :class="selectedAssetId === p.id ? 'ring-4 ring-primary-emerald/50 border-primary-emerald shadow-glass-primary' : ''"
                  @click="selectAsset(p)"
                >
                  <div class="aspect-video relative rounded-5xl overflow-hidden shadow-inner">
                    <PropertyCardImage :src="getPrimaryImageUrl(p)" :alt="displayName(p)" class="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" />
                    
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <!-- Glass Badges -->
                    <div class="absolute top-5 left-5 right-5 flex justify-between items-start pointer-events-none">
                       <div class="flex flex-col gap-2">
                         <span v-if="(p as any)._virtual" class="px-4 py-1.5 rounded-2xl backdrop-blur-xl bg-amber-500/20 border border-white/20 text-[10px] font-black uppercase tracking-widest-xl text-amber-200">
                           {{ t('landlord.assetTypeUnit') }}
                         </span>
                         <span class="px-4 py-1.5 rounded-2xl backdrop-blur-xl bg-black/30 border border-white/10 text-[10px] font-black uppercase tracking-widest-xl text-white">
                           {{ statusLabel(p.status) }}
                         </span>
                       </div>
                    </div>

                    <div class="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                       <div class="flex gap-2">
                         <span class="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-xl text-[10px] font-black text-white uppercase tracking-widest-xl">
                           <Users :size="16" />
                           {{ unitCount(p) }} {{ t('landlord.units') }}
                         </span>
                         <span v-if="hasVehicleAccess(p)" class="flex items-center justify-center w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-xl text-white">
                           <Car :size="16" />
                         </span>
                       </div>
                    </div>
                  </div>

                  <div class="p-6 space-y-4">
                    <div class="flex items-center justify-between">
                      <div class="space-y-1">
                        <h3 class="text-xl font-black text-slate-900 dark:text-white truncate tracking-tighter" :title="displayName(p)">{{ displayName(p) }}</h3>
                        <div class="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                          <MapPin :size="16" class="text-primary-emerald" />
                          {{ cityDisplay(p) }}
                        </div>
                      </div>
                      <div class="data-grid-actions" @click.stop>
                        <button class="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-primary-emerald hover:text-white transition-all shadow-sm" @click="gridActionsOpenId = gridActionsOpenId === p.id ? null : p.id">
                          <MoreVertical :size="20" />
                        </button>
                      </div>
                    </div>

                    <!-- Occupancy Progress -->
                    <div class="space-y-2">
                      <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest-xl text-slate-400">
                        <span>{{ t('landlord.kpi.occupancy') }}</span>
                        <span class="text-slate-900 dark:text-white">{{ occupancyPercent(p) }}%</span>
                      </div>
                      <div class="h-3 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden shadow-inner">
                        <div class="h-full bg-gradient-to-r from-primary-emerald to-emerald-400 transition-all duration-1000 ease-out" :style="{ width: occupancyPercent(p) + '%' }" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Compact View -->
            <div v-show="viewMode === 'compact'" class="grid grid-cols-12 gap-6">
              <div v-for="p in filteredProperties" :key="p.id" class="col-span-6 md:col-span-3 lg:col-span-2">
                <div 
                  class="group p-5 rounded-5xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/10 shadow-glass cursor-pointer transition-all hover:scale-[1.05]"
                  :class="selectedAssetId === p.id ? 'ring-2 ring-primary-emerald bg-white/60 dark:bg-white/10' : ''"
                  @click="selectAsset(p)"
                >
                   <div class="space-y-3">
                     <p class="text-sm font-black text-slate-900 dark:text-white truncate tracking-tighter">{{ displayName(p) }}</p>
                     <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{{ cityDisplay(p) }}</p>
                     <div class="h-1.5 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden">
                       <div class="h-full bg-primary-emerald shadow-primary-light" :style="{ width: occupancyPercent(p) + '%' }" />
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </template>

          <div v-else class="py-32 text-center animate-in fade-in zoom-in-95">
            <p class="text-lg font-black text-slate-400 italic tracking-tight">{{ t('landlord.assets.noResults') }}</p>
          </div>
        </div>
      </div>

      <!-- Detail Panel (Fixed Right on Desktop) -->
      <aside 
        class="fixed inset-y-0 right-0 z-20 w-asset-detail-mobile lg:w-[40%] xl:w-asset-detail 2xl:w-asset-detail-xl transform transition-all duration-[800ms] cubic-bezier"
        :class="selectedAssetId ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 translate-y-20'"
      >
        <AssetDetailPanel
          v-if="selectedAssetId || selectedAssetDetail"
          :asset="selectedAssetDetail"
          :loading="loadingAssetDetail"
          :primary-image-url="selectedAssetId ? getPrimaryImageUrl(properties.find(p => p.id === selectedAssetId)!) : undefined"
          :display-name="selectedAssetDetail ? (typeof selectedAssetDetail.name === 'object' ? selectedAssetDetail.name[locale] || displayName(selectedAssetDetail as any) : selectedAssetDetail.name) : (selectedAssetId ? displayName(properties.find(p => p.id === selectedAssetId)!) : '')"
          :city-name="selectedAssetDetail?.city?.name || (selectedAssetId ? cityDisplay(properties.find(p => p.id === selectedAssetId)!) : '')"
          :format-price="formatPrice"
          @close="closeAssetDetail"
          @edit="editPropertyId = selectedAssetId; closeAssetDetail()"
          @add-unit="onAssetActionAddUnit"
          @edit-unit="(u) => openEditUnit(selectedAssetId!, u)"
          @delete="openDeleteConfirm(selectedAssetId!)"
        />
      </aside>
    </div>

    <!-- Modals -->
    <AddPropertyModal :show="showAddPropertyModal" @close="onPropertyModalClosed" />
    <AddUnitModal :show="showAddUnitModal" :property-id="createdPropertyId" :property-name="createdPropertyName" @close="onUnitModalClosed" />
    <QuickEditPropertyModal :show="!!quickEditProperty" :property="quickEditProperty" @close="onQuickEditClosed" @saved="onQuickEditSaved" />
    <EditPropertyModal :show="!!editPropertyId" :property-id="editPropertyId" @close="editPropertyId = null" @saved="onEditPropertySaved" />
    <EditUnitModal :show="!!editUnitContext" :property-id="editUnitContext?.propertyId ?? null" :unit="editUnitContext?.unit ?? null" @close="editUnitContext = null" @saved="onEditUnitSaved" />
    <ConfirmModal :show="!!deleteConfirmPropertyId" :title="t('landlord.deleteConfirm.title')" :message="t('landlord.deleteConfirm.message')" :confirm-label="t('landlord.deleteConfirm.delete')" variant="danger" :loading="deletingProperty" @close="closeDeleteConfirm" @confirm="confirmDeleteProperty" />
  </main>
</template>

<style scoped>
.cubic-bezier {
  transition-timing-function: cubic-bezier(0.87, 0, 0.13, 1);
}

.shadow-primary {
  box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
}
.shadow-primary-light {
  box-shadow: 0 0 40px rgba(16, 185, 129, 0.15);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.1);
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.05);
}

@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
