<script setup lang="ts">
/**
 * Modal d'édition d'une unité — type et équipements dynamiques (ref_types, ref_features).
 * Statut : Disponible / Occupé / Bientôt disponible (+ date).
 * DESIGN: Ultra-Premium Apple Glass / MallOS.
 * Navigation: Flexible (toutes les étapes accessibles).
 */
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, ChevronRight, ChevronLeft, CheckCircle2, Calendar, Info, Zap, Sparkles, Save } from 'lucide-vue-next'
import { getUploadUrl } from '../../config/api'
import { updateUnit, uploadPropertyImage, type UpdateUnitPayload, type UnitDto, type PropertyImageItemDto } from '../../services/property.service'
import { getRefTypes, getRefFeaturesByTypeId, getUnitFeatures, type RefTypeDto, type RefFeatureDto, type UnitFeatureDto } from '../../services/references.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, AppInput, AppSelect, AppTitle, AppUpload, FeatureIcon } from '../../components/ui'
import ImageWithMeta from '../../components/landlord/ImageWithMeta.vue'

const props = defineProps<{
  show: boolean
  propertyId: string | null
  unit: UnitDto | null
}>()

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const { t, locale } = useI18n()
const submitting = ref(false)
const errorMessage = ref('')
const currentStep = ref(1)
const totalSteps = 4

const refTypes = ref<RefTypeDto[]>([])
const refFeatures = ref<RefFeatureDto[]>([])
const unitFeatures = ref<UnitFeatureDto[]>([])

const form = ref({
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
})

const descriptionLangTab = ref<'fr' | 'en'>('fr')
const priceInput = ref('0')

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

const featureOptions = computed(() =>
  refFeatures.value.map((f) => ({
    value: f.code,
    label: locale.value === 'fr' ? f.label_fr : f.label_en || f.label_fr,
  }))
)

const statusOptions = computed(() => [
  { value: 'available', label: t('landlord.unitStatusAvailable') },
  { value: 'occupied', label: t('landlord.unitStatusOccupied') },
  { value: 'notice_given', label: t('landlord.unitStatusNoticeGiven') },
])

const isValid = computed(() => {
  const f = form.value
  const noticeOk = f.unit_status !== 'notice_given' || (f.available_from && f.available_from.trim().length > 0)
  return (
    typeof f.name === 'string' &&
    f.name.trim().length > 0 &&
    !!f.ref_type_id &&
    typeof f.price === 'number' &&
    f.price >= 0 &&
    noticeOk
  )
})

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

async function loadUnitFeaturesList() {
  unitFeatures.value = await getUnitFeatures()
}

watch(() => form.value.ref_type_id, loadRefFeatures)

function toggleFeature(value: string) {
  const i = form.value.features.indexOf(value)
  if (i >= 0) {
    form.value.features = form.value.features.filter((x) => x !== value)
  } else {
    form.value.features = [...form.value.features, value]
  }
}

function fillFromUnit(u: UnitDto) {
  form.value.name = u.name ?? ''
  form.value.ref_type_id = u.ref_type_id ?? (refTypes.value.find((t) => t.code === (u.type as string))?.id ?? '')
  form.value.price = Number(u.price) || 0
  priceInput.value = String(form.value.price)
  form.value.unit_status = (u.unit_status as 'available' | 'occupied' | 'notice_given') ?? (u.is_available ? 'available' : 'occupied')
  form.value.available_from = u.available_from ?? ''
  form.value.caution_months = u.caution_months ?? null
  form.value.avance_months = u.avance_months ?? null
  form.value.frais_dossier = u.frais_dossier != null ? Number(u.frais_dossier) : null
  form.value.prepaid_electricity = u.prepaid_electricity ?? false
  form.value.water_included = u.water_included ?? false
  const feat = u.features
  form.value.features = Array.isArray(feat) ? feat : (feat && typeof feat === 'object' && 'fr' in feat ? (feat as { fr: string[] }).fr : []) ?? []
  const desc = u.description
  form.value.description = {
    fr: typeof desc === 'object' && desc?.fr ? desc.fr : typeof desc === 'string' ? desc : '',
    en: typeof desc === 'object' && desc?.en ? desc.en : '',
  }
  const imgs = u.images
  if (Array.isArray(imgs) && imgs.length > 0) {
    const list = imgs.every((x) => typeof x === 'string')
      ? (imgs as string[]).map((url, i) => ({ url, previewUrl: getUploadUrl(url), rank: i + 1, is_primary: i === 0, description: { fr: '', en: '' } as Record<string, string> }))
      : (imgs as Array<{ url: string; rank?: number; is_primary?: boolean; description?: Record<string, string> }>).map((x, i) => ({
          url: x.url,
          previewUrl: getUploadUrl(x.url),
          rank: x.rank ?? i + 1,
          is_primary: x.is_primary ?? false,
          description: x.description ?? { fr: '', en: '' },
        }))
    existingImageItems.value = list.sort((a, b) => a.rank - b.rank)
    if (existingImageItems.value.length === 1) existingImageItems.value[0].is_primary = true
  } else {
    existingImageItems.value = []
  }
  photoFiles.value = []
  newImageItems.value = []
}

watch(
  () => [props.show, props.unit] as const,
  async ([show, unit]) => {
    if (show) {
      currentStep.value = 1
      await Promise.all([loadRefTypes(), loadUnitFeaturesList()])
      if (unit) {
        fillFromUnit(unit)
        await loadRefFeatures()
      }
      errorMessage.value = ''
    }
  },
  { immediate: true }
)

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
    is_primary: existingImageItems.value.every((x) => x._removed) && i === 0,
    description: { fr: '', en: '' },
  }))
}, { deep: true })

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

function close() {
  emit('close')
}

async function submit() {
  if (!props.propertyId || !props.unit || !isValid.value) return
  setPriceFromInput()
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

    const payload: UpdateUnitPayload = {
      name: form.value.name.trim(),
      ref_type_id: form.value.ref_type_id,
      price: form.value.price,
      unit_status: form.value.unit_status,
      available_from: form.value.unit_status === 'notice_given' && form.value.available_from?.trim() ? form.value.available_from.trim() : undefined,
      caution_months: form.value.caution_months ?? undefined,
      avance_months: form.value.avance_months ?? undefined,
      frais_dossier: form.value.frais_dossier ?? undefined,
      prepaid_electricity: form.value.prepaid_electricity,
      water_included: form.value.water_included,
      features: form.value.features.length ? form.value.features : undefined,
      description:
        form.value.description?.fr?.trim() || form.value.description?.en?.trim()
          ? {
              fr: form.value.description.fr?.trim() || form.value.description.en?.trim() || '',
              en: form.value.description.en?.trim() || form.value.description.fr?.trim() || '',
            }
          : undefined,
      images: allImages.length > 0 ? allImages : undefined,
    }

    await updateUnit(props.propertyId, props.unit.id, payload)
    emit('saved')
    emit('close')
    toast.success(t('landlord.toast.unitUpdated'))
  } catch (e) {
    const msg = getApiErrorMessage(e)
    errorMessage.value = msg
    toast.error(t('landlord.toast.apiError', { message: msg }))
  } finally {
    submitting.value = false
  }
}

function next() {
  if (currentStep.value < totalSteps) currentStep.value++
  else submit()
}

function back() {
  if (currentStep.value > 1) currentStep.value--
  else close()
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
        v-if="show && propertyId && unit"
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
              <AppTitle id="edit-unit-title" :level="3" class="text-3xl font-black tracking-tighter">{{ t('landlord.editUnit') }}</AppTitle>
              <p class="text-xs font-black uppercase tracking-widest-xl text-primary-emerald opacity-70">{{ unit.name }}</p>
            </div>
            <button
              type="button"
              class="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-all group"
              @click="close"
            >
              <X class="w-6 h-6 text-slate-400 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </header>

          <!-- Glass Stepper (Flexible in Edit Mode) -->
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
               <!-- Équipements admin (unit_features) -->
               <div v-if="unitFeatures.length" class="space-y-4">
                 <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Équipements — sélectionnez ce qui est disponible</p>
                 <div class="p-6 rounded-5xl bg-white/40 dark:bg-white/5 border border-white/10 shadow-glass">
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <button
                       v-for="f in unitFeatures"
                       :key="f.code"
                       type="button"
                       class="flex items-center gap-3 p-4 rounded-2xl border transition-all text-left"
                       :class="form.features.includes(f.code) ? 'bg-primary-emerald/10 border-primary-emerald/30 text-emerald-500' : 'bg-transparent border-white/5 text-slate-500'"
                       @click="toggleFeature(f.code)"
                     >
                       <div class="w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0" :class="form.features.includes(f.code) ? 'bg-primary-emerald border-primary-emerald' : 'border-white/20'">
                         <CheckCircle2 v-if="form.features.includes(f.code)" :size="12" class="text-white" />
                       </div>
                       <FeatureIcon
                         :icon-lucide="f.icon_lucide"
                         :icon-svg="f.icon_svg"
                         :size="16"
                         :class="form.features.includes(f.code) ? 'text-emerald-500' : 'text-slate-400'"
                       />
                       <span class="text-xs font-black uppercase tracking-widest truncate">
                         {{ locale === 'fr' ? f.label_fr : (f.label_en || f.label_fr) }}
                       </span>
                     </button>
                   </div>
                 </div>
               </div>

               <!-- Équipements moteur (ref_features) liés au type sélectionné, si différents -->
               <div v-if="refFeatures.length" class="space-y-4">
                 <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Caractéristiques spécifiques au type</p>
                 <div class="p-6 rounded-5xl bg-white/40 dark:bg-white/5 border border-white/10 shadow-glass">
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <button
                       v-for="f in featureOptions"
                       :key="f.value"
                       type="button"
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
                 </div>
               </div>

               <div v-if="!unitFeatures.length && !refFeatures.length" class="py-8 text-center text-slate-400 text-sm font-bold">
                 Sélectionnez d'abord un type d'unité pour voir les caractéristiques disponibles.
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
                class="h-16 flex-1 rounded-4xl font-black text-lg tracking-tighter"
                :loading="submitting" 
                :disabled="!isValid" 
                @click="next"
              >
                <Save v-if="currentStep === totalSteps" :size="20" class="mr-2" />
                {{ currentStep === totalSteps ? t('landlord.assets.save') : t('landlord.next') }}
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
