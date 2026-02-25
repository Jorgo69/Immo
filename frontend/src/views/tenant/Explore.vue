<script setup lang="ts">
/**
 * Vue Tenant — Recherche publique (ARCHITECTURE §2, §6).
 * Style MallOS : filtres dynamiques, Split-View Carte + Liste, annonces parlantes.
 * Réutilise AppCard, badges Lucide (Users, Car), Prix Total d'Entrée.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Car,
  Users,
  Home,
  Map,
  X,
} from 'lucide-vue-next'
import { searchProperties } from '../../services/property.service'
import { getCities } from '../../services/location.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { useReferenceStore } from '../../stores/references'
import { getPrimaryImageUrlForProperty, hasVehicleAccess, totalEntryPrice } from '../../composables/useListingDisplay'
import type { PropertyListItemDto, UnitDto } from '../../services/property.service'
import PropertyMap from '../../components/PropertyMap.vue'
import PropertyCardImage from '../../components/landlord/PropertyCardImage.vue'
import { AppCard, AppButton, AppTitle, AppParagraph } from '../../components/ui'

const { t } = useI18n()
const router = useRouter()
const refStore = useReferenceStore()

const properties = ref<PropertyListItemDto[]>([])
const loading = ref(false)
const searchQuery = ref('')
const filterCityId = ref('')
const filterTypeId = ref('')
const budgetMin = ref(0)
const budgetMax = ref(500000)
const BUDGET_STEP = 5000
const cityOptions = ref<{ id: string; name: string }[]>([])
const citySearch = ref('')
const showCityDropdown = ref(false)
const showMap = ref(true)

interface ListingItem {
  property: PropertyListItemDto
  unit: UnitDto
}
const listings = computed<ListingItem[]>(() => {
  const out: ListingItem[] = []
  for (const p of properties.value) {
    const units = p.units ?? []
    for (const u of units) {
      if (u.unit_status === 'available' || u.is_available === true) {
        out.push({ property: p, unit: u })
      }
    }
  }
  return out
})

const filteredListings = computed(() => {
  let list = listings.value
  if (filterTypeId.value) {
    list = list.filter((l) => l.unit.ref_type_id === filterTypeId.value || l.unit.ref_type?.id === filterTypeId.value)
  }
  const min = budgetMin.value
  const max = budgetMax.value
  list = list.filter((l) => {
    const price = Number(l.unit.price ?? 0)
    return price >= min && price <= max
  })
  return list
})

const mapProperties = computed(() =>
  filteredListings.value.reduce((acc, l) => {
    if (!acc.find((x) => x.id === l.property.id))
      acc.push({
        id: l.property.id,
        title: displayPropertyName(l.property),
        city: l.property.city?.name ?? '',
        price_monthly: l.unit.price ?? '0',
        latitude: l.property.gps_latitude ?? l.unit.gps_latitude ?? null,
        longitude: l.property.gps_longitude ?? l.unit.gps_longitude ?? null,
      })
    return acc
  }, [] as Array<{ id: string; title: string; city: string; price_monthly: string; latitude: string | null; longitude: string | null }>)
)

function displayPropertyName(p: PropertyListItemDto): string {
  const n = p.name
  if (typeof n === 'object' && n !== null && 'fr' in n) return (n as { fr?: string }).fr ?? (n as { en?: string }).en ?? '—'
  return typeof n === 'string' ? n : '—'
}

function unitTypeLabel(unit: UnitDto): string {
  const rt = unit.ref_type
  if (rt) return rt.label_fr ?? rt.label_en ?? unit.name
  return unit.name
}

function unitCount(p: PropertyListItemDto): number {
  return p.units?.length ?? 0
}

async function loadCities() {
  try {
    const cities = await getCities()
    cityOptions.value = cities.map((c) => ({ id: c.id, name: c.name }))
  } catch {
    cityOptions.value = []
  }
}

async function doSearch() {
  loading.value = true
  try {
    const min = Math.max(0, Number(budgetMin.value) || 0)
    const max = Math.max(0, Number(budgetMax.value) || 500000)
    const result = await searchProperties({
      q: searchQuery.value.trim() || undefined,
      city: filterCityId.value ? (citySearch.value?.trim() || undefined) : undefined,
      min_price: String(min),
      max_price: String(max),
      limit: 100,
    })
    properties.value = result.data
  } catch (e) {
    toast.error(getApiErrorMessage(e))
    properties.value = []
  } finally {
    loading.value = false
  }
}

function onMapSelect(id: string) {
  router.push({ name: 'property-detail', params: { id } })
}

function goToListing(listing: ListingItem) {
  router.push({ name: 'property-detail', params: { id: listing.property.id } })
}

let cityDropdownBlurTimer: ReturnType<typeof setTimeout> | null = null
function cityDropdownBlur() {
  cityDropdownBlurTimer = setTimeout(() => { showCityDropdown.value = false }, 150)
}
function cityDropdownSelect(id: string, name: string) {
  if (cityDropdownBlurTimer) clearTimeout(cityDropdownBlurTimer)
  filterCityId.value = id
  citySearch.value = name
  showCityDropdown.value = false
}

const cityFilteredOptions = computed(() => {
  const q = citySearch.value.trim().toLowerCase()
  if (!q) return cityOptions.value.slice(0, 20)
  return cityOptions.value.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 20)
})

onMounted(() => {
  refStore.fetch().catch(() => {})
  loadCities()
  doSearch()
})

watch([searchQuery, filterCityId], () => {
  doSearch()
})
</script>

<template>
  <div class="flex min-h-[calc(100dvh-3.5rem)] flex-col lg:flex-row">
    <aside class="w-full shrink-0 border-b border-ui-border bg-ui-surface dark:border-ui-border-dark dark:bg-ui-surface-dark lg:w-72 lg:border-b-0 lg:border-r">
      <div class="sticky top-0 z-10 flex flex-col gap-4 p-4">
        <AppTitle :level="3" class="flex items-center gap-2 text-base text-gray-900 dark:text-gray-100">
          <SlidersHorizontal :size="20" class="shrink-0 text-primary-emerald" />
          {{ t('tenant.explore.filters') }}
        </AppTitle>

        <div class="space-y-1">
          <label class="text-xs font-medium text-ui-muted">{{ t('tenant.explore.searchLabel') }}</label>
          <div class="relative">
            <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 shrink-0 text-ui-muted" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('tenant.explore.searchPlaceholder')"
              class="w-full rounded-lg border border-ui-border bg-ui-surface py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-ui-muted focus:border-primary-emerald focus:outline-none dark:border-ui-border-dark dark:bg-ui-surface-dark dark:text-gray-100"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium text-ui-muted">{{ t('tenant.explore.typeLabel') }}</label>
          <select
            v-model="filterTypeId"
            class="w-full rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-sm text-gray-900 focus:border-primary-emerald focus:outline-none dark:border-ui-border-dark dark:bg-ui-surface-dark dark:text-gray-100"
          >
            <option value="">{{ t('tenant.explore.typeAll') }}</option>
            <option v-for="ut in refStore.unitTypes" :key="ut.id" :value="ut.id">
              {{ ut.label_fr ?? ut.label_en }}
            </option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-medium text-ui-muted">{{ t('tenant.explore.budgetLabel') }}</label>
          <div class="flex items-center gap-2 text-sm text-ui-muted">
            <span>{{ new Intl.NumberFormat('fr-FR').format(budgetMin) }} FCFA</span>
            <span>-</span>
            <span>{{ new Intl.NumberFormat('fr-FR').format(budgetMax) }} FCFA</span>
          </div>
          <div class="flex flex-col gap-1">
            <input
              v-model.number="budgetMin"
              type="range"
              :min="0"
              :max="500000"
              :step="BUDGET_STEP"
              class="h-2 w-full appearance-none rounded-full bg-ui-border dark:bg-ui-border-dark [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-emerald"
            />
            <input
              v-model.number="budgetMax"
              type="range"
              :min="0"
              :max="500000"
              :step="BUDGET_STEP"
              class="h-2 w-full appearance-none rounded-full bg-ui-border dark:bg-ui-border-dark [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-emerald"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium text-ui-muted">{{ t('tenant.explore.quartiersLabel') }}</label>
          <div class="relative">
            <MapPin :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 shrink-0 text-ui-muted" />
            <input
              v-model="citySearch"
              type="text"
              :placeholder="t('tenant.explore.quartiersPlaceholder')"
              class="w-full rounded-lg border border-ui-border bg-ui-surface py-2 pl-9 pr-8 text-sm text-gray-900 placeholder:text-ui-muted focus:border-primary-emerald focus:outline-none dark:border-ui-border-dark dark:bg-ui-surface-dark dark:text-gray-100"
              autocomplete="off"
              @focus="showCityDropdown = true"
              @blur="cityDropdownBlur"
            />
            <button
              v-if="filterCityId"
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ui-muted hover:text-gray-900 dark:hover:text-gray-100"
              @click="filterCityId = ''; citySearch = ''"
            >
              <X :size="16" class="shrink-0" />
            </button>
            <div
              v-show="showCityDropdown && cityFilteredOptions.length"
              class="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-lg border border-ui-border bg-ui-surface shadow-soft-lg dark:border-ui-border-dark dark:bg-ui-surface-dark"
            >
              <button
                v-for="c in cityFilteredOptions"
                :key="c.id"
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-900 hover:bg-ui-background dark:text-gray-100 dark:hover:bg-ui-border-dark"
                @mousedown.prevent="cityDropdownSelect(c.id, c.name)"
              >
                <MapPin :size="14" class="shrink-0 text-ui-muted" />
                {{ c.name }}
              </button>
            </div>
          </div>
        </div>

        <AppButton variant="primary" size="sm" class="w-full gap-2" :loading="loading" @click="doSearch">
          <Search :size="18" class="shrink-0 text-white" />
          {{ t('tenant.explore.search') }}
        </AppButton>
      </div>
    </aside>

    <div class="flex flex-1 flex-col lg:grid lg:grid-cols-12">
      <section
        v-if="showMap"
        class="order-2 min-h-[280px] border-t border-ui-border dark:border-ui-border-dark lg:order-1 lg:col-span-5 lg:border-t-0 lg:border-r"
      >
        <div class="sticky top-0 h-full min-h-[280px] p-3 lg:p-4">
          <AppTitle :level="4" class="mb-2 flex items-center gap-1.5 text-sm text-ui-muted">
            <MapPin :size="18" class="shrink-0 text-primary-emerald" />
            {{ t('tenant.explore.mapTitle') }}
          </AppTitle>
          <div class="h-[260px] w-full overflow-hidden rounded-xl border border-ui-border bg-ui-background dark:border-ui-border-dark dark:bg-ui-surface-dark lg:h-[calc(100vh-12rem)]">
            <PropertyMap :properties="mapProperties" @select="onMapSelect" />
          </div>
        </div>
      </section>

      <section
        class="order-1 flex-1 overflow-auto p-3 lg:p-4"
        :class="showMap ? 'lg:col-span-7' : 'lg:col-span-12'"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <AppParagraph muted class="text-sm">
            {{ t('tenant.explore.resultsCount', { count: filteredListings.length }) }}
          </AppParagraph>
          <AppButton
            variant="ghost"
            size="sm"
            class="hidden items-center gap-1.5 text-xs text-ui-muted hover:text-gray-900 dark:hover:text-gray-100 lg:inline-flex"
            @click="showMap = !showMap"
          >
            <Map :size="16" class="shrink-0 text-ui-muted" />
            <span v-if="showMap">{{ t('tenant.explore.mapHide') }}</span>
            <span v-else>{{ t('tenant.explore.mapShow') }}</span>
          </AppButton>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-12 text-sm text-ui-muted">
          {{ t('tenant.explore.loading') }}
        </div>

        <div
          v-else-if="!filteredListings.length"
          class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ui-border bg-ui-background py-12 dark:border-ui-border-dark dark:bg-ui-surface-dark"
        >
          <Home :size="32" class="mb-3 shrink-0 text-ui-muted" />
          <AppTitle :level="4" class="text-base">{{ t('tenant.explore.noResults') }}</AppTitle>
          <AppParagraph muted class="text-center text-sm">{{ t('tenant.explore.noResultsHint') }}</AppParagraph>
        </div>

        <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AppCard
            v-for="(listing, idx) in filteredListings"
            :key="listing.property.id + '-' + listing.unit.id + '-' + idx"
            padding="none"
            class="cursor-pointer overflow-hidden transition-shadow hover:shadow-soft-lg"
            @click="goToListing(listing)"
          >
            <div class="aspect-[4/3] bg-ui-background dark:bg-ui-surface-dark relative shrink-0">
              <PropertyCardImage
                :src="getPrimaryImageUrlForProperty(listing.property)"
                :alt="displayPropertyName(listing.property)"
                class="absolute inset-0 h-full w-full object-cover"
              />
              <span class="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-lg bg-brand-dark/80 px-1.5 py-0.5 text-xs font-medium text-white">
                <Users :size="14" class="shrink-0 text-white" />
                {{ unitCount(listing.property) }} {{ t('landlord.kpi.households') }}
              </span>
              <span
                v-if="hasVehicleAccess(listing.property)"
                class="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-lg bg-brand-dark/80 px-1.5 py-0.5 text-xs font-medium text-white"
              >
                <Car :size="14" class="shrink-0 text-white" />
                {{ t('landlord.kpi.vehicleAccess') }}
              </span>
            </div>
            <div class="p-2.5">
              <p class="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
                {{ unitTypeLabel(listing.unit) }} — {{ displayPropertyName(listing.property) }}
              </p>
              <p class="mt-0.5 flex items-center gap-1 text-xs text-ui-muted">
                <MapPin :size="14" class="shrink-0 text-ui-muted" />
                {{ listing.property.city?.name ?? '—' }}
              </p>
              <p class="mt-1 text-sm font-semibold text-primary-emerald">
                {{ new Intl.NumberFormat('fr-FR').format(Number(listing.unit.price)) }} FCFA
                <span class="font-normal text-ui-muted">/ {{ t('tenant.explore.perMonth') }}</span>
              </p>
              <p class="mt-0.5 text-xs text-ui-muted">
                {{ t('tenant.explore.totalEntry') }} :
                <span class="font-medium text-gray-900 dark:text-gray-100">
                  {{ new Intl.NumberFormat('fr-FR').format(totalEntryPrice(listing.unit)) }} FCFA
                </span>
              </p>
            </div>
          </AppCard>
        </div>
      </section>
    </div>
  </div>
</template>
