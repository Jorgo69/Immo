<script setup lang="ts">
/**
 * Vue Détail Complet d'un Bien
 * Affiche toutes les informations, médias, localisation et unités d'un bien.
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { 
  Building2, MapPin, Edit3, Trash2, ArrowLeft, Home, 
  Map, Calendar, ChevronRight, CheckCircle2, Key, FileText
} from 'lucide-vue-next'
import { useAppStore } from '../../../stores/app'
import { 
  getPropertyById, 
  deleteProperty,
  type PropertyDetailDto 
} from '../../../services/property.service'
import { getApiErrorMessage } from '../../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, ConfirmModal, AppSkeleton } from '../../../components/ui'
import AppImageGallery from '../../../components/ui/AppImageGallery.vue'
import EditPropertyModal from '../../landlord/EditPropertyModal.vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const propertyId = route.params.id as string
const property = ref<PropertyDetailDto | null>(null)
const loading = ref(true)
const error = ref('')

const editPropertyId = ref<string | null>(null)
const deleteConfirm = ref(false)
const deleting = ref(false)

const currentUserId = computed(() => appStore.currentUser?.id)

function canManageProperty(): boolean {
  if (!currentUserId.value || !property.value) return false
  return property.value.owner_id === currentUserId.value
}

async function loadProperty() {
  loading.value = true
  error.value = ''
  try {
    property.value = await getPropertyById(propertyId)
  } catch (err) {
    const msg = getApiErrorMessage(err)
    error.value = msg
    toast.error(msg)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProperty()
})

function buildingTypeLabel(type: string | undefined): string {
  if (!type) return '—'
  const camelCaseType = type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
  const key = `landlord.buildingType${camelCaseType}`
  const translation = t(key)
  return translation === key ? type : translation
}

function displayName(): string {
  const p = property.value
  if (!p) return '—'
  const n = p.name
  if (typeof n === 'object' && n !== null && 'fr' in n) return (n as { fr?: string }).fr ?? (n as { en?: string }).en ?? '—'
  return typeof n === 'string' ? n : '—'
}

function localizedDescription(): string {
  const p = property.value
  if (!p) return ''
  const desc = p.description_translations || p.description
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
  if (!property.value) return
  deleting.value = true
  try {
    await deleteProperty(property.value.id)
    toast.success(t('landlord.toast.propertyDeleted'))
    router.replace('/admin/assets/properties')
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    deleting.value = false
    deleteConfirm.value = false
  }
}

function onEditSaved() {
  toast.success(t('landlord.toast.propertyUpdateSuccess'))
  editPropertyId.value = null
  loadProperty()
}
</script>

<template>
  <main class="w-full min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-700 pb-20">
    <!-- Mesh Background -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-40 z-0">
      <div class="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 bg-mesh-emerald blur-mesh-glow rounded-full animate-blob" />
      <div class="absolute top-0 -right-1/4 w-1/2 h-1/2 bg-mesh-blue blur-mesh-glow rounded-full animate-blob animation-delay-2000" />
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
        <AppSkeleton type="rectangle" class="w-full h-[400px] rounded-6xl" />
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="md:col-span-2 space-y-4">
            <AppSkeleton type="text-title" class="w-3/4" />
            <AppSkeleton type="text-body" class="w-1/2" />
            <AppSkeleton type="rectangle" class="w-full h-64 rounded-4xl mt-8" />
          </div>
          <div class="space-y-4">
            <AppSkeleton type="rectangle" class="w-full h-48 rounded-4xl" />
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="py-20 text-center">
        <p class="text-red-500 font-bold">{{ error }}</p>
        <AppButton class="mt-4" @click="loadProperty">Ressayer</AppButton>
      </div>

      <!-- Content -->
      <div v-else-if="property" class="space-y-8">
        
        <!-- Header & Cover Image -->
        <div class="relative w-full h-[400px] lg:h-[500px] rounded-6xl overflow-hidden shadow-2xl group">
          <div class="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-1000">
            <AppImageGallery 
              mode="primary"
              :media="property.media"
              :gallery="property.gallery"
              :main-image="property.main_image"
              alt="Cover"
            />
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent pointer-events-none" />
          
          <div class="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
            <div class="flex flex-wrap items-end justify-between gap-6">
              <div class="space-y-4 max-w-3xl">
                <div class="flex gap-3">
                  <span class="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-black text-white uppercase tracking-widest border border-white/20">
                    {{ statusLabel(property.status) }}
                  </span>
                  <span class="px-4 py-1.5 rounded-full bg-primary-emerald/20 backdrop-blur-md text-xs font-black text-emerald-300 uppercase tracking-widest border border-emerald-500/30">
                    {{ buildingTypeLabel(property.building_type) }}
                  </span>
                </div>
                <h1 class="text-4xl lg:text-6xl font-black text-white tracking-tighter leading-tight">
                  {{ displayName() }}
                </h1>
                <div class="flex items-center gap-2 text-slate-300 font-bold text-lg">
                  <MapPin :size="20" class="text-primary-emerald" />
                  {{ property.city?.name }}, {{ property.address }}
                </div>
              </div>

              <!-- Owner Actions -->
              <div v-if="canManageProperty()" class="flex gap-4">
                <AppButton variant="secondary" class="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border-white/20" @click="editPropertyId = property.id">
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
            <!-- Description -->
            <section class="p-8 rounded-5xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800">
              <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter flex items-center gap-3">
                <FileText :size="24" class="text-primary-emerald" />
                {{ t('landlord.description') }}
              </h2>
              <div class="prose prose-slate dark:prose-invert max-w-none font-medium leading-relaxed" v-html="localizedDescription() || `<span class='text-slate-400 italic'>${t('common.noDescription')}</span>`"></div>
            </section>

            <!-- Unités Rattachées -->
            <section class="p-8 rounded-5xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800">
              <div class="flex items-center justify-between mb-8">
                <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                  <Home :size="24" class="text-primary-emerald" />
                  Unités du bien
                </h2>
                <span class="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300">
                  {{ property.units?.length || 0 }} Unités
                </span>
              </div>

              <div v-if="property.units?.length" class="space-y-4">
                <div v-for="unit in property.units" :key="unit.id" class="flex items-center justify-between p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group cursor-pointer" @click="router.push(`/admin/assets/units/${unit.id}`)">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center text-primary-emerald shadow-sm">
                      <Key :size="20" />
                    </div>
                    <div>
                      <h4 class="font-bold text-slate-900 dark:text-white group-hover:text-primary-emerald transition-colors">{{ unit.name }}</h4>
                      <div class="flex items-center gap-3 mt-1 text-xs font-bold text-slate-500">
                        <span class="flex items-center gap-1"><Home :size="12"/> {{ unit.ref_type?.label_fr || 'Unité' }}</span>
                        <span class="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span class="flex items-center gap-1" :class="unit.unit_status === 'available' ? 'text-emerald-500' : 'text-amber-500'">
                          <CheckCircle2 :size="12" /> {{ statusLabel(unit.unit_status || 'available') }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="text-right flex items-center gap-4">
                    <div>
                      <p class="text-sm font-black text-slate-900 dark:text-white">{{ formatPrice(unit.price) }}</p>
                      <p class="text-[10px] uppercase tracking-widest text-slate-400">Mensuel</p>
                    </div>
                    <ChevronRight :size="20" class="text-slate-300 group-hover:text-primary-emerald transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-10 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
                <p class="text-slate-500 font-bold uppercase tracking-widest text-sm">Aucune unité pour le moment</p>
              </div>
            </section>
          </div>

          <!-- Sidebar (Right) -->
          <div class="space-y-8">
            <!-- Résumé Card -->
            <div class="p-8 rounded-5xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 space-y-6">
              <h3 class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Building2 :size="20" class="text-primary-emerald" />
                Détails
              </h3>
              
              <div class="space-y-5">
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Calendar :size="18" class="text-slate-500" />
                  </div>
                  <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date d'ajout</p>
                    <p class="font-bold text-slate-900 dark:text-white">{{ property.created_at ? new Date(property.created_at).toLocaleDateString(locale) : '—' }}</p>
                  </div>
                </div>
                
                <div v-if="property.available_from" class="flex items-start gap-4">
                  <div class="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                    <Calendar :size="18" class="text-emerald-500" />
                  </div>
                  <div>
                    <p class="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">Disponible à partir du</p>
                    <p class="font-bold text-emerald-600 dark:text-emerald-400">{{ new Date(property.available_from).toLocaleDateString(locale) }}</p>
                  </div>
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
                :media="property.media"
                :gallery="property.gallery"
                :main-image="property.main_image"
                :limit="4"
                alt="Gallery"
              />
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Modals -->
    <EditPropertyModal :show="!!editPropertyId" :property-id="editPropertyId" @close="editPropertyId = null" @saved="onEditSaved" />
    <ConfirmModal :show="deleteConfirm" :title="t('landlord.deleteConfirm.title')" :message="t('landlord.deleteConfirm.message')" variant="danger" :loading="deleting" @close="deleteConfirm = false" @confirm="confirmDelete" />
  </main>
</template>

<style scoped>
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob { animation: blob 7s infinite; }
.animation-delay-2000 { animation-delay: 2s; }
</style>
