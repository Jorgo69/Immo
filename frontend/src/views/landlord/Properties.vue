<script setup lang="ts">
/**
 * Gestion de Patrimoine Multi-vues (ARCHITECTURE §6 & §7).
 * Grille (xl: 6 colonnes) / Tableau / Compact. ViewSwitcher + persistance localStorage.
 * Données via CRUD Back-end ; affichage nom/ville formaté (jamais d'ID brut).
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Building2, Plus, MapPin, Settings2, MoreVertical, TrendingUp, PieChart, Home, AlertCircle, Clock } from 'lucide-vue-next'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { useProperty } from '../../composables/useProperty'
import { useViewMode } from '../../composables/useViewMode'
import type { PropertyListItemDto, PropertyDetailDto, UnitDto } from '../../services/property.service'
import { deleteProperty } from '../../services/property.service'
import { AppCard, AppButton, AppTitle, AppParagraph, AppInput, ViewSwitcher, ConfirmModal } from '../../components/ui'
import PropertyCardImage from '../../components/landlord/PropertyCardImage.vue'
import PropertyTable from './PropertyTable.vue'
import PropertyDetailsDrawer from './PropertyDetailsDrawer.vue'
import AddPropertyModal from './AddPropertyModal.vue'
import EditPropertyModal from './EditPropertyModal.vue'
import AddUnitModal from './AddUnitModal.vue'
import EditUnitModal from './EditUnitModal.vue'
import QuickEditPropertyModal from './QuickEditPropertyModal.vue'

const ASSET_VIEW_KEY = 'immo_landlord_assets_view'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { viewMode, setViewMode } = useViewMode(ASSET_VIEW_KEY, 'grid')
const { properties, loading, error, fetchList, getDetail, getPrimaryImageUrl } = useProperty({ fetchOnMount: false })

const showAddPropertyModal = ref(false)
const showAddUnitModal = ref(false)
const createdPropertyId = ref<string | null>(null)
const createdPropertyName = ref<string>('')
const drawerPropertyId = ref<string | null>(null)
const detailForDrawer = ref<PropertyDetailDto | null>(null)
const loadingDetail = ref(false)
const quickEditProperty = ref<PropertyListItemDto | null>(null)
const editPropertyId = ref<string | null>(null)
const editUnitContext = ref<{ propertyId: string; unit: UnitDto } | null>(null)
const gridActionsOpenId = ref<string | null>(null)
const deleteConfirmPropertyId = ref<string | null>(null)
const deletingProperty = ref(false)

const searchQuery = ref('')
const filterCityId = ref('')
const filterVacanciesOnly = ref(false)

onMounted(() => {
  fetchList().catch(() => {})
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

const cityOptions = computed(() => {
  const seen = new Set<string>()
  const names: { id: string; name: string }[] = []
  for (const p of properties.value) {
    if (p.city_id && p.city?.name && !seen.has(p.city_id)) {
      seen.add(p.city_id)
      names.push({ id: p.city_id, name: p.city.name })
    }
  }
  names.sort((a, b) => a.name.localeCompare(b.name))
  return [{ id: '', name: t('landlord.filterCityAll') }, ...names]
})

const filteredProperties = computed(() => {
  let list = properties.value
  const q = searchQuery.value?.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (p) =>
        (p.name?.toLowerCase().includes(q)) ||
        (p.city?.name?.toLowerCase().includes(q)) ||
        (p.address?.toLowerCase().includes(q))
    )
  }
  if (filterCityId.value) list = list.filter((p) => p.city_id === filterCityId.value)
  if (filterVacanciesOnly.value) {
    list = list.filter((p) => {
      const units = p.units ?? []
      return units.some((u: UnitDto) => u.unit_status === 'available' || u.is_available === true)
    })
  }
  return list
})

/** KPI agrégés (toutes les propriétés, pas seulement filtrées). */
const kpiMonthlyRevenue = computed(() => {
  let sum = 0
  for (const p of properties.value) {
    const units = p.units ?? []
    for (const u of units) {
      const isOccupied = u.unit_status !== 'available' && u.is_available !== true
      if (isOccupied) sum += Number(u.price || 0)
    }
  }
  return sum
})

const kpiTotalUnits = computed(() => {
  return properties.value.reduce((acc, p) => acc + (p.units?.length ?? 0), 0)
})

const kpiOccupiedUnits = computed(() => {
  let n = 0
  for (const p of properties.value) {
    const units = p.units ?? []
    for (const u of units) {
      if (u.unit_status !== 'available' && u.is_available !== true) n += 1
    }
  }
  return n
})

const kpiOccupancyRate = computed(() => {
  const total = kpiTotalUnits.value
  if (total === 0) return 0
  return Math.round((kpiOccupiedUnits.value / total) * 100)
})

const kpiVacantUnits = computed(() => kpiTotalUnits.value - kpiOccupiedUnits.value)

/** Paiements en attente : placeholder (0) tant qu'aucun endpoint dédié. */
const kpiPendingPayments = computed(() => 0)

async function loadDetailForDrawer(propertyId: string) {
  if (drawerPropertyId.value !== propertyId) return
  loadingDetail.value = true
  detailForDrawer.value = null
  try {
    detailForDrawer.value = await getDetail(propertyId)
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    loadingDetail.value = false
  }
}

/** Ouvre le drawer Détails & Unités (clic ligne ou « Voir détails »). Pas de dépliage de ligne. */
function openDrawer(p: PropertyListItemDto) {
  drawerPropertyId.value = p.id
  detailForDrawer.value = null
  loadDetailForDrawer(p.id)
}

function closeDrawer() {
  drawerPropertyId.value = null
  detailForDrawer.value = null
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

function onDrawerAddUnit() {
  const p = filteredProperties.value.find((x: PropertyListItemDto) => x.id === drawerPropertyId.value)
  if (p) openAddUnitForProperty(p)
}

function openQuickEdit(p: PropertyListItemDto) {
  quickEditProperty.value = p
}

function openEditProperty(p: PropertyListItemDto) {
  editPropertyId.value = p.id
}

function onEditPropertySaved() {
  fetchList().catch(() => {})
  if (drawerPropertyId.value) loadDetailForDrawer(drawerPropertyId.value)
  editPropertyId.value = null
  toast.success(t('landlord.toast.propertyUpdateSuccess'))
}

function openEditUnit(propertyId: string, unit: UnitDto) {
  editUnitContext.value = { propertyId, unit }
}

function onEditUnitSaved() {
  fetchList().catch(() => {})
  if (drawerPropertyId.value) loadDetailForDrawer(drawerPropertyId.value)
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
    if (drawerPropertyId.value) loadDetailForDrawer(drawerPropertyId.value)
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

function formatPrice(price: string) {
  return new Intl.NumberFormat('fr-FR').format(Number(price)) + ' FCFA'
}

/** Nom affiché : clé fr si JSONB, sinon chaîne (jamais d'ID brut). */
function displayName(p: PropertyListItemDto): string {
  const n = p.name
  if (typeof n === 'object' && n !== null && 'fr' in n) return (n as { fr?: string }).fr ?? (n as { en?: string }).en ?? '—'
  return typeof n === 'string' ? n : '—'
}

function cityDisplay(p: PropertyListItemDto): string {
  return p.city?.name ?? '—'
}

function drawerDisplayName(): string {
  const d = detailForDrawer.value
  if (d?.name) {
    if (typeof d.name === 'object' && d.name !== null && 'fr' in d.name) return (d.name as { fr?: string }).fr ?? (d.name as { en?: string }).en ?? '—'
    return typeof d.name === 'string' ? d.name : '—'
  }
  const p = properties.value.find((x) => x.id === drawerPropertyId.value)
  return p ? displayName(p) : '—'
}

function drawerCityName(): string {
  const d = detailForDrawer.value
  if (d?.city?.name) return d.city.name
  const p = properties.value.find((x) => x.id === drawerPropertyId.value)
  return p ? cityDisplay(p) : '—'
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
    if (drawerPropertyId.value === id) closeDrawer()
    await fetchList()
  } catch (e) {
    toast.error(t('landlord.toast.apiError', { message: getApiErrorMessage(e) }))
  } finally {
    deletingProperty.value = false
  }
}

function unitCount(p: PropertyListItemDto): number {
  if (drawerPropertyId.value === p.id && detailForDrawer.value?.units?.length)
    return detailForDrawer.value.units.length
  return p.units?.length ?? 0
}

function occupiedCount(p: PropertyListItemDto): number {
  const units = drawerPropertyId.value === p.id && detailForDrawer.value?.units
    ? detailForDrawer.value.units
    : p.units ?? []
  return units.filter((u: UnitDto) => u.unit_status !== 'available' && u.is_available !== true).length
}

/** Taux de remplissage du bien (0–100) pour la barre de progression. */
function occupancyPercent(p: PropertyListItemDto): number {
  const total = unitCount(p)
  if (total === 0) return 0
  return Math.round((occupiedCount(p) / total) * 100)
}

/** True si au moins une unité a un équipement type parking / accès véhicule. */
function hasVehicleAccess(p: PropertyListItemDto): boolean {
  const units = p.units ?? []
  const re = /parking|vehicle|véhicule|voiture|accès/i
  for (const u of units) {
    const f = u.features
    if (Array.isArray(f) && f.some((x: string) => re.test(String(x)))) return true
    if (f && typeof f === 'object' && !Array.isArray(f)) {
      const arr = (f as Record<string, string[]>).fr ?? (f as Record<string, string[]>).en ?? []
      if (arr.some((x: string) => re.test(x))) return true
    }
  }
  return false
}

watch(
  () => route.query.openAdd,
  (v) => {
    if (v === 'property') {
      showAddPropertyModal.value = true
      router.replace({ path: route.path, query: {} })
    }
  }
)
</script>

<template>
  <main class="w-full max-w-full px-3 py-4 md:px-4 lg:px-6">
    <div class="grid grid-cols-12 gap-4">
      <!-- Header + actions -->
      <header class="col-span-12 flex flex-wrap items-center justify-between gap-3">
        <div>
          <AppTitle :level="2" class="flex items-center gap-2 text-xl text-gray-900 dark:text-gray-100">
            <Building2 class="w-6 h-6 text-primary-emerald" />
            {{ t('landlord.myProperties') }}
          </AppTitle>
          <AppParagraph muted class="mt-0.5 text-sm">{{ t('landlord.myPropertiesSubtitle') }}</AppParagraph>
        </div>
        <div class="flex items-center gap-2">
          <ViewSwitcher v-model="viewMode" :storage-key="ASSET_VIEW_KEY" />
          <AppButton variant="primary" size="sm" class="flex items-center gap-1.5" @click="openAddPropertyModal">
            <Plus class="w-4 h-4" />
            {{ t('landlord.addProperty') }}
          </AppButton>
        </div>
      </header>

      <!-- KPI Header (Frijo style) -->
      <section v-if="properties.length" class="col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="rounded-2xl border border-ui-border dark:border-gray-600 bg-ui-surface dark:bg-ui-surface-dark shadow-soft p-4 flex items-center gap-3">
          <div class="shrink-0 w-10 h-10 rounded-xl bg-primary-emerald/10 flex items-center justify-center text-primary-emerald">
            <TrendingUp class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-ui-muted dark:text-gray-400">{{ t('landlord.kpi.monthlyRevenue') }}</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {{ new Intl.NumberFormat('fr-FR').format(kpiMonthlyRevenue) }} FCFA
            </p>
          </div>
        </div>
        <div class="rounded-2xl border border-ui-border dark:border-gray-600 bg-ui-surface dark:bg-ui-surface-dark shadow-soft p-4 flex items-center gap-3">
          <div class="shrink-0 w-10 h-10 rounded-xl bg-primary-emerald/10 flex items-center justify-center text-primary-emerald">
            <PieChart class="w-5 h-5" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-ui-muted dark:text-gray-400">{{ t('landlord.kpi.occupancyRate') }}</p>
            <div class="flex items-center gap-2">
              <div class="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  class="h-full rounded-full bg-primary-emerald transition-all duration-300"
                  :style="{ width: String(kpiOccupancyRate) + '%' }"
                />
              </div>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">{{ kpiOccupancyRate }}%</span>
            </div>
          </div>
        </div>
        <div
          class="rounded-2xl border shadow-soft p-4 flex items-center gap-3 transition-colors"
          :class="kpiVacantUnits > 0
            ? 'border-warning-orange/50 dark:border-warning-orange/50 bg-warning-orange-light/30 dark:bg-warning-orange/10'
            : 'border-ui-border dark:border-gray-600 bg-ui-surface dark:bg-ui-surface-dark'"
        >
          <div
            class="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            :class="kpiVacantUnits > 0 ? 'bg-warning-orange/20 text-warning-orange' : 'bg-primary-emerald/10 text-primary-emerald'"
          >
            <Home class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-ui-muted dark:text-gray-400">{{ t('landlord.kpi.vacantUnits') }}</p>
            <p class="text-lg font-semibold" :class="kpiVacantUnits > 0 ? 'text-warning-orange' : 'text-gray-900 dark:text-gray-100'">
              {{ kpiVacantUnits }}
            </p>
          </div>
        </div>
        <div class="rounded-2xl border border-ui-border dark:border-gray-600 bg-ui-surface dark:bg-ui-surface-dark shadow-soft p-4 flex items-center gap-3">
          <div class="shrink-0 w-10 h-10 rounded-xl bg-primary-emerald/10 flex items-center justify-center text-primary-emerald">
            <Clock class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-ui-muted dark:text-gray-400">{{ t('landlord.kpi.pendingPayments') }}</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ kpiPendingPayments }}
            </p>
          </div>
        </div>
      </section>

      <!-- Filtres -->
      <section class="col-span-12 flex flex-wrap items-center gap-2">
        <AppInput
          v-model="searchQuery"
          type="text"
          :placeholder="t('landlord.searchPlaceholder')"
          class="min-w-[180px] max-w-xs text-sm"
        />
        <select
          v-model="filterCityId"
          class="rounded-lg border border-ui-border dark:border-gray-600 bg-ui-surface dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 min-w-[140px]"
        >
          <option v-for="c in cityOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <label class="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-900 dark:text-gray-100">
          <input v-model="filterVacanciesOnly" type="checkbox" class="rounded border-gray-300 text-primary-emerald" />
          {{ t('landlord.filterVacancies') }}
        </label>
      </section>

      <section class="col-span-12">
        <div v-if="loading" class="flex items-center justify-center py-12 text-sm text-ui-muted">
          {{ t('admin.properties.loading') }}
        </div>

        <div
          v-else-if="!properties.length"
          class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ui-border dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 py-12 px-4 text-center"
        >
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary-emerald/10 text-primary-emerald mb-4">
            <Building2 class="w-8 h-8" />
          </div>
          <AppTitle :level="3" class="mb-1 text-lg">{{ t('landlord.emptyTitle') }}</AppTitle>
          <AppParagraph muted class="text-sm mb-6">{{ t('landlord.emptyBody') }}</AppParagraph>
          <AppButton variant="primary" size="sm" class="flex items-center gap-2" @click="openAddPropertyModal">
            <Plus class="w-4 h-4" />
            {{ t('landlord.emptyCta') }}
          </AppButton>
        </div>

        <template v-else-if="filteredProperties.length">
          <!-- Vue Tableau (Pro) -->
          <div v-show="viewMode === 'table'">
            <PropertyTable
              :properties="filteredProperties"
              :primary-image-url="getPrimaryImageUrl"
              :display-name="displayName"
              :city-display="cityDisplay"
              :status-label="statusLabel"
              :format-price="formatPrice"
              @select-property="openDrawer"
              @select-property-units="openDrawer"
              @view-details="openDrawer"
              @add-unit="openAddUnitForProperty"
              @quick-edit="openQuickEdit"
              @edit-property="openEditProperty"
            />
          </div>

          <!-- Vue Grille (MallOS style : data-dense, rounded-2xl, barre de remplissage) -->
          <div v-show="viewMode === 'grid'" class="grid grid-cols-12 gap-3">
            <div
              v-for="p in filteredProperties"
              :key="p.id"
              class="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-2 flex flex-col relative"
            >
              <div class="rounded-2xl border border-ui-border dark:border-gray-600 bg-ui-surface dark:bg-gray-800 shadow-soft overflow-hidden flex flex-col h-full">
                <div class="aspect-video bg-gray-100 dark:bg-gray-700 relative shrink-0">
                  <PropertyCardImage
                    :src="getPrimaryImageUrl(p)"
                    :alt="displayName(p)"
                    class="absolute inset-0 w-full h-full object-cover"
                  />
                  <span
                    class="absolute top-1.5 right-1.5 rounded-lg px-1.5 py-0.5 text-xs font-medium"
                    :class="{
                      'bg-primary-emerald-light text-primary-emerald dark:bg-primary-emerald/20 dark:text-primary-emerald': p.status === 'available',
                      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300': p.status === 'coming_soon',
                      'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200': p.status === 'occupied',
                      'bg-warning-orange-light text-warning-orange dark:bg-warning-orange/20 dark:text-warning-orange': p.status === 'maintenance',
                    }"
                  >
                    {{ statusLabel(p.status) }}
                  </span>
                  <span class="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-lg bg-brand-dark/80 px-1.5 py-0.5 text-xs font-medium text-white">
                    🏠 {{ unitCount(p) }} {{ t('landlord.kpi.households') }}
                  </span>
                  <span v-if="hasVehicleAccess(p)" class="absolute bottom-1.5 right-1.5 rounded-lg bg-brand-dark/80 px-1.5 py-0.5 text-xs font-medium text-white">
                    🚗 {{ t('landlord.kpi.vehicleAccess') }}
                  </span>
                </div>
                <div class="p-2.5 flex flex-col flex-1 min-w-0">
                  <p class="font-medium text-sm truncate text-gray-900 dark:text-gray-100" :title="displayName(p)">{{ displayName(p) }}</p>
                  <p class="text-xs text-ui-muted flex items-center gap-1 truncate mt-0.5">
                    <MapPin class="w-3 h-3 shrink-0" />
                    {{ cityDisplay(p) }}
                  </p>
                  <div class="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden" role="progressbar" :aria-valuenow="occupancyPercent(p)" aria-valuemin="0" aria-valuemax="100">
                    <div
                      class="h-full rounded-full bg-primary-emerald transition-all duration-300"
                      :style="{ width: String(occupancyPercent(p)) + '%' }"
                    />
                  </div>
                  <div class="mt-auto pt-1.5 relative" data-grid-actions>
                    <AppButton
                      variant="ghost"
                      size="sm"
                      class="min-w-0 p-1.5 h-8 rounded-lg text-ui-muted hover:text-gray-900 dark:hover:text-gray-100"
                      :aria-label="t('landlord.assets.quickActions')"
                      @click="gridActionsOpenId = gridActionsOpenId === p.id ? null : p.id"
                    >
                      <MoreVertical class="w-4 h-4" />
                    </AppButton>
                    <div
                      v-show="gridActionsOpenId === p.id"
                      class="absolute left-0 bottom-full mb-0.5 z-10 min-w-[160px] rounded-xl border border-ui-border dark:border-gray-600 bg-ui-surface dark:bg-gray-800 shadow-soft-lg py-1"
                      role="menu"
                    >
                      <button type="button" class="w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2" @click="openEditProperty(p); gridActionsOpenId = null">
                        {{ t('landlord.editProperty') }}
                      </button>
                      <button type="button" class="w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2" @click="openQuickEdit(p); gridActionsOpenId = null">
                        {{ t('landlord.assets.quickEdit') }}
                      </button>
                      <button type="button" class="w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700" @click="openDrawer(p); gridActionsOpenId = null">
                        <Settings2 class="w-3.5 h-3.5" />
                        {{ t('landlord.manageUnits') }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Vue Compacte (data-dense, barre de remplissage) -->
          <div
            v-show="viewMode === 'compact'"
            class="grid grid-cols-12 gap-2 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6"
          >
            <div
              v-for="p in filteredProperties"
              :key="p.id"
              class="col-span-6 md:col-span-3 xl:col-span-2 flex flex-col"
            >
              <div class="rounded-2xl border border-ui-border dark:border-gray-600 bg-ui-surface dark:bg-gray-800 shadow-soft overflow-hidden flex flex-col h-full">
                <div class="aspect-video bg-gray-100 dark:bg-gray-700 relative shrink-0">
                  <PropertyCardImage
                    :src="getPrimaryImageUrl(p)"
                    :alt="displayName(p)"
                    class="absolute inset-0 w-full h-full object-cover"
                  />
                  <span class="absolute bottom-0 left-0 right-0 bg-brand-dark/80 px-1.5 py-0.5 text-xs text-white truncate">
                    🏠 {{ unitCount(p) }} {{ t('landlord.kpi.households') }}<span v-if="hasVehicleAccess(p)"> · 🚗</span>
                  </span>
                </div>
                <div class="p-1.5">
                  <div class="h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-1">
                    <div class="h-full rounded-full bg-primary-emerald" :style="{ width: String(occupancyPercent(p)) + '%' }" />
                  </div>
                  <p class="text-xs font-medium truncate text-gray-900 dark:text-gray-100" :title="displayName(p)">{{ displayName(p) }}</p>
                  <div class="flex gap-1 mt-1 flex-wrap">
                    <button type="button" class="text-xs text-primary-emerald hover:underline" @click="openEditProperty(p)">{{ t('landlord.editProperty') }}</button>
                    <button type="button" class="text-xs text-ui-muted hover:underline" @click="openQuickEdit(p)">{{ t('landlord.assets.quickEdit') }}</button>
                    <button type="button" class="text-xs text-ui-muted hover:underline" @click="openDrawer(p)">{{ t('landlord.manageUnits') }}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </template>

        <div v-else class="py-8 text-center text-sm text-ui-muted">
          {{ t('landlord.assets.noResults') }}
        </div>
      </section>
    </div>

    <AddPropertyModal :show="showAddPropertyModal" @close="onPropertyModalClosed" />
    <AddUnitModal
      :show="showAddUnitModal"
      :property-id="createdPropertyId"
      :property-name="createdPropertyName"
      @close="onUnitModalClosed"
    />
    <QuickEditPropertyModal
      :show="!!quickEditProperty"
      :property="quickEditProperty"
      @close="onQuickEditClosed"
      @saved="onQuickEditSaved"
    />
    <EditPropertyModal
      :show="!!editPropertyId"
      :property-id="editPropertyId"
      @close="editPropertyId = null"
      @saved="onEditPropertySaved"
    />
    <EditUnitModal
      :show="!!editUnitContext"
      :property-id="editUnitContext?.propertyId ?? null"
      :unit="editUnitContext?.unit ?? null"
      @close="editUnitContext = null"
      @saved="onEditUnitSaved"
    />
    <PropertyDetailsDrawer
      :show="!!drawerPropertyId"
      :property="detailForDrawer"
      :primary-image-url="drawerPropertyId ? getPrimaryImageUrl(filteredProperties.find((x) => x.id === drawerPropertyId)!) : undefined"
      :display-name="drawerDisplayName()"
      :city-name="drawerCityName()"
      :format-price="formatPrice"
      @close="closeDrawer"
      @edit-property="editPropertyId = drawerPropertyId; closeDrawer()"
      @add-unit="onDrawerAddUnit"
      @edit-unit="(unit) => { if (drawerPropertyId) openEditUnit(drawerPropertyId, unit) }"
      @saved-unit="drawerPropertyId && loadDetailForDrawer(drawerPropertyId)"
      @delete="openDeleteConfirm(drawerPropertyId!)"
    />
    <ConfirmModal
      :show="!!deleteConfirmPropertyId"
      :title="t('landlord.deleteConfirm.title')"
      :message="t('landlord.deleteConfirm.message')"
      :confirm-label="t('landlord.deleteConfirm.delete')"
      variant="danger"
      :loading="deletingProperty"
      @close="closeDeleteConfirm"
      @confirm="confirmDeleteProperty"
    />
  </main>
</template>
