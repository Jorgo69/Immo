<script setup lang="ts">
/**
 * Modal d'édition complète d'un bien (ARCHITECTURE §2, §5, §7).
 * DESIGN: Ultra-Premium Apple Glass / MallOS.
 * Navigation: Flexible (toutes les étapes accessibles).
 */
import { ref, watch, computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, ChevronRight, ChevronLeft, Building2, Map, Camera, Save } from 'lucide-vue-next'
import { getCountries, getCities, type CountryDto, type CityDto } from '../../services/location.service'
import { useReferenceStore } from '../../stores/references'
import { getUploadUrl } from '../../config/api'
import {
  getPropertyById,
  updateProperty,
  uploadPropertyImage,
  type PropertyDetailDto,
  type UpdatePropertyPayload,
  type PropertyImageItemDto,
} from '../../services/property.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, AppInput, AppTitle, AppSelect, AppUpload } from '../../components/ui'
import ImageWithMeta from '../../components/landlord/ImageWithMeta.vue'
import MapLocationPickerLoading from '../../components/MapLocationPickerLoading.vue'

const MapLocationPicker = defineAsyncComponent({
  loader: () => import('../../components/MapLocationPicker.vue'),
  loadingComponent: MapLocationPickerLoading,
  delay: 200,
  timeout: 10000,
})

const props = defineProps<{
  show: boolean
  propertyId: string | null
}>()

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const { t, locale } = useI18n()
const referenceStore = useReferenceStore()
const currentStep = ref(1)
const totalSteps = 3
const submitting = ref(false)
const loadingDetail = ref(false)
const errorMessage = ref('')

const property = ref<PropertyDetailDto | null>(null)
const countries = ref<CountryDto[]>([])
const cities = ref<CityDto[]>([])
const loadingCities = ref(false)

const form = ref({
  name: '',
  building_type: 'villa' as string,
  address: '',
  country_id: '',
  city_id: '',
  status: 'available' as string,
  gps_latitude: '' as string | number,
  gps_longitude: '' as string | number,
  description: { fr: '', en: '' } as Record<string, string>,
})
const descriptionLangTab = ref<'fr' | 'en'>('fr')

interface ExistingImageItem {
  url: string
  previewUrl: string
  rank: number
  is_primary: boolean
  description: Record<string, string>
  _removed?: boolean
}
interface NewImageItem {
  file: File
  previewUrl: string
  rank: number
  is_primary: boolean
  description: Record<string, string>
}

const existingImageItems = ref<ExistingImageItem[]>([])
const photoFiles = ref<File[]>([])
const newImageItems = ref<NewImageItem[]>([])

const steps = [
  { id: 1, label: 'landlord.stepInfo', icon: Building2 },
  { id: 2, label: 'landlord.stepLocation', icon: Map },
  { id: 3, label: 'landlord.stepDocuments', icon: Camera },
]

const step1Valid = computed(() => {
  const f = form.value
  const nameVal = f.name?.trim() || ''
  return (
    nameVal.length > 0 &&
    referenceStore.propertyTypes.some((r) => r.code === f.building_type) &&
    typeof f.address === 'string' &&
    f.address.trim().length > 0 &&
    typeof f.city_id === 'string' &&
    f.city_id.length > 0
  )
})

const canNext = computed(() => {
  if (currentStep.value === 1) return step1Valid.value
  return true
})

const countryOptions = computed(() =>
  countries.value.map((c) => ({ value: c.id, label: c.name }))
)
const cityOptions = computed(() =>
  cities.value.map((c) => ({ value: c.id, label: c.name }))
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

async function loadCities(countryId: string, preserveCurrentCity = false) {
  if (!countryId) {
    cities.value = []
    form.value.city_id = ''
    return
  }
  loadingCities.value = true
  try {
    cities.value = await getCities(countryId)
    const currentCityId = preserveCurrentCity ? form.value.city_id : null
    if (currentCityId && cities.value.some((c) => c.id === currentCityId)) {
      form.value.city_id = currentCityId
    } else if (property.value?.city_id && cities.value.some((c) => c.id === property.value!.city_id)) {
      form.value.city_id = property.value.city_id
    } else {
      form.value.city_id = ''
    }
  } finally {
    loadingCities.value = false
  }
}

async function loadProperty() {
  if (!props.propertyId) return
  loadingDetail.value = true
  property.value = null
  try {
    property.value = await getPropertyById(props.propertyId)
    const p = property.value
    form.value.name = p.name ?? ''
    form.value.building_type = (p.building_type as string) ?? 'villa'
    form.value.address = p.address ?? ''
    form.value.city_id = p.city_id ?? ''
    form.value.status = p.status ?? 'available'
    form.value.description = {
      fr: (typeof p.description === 'object' && p.description?.fr) ? p.description.fr : '',
      en: (typeof p.description === 'object' && p.description?.en) ? p.description.en : '',
    }
    if (p.gps_latitude != null) form.value.gps_latitude = Number(p.gps_latitude)
    if (p.gps_longitude != null) form.value.gps_longitude = Number(p.gps_longitude)
    const countryId = (p.city as { country_id?: string })?.country_id
    form.value.country_id = countryId ?? ''
    existingImageItems.value = (p.media ?? [])
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
      .map((m, i) => ({
        url: m.url,
        previewUrl: getUploadUrl(m.url),
        rank: m.rank ?? i + 1,
        is_primary: m.is_primary ?? false,
        description: m.description ?? { fr: '', en: '' },
      }))
    if (existingImageItems.value.length === 1) existingImageItems.value[0].is_primary = true
    photoFiles.value = []
    newImageItems.value = []
    if (form.value.country_id) await loadCities(form.value.country_id, true)
  } catch {
    errorMessage.value = 'Impossible de charger le bien.'
  } finally {
    loadingDetail.value = false
  }
}

watch(() => form.value.country_id, (id) => {
  if (id) loadCities(id, false)
  else cities.value = []
})

watch(photoFiles, (files) => {
  newImageItems.value.forEach((it) => URL.revokeObjectURL(it.previewUrl))
  if (!files.length) {
    newImageItems.value = []
    return
  }
  const baseRank = existingImageItems.value.filter((x) => !x._removed).length + 1
  newImageItems.value = files.map((file, i) => ({
    file,
    previewUrl: URL.createObjectURL(file),
    rank: baseRank + i,
    is_primary: existingImageItems.value.filter((x) => !x._removed).length === 0 && i === 0,
    description: { fr: '', en: '' },
  }))
}, { deep: true })

watch(() => [props.show, props.propertyId] as const, ([show, id]) => {
  if (show && id) {
    loadProperty()
    loadCountries()
  }
  if (!show) {
    errorMessage.value = ''
    currentStep.value = 1
  }
}, { immediate: true })

function updateExistingItem(index: number, payload: Partial<ExistingImageItem>) {
  const item = existingImageItems.value[index]
  if (!item) return
  if (payload.is_primary !== undefined) {
    existingImageItems.value.forEach((x, i) => { x.is_primary = i === index })
    newImageItems.value.forEach((x) => { x.is_primary = false })
  }
  Object.assign(item, payload)
}

function removeExistingItem(index: number) {
  existingImageItems.value[index]._removed = true
}

function updateNewItem(index: number, payload: Partial<NewImageItem>) {
  const item = newImageItems.value[index]
  if (!item) return
  if (payload.is_primary !== undefined) {
    newImageItems.value.forEach((x, i) => { x.is_primary = i === index })
    existingImageItems.value.forEach((x) => { x.is_primary = false })
  }
  Object.assign(item, payload)
}

function removeNewItem(index: number) {
  const item = newImageItems.value[index]
  if (item) URL.revokeObjectURL(item.previewUrl)
  newImageItems.value.splice(index, 1)
  photoFiles.value = newImageItems.value.map((x) => x.file)
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
  if (!props.propertyId) return
  errorMessage.value = ''
  submitting.value = true
  try {
    const kept = existingImageItems.value.filter((x) => !x._removed)
    const newUploads: PropertyImageItemDto[] = []
    for (let i = 0; i < newImageItems.value.length; i++) {
      const it = newImageItems.value[i]
      const { url } = await uploadPropertyImage(it.file)
      newUploads.push({
        url,
        rank: kept.length + i + 1,
        is_primary: it.is_primary,
        description: (it.description?.fr || it.description?.en) ? it.description : undefined,
      })
    }
    const existingAsPayload: PropertyImageItemDto[] = kept.map((it, i) => ({
      url: it.url,
      rank: i + 1,
      is_primary: it.is_primary,
      description: (it.description?.fr || it.description?.en) ? it.description : undefined,
    }))
    const allImages = [...existingAsPayload, ...newUploads]
    if (allImages.length > 0 && !allImages.some((i) => i.is_primary)) allImages[0].is_primary = true

    const payload: UpdatePropertyPayload = {
      name: form.value.name?.trim() || 'Sans nom',
      building_type: form.value.building_type,
      address: form.value.address.trim(),
      city_id: form.value.city_id,
      status: form.value.status,
      description: (form.value.description?.fr?.trim() || form.value.description?.en?.trim())
        ? {
            fr: form.value.description.fr?.trim() || form.value.description.en?.trim() || '',
            en: form.value.description.en?.trim() || form.value.description.fr?.trim() || '',
          }
        : undefined,
      images: allImages.length > 0 ? allImages : undefined,
    }
    const lat = form.value.gps_latitude !== '' ? Number(form.value.gps_latitude) : undefined
    const lng = form.value.gps_longitude !== '' ? Number(form.value.gps_longitude) : undefined
    if (lat != null && !Number.isNaN(lat)) payload.gps_latitude = lat
    if (lng != null && !Number.isNaN(lng)) payload.gps_longitude = lng

    await updateProperty(props.propertyId, payload)
    emit('saved')
    emit('close')
    toast.success(t('landlord.toast.propertyUpdated'))
  } catch (e) {
    const msg = getApiErrorMessage(e)
    errorMessage.value = msg
    toast.error(t('landlord.toast.apiError', { message: msg }))
  } finally {
    submitting.value = false
  }
}
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
        v-if="show && propertyId"
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
              <AppTitle id="edit-property-title" :level="3" class="text-3xl font-black tracking-tighter">{{ t('landlord.editProperty') }}</AppTitle>
               <p v-if="property" class="text-xs font-black uppercase tracking-widest-xl text-primary-emerald opacity-70">{{ property.name }}</p>
            </div>
            <button
              type="button"
              class="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-all group"
              @click="close"
            >
              <X class="w-6 h-6 text-slate-400 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </header>

          <div v-if="loadingDetail" class="flex-1 flex items-center justify-center py-24">
             <div class="flex flex-col items-center gap-4">
               <div class="w-16 h-16 border-4 border-primary-emerald/20 border-t-primary-emerald rounded-full animate-spin" />
               <p class="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">{{ t('landlord.loading') }}</p>
             </div>
          </div>

          <template v-else>
            <!-- Glass Stepper (Flexible in Edit) -->
            <div class="px-8 py-4 shrink-0 relative z-10">
              <div class="flex items-center justify-between bg-black/5 dark:bg-white/5 p-2 rounded-[2rem] border border-white/10">
                <button
                  v-for="step in steps"
                  :key="step.id"
                  class="flex-1 flex items-center justify-center gap-2 py-3 rounded-3xl transition-all relative overflow-hidden"
                  :class="currentStep === step.id ? 'bg-white dark:bg-white/10 shadow-glass text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'"
                  @click="currentStep = step.id"
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
                </div>
              </div>

              <!-- Step 3: Photos -->
              <div v-if="currentStep === 3" class="space-y-8 animate-in slide-in-from-right-10 duration-500">
                <div v-if="existingImageItems.filter(x => !x._removed).length" class="space-y-4">
                  <p class="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Photos existantes</p>
                  <div class="grid grid-cols-1 gap-4">
                      <ImageWithMeta
                        v-for="(item, idx) in existingImageItems"
                        v-show="!item._removed"
                        :key="'ex-' + idx"
                        :item="item"
                        :index="idx"
                        :can-remove="true"
                        @update:item="(p) => updateExistingItem(idx, p)"
                        @remove="removeExistingItem(idx)"
                      />
                  </div>
                </div>

                <AppUpload :label="t('landlord.stepDocuments')" :max-files="10" @update:files="photoFiles = $event" />
                
                <div v-if="newImageItems.length" class="space-y-4 mt-8">
                  <p class="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Nouvelles photos</p>
                  <div class="grid grid-cols-1 gap-4">
                      <ImageWithMeta
                        v-for="(item, idx) in newImageItems"
                        :key="'new-' + idx"
                        :item="item"
                        :index="idx"
                        :can-remove="true"
                        @update:item="(p) => updateNewItem(idx, p)"
                        @remove="removeNewItem(idx)"
                      />
                  </div>
                </div>
              </div>
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
                  {{ currentStep === totalSteps ? t('landlord.assets.save') : t('landlord.next') }}
                  <ChevronRight v-if="currentStep < totalSteps" class="ml-2" />
                </AppButton>
              </div>
            </footer>
          </template>
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
