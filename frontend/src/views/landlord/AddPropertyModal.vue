<script setup lang="ts">
/**
 * Modal d'ajout de bien (Property) — Stepper, validation stricte.
 * DESIGN: Ultra-Premium Apple Glass / MallOS.
 */
import { ref, watch, computed, onMounted, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, ChevronRight, ChevronLeft, Building2, Map, Camera, Save } from 'lucide-vue-next'
import { getCountries, getCities, getNeighborhoods, type CountryDto, type CityDto, type NeighborhoodDto } from '../../services/location.service'
import { useReferenceStore } from '../../stores/references'
import { createProperty, uploadPropertyImage, type CreatePropertyPayload, type PropertyImageItemDto } from '../../services/property.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, AppInput, AppTitle, AppSelect, AppUpload } from '../../components/ui'
import ImageWithMeta from '../../components/landlord/ImageWithMeta.vue'
import MapLocationPickerLoading from '../../components/MapLocationPickerLoading.vue'

/** Carte (Leaflet) chargée à la demande uniquement à l’étape Localisation — garde le bundle initial léger. */
const MapLocationPicker = defineAsyncComponent({
  loader: () => import('../../components/MapLocationPicker.vue'),
  loadingComponent: MapLocationPickerLoading,
  delay: 200,
  timeout: 10000,
})

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'close', result?: { created: boolean; propertyId?: string; propertyName?: string }): void }>()

const { t, locale } = useI18n()
const referenceStore = useReferenceStore()
const currentStep = ref(1)
const totalSteps = 3
const submitting = ref(false)
const errorMessage = ref('')

const countries = ref<CountryDto[]>([])
const cities = ref<CityDto[]>([])
const loadingCities = ref(false)

const form = ref({
  name: 'Sans nom',
  building_type: 'villa' as string,
  address: '',
  neighborhood_id: '' as string,
  country_id: '',
  city_id: '',
  status: 'available' as string,
  title_deed: '',
  gps_latitude: '' as string | number,
  gps_longitude: '' as string | number,
  description: { fr: '', en: '' } as Record<string, string>,
})

const descriptionLangTab = ref<'fr' | 'en'>('fr')
const photoFiles = ref<File[]>([])

interface ImageItemState {
  file: File
  previewUrl: string
  rank: number
  is_primary: boolean
  description: Record<string, string>
}
const imageItems = ref<ImageItemState[]>([])

const steps = [
  { id: 1, label: 'landlord.stepInfo', icon: Building2 },
  { id: 2, label: 'landlord.stepLocation', icon: Map },
  { id: 3, label: 'landlord.stepDocuments', icon: Camera },
]

const step1Valid = computed(() => {
  const f = form.value
  const nameVal = (f.name?.trim() || 'Sans nom')
  return (
    typeof f.name === 'string' &&
    nameVal.length > 0 &&
    referenceStore.propertyTypes.some((r) => r.code === f.building_type) &&
    typeof f.address === 'string' &&
    f.address.trim().length > 0 &&
    typeof f.city_id === 'string' &&
    f.city_id.length > 0
  )
})

const step2Valid = computed(() => true)
const step3Valid = computed(() => true)

const canNext = computed(() => {
  if (currentStep.value === 1) return step1Valid.value
  if (currentStep.value === 2) return step2Valid.value
  return step3Valid.value
})

const countryOptions = computed(() =>
  countries.value.map((c) => ({ value: c.id, label: c.name }))
)
const cityOptions = computed(() =>
  cities.value.map((c) => ({ value: c.id, label: c.name }))
)
const neighborhoodOptions = computed(() =>
  neighborhoods.value.map((n) => ({ value: n.id, label: n.name }))
)
const buildingTypeOptions = computed(() =>
  referenceStore.propertyTypes.map((r) => ({
    value: r.code,
    label: locale.value === 'fr' ? r.label_fr : r.label_en || r.label_fr,
  }))
)

const suggestedMapQuery = computed(() => {
  const country = countries.value.find((c) => c.id === form.value.country_id)
  const city = cities.value.find((c) => c.id === form.value.city_id)
  if (!city?.name || !country?.name) return ''
  return `${city.name}, ${country.name}`
})

async function loadCountries() {
  try { countries.value = await getCountries() } catch { countries.value = [] }
}

async function loadCities(countryId: string) {
  if (!countryId) {
    cities.value = []
    form.value.city_id = ''
    return
  }
  loadingCities.value = true
  try {
    cities.value = await getCities(countryId)
    form.value.city_id = ''
  } finally {
    loadingCities.value = false
  }
}

watch(() => form.value.country_id, (id) => {
  if (id) loadCities(id)
  else cities.value = []
})

const neighborhoods = ref<NeighborhoodDto[]>([])
const loadingNeighborhoods = ref(false)

async function loadNeighborhoods(cityId: string) {
  if (!cityId) {
    neighborhoods.value = []
    form.value.neighborhood_id = ''
    return
  }
  loadingNeighborhoods.value = true
  try {
    neighborhoods.value = await getNeighborhoods(cityId)
    form.value.neighborhood_id = ''
  } finally {
    loadingNeighborhoods.value = false
  }
}

watch(() => form.value.city_id, (id) => {
  if (id) loadNeighborhoods(id)
  else neighborhoods.value = []
})

watch(photoFiles, (files) => {
  imageItems.value.forEach((it) => URL.revokeObjectURL(it.previewUrl))
  if (!files.length) {
    imageItems.value = []
    return
  }
  imageItems.value = files.map((file, i) => ({
    file,
    previewUrl: URL.createObjectURL(file),
    rank: i + 1,
    is_primary: i === 0,
    description: { fr: '', en: '' },
  }))
}, { deep: true })

function updateImageItem(index: number, payload: Partial<ImageItemState>) {
  const item = imageItems.value[index]
  if (!item) return
  if (payload.is_primary !== undefined) imageItems.value.forEach((x, i) => { x.is_primary = i === index })
  Object.assign(item, payload)
}

function removeImageItem(index: number) {
  const item = imageItems.value[index]
  if (item) URL.revokeObjectURL(item.previewUrl)
  imageItems.value.splice(index, 1)
  photoFiles.value = imageItems.value.map((x) => x.file)
}

function next() {
  if (currentStep.value < totalSteps) currentStep.value++
  else submit()
}

function back() {
  if (currentStep.value > 1) currentStep.value--
  else close()
}

function close() {
  emit('close')
}

async function submit() {
  errorMessage.value = ''
  submitting.value = true
  try {
    const items = imageItems.value
    const images: PropertyImageItemDto[] = []
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      const { url } = await uploadPropertyImage(it.file)
      images.push({
        url,
        rank: it.rank,
        is_primary: it.is_primary,
        description: (it.description?.fr || it.description?.en) ? it.description : undefined,
      })
    }

    const desc = form.value.description
    const descriptionNorm = (desc?.fr?.trim() || desc?.en?.trim())
      ? { fr: desc?.fr?.trim() || desc?.en?.trim() || '', en: desc?.en?.trim() || desc?.fr?.trim() || '' }
      : undefined
    
    const payload: CreatePropertyPayload = {
      name: form.value.name?.trim() || 'Sans nom',
      building_type: form.value.building_type || 'villa',
      address: form.value.address.trim(),
      neighborhood_id: form.value.neighborhood_id || undefined,
      city_id: form.value.city_id,
      status: form.value.status,
      title_deed: form.value.title_deed?.trim() || undefined,
      description: descriptionNorm,
      images,
    }
    const lat = form.value.gps_latitude !== '' ? Number(form.value.gps_latitude) : undefined
    const lng = form.value.gps_longitude !== '' ? Number(form.value.gps_longitude) : undefined
    if (lat != null && !Number.isNaN(lat)) payload.gps_latitude = lat
    if (lng != null && !Number.isNaN(lng)) payload.gps_longitude = lng
    
    const created = await createProperty(payload)
    emit('close', { created: true, propertyId: created.id, propertyName: created.name })
    toast.success(t('landlord.toast.propertyCreated'))
  } catch (e) {
    const msg = getApiErrorMessage(e)
    errorMessage.value = msg
    toast.error(t('landlord.toast.apiError', { message: msg }))
  } finally {
    submitting.value = false
  }
}

watch(() => props.show, (visible) => {
  if (visible) {
    currentStep.value = 1
    form.value = {
      name: 'Sans nom',
      building_type: 'villa',
      address: '',
      neighborhood_id: '',
      country_id: '',
      city_id: '',
      status: 'available',
      title_deed: '',
      gps_latitude: '',
      gps_longitude: '',
      description: { fr: '', en: '' },
    }
    photoFiles.value = []
    imageItems.value.forEach((it) => URL.revokeObjectURL(it.previewUrl))
    imageItems.value = []
    errorMessage.value = ''
    loadCountries()
  }
})

onMounted(() => { if (props.show) loadCountries() })
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md"
        @click.self="close"
      >
        <div
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-8xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300"
          role="dialog"
          aria-modal="true"
        >
          <!-- Internal Glow Effects -->
          <div class="absolute -top-[10%] -right-[10%] w-[40%] h-[30%] bg-primary-emerald/10 blur-mesh-glow rounded-full pointer-events-none" />
          <div class="absolute bottom-[5%] -left-[10%] w-[30%] h-[20%] bg-blue-500/10 blur-mesh-glow rounded-full pointer-events-none" />

          <!-- Header -->
          <header class="flex items-center justify-between p-8 pb-4 shrink-0 relative z-10">
            <div class="space-y-1">
              <AppTitle id="add-property-title" :level="3" class="text-3xl font-black tracking-tighter">{{ t('landlord.addProperty') }}</AppTitle>
               <p class="text-[10px] font-black uppercase tracking-widest-xl text-primary-emerald opacity-70">Création d'un nouveau patrimoine</p>
            </div>
            <button
              type="button"
              class="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-all group"
              @click="close"
            >
              <X class="w-6 h-6 text-slate-400 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </header>

          <!-- Glass Stepper -->
          <div class="px-8 py-4 shrink-0 relative z-10">
            <div class="flex items-center justify-between bg-black/5 dark:bg-white/5 p-2 rounded-[2rem] border border-white/10">
              <button
                v-for="step in steps"
                :key="step.id"
                class="flex-1 flex items-center justify-center gap-2 py-3 rounded-3xl transition-all relative overflow-hidden"
                :class="currentStep === step.id ? 'bg-white dark:bg-white/10 shadow-glass text-slate-900 dark:text-white' : 'text-slate-400 opacity-60'"
                @click="currentStep >= step.id ? (step1Valid || step.id === 1 ? currentStep = step.id : null) : (step1Valid ? currentStep = step.id : null)"
              >
                <component :is="step.icon" :size="18" :class="currentStep === step.id ? 'text-primary-emerald' : ''" />
                <span class="text-[10px] font-black uppercase tracking-widest hidden md:inline">{{ t(step.label) }}</span>
                <div v-if="currentStep === step.id" class="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary-emerald rounded-full" />
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar relative z-10">
            <!-- Step 1: Info -->
            <div v-if="currentStep === 1" class="space-y-8 animate-in slide-in-from-right-10 duration-500">
               <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <AppInput v-model="form.name" :label="t('landlord.name')" :placeholder="t('landlord.namePlaceholder')" />
                 <AppSelect v-model="form.building_type" :label="t('landlord.propertyType')" :options="buildingTypeOptions" />
               </div>

               <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div class="md:col-span-2">
                    <AppInput v-model="form.address" :label="t('landlord.address')" :placeholder="t('landlord.addressPlaceholder')" />
                 </div>
                 <AppSelect v-model="form.status" :label="t('landlord.status')" :options="referenceStore.propertyStatuses.map(s => ({ value: s.code, label: locale === 'fr' ? s.label_fr : s.label_en || s.label_fr }))" />
               </div>

               <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <AppSelect v-model="form.country_id" :label="t('landlord.country')" :options="countryOptions" />
                 <AppSelect v-model="form.city_id" :label="t('landlord.city')" :options="cityOptions" :disabled="!form.country_id || loadingCities" />
               </div>

                <AppSelect
                  v-model="form.neighborhood_id"
                  label="Quartier (facultatif)"
                  :options="neighborhoodOptions"
                  :disabled="loadingNeighborhoods || !form.city_id"
                  placeholder="Sélectionner..."
                />

               <div class="space-y-4">
                  <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{{ t('landlord.description') }}</label>
                  <div class="p-2 bg-black/5 dark:bg-white/5 rounded-2xl flex gap-1 w-fit">
                    <button v-for="lang in ['fr', 'en'] as const" :key="lang" class="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all" :class="descriptionLangTab === lang ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'" @click="descriptionLangTab = lang">
                      {{ lang }}
                    </button>
                  </div>
                  <textarea v-model="form.description[descriptionLangTab]" rows="3" class="w-full p-6 rounded-4xl bg-white/40 dark:bg-white/5 border border-white/10 focus:border-primary-emerald/50 outline-none transition-all text-sm font-bold placeholder:text-slate-400" :placeholder="descriptionLangTab === 'fr' ? t('landlord.descriptionFr') : t('landlord.descriptionEn')" />
               </div>
            </div>

            <!-- Step 2: Map -->
            <div v-if="currentStep === 2" class="space-y-6 animate-in slide-in-from-right-10 duration-500">
               <div class="bg-primary-emerald/5 p-6 rounded-4xl border border-primary-emerald/10">
                 <p class="text-xs font-bold text-slate-600 dark:text-slate-300 italic">
                   {{ t('landlord.mapStep2Guide', { example: suggestedMapQuery || t('landlord.mapStep2Example') }) }}
                 </p>
               </div>
               
               <div class="rounded-5xl overflow-hidden border border-white/10 shadow-glass relative group">
                  <MapLocationPicker
                    :latitude="form.gps_latitude"
                    :longitude="form.gps_longitude"
                    :suggested-query="suggestedMapQuery"
                    :suggested-hint-text="suggestedMapQuery ? t('landlord.mapSuggestedHint') : ''"
                    height="400px"
                    @update:latitude="(v) => (form.gps_latitude = v)"
                    @update:longitude="(v) => (form.gps_longitude = v)"
                  />
                  <div class="absolute bottom-4 left-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-[10px] font-black uppercase tracking-widest text-center">
                    {{ t('landlord.mapClickHint') }}
                  </div>
               </div>
            </div>

            <!-- Step 3: Documents -->
            <div v-if="currentStep === 3" class="space-y-8 animate-in slide-in-from-right-10 duration-500">
               <AppInput v-model="form.title_deed" :label="t('landlord.titleDeed')" :placeholder="t('landlord.titleDeedPlaceholder')" />
               
               <AppUpload :label="t('landlord.stepDocuments')" :max-files="10" @update:files="photoFiles = $event" />
               
               <div v-if="imageItems.length" class="space-y-6">
                 <p class="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">{{ t('landlord.imageDescription') }}</p>
                 <div class="grid grid-cols-1 gap-4">
                   <ImageWithMeta v-for="(item, idx) in imageItems" :key="idx" :item="item" :index="idx" :can-remove="true" @update:item="(p) => updateImageItem(idx, p)" @remove="removeImageItem(idx)" />
                 </div>
               </div>
            </div>
          </div>

          <!-- Error Alert -->
          <div v-if="errorMessage" class="px-8 py-3 bg-rose-500/10 border-y border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">
            {{ errorMessage }}
          </div>

          <!-- Footer -->
          <footer class="p-8 pt-4 flex items-center justify-between shrink-0 relative z-10 bg-white/30 dark:bg-white/[0.02] backdrop-blur-xl border-t border-white/10">
            <AppButton variant="ghost" size="lg" class="h-16 rounded-4xl font-black text-slate-500" @click="back">
              <ChevronLeft v-if="currentStep > 1" class="mr-2" />
              {{ currentStep === 1 ? t('common.cancel') : t('landlord.back') }}
            </AppButton>
            
            <div class="flex gap-4 flex-1 ml-4">
              <AppButton 
                variant="primary" 
                size="lg" 
                class="h-16 flex-1 rounded-4xl font-black text-lg tracking-tighter shadow-emerald-500/20 shadow-lg"
                :loading="submitting" 
                :disabled="!canNext" 
                @click="next"
              >
                <Save v-if="currentStep === totalSteps" :size="20" class="mr-2" />
                {{ currentStep === totalSteps ? t('landlord.submitCreate') : t('landlord.next') }}
                <ChevronRight v-if="currentStep < totalSteps" class="ml-2" />
              </AppButton>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.1);
  border-radius: 10px;
}
</style>
