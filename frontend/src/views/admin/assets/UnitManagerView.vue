<script setup lang="ts">
import { useCurrency } from '../../../composables/useCurrency'
/**
 * Vue Liste des Unités - Global Manager
 * Les admins voient tout (lecture seule sur autrui), les autres ne voient que leurs unités.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Key, MapPin, MoreVertical, Search, CheckCircle2, LayoutGrid, ChevronDown } from 'lucide-vue-next'
import { useAppStore } from '../../../stores/app'
import { 
  searchProperties, 
  getMyProperties,
  deleteUnit,
  type PropertyListItemDto,
  type UnitDto
} from '../../../services/property.service'
import { getCities } from '../../../services/location.service'
import { getApiErrorMessage } from '../../../services/http'
import { getUploadUrl } from '../../../config/api'
import { toast } from 'vue-sonner'
import { AppInput, ConfirmModal, AppSkeleton } from '../../../components/ui'
import ViewSwitcher from '../../../components/ui/ViewSwitcher.vue'
import AppPagination from '../../../components/ui/AppPagination.vue'
import UnitTable from '../../landlord/UnitTable.vue'
import PropertyCardImage from '../../../components/landlord/PropertyCardImage.vue'
import EditUnitModal from '../../landlord/EditUnitModal.vue'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

interface UnitWithProperty {
  unit: UnitDto
  propertyName: string
  propertyId: string
  ownerId: string
}

const properties = ref<PropertyListItemDto[]>([])
const loading = ref(true)
const error = ref('')

const searchQuery = ref('')
const cityNamesById = ref<Record<string, string>>({})

const editUnitContext = ref<{ propertyId: string; unit: UnitDto } | null>(null)
const deleteConfirmContext = ref<{ propertyId: string; unitId: string } | null>(null)
const deleting = ref(false)
const gridActionsOpenId = ref<string | null>(null)

// UI State : Pagination & View Mode
const viewMode = ref<'grid' | 'table' | 'compact'>('grid')
const itemsPerRow = ref<number>(4)
const page = ref(1)
const limit = ref(12)

const isAdmin = computed(() => appStore.userRole === 'admin')
const currentUserId = computed(() => appStore.currentUser?.id)

function canManageUnit(u: UnitWithProperty): boolean {
  if (!currentUserId.value) return false
  return u.ownerId === currentUserId.value
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

// Extraction des unités depuis la liste des propriétés
const unitsFlat = computed<UnitWithProperty[]>(() => {
  const list: UnitWithProperty[] = []
  for (const p of properties.value) {
    const pName = typeof p.name === 'string' ? p.name : (p.name as { fr?: string })?.fr ?? 'Bien'
    for (const u of p.units ?? []) {
      list.push({ unit: u, propertyName: pName, propertyId: p.id, ownerId: p.owner_id })
    }
  }
  return list
})

const filteredUnits = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return unitsFlat.value
  return unitsFlat.value.filter(item => 
    item.unit.name.toLowerCase().includes(q) || 
    item.propertyName.toLowerCase().includes(q)
  )
})

const paginatedUnits = computed(() => {
  const start = (page.value - 1) * limit.value
  return filteredUnits.value.slice(start, start + limit.value)
})

const totalPages = computed(() => Math.ceil(filteredUnits.value.length / limit.value))

const gridColsClass = computed(() => {
  if (itemsPerRow.value === 2) return 'col-span-12 md:col-span-6'
  if (itemsPerRow.value === 3) return 'col-span-12 md:col-span-6 lg:col-span-4'
  if (itemsPerRow.value === 6) return 'col-span-12 md:col-span-4 xl:col-span-2'
  return 'col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3' // Default 4
})

import { watch } from 'vue'
watch([searchQuery, itemsPerRow], () => {
  page.value = 1
})

const { formatPrice: formatPriceC } = useCurrency()
function formatPrice(val: any) {
  if (!val && val !== 0) return formatPriceC(0)
  const v = Number(val)
  return isNaN(v) ? formatPriceC(0) : formatPriceC(v)
}

function statusLabel(status: string): string {
  const key = status === 'coming_soon' ? 'statusComingSoon' : 'status' + status.charAt(0).toUpperCase() + status.slice(1)
  return t('landlord.' + key)
}

function getPrimaryImage(u: UnitDto): string | null {
  if (!u.images || u.images.length === 0) return null
  const images = u.images as any[]
  let url = ''
  if (typeof images[0] === 'string') url = images[0]
  else {
    const prim = images.find(img => img.is_primary)
    url = prim ? prim.url : images[0].url
  }
  return url ? getUploadUrl(url) : null
}

// Actions
function goToDetail(item: UnitWithProperty) {
  router.push(`/admin/assets/units/${item.propertyId}/${item.unit.id}`)
}

function openEditUnit(item: UnitWithProperty) {
  editUnitContext.value = { propertyId: item.propertyId, unit: item.unit }
}

function onEditUnitSaved() {
  toast.success(t('landlord.toast.unitUpdated'))
  editUnitContext.value = null
  fetchList()
}

function openDeleteConfirm(item: UnitWithProperty) {
  deleteConfirmContext.value = { propertyId: item.propertyId, unitId: item.unit.id }
}

async function confirmDeleteUnit() {
  const ctx = deleteConfirmContext.value
  if (!ctx) return
  deleting.value = true
  try {
    await deleteUnit(ctx.propertyId, ctx.unitId)
    toast.success('Unité supprimée')
    deleteConfirmContext.value = null
    fetchList()
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    deleting.value = false
  }
}

function toggleGridActions(e: Event, id: string) {
  e.stopPropagation()
  gridActionsOpenId.value = gridActionsOpenId.value === id ? null : id
}

onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target?.closest?.('.data-grid-actions')) gridActionsOpenId.value = null
  })
})
</script>

<template>
  <main class="w-full h-full flex flex-col min-h-0 relative bg-slate-50 dark:bg-slate-950 transition-colors duration-700">
    <!-- Background Animé -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-60">
      <div class="absolute -top-1/4 -right-1/4 w-3/4 h-3/4 bg-mesh-purple blur-mesh-glow rounded-full animate-blob animation-delay-4000" />
      <div class="absolute bottom-0 -left-1/4 w-1/2 h-1/2 bg-mesh-blue blur-mesh-glow rounded-full animate-blob" />
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-6 lg:px-12 py-10 space-y-10 relative z-10 custom-scrollbar">
      
      <!-- Header -->
      <header class="flex flex-wrap items-center justify-between gap-6">
        <div class="space-y-1">
          <h1 class="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            Gérer les Unités
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-bold text-lg tracking-tight">
            {{ isAdmin ? 'Vue globale de toutes les unités' : 'Vos unités disponibles' }}
          </p>
        </div>
        <div class="flex items-center gap-4 bg-white/40 dark:bg-white/5 backdrop-blur-md p-2 rounded-8xl border border-white/20 shadow-glass">
          <div class="flex items-center gap-3">
            <ViewSwitcher v-model="viewMode" storage-key="assets_unit_view" />
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
        </div>
      </header>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-4 bg-white/30 dark:bg-white/[0.02] backdrop-blur-md p-3 rounded-8xl border border-white/10 shadow-inner">
        <div class="relative flex-1 max-w-xl group">
          <AppInput 
            v-model="searchQuery" 
            placeholder="Rechercher une unité par nom ou par bien..." 
            class="rounded-3xl border-transparent bg-white/40 dark:bg-white/5 pl-12 h-14 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:scale-[1.02] transition-all" 
          />
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-emerald transition-colors" />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-12 gap-8">
        <div v-for="i in 8" :key="i" class="col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3">
          <AppSkeleton type="property-card" />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!filteredUnits.length" class="flex flex-col items-center justify-center py-32 rounded-8xl bg-white/20 dark:bg-white/[0.02] border border-dashed border-white/20 backdrop-blur-sm">
        <div class="w-32 h-32 rounded-7xl bg-primary-emerald/10 flex items-center justify-center text-primary-emerald mb-8 shadow-inner">
          <Key :size="60" />
        </div>
        <h2 class="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">Aucune unité trouvée</h2>
      </div>

      <!-- Table View -->
      <div v-if="viewMode === 'table'" class="animate-in fade-in slide-in-from-bottom-10 duration-700">
        <UnitTable
          :units="paginatedUnits"
          :primary-image-url="u => getPrimaryImage(u.unit) ?? undefined"
          :format-price="p => formatPrice(p)"
          :can-manage-unit="canManageUnit"
          @view-details="goToDetail"
          @edit-unit="openEditUnit"
          @delete-unit="openDeleteConfirm"
        />
      </div>

      <!-- Grid View -->
      <div v-else class="grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div
          v-for="item in paginatedUnits"
          :key="item.unit.id"
          :class="gridColsClass"
        >
          <div 
            class="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-5xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col h-full overflow-hidden"
            @click="goToDetail(item)"
          >
            <!-- Image Header -->
            <div class="relative h-48 bg-slate-100 dark:bg-slate-800 shrink-0">
              <PropertyCardImage :src="getPrimaryImage(item.unit) ?? undefined" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              
              <div class="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div class="space-y-1">
                  <span class="px-3 py-1 bg-white/20 backdrop-blur text-[10px] font-black uppercase text-white rounded-full border border-white/20">
                    {{ item.unit.ref_type?.label_fr || 'Unité' }}
                  </span>
                  <p class="text-lg font-black text-white truncate">{{ item.unit.name }}</p>
                </div>
              </div>

              <div v-if="isAdmin && !canManageUnit(item)" class="absolute top-4 left-4 px-2 py-1 bg-black/60 backdrop-blur text-[10px] text-white font-bold rounded-lg uppercase">
                Lecture seule
              </div>

              <!-- Menu Actions -->
              <div v-if="canManageUnit(item)" class="absolute top-4 right-4 data-grid-actions">
                <button 
                  class="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/40 backdrop-blur flex items-center justify-center text-white transition-colors"
                  @click="(e) => toggleGridActions(e, item.unit.id)"
                >
                  <MoreVertical :size="16" />
                </button>
                <div v-if="gridActionsOpenId === item.unit.id" class="absolute right-0 top-10 w-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl py-2 z-50 border border-slate-100 dark:border-slate-700" @click.stop>
                  <button class="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700" @click="openEditUnit(item); gridActionsOpenId = null">Modifier</button>
                  <button class="w-full text-left px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" @click="openDeleteConfirm(item); gridActionsOpenId = null">Supprimer</button>
                </div>
              </div>
            </div>

            <!-- Content Details -->
            <div class="p-5 flex-1 flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <div class="flex items-center gap-2 text-xs font-bold text-slate-500 mb-3 truncate">
                <MapPin :size="14" class="text-primary-emerald shrink-0" />
                <span class="truncate">{{ item.propertyName }}</span>
              </div>
              
              <div class="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-2" :class="item.unit.unit_status === 'available' ? 'text-emerald-500' : 'text-amber-500'">
                  <CheckCircle2 :size="16" />
                  <span class="text-xs font-bold uppercase tracking-widest">{{ statusLabel(item.unit.unit_status || 'available') }}</span>
                </div>
                <div class="text-right">
                  <p class="text-lg font-black text-slate-900 dark:text-white">{{ formatPrice(item.unit.price) }}</p>
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
            :total="filteredUnits.length"
            :limit="limit"
            @page-change="p => page = p"
          />
        </div>
      </div>
    </div>

    <!-- Modals -->
    <EditUnitModal :show="!!editUnitContext" :property-id="editUnitContext?.propertyId ?? null" :unit="editUnitContext?.unit ?? null" @close="editUnitContext = null" @saved="onEditUnitSaved" />
    <ConfirmModal :show="!!deleteConfirmContext" title="Supprimer l'unité" message="Êtes-vous sûr de vouloir supprimer cette unité ? Cette action est irréversible." confirm-label="Oui, supprimer" variant="danger" :loading="deleting" @close="deleteConfirmContext = null" @confirm="confirmDeleteUnit" />
  </main>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 10px; }
.animate-blob { animation: blob 7s infinite; }
</style>
