<script setup lang="ts">
/**
 * Modal d'ajout d'unité — type et équipements dynamiques (GET /ref/types, GET /ref/types/:id/features).
 * Mode : rattachée à un bien (propertyId) ou unité indépendante (adresse, ville, GPS).
 * Statut : Disponible / Occupé / Bientôt disponible (+ date obligatoire).
 * DESIGN: Ultra-Premium Apple Glass / MallOS.
 */
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, ChevronRight, ChevronLeft, CheckCircle2, Calendar, Info, Zap, Sparkles } from 'lucide-vue-next'
import { createUnit, type CreateUnitPayload } from '../../services/property.service'
import { getRefTypes, getRefFeaturesByTypeId, type RefTypeDto, type RefFeatureDto } from '../../services/references.service'
import { getMyProperties } from '../../services/property.service'
import type { PropertyListItemDto } from '../../services/property.service'
import { getCities, getNeighborhoods, type NeighborhoodDto } from '../../services/location.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, AppInput, AppSelect, AppTitle, AppUpload } from '../../components/ui'
import ImageWithMeta from '../../components/landlord/ImageWithMeta.vue'

const props = defineProps<{
  show: boolean
  /** Si fourni : unité rattachée à ce bien. Sinon : choix rattachée/indépendante. */
  propertyId: string | null
  propertyName?: string
}>()
const emit = defineEmits<{ (e: 'close', result?: { created: boolean }): void }>()

const { t, locale } = useI18n()
const submitting = ref(false)
const errorMessage = ref('')
const currentStep = ref(1)
const totalSteps = 4

const refTypes = ref<RefTypeDto[]>([])
const refFeatures = ref<RefFeatureDto[]>([])
const myProperties = ref<PropertyListItemDto[]>([])
const cities = ref<Array<{ id: string; name: string }>>([])

const form = ref({
  mode: 'attach' as 'attach' | 'standalone',
  attachedPropertyId: '' as string,
  name: '',
  ref_type_id: '' as string,
  price: 0,
  unit_status: 'available' as 'available' | 'occupied' | 'notice_given',
  available_from: '' as string,
  caution_months: null as number | null,
  avance_months: null as number | null,
  frais_dossier: null as number | null,
  prepaid_electricity: false,
  water_included: false,
  features: [] as string[],
  description: { fr: '', en: '' } as Record<string, string>,
  address: '' as string,
  neighborhood_id: '' as string,
  city_id: '' as string,
  gps_latitude: '' as string,
  gps_longitude: '' as string,
})

const descriptionLangTab = ref<'fr' | 'en'>('fr')
const priceInput = ref('0')
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
  { id: 1, label: 'landlord.stepInfo', icon: Info },
  { id: 2, label: 'landlord.unitFeatures', icon: Zap },
  { id: 3, label: 'landlord.conditions.tab', icon: Calendar },
  { id: 4, label: 'landlord.stepDocuments', icon: Sparkles }
]

function setPriceFromInput() {
  const num = Number(priceInput.value)
  form.value.price = Number.isNaN(num) ? 0 : num
}

function onPriceInput(v: string | number) {
  priceInput.value = v === '' || v === null || v === undefined ? '' : String(v)
  setPriceFromInput()
}

const typeOptions = computed(() =>
  refTypes.value.map((r) => ({
    value: r.id,
    label: locale.value === 'fr' ? r.label_fr : r.label_en || r.label_fr,
  }))
)

const propertyOptions = computed(() =>
  myProperties.value.map((p) => ({ value: p.id, label: p.name }))
)

const cityOptionsForSelect = computed(() =>
  cities.value.map((c) => ({ value: c.id, label: c.name }))
)

const neighborhoods = ref<NeighborhoodDto[]>([])
const loadingNeighborhoods = ref(false)

async function loadNeighborhoods(cityId: string | null) {
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
  loadNeighborhoods(id || null)
})

const neighborhoodOptions = computed(() =>
  neighborhoods.value.map((n) => ({ value: n.id, label: n.name }))
)

const statusOptions = computed(() => [
  { value: 'available', label: t('landlord.unitStatusAvailable') },
  { value: 'occupied', label: t('landlord.unitStatusOccupied') },
  { value: 'notice_given', label: t('landlord.unitStatusNoticeGiven') },
])

const featureOptions = computed(() =>
  refFeatures.value.map((f) => ({
    value: f.code,
    label: locale.value === 'fr' ? f.label_fr : f.label_en || f.label_fr,
  }))
)

const effectivePropertyId = computed(() => {
  if (props.propertyId) return props.propertyId
  if (form.value.mode === 'attach' && form.value.attachedPropertyId) return form.value.attachedPropertyId
  return null
})

const showStandaloneFields = computed(() => !props.propertyId && form.value.mode === 'standalone')

const step1Valid = computed(() => {
  const f = form.value
  const hasName = typeof f.name === 'string' && f.name.trim().length > 0
  const hasType = !!f.ref_type_id
  const hasTarget = effectivePropertyId.value !== null || (f.mode === 'standalone' && (f.address?.trim() || f.city_id))
  return hasName && hasType && hasTarget
})

const step3Valid = computed(() => {
  const f = form.value
  const hasPrice = typeof f.price === 'number' && f.price >= 0
  const noticeOk = f.unit_status !== 'notice_given' || (f.available_from && f.available_from.trim().length > 0)
  return hasPrice && noticeOk
})

const canNext = computed(() => {
  if (currentStep.value === 1) return step1Valid.value
  if (currentStep.value === 3) return step3Valid.value
  return true
})

function next() {
  if (currentStep.value < totalSteps) currentStep.value++
  else submit()
}

function back() {
  if (currentStep.value > 1) currentStep.value--
  else close()
}

function toggleFeature(code: string) {
  const i = form.value.features.indexOf(code)
  if (i >= 0) form.value.features = form.value.features.filter((x) => x !== code)
  else form.value.features = [...form.value.features, code]
}

async function loadRefTypes() {
  refTypes.value = await getRefTypes()
}

async function loadRefFeatures() {
  if (!form.value.ref_type_id) {
    refFeatures.value = []
    return
  }
  refFeatures.value = await getRefFeaturesByTypeId(form.value.ref_type_id)
}

watch(() => form.value.ref_type_id, loadRefFeatures)

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

function close() {
  emit('close')
}

async function submit() {
  setPriceFromInput()
  if (!step1Valid.value || !step3Valid.value) return
  errorMessage.value = ''
  submitting.value = true
  try {
    const desc = form.value.description
    const descriptionNorm = (desc?.fr?.trim() || desc?.en?.trim())
      ? { fr: desc?.fr?.trim() || desc?.en?.trim() || '', en: desc?.en?.trim() || desc?.fr?.trim() || '' }
      : undefined

    const payload: CreateUnitPayload = {
      name: form.value.name.trim(),
      ref_type_id: form.value.ref_type_id,
      property_id: effectivePropertyId.value ?? null,
      price: form.value.price,
      unit_status: form.value.unit_status,
      available_from: form.value.unit_status === 'notice_given' && form.value.available_from?.trim() ? form.value.available_from.trim() : undefined,
      caution_months: form.value.caution_months ?? undefined,
      avance_months: form.value.avance_months ?? undefined,
      frais_dossier: form.value.frais_dossier ?? undefined,
      prepaid_electricity: form.value.prepaid_electricity,
      water_included: form.value.water_included,
      features: form.value.features.length ? form.value.features : undefined,
      description: descriptionNorm,
      images: [],
    }
    if (showStandaloneFields.value) {
      payload.address = form.value.address?.trim() || undefined
      payload.neighborhood_id = form.value.neighborhood_id || undefined
      payload.city_id = form.value.city_id || undefined
      payload.gps_latitude = form.value.gps_latitude?.trim() || undefined
      payload.gps_longitude = form.value.gps_longitude?.trim() || undefined
    }

    await createUnit(effectivePropertyId.value, payload)
    emit('close', { created: true })
    toast.success(t('landlord.toast.unitCreated'))
  } catch (e) {
    const msg = getApiErrorMessage(e)
    errorMessage.value = msg
    toast.error(t('landlord.toast.apiError', { message: msg }))
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.show,
  async (visible) => {
    if (visible) {
      currentStep.value = 1
      form.value = {
        mode: props.propertyId ? 'attach' : 'attach',
        attachedPropertyId: props.propertyId || '',
        name: '',
        ref_type_id: '',
        price: 0,
        unit_status: 'available',
        available_from: '',
        caution_months: null,
        avance_months: null,
        frais_dossier: null,
        prepaid_electricity: false,
        water_included: false,
        features: [],
        description: { fr: '', en: '' },
        address: '',
        neighborhood_id: '',
        city_id: '',
        gps_latitude: '',
        gps_longitude: '',
      }
      priceInput.value = '0'
      photoFiles.value = []
      imageItems.value.forEach((it) => URL.revokeObjectURL(it.previewUrl))
      imageItems.value = []
      errorMessage.value = ''
      await loadRefTypes()
      if (!props.propertyId) {
        const res = await getMyProperties({ limit: 500 })
        myProperties.value = res.data
        if (res.data.length) form.value.attachedPropertyId = res.data[0].id
        const countries = await import('../../services/location.service').then((m) => m.getCountries())
        if (countries.length) {
          const citiesList = await getCities(countries[0].id)
          cities.value = citiesList.map((c) => ({ id: c.id, name: c.name }))
        }
      }
    }
  }
)
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
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-8xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300"
          role="dialog"
          aria-modal="true"
        >
          <!-- Internal Glow Effects -->
          <div class="absolute -top-[10%] -right-[10%] w-[40%] h-[30%] bg-primary-emerald/10 blur-mesh-glow rounded-full pointer-events-none" />
          <div class="absolute bottom-[5%] -left-[10%] w-[30%] h-[20%] bg-blue-500/10 blur-mesh-glow rounded-full pointer-events-none" />

          <!-- Header -->
          <header class="flex items-center justify-between p-8 pb-4 shrink-0 relative z-10">
            <div class="space-y-1">
              <AppTitle id="add-unit-title" :level="3" class="text-3xl font-black tracking-tighter">{{ t('landlord.addUnit') }}</AppTitle>
              <p v-if="propertyName" class="text-xs font-black uppercase tracking-widest-xl text-primary-emerald opacity-70">{{ propertyName }}</p>
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
                @click="currentStep >= step.id ? currentStep = step.id : (step1Valid ? currentStep = step.id : null)"
              >
                <component :is="step.icon" :size="18" :class="currentStep === step.id ? 'text-primary-emerald' : ''" />
                <span class="text-[10px] font-black uppercase tracking-widest hidden md:inline">{{ t(step.label) }}</span>
                <div v-if="currentStep === step.id" class="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary-emerald rounded-full" />
              </button>
            </div>
          </div>

          <!-- Content Scrollable -->
          <div class="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar relative z-10">
            <!-- Step 1: General -->
            <div v-if="currentStep === 1" class="space-y-8 animate-in slide-in-from-right-10 duration-500">
               <template v-if="!propertyId">
                 <div class="space-y-4">
                    <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{{ t('landlord.unitType') }}</label>
                    <div class="grid grid-cols-2 gap-4">
                       <button 
                        class="p-4 rounded-3xl border transition-all flex flex-col gap-2 items-center text-center"
                        :class="form.mode === 'attach' ? 'bg-primary-emerald/10 border-primary-emerald/30 text-emerald-500' : 'bg-white/40 dark:bg-white/5 border-white/10 text-slate-400'"
                        @click="form.mode = 'attach'"
                       >
                         <Layers :size="24" />
                         <span class="text-xs font-black uppercase tracking-widest">{{ t('landlord.attachToProperty') }}</span>
                       </button>
                       <button 
                        class="p-4 rounded-3xl border transition-all flex flex-col gap-2 items-center text-center"
                        :class="form.mode === 'standalone' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'bg-white/40 dark:bg-white/5 border-white/10 text-slate-400'"
                        @click="form.mode = 'standalone'"
                       >
                         <MapPin :size="24" />
                         <span class="text-xs font-black uppercase tracking-widest">{{ t('landlord.standaloneUnit') }}</span>
                       </button>
                    </div>
                 </div>

                 <div v-if="form.mode === 'attach'" class="space-y-4">
                    <AppSelect
                      v-model="form.attachedPropertyId"
                      :label="t('landlord.selectProperty')"
                      :options="propertyOptions"
                    />
                 </div>

                 <div v-if="form.mode === 'standalone'" class="space-y-6">
                    <AppInput v-model="form.address" :label="t('landlord.address')" :placeholder="t('landlord.addressPlaceholder')" />
                    <AppSelect
                      v-model="form.city_id"
                      :label="t('landlord.city')"
                      :options="cityOptionsForSelect"
                    />
                  <AppSelect
                    v-model="form.neighborhood_id"
                    label="Quartier (facultatif)"
                    :options="neighborhoodOptions"
                    :disabled="loadingNeighborhoods || !form.city_id"
                    placeholder="Sélectionner..."
                  />
                    <div class="grid grid-cols-2 gap-4">
                      <AppInput v-model="form.gps_latitude" label="Lat" />
                      <AppInput v-model="form.gps_longitude" label="Long" />
                    </div>
                 </div>
               </template>

               <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <AppInput v-model="form.name" :label="t('landlord.unitName')" :placeholder="t('landlord.unitNamePlaceholder')" />
                 <AppSelect v-model="form.ref_type_id" :label="t('landlord.unitType')" :options="typeOptions" />
               </div>

               <div class="space-y-4">
                  <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{{ t('landlord.description') }}</label>
                  <div class="p-2 bg-black/5 dark:bg-white/5 rounded-2xl flex gap-1 w-fit">
                    <button 
                      v-for="lang in ['fr', 'en'] as const" 
                      :key="lang"
                      class="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      :class="descriptionLangTab === lang ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'"
                      @click="descriptionLangTab = lang"
                    >
                      {{ lang }}
                    </button>
                  </div>
                  <textarea
                    v-model="form.description[descriptionLangTab]"
                    rows="3"
                    class="w-full p-6 rounded-4xl bg-white/40 dark:bg-white/5 border border-white/10 focus:border-primary-emerald/50 outline-none transition-all text-sm font-bold placeholder:text-slate-400"
                    :placeholder="descriptionLangTab === 'fr' ? t('landlord.descriptionFr') : t('landlord.descriptionEn')"
                  />
               </div>
            </div>

            <!-- Step 2: Features -->
            <div v-if="currentStep === 2" class="space-y-8 animate-in slide-in-from-right-10 duration-500">
               <div class="p-8 rounded-6xl bg-white/40 dark:bg-white/5 border border-white/10 shadow-glass">
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      v-for="f in featureOptions" 
                      :key="f.value"
                      class="flex items-center gap-3 p-4 rounded-2xl border transition-all"
                      :class="form.features.includes(f.value) ? 'bg-primary-emerald/10 border-primary-emerald/30 text-emerald-500' : 'bg-transparent border-white/5 text-slate-500'"
                      @click="toggleFeature(f.value)"
                    >
                      <div class="w-5 h-5 rounded-md border flex items-center justify-center transition-all" :class="form.features.includes(f.value) ? 'bg-primary-emerald border-primary-emerald' : 'border-white/20'">
                        <CheckCircle2 v-if="form.features.includes(f.value)" :size="12" class="text-white" />
                      </div>
                      <span class="text-xs font-black uppercase tracking-widest truncate">{{ f.label }}</span>
                    </button>
                 </div>
                 <div v-if="!featureOptions.length && form.ref_type_id" class="text-center py-8">
                    <p class="text-sm font-bold text-slate-400 opacity-60">{{ t('admin.references.noFeatures') }}</p>
                 </div>
               </div>
            </div>

            <!-- Step 3: Conditions & Status -->
            <div v-if="currentStep === 3" class="space-y-10 animate-in slide-in-from-right-10 duration-500">
               <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <AppInput :model-value="priceInput" type="number" :label="t('landlord.unitPrice')" :min="0" @update:model-value="onPriceInput" />
                 <AppSelect v-model="form.unit_status" :label="t('landlord.unitStatus')" :options="statusOptions" />
               </div>

               <!-- MAGIC DATE FIELD : Bientôt disponible -->
               <div v-if="form.unit_status === 'notice_given'" class="p-8 rounded-5xl bg-primary-emerald/5 border border-primary-emerald/20 animate-in flip-x-in-95 duration-500">
                  <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 rounded-2xl bg-primary-emerald/10 flex items-center justify-center text-primary-emerald">
                      <Calendar :size="24" />
                    </div>
                    <div>
                      <h4 class="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{{ t('landlord.availableFrom') }} *</h4>
                      <p class="text-[10px] font-bold text-slate-500">{{ t('landlord.availableFromPlaceholder') }}</p>
                    </div>
                  </div>
                  <AppInput v-model="form.available_from" type="date" label="" />
               </div>

               <div class="grid grid-cols-2 gap-6">
                 <AppInput :model-value="form.caution_months || ''" type="number" :label="t('landlord.cautionMonths')" :min="0" :max="24" @update:model-value="(v) => (form.caution_months = v === '' ? null : Number(v))" />
                 <AppInput :model-value="form.avance_months || ''" type="number" :label="t('landlord.avanceMonths')" :min="0" :max="24" @update:model-value="(v) => (form.avance_months = v === '' ? null : Number(v))" />
               </div>

               <AppInput :model-value="form.frais_dossier || ''" type="number" :label="t('landlord.fraisDossier')" :min="0" @update:model-value="(v) => (form.frais_dossier = v === '' ? null : Number(v))" />

               <div class="flex flex-wrap gap-4">
                 <button 
                  class="flex items-center gap-3 p-4 px-6 rounded-2xl border transition-all"
                  :class="form.prepaid_electricity ? 'bg-primary-emerald/10 border-primary-emerald/30 text-emerald-500' : 'bg-white/40 dark:bg-white/5 border-white/10 text-slate-400'"
                  @click="form.prepaid_electricity = !form.prepaid_electricity"
                 >
                   <div class="w-5 h-5 rounded-md border flex items-center justify-center transition-all" :class="form.prepaid_electricity ? 'bg-primary-emerald border-primary-emerald' : 'border-white/20'">
                     <CheckCircle2 v-if="form.prepaid_electricity" :size="12" class="text-white" />
                   </div>
                   <span class="text-xs font-black uppercase tracking-widest">{{ t('landlord.prepaidElectricity') }}</span>
                 </button>
                 <button 
                  class="flex items-center gap-3 p-4 px-6 rounded-2xl border transition-all"
                  :class="form.water_included ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'bg-white/40 dark:bg-white/5 border-white/10 text-slate-400'"
                  @click="form.water_included = !form.water_included"
                 >
                   <div class="w-5 h-5 rounded-md border flex items-center justify-center transition-all" :class="form.water_included ? 'bg-blue-500 border-blue-500' : 'border-white/20'">
                     <CheckCircle2 v-if="form.water_included" :size="12" class="text-white" />
                   </div>
                   <span class="text-xs font-black uppercase tracking-widest">{{ t('landlord.waterIncluded') }}</span>
                 </button>
               </div>
            </div>

            <!-- Step 4: Photos -->
            <div v-if="currentStep === 4" class="space-y-8 animate-in slide-in-from-right-10 duration-500">
               <AppUpload :label="t('landlord.stepDocuments')" :max-files="10" @update:files="photoFiles = $event" />
               <div v-if="imageItems.length" class="space-y-6">
                 <p class="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">{{ t('landlord.imageDescription') }}</p>
                 <div class="grid grid-cols-1 gap-4">
                   <ImageWithMeta 
                    v-for="(item, idx) in imageItems" 
                    :key="idx" 
                    :item="item" 
                    :index="idx" 
                    :can-remove="true" 
                    @update:item="(p) => updateImageItem(idx, p)" 
                    @remove="removeImageItem(idx)" 
                   />
                 </div>
               </div>
            </div>
          </div>

          <!-- Bottom Warning / Info -->
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
                class="h-16 flex-1 rounded-4xl font-black text-lg tracking-tighter"
                :loading="submitting" 
                :disabled="!canNext" 
                @click="next"
              >
                {{ currentStep === totalSteps ? t('landlord.submitUnit') : t('landlord.next') }}
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
