<script setup lang="ts">
/**
 * Vue Liste des Biens - Global Manager
 * Les admins voient tout (lecture seule sur les biens d'autrui), les autres ne voient que leurs biens.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, MapPin, MoreVertical, Building2, Users, Car, Check, Settings2, ChevronDown, LayoutGrid } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/app'
import { searchProperties, getMyProperties, deleteProperty, type PropertyListItemDto, type UnitDto } from '../../../services/property.service'
import { getCities } from '../../../services/location.service'
import { getApiErrorMessage } from '../../../services/http'
import { getUploadUrl } from '../../../config/api'
import { toast } from 'vue-sonner'
import { AppButton, AppInput, ConfirmModal, AppSkeleton } from '../../../components/ui'
import ViewSwitcher from '../../../components/ui/ViewSwitcher.vue'
import AppPagination from '../../../components/ui/AppPagination.vue'
import PropertyTable from '../../landlord/PropertyTable.vue'
import PropertyCardImage from '../../../components/landlord/PropertyCardImage.vue'
import AddPropertyModal from '../../landlord/AddPropertyModal.vue'
import EditPropertyModal from '../../landlord/EditPropertyModal.vue'
import QuickEditPropertyModal from '../../landlord/QuickEditPropertyModal.vue'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const properties = ref<PropertyListItemDto[]>([])
const loading = ref(true)
const error = ref('')

const searchQuery = ref('')
const filterCityId = ref('')
const filterVacanciesOnly = ref(false)
const cityNamesById = ref<Record<string, string>>({})

const showAddPropertyModal = ref(false)
const quickEditProperty = ref<PropertyListItemDto | null>(null)
const editPropertyId = ref<string | null>(null)
const gridActionsOpenId = ref<string | null>(null)
const deleteConfirmPropertyId = ref<string | null>(null)
const deletingProperty = ref(false)

// UI State : Pagination & View Mode
const viewMode = ref<'grid' | 'table' | 'compact'>('grid')
const itemsPerRow = ref<number>(4)
const page = ref(1)
const limit = ref(12)

const isAdmin = computed(() => appStore.userRole === 'admin')
const currentUserId = computed(() => appStore.currentUser?.id)

function canManageProperty(p: PropertyListItemDto): boolean {
  if (!currentUserId.value) return false
  return p.owner_id === currentUserId.value
}

const fetchList = async () => {
  loading.value = true
  error.value = ''
  try {
    const filters = { limit: 100 }
    let res
    if (isAdmin.value) {
      res = await searchProperties(filters)
    } else {
      res = await getMyProperties(filters)
    }
    properties.value = res.data
  } catch (err: any) {
    const msg = getApiErrorMessage(err)
    error.value = msg
    toast.error(msg)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  fetchList()
  try {
    const cities = await getCities()
    const map: Record<string, string> = {}
    for (const c of cities) map[c.id] = c.name ?? c.id
    cityNamesById.value = map
  } catch {}
})

// === Helpers d'affichage ===
function getPrimaryImageUrl(p: PropertyListItemDto): string {
  let url = ''
  if (p.main_image) url = p.main_image
  else if (p.gallery && p.gallery.length > 0) url = p.gallery[0]
  else if (p.media && p.media.length > 0) {
    const prim = p.media.find(m => m.is_primary)
    url = prim ? prim.url : p.media[0].url
  }
  return url ? getUploadUrl(url) : ''
}

function displayName(p: PropertyListItemDto): string {
  const n = p.name
  if (typeof n === 'object' && n !== null && 'fr' in n) return (n as { fr?: string }).fr ?? (n as { en?: string }).en ?? '—'
  return typeof n === 'string' ? n : '—'
}

function cityDisplay(p: PropertyListItemDto): string {
  return p.city?.name ?? cityNamesById.value[p.city_id ?? ''] ?? '—'
}

function statusLabel(status: string): string {
  const key = status === 'coming_soon' ? 'statusComingSoon' : 'status' + status.charAt(0).toUpperCase() + status.slice(1)
  return t('landlord.' + key)
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
  if (typeof n === 'object' && n !== null) return [(n as any).fr, (n as any).en].filter(Boolean).join(' ')
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
  if (cityFilter && cityFilter !== '') list = list.filter((p) => p.city_id === cityFilter)
  if (filterVacanciesOnly.value) {
    list = list.filter((p) => (p.units ?? []).some((u: UnitDto) => u.unit_status === 'available' || u.is_available === true))
  }
  return list
})

const paginatedProperties = computed(() => {
  const start = (page.value - 1) * limit.value
  return filteredProperties.value.slice(start, start + limit.value)
})

const totalPages = computed(() => Math.ceil(filteredProperties.value.length / limit.value))

const gridColsClass = computed(() => {
  if (itemsPerRow.value === 2) return 'col-span-12 md:col-span-6'
  if (itemsPerRow.value === 3) return 'col-span-12 md:col-span-6 lg:col-span-4'
  if (itemsPerRow.value === 6) return 'col-span-12 md:col-span-4 xl:col-span-2'
  return 'col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3' // Default 4
})

import { watch } from 'vue'
watch([searchQuery, filterCityId, filterVacanciesOnly, itemsPerRow], () => {
  page.value = 1
})


// === Navigation & Modals ===
function goToDetail(p: PropertyListItemDto) {
  router.push(`/admin/assets/properties/${p.id}`)
}

function openAddProperty() { showAddPropertyModal.value = true }
function onPropertyModalClosed(res?: { created: boolean; propertyId?: string }) {
  showAddPropertyModal.value = false
  if (res?.created) fetchList()
}

function openQuickEdit(p: PropertyListItemDto) { quickEditProperty.value = p }
function openEditProperty(p: PropertyListItemDto) { editPropertyId.value = p.id }
function onQuickEditSaved() { toast.success(t('landlord.toast.propertyUpdateSuccess')); fetchList() }
function onEditPropertySaved() { toast.success(t('landlord.toast.propertyUpdateSuccess')); editPropertyId.value = null; fetchList() }

function openDeleteConfirm(p: PropertyListItemDto) { deleteConfirmPropertyId.value = p.id }
async function confirmDeleteProperty() {
  const id = deleteConfirmPropertyId.value
  if (!id) return
  deletingProperty.value = true
  try {
    await deleteProperty(id)
    toast.success(t('landlord.toast.propertyDeleted'))
    deleteConfirmPropertyId.value = null
    fetchList()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    deletingProperty.value = false
  }
}

function toggleGridActions(e: Event, id: string) {
  e.stopPropagation()
  gridActionsOpenId.value = gridActionsOpenId.value === id ? null : id
}

// Clic extérieur pour fermer le menu
onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target?.closest?.('.data-grid-actions')) gridActionsOpenId.value = null
  })
})
</script>

<template>
  <main class="w-full h-full flex flex-col min-h-0 relative bg-slate-50 dark:bg-slate-950 transition-colors duration-700">
    <!-- Mesh Gradient Background Animé -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-60">
      <div class="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 bg-mesh-emerald blur-mesh-glow rounded-full animate-blob" />
      <div class="absolute top-0 -right-1/4 w-1/2 h-1/2 bg-mesh-blue blur-mesh-glow rounded-full animate-blob animation-delay-2000" />
      <div class="absolute -bottom-1/4 left-1/4 w-3/4 h-1/2 bg-mesh-purple blur-mesh-glow rounded-full animate-blob animation-delay-4000" />
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-6 lg:px-12 py-10 space-y-10 relative z-10 custom-scrollbar">
      
      <!-- Header -->
      <header class="flex flex-wrap items-center justify-between gap-6">
        <div class="space-y-1">
          <h1 class="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            {{ t('admin.navPropertiesList') }}
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-bold text-lg tracking-tight">
            {{ isAdmin ? t('admin.navPropertiesList') : t('landlord.myPropertiesSubtitle') }}
          </p>
        </div>
        <div class="flex items-center gap-4 bg-white/40 dark:bg-white/5 backdrop-blur-md p-2 rounded-8xl border border-white/20 shadow-glass">
          <div class="flex items-center gap-3 border-r border-slate-200 dark:border-white/10 pr-4">
            <ViewSwitcher v-model="viewMode" storage-key="assets_prop_view" />
            <div v-show="viewMode === 'grid'" class="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 text-sm font-bold text-slate-700 dark:text-slate-300 shadow-inner">
              <LayoutGrid :size="16" class="text-slate-400" />
              <select v-model="itemsPerRow" class="bg-transparent border-none outline-none cursor-pointer appearance-none text-center pr-2">
                <option :value="2">2 / ligne</option>
                <option :value="3">3 / ligne</option>
                <option :value="4">4 / ligne</option>
                <option :value="6">6 / ligne</option>
              </select>
              <ChevronDown :size="14" class="text-slate-400" />
            </div>
          </div>
          <AppButton variant="primary" size="lg" class="font-black rounded-6xl px-8 shadow-primary" @click="openAddProperty">
            <Plus :size="24" class="mr-2" />
            {{ t('landlord.addProperty') }}
          </AppButton>
        </div>
      </header>

      <!-- Filters -->
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

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-12 gap-8">
        <div v-for="i in 6" :key="i" class="col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3">
          <AppSkeleton type="property-card" />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!filteredProperties.length" class="flex flex-col items-center justify-center py-32 rounded-8xl bg-white/20 dark:bg-white/[0.02] border border-dashed border-white/20 backdrop-blur-sm">
        <div class="w-32 h-32 rounded-7xl bg-primary-emerald/10 flex items-center justify-center text-primary-emerald mb-8 shadow-inner">
          <Building2 :size="60" />
        </div>
        <h2 class="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">{{ t('landlord.emptyTitle') }}</h2>
        <p class="text-slate-500 dark:text-slate-400 font-bold mb-10 text-center max-w-sm">{{ t('landlord.emptyBody') }}</p>
      </div>

      <!-- Table View -->
      <div v-if="viewMode === 'table'" class="animate-in fade-in slide-in-from-bottom-10 duration-700">
        <PropertyTable
          :properties="paginatedProperties"
          :primary-image-url="getPrimaryImageUrl"
          :display-name="displayName"
          :city-display="cityDisplay"
          :status-label="statusLabel"
          :format-price="() => ''"
          :selected-id="null"
          @view-details="goToDetail"
          @quick-edit="openQuickEdit"
          @edit-property="openEditProperty"
        />
      </div>

      <!-- Grid View -->
      <div v-else class="grid grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-700">
        <div
          v-for="p in paginatedProperties"
          :key="p.id"
          :class="gridColsClass"
        >
          <div 
            class="group relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-ultra-glass rounded-6xl border border-white/20 dark:border-white/10 shadow-glass transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer overflow-hidden p-3 h-full flex flex-col"
            @click="goToDetail(p)"
          >
            <!-- Badge Lecture Seule pour les admins -->
            <div v-if="isAdmin && !canManageProperty(p)" class="absolute z-20 top-6 right-6 px-3 py-1 rounded-2xl bg-black/60 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
              Lecture seule
            </div>

            <div class="aspect-video relative rounded-5xl overflow-hidden shadow-inner shrink-0">
              <PropertyCardImage :src="getPrimaryImageUrl(p)" :alt="displayName(p)" class="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div class="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
                <span class="px-3 py-1 rounded-2xl backdrop-blur-xl bg-black/30 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white">
                  {{ statusLabel(p.status) }}
                </span>
              </div>

              <div class="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                <span class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/40 backdrop-blur-xl text-[10px] font-black text-white uppercase tracking-widest">
                  <Users :size="14" /> {{ unitCount(p) }} {{ t('landlord.units') }}
                </span>
                <span v-if="hasVehicleAccess(p)" class="flex items-center justify-center w-8 h-8 rounded-2xl bg-black/40 backdrop-blur-xl text-white">
                  <Car :size="14" />
                </span>
              </div>
            </div>

            <div class="p-4 flex-1 flex flex-col">
              <div class="flex items-start justify-between gap-2">
                <div class="space-y-1 min-w-0">
                  <h3 class="text-lg font-black text-slate-900 dark:text-white truncate tracking-tighter" :title="displayName(p)">{{ displayName(p) }}</h3>
                  <div class="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                    <MapPin :size="14" class="text-primary-emerald shrink-0" />
                    <span class="truncate">{{ cityDisplay(p) }}</span>
                  </div>
                </div>

                <!-- Actions Menu (uniquement si droit de gestion) -->
                <div v-if="canManageProperty(p)" class="data-grid-actions relative shrink-0">
                  <button 
                    class="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-primary-emerald hover:text-white transition-colors"
                    @click="(e) => toggleGridActions(e, p.id)"
                  >
                    <MoreVertical :size="20" />
                  </button>
                  <Transition
                    enter-active-class="transition duration-100 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-75 ease-in"
                    leave-from-class="transform scale-100 opacity-100"
                    leave-to-class="transform scale-95 opacity-0"
                  >
                    <div 
                      v-if="gridActionsOpenId === p.id"
                      class="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50"
                      @click.stop
                    >
                      <button class="w-full text-left px-5 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" @click="openQuickEdit(p); gridActionsOpenId = null">
                        {{ t('landlord.quickEdit') }}
                      </button>
                      <button class="w-full text-left px-5 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" @click="openEditProperty(p); gridActionsOpenId = null">
                        {{ t('common.edit') }}
                      </button>
                      <div class="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                      <button class="w-full text-left px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" @click="openDeleteConfirm(p); gridActionsOpenId = null">
                        {{ t('common.delete') }}
                      </button>
                    </div>
                  </Transition>
                </div>
              </div>

              <!-- Occupancy Progress -->
              <div class="mt-auto pt-4 space-y-2">
                <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>{{ t('landlord.kpi.occupancy') }}</span>
                  <span class="text-slate-900 dark:text-white">{{ occupancyPercent(p) }}%</span>
                </div>
                <div class="h-2.5 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden shadow-inner">
                  <div class="h-full bg-gradient-to-r from-primary-emerald to-emerald-400 transition-all duration-1000 ease-out" :style="{ width: occupancyPercent(p) + '%' }" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="mt-8 flex justify-center w-full pb-8">
        <div class="bg-white/40 dark:bg-white/5 backdrop-blur-md px-6 py-2 rounded-3xl border border-white/20 shadow-glass">
          <AppPagination
            :page="page"
            :total-pages="totalPages"
            :total="filteredProperties.length"
            :limit="limit"
            @page-change="p => page = p"
          />
        </div>
      </div>
    </div>

    <!-- Modals (Uniquement ajout/édition) -->
    <AddPropertyModal :show="showAddPropertyModal" @close="onPropertyModalClosed" />
    <QuickEditPropertyModal :show="!!quickEditProperty" :property="quickEditProperty" @close="quickEditProperty = null" @saved="onQuickEditSaved" />
    <EditPropertyModal :show="!!editPropertyId" :property-id="editPropertyId" @close="editPropertyId = null" @saved="onEditPropertySaved" />
    <ConfirmModal :show="!!deleteConfirmPropertyId" :title="t('landlord.deleteConfirm.title')" :message="t('landlord.deleteConfirm.message')" :confirm-label="t('landlord.deleteConfirm.delete')" variant="danger" :loading="deletingProperty" @close="deleteConfirmPropertyId = null" @confirm="confirmDeleteProperty" />
  </main>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); }

@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob { animation: blob 7s infinite; }
.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }
</style>
