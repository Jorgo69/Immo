<script setup lang="ts">
/**
 * Vue Détail Complet d'une Unité
 * Affiche toutes les informations (prix, caractéristiques, médias, description)
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { 
  Edit3, Trash2, ArrowLeft,
  Map, CheckCircle2, Home, Droplets, Zap, FileText, Building2
} from 'lucide-vue-next'
import { useAppStore } from '../../../stores/app'
import { 
  getPropertyById, 
  deleteUnit,
  type PropertyDetailDto,
  type UnitDto
} from '../../../services/property.service'
import { getApiErrorMessage } from '../../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, ConfirmModal, AppSkeleton } from '../../../components/ui'
import AppImageGallery from '../../../components/ui/AppImageGallery.vue'
import EditUnitModal from '../../landlord/EditUnitModal.vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const propertyId = route.params.propertyId as string
const unitId = route.params.unitId as string

const property = ref<PropertyDetailDto | null>(null)
const unit = ref<UnitDto | null>(null)
const loading = ref(true)
const error = ref('')

const editUnitContext = ref<{ propertyId: string; unit: UnitDto } | null>(null)
const deleteConfirm = ref(false)
const deleting = ref(false)

const currentUserId = computed(() => appStore.currentUser?.id)

function canManageUnit(): boolean {
  if (!currentUserId.value || !property.value) return false
  return property.value.owner_id === currentUserId.value
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const p = await getPropertyById(propertyId)
    property.value = p
    const u = p.units?.find(x => x.id === unitId)
    if (!u) throw new Error("Unité introuvable dans ce bien")
    unit.value = u
  } catch (err) {
    const msg = getApiErrorMessage(err)
    error.value = msg
    toast.error(msg)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const unitMedia = computed(() => {
  const u = unit.value
  if (!u || !u.images || u.images.length === 0) return []
  const imgs = u.images as any[]
  if (typeof imgs[0] === 'string') {
    return imgs.map(url => ({ url, is_primary: false }))
  }
  return imgs
})

function localizedDescription(): string {
  const u = unit.value
  if (!u) return ''
  const desc = u.description_translations || u.description
  if (typeof desc === 'object' && desc !== null) {
    return (desc as any)[locale.value] || (desc as any).fr || (desc as any).en || ''
  }
  return typeof desc === 'string' ? desc : ''
}

function statusLabel(status: string): string {
  const key = status === 'coming_soon' ? 'statusComingSoon' : 'status' + status.charAt(0).toUpperCase() + status.slice(1)
  return t('landlord.' + key)
}

function formatPrice(price: string | number | undefined) {
  if (price == null) return '—'
  return new Intl.NumberFormat('fr-FR').format(Number(price)) + ' FCFA'
}

async function confirmDelete() {
  if (!property.value || !unit.value) return
  deleting.value = true
  try {
    await deleteUnit(property.value.id, unit.value.id)
    toast.success(t('landlord.toast.unitDeleted'))
    router.replace('/admin/assets/units')
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    deleting.value = false
    deleteConfirm.value = false
  }
}

function onEditSaved() {
  toast.success(t('landlord.toast.unitUpdated'))
  editUnitContext.value = null
  loadData()
}
</script>

<template>
  <main class="w-full min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-700 pb-20">
    <!-- Background -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-40 z-0">
      <div class="absolute -top-1/4 -right-1/4 w-3/4 h-3/4 bg-mesh-purple blur-mesh-glow rounded-full animate-blob" />
    </div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <!-- Top Navigation -->
      <button 
        class="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors group"
        @click="router.back()"
      >
        <div class="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
          <ArrowLeft :size="16" />
        </div>
        {{ t('common.back') }}
      </button>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-8">
        <AppSkeleton type="rectangle" class="w-full h-[350px] rounded-6xl" />
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="md:col-span-2 space-y-4">
            <AppSkeleton type="text-title" class="w-1/2" />
            <AppSkeleton type="rectangle" class="w-full h-48 rounded-4xl mt-8" />
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="py-20 text-center">
        <p class="text-red-500 font-bold">{{ error }}</p>
        <AppButton class="mt-4" @click="loadData">Ressayer</AppButton>
      </div>

      <!-- Content -->
      <div v-else-if="unit && property" class="space-y-8">
        
        <!-- Header & Cover Image -->
        <div class="relative w-full h-[350px] lg:h-[450px] rounded-6xl overflow-hidden shadow-2xl group">
          <div class="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-1000">
            <AppImageGallery 
              mode="primary"
              :media="unitMedia"
              alt="Cover"
            />
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent pointer-events-none" />
          
          <div class="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
            <div class="flex flex-wrap items-end justify-between gap-6">
              <div class="space-y-4 max-w-3xl">
                <div class="flex gap-3">
                  <span class="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-black text-white uppercase tracking-widest border border-white/20">
                    {{ unit.ref_type?.label_fr || 'Unité' }}
                  </span>
                  <span class="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-xs font-black uppercase tracking-widest border border-white/10" :class="unit.unit_status === 'available' ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'">
                    {{ statusLabel(unit.unit_status || 'available') }}
                  </span>
                </div>
                <h1 class="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
                  {{ unit.name }}
                </h1>
                <div class="flex items-center gap-2 text-slate-300 font-bold text-base cursor-pointer hover:text-primary-emerald transition-colors" @click="router.push(`/admin/assets/properties/${property.id}`)">
                  <Building2 :size="18" class="text-primary-emerald" />
                  Rattaché à : {{ property.name }}
                </div>
              </div>

              <!-- Owner Actions -->
              <div v-if="canManageUnit()" class="flex gap-4">
                <AppButton variant="secondary" class="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border-white/20" @click="editUnitContext = { propertyId: property.id, unit: unit! }">
                  <Edit3 :size="18" class="mr-2" /> {{ t('common.edit') }}
                </AppButton>
                <AppButton variant="danger" class="bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-md border-red-500/50" @click="deleteConfirm = true">
                  <Trash2 :size="18" />
                </AppButton>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Content (Left) -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Pricing & Terms -->
            <section class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="p-6 rounded-4xl bg-white dark:bg-slate-900 shadow-lg border border-slate-100 dark:border-slate-800">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Loyer Mensuel</p>
                <p class="text-2xl font-black text-slate-900 dark:text-white">{{ formatPrice(unit.price) }}</p>
              </div>
              <div class="p-6 rounded-4xl bg-white dark:bg-slate-900 shadow-lg border border-slate-100 dark:border-slate-800">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Caution</p>
                <p class="text-xl font-bold text-slate-900 dark:text-white">{{ unit.caution_months || 0 }} mois</p>
              </div>
              <div class="p-6 rounded-4xl bg-white dark:bg-slate-900 shadow-lg border border-slate-100 dark:border-slate-800">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Avance</p>
                <p class="text-xl font-bold text-slate-900 dark:text-white">{{ unit.avance_months || 0 }} mois</p>
              </div>
              <div class="p-6 rounded-4xl bg-white dark:bg-slate-900 shadow-lg border border-slate-100 dark:border-slate-800">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Frais de dossier</p>
                <p class="text-xl font-bold text-slate-900 dark:text-white">{{ formatPrice(unit.frais_dossier || 0) }}</p>
              </div>
            </section>

            <!-- Description -->
            <section class="p-8 rounded-5xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800">
              <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter flex items-center gap-3">
                <FileText :size="24" class="text-primary-emerald" />
                {{ t('landlord.description') }}
              </h2>
              <div class="prose prose-slate dark:prose-invert max-w-none font-medium leading-relaxed" v-html="localizedDescription() || `<span class='text-slate-400 italic'>${t('common.noDescription')}</span>`"></div>
            </section>
          </div>

          <!-- Sidebar (Right) -->
          <div class="space-y-8">
            <!-- Features Overview -->
            <div class="p-8 rounded-5xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 space-y-6">
              <h3 class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Home :size="20" class="text-primary-emerald" />
                Détails de l'unité
              </h3>
              
              <div class="space-y-4">
                <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div class="flex items-center gap-3">
                    <Droplets :size="18" class="text-blue-500" />
                    <span class="font-bold text-sm text-slate-700 dark:text-slate-300">Eau incluse</span>
                  </div>
                  <CheckCircle2 v-if="unit.water_included" :size="18" class="text-emerald-500" />
                  <span v-else class="text-xs font-bold text-slate-400">Non</span>
                </div>

                <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div class="flex items-center gap-3">
                    <Zap :size="18" class="text-amber-500" />
                    <span class="font-bold text-sm text-slate-700 dark:text-slate-300">Électricité (Prépayé)</span>
                  </div>
                  <CheckCircle2 v-if="unit.prepaid_electricity" :size="18" class="text-emerald-500" />
                  <span v-else class="text-xs font-bold text-slate-400">Non</span>
                </div>

                <div v-if="unit.surface_m2" class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div class="flex items-center gap-3">
                    <Map :size="18" class="text-slate-500" />
                    <span class="font-bold text-sm text-slate-700 dark:text-slate-300">Surface</span>
                  </div>
                  <span class="text-sm font-black text-slate-900 dark:text-white">{{ unit.surface_m2 }} m²</span>
                </div>
              </div>
            </div>

            <!-- Gallery Mini -->
            <div class="p-8 rounded-5xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800">
              <h3 class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <Map :size="20" class="text-primary-emerald" />
                Galerie
              </h3>
              <AppImageGallery
                mode="gallery"
                :media="unitMedia"
                :limit="4"
                alt="Gallery"
              />
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Modals -->
    <EditUnitModal :show="!!editUnitContext" :property-id="editUnitContext?.propertyId ?? null" :unit="editUnitContext?.unit ?? null" @close="editUnitContext = null" @saved="onEditSaved" />
    <ConfirmModal :show="deleteConfirm" title="Supprimer l'unité" message="Voulez-vous vraiment supprimer cette unité ?" variant="danger" :loading="deleting" @close="deleteConfirm = false" @confirm="confirmDelete" />
  </main>
</template>

<style scoped>
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  50% { transform: translate(30px, -50px) scale(1.1); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob { animation: blob 7s infinite; }
</style>
