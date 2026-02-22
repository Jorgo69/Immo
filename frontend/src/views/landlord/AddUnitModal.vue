<script setup lang="ts">
/**
 * Modal d'ajout d'unité — type et équipements dynamiques (GET /ref/types, GET /ref/types/:id/features).
 * Mode : rattachée à un bien (propertyId) ou unité indépendante (adresse, ville, GPS).
 * Statut : Disponible / Occupé / Bientôt disponible (+ date obligatoire).
 */
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'
import { createUnit, type CreateUnitPayload } from '../../services/property.service'
import { getRefTypes, getRefFeaturesByTypeId, type RefTypeDto, type RefFeatureDto } from '../../services/references.service'
import { getMyProperties } from '../../services/property.service'
import type { PropertyListItemDto } from '../../services/property.service'
import { getCities } from '../../services/location.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, AppInput, AppTitle, AppDropzone } from '../../components/ui'
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

const effectivePropertyId = computed(() => {
  if (props.propertyId) return props.propertyId
  if (form.value.mode === 'attach' && form.value.attachedPropertyId) return form.value.attachedPropertyId
  return null
})

const showStandaloneFields = computed(() => !props.propertyId && form.value.mode === 'standalone')
const showAttachSelect = computed(() => !props.propertyId && form.value.mode === 'attach')

const isValid = computed(() => {
  const f = form.value
  const hasName = typeof f.name === 'string' && f.name.trim().length > 0 && f.name.length <= 150
  const hasType = !!f.ref_type_id
  const hasPrice = typeof f.price === 'number' && f.price >= 0
  const hasTarget = effectivePropertyId.value !== null || (form.value.mode === 'standalone' && (f.address?.trim() || f.city_id))
  const noticeOk = f.unit_status !== 'notice_given' || (f.available_from && f.available_from.trim().length > 0)
  return hasName && hasType && hasPrice && hasTarget && noticeOk
})

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
  form.value.features = []
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
  if (imageItems.value.length === 1) imageItems.value[0].is_primary = true
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
  if (!isValid.value) return
  errorMessage.value = ''
  submitting.value = true
  try {
    const desc = form.value.description
    const descriptionNorm =
      (desc?.fr?.trim() || desc?.en?.trim())
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
      payload.city_id = form.value.city_id || undefined
      payload.gps_latitude = form.value.gps_latitude?.trim() || undefined
      payload.gps_longitude = form.value.gps_longitude?.trim() || undefined
    }

    await createUnit(effectivePropertyId.value, payload)
    emit('close', { created: true })
    toast.success(t('landlord.submitUnit'))
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
        city_id: '',
        gps_latitude: '',
        gps_longitude: '',
      }
      descriptionLangTab.value = 'fr'
      priceInput.value = '0'
      photoFiles.value = []
      imageItems.value.forEach((it) => URL.revokeObjectURL(it.previewUrl))
      imageItems.value = []
      errorMessage.value = ''
      await loadRefTypes()
      refFeatures.value = []
      if (!props.propertyId) {
        const res = await getMyProperties({ limit: 500 })
        myProperties.value = res.data
        if (res.data.length) form.value.attachedPropertyId = res.data[0].id
        const countries = await import('../../services/location.service').then((m) => m.getCountries())
        if (countries.length) {
          const citiesList = await getCities(countries[0].id)
          cities.value = citiesList.map((c) => ({ id: c.id, name: c.name }))
        } else cities.value = []
      }
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/60"
      @click.self="close"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-unit-title"
      >
        <header class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <AppTitle id="add-unit-title" :level="3">{{ t('landlord.addUnit') }}</AppTitle>
          <button type="button" class="p-2 rounded-lg text-[var(--color-muted)] hover:bg-gray-100 dark:hover:bg-gray-700" :aria-label="t('common.cancel')" @click="close">
            <X class="w-5 h-5" />
          </button>
        </header>
        <p v-if="propertyName" class="px-4 pb-2 text-sm text-[var(--color-muted)]">{{ propertyName }}</p>

        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <!-- Mode : rattachée / indépendante (si pas de propertyId) -->
          <template v-if="!propertyId">
            <div>
              <label class="block text-sm font-medium text-[var(--color-text)] mb-2">{{ t('landlord.unitType') }}</label>
              <div class="flex gap-4">
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input v-model="form.mode" type="radio" value="attach" class="text-[var(--color-accent)] focus:ring-[var(--color-accent)]" />
                  <span class="text-sm">{{ t('landlord.attachToProperty') }}</span>
                </label>
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input v-model="form.mode" type="radio" value="standalone" class="text-[var(--color-accent)] focus:ring-[var(--color-accent)]" />
                  <span class="text-sm">{{ t('landlord.standaloneUnit') }}</span>
                </label>
              </div>
            </div>
            <div v-if="showAttachSelect" class="min-w-[200px]">
              <label class="block text-sm font-medium text-[var(--color-text)] mb-1">{{ t('landlord.selectProperty') }}</label>
              <select
                v-model="form.attachedPropertyId"
                class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-[var(--color-text)] bg-white dark:bg-gray-800"
              >
                <option value="">—</option>
                <option v-for="p in myProperties" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
            <template v-if="showStandaloneFields">
              <AppInput v-model="form.address" :label="t('landlord.address')" :placeholder="t('landlord.addressPlaceholder')" />
              <div>
                <label class="block text-sm font-medium text-[var(--color-text)] mb-1">{{ t('landlord.city') }}</label>
                <select
                  v-model="form.city_id"
                  class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-[var(--color-text)] bg-white dark:bg-gray-800"
                >
                  <option value="">—</option>
                  <option v-for="c in cities" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <AppInput v-model="form.gps_latitude" :label="'Lat'" />
                <AppInput v-model="form.gps_longitude" :label="'Long'" />
              </div>
            </template>
          </template>

          <AppInput v-model="form.name" :label="t('landlord.unitName')" :placeholder="t('landlord.unitNamePlaceholder')" />

          <div>
            <label class="block text-sm font-medium text-[var(--color-text)] mb-1">{{ t('landlord.unitType') }}</label>
            <select
              v-model="form.ref_type_id"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-[var(--color-text)] bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              <option value="">—</option>
              <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <AppInput :model-value="priceInput" type="number" :label="t('landlord.unitPrice')" :min="0" @update:model-value="onPriceInput" />

          <!-- Statut + date -->
          <div>
            <label class="block text-sm font-medium text-[var(--color-text)] mb-1">{{ t('landlord.unitStatus') }}</label>
            <select
              v-model="form.unit_status"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-[var(--color-text)] bg-white dark:bg-gray-800"
            >
              <option value="available">{{ t('landlord.unitStatusAvailable') }}</option>
              <option value="occupied">{{ t('landlord.unitStatusOccupied') }}</option>
              <option value="notice_given">{{ t('landlord.unitStatusNoticeGiven') }}</option>
            </select>
            <div v-if="form.unit_status === 'notice_given'" class="mt-2">
              <label class="block text-sm font-medium text-[var(--color-text)] mb-1">{{ t('landlord.availableFrom') }} *</label>
              <input
                v-model="form.available_from"
                type="date"
                class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-[var(--color-text)] bg-white dark:bg-gray-800"
                :placeholder="t('landlord.availableFromPlaceholder')"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <AppInput :model-value="form.caution_months != null ? form.caution_months : undefined" type="number" :label="t('landlord.cautionMonths')" :min="0" :max="24" @update:model-value="(v) => { form.caution_months = v === '' || v == null ? null : Number(v) }" />
            <AppInput :model-value="form.avance_months != null ? form.avance_months : undefined" type="number" :label="t('landlord.avanceMonths')" :min="0" :max="24" @update:model-value="(v) => { form.avance_months = v === '' || v == null ? null : Number(v) }" />
          </div>
          <AppInput :model-value="form.frais_dossier != null ? form.frais_dossier : undefined" type="number" :label="t('landlord.fraisDossier')" :min="0" @update:model-value="(v) => { form.frais_dossier = v === '' || v == null ? null : Number(v) }" />
          <div class="flex flex-wrap gap-4">
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input v-model="form.prepaid_electricity" type="checkbox" class="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]" />
              <span class="text-sm text-[var(--color-text)]">{{ t('landlord.prepaidElectricity') }}</span>
            </label>
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input v-model="form.water_included" type="checkbox" class="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]" />
              <span class="text-sm text-[var(--color-text)]">{{ t('landlord.waterIncluded') }}</span>
            </label>
          </div>

          <div>
            <label class="block text-sm font-medium text-[var(--color-text)] mb-2">{{ t('landlord.description') }}</label>
            <div class="flex gap-2 mb-2">
              <button type="button" :class="['px-3 py-1.5 rounded-lg text-sm font-medium', descriptionLangTab === 'fr' ? 'bg-[var(--color-accent)] text-white' : 'bg-gray-100 dark:bg-gray-700 text-[var(--color-text)]']" @click="descriptionLangTab = 'fr'">{{ t('landlord.langFr') }}</button>
              <button type="button" :class="['px-3 py-1.5 rounded-lg text-sm font-medium', descriptionLangTab === 'en' ? 'bg-[var(--color-accent)] text-white' : 'bg-gray-100 dark:bg-gray-700 text-[var(--color-text)]']" @click="descriptionLangTab = 'en'">{{ t('landlord.langEn') }}</button>
            </div>
            <textarea
              v-if="descriptionLangTab === 'fr'"
              v-model="form.description.fr"
              rows="3"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-[var(--color-text)] bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--color-accent)]"
              :placeholder="t('landlord.descriptionFr')"
            />
            <textarea v-else v-model="form.description.en" rows="3" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-[var(--color-text)] bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--color-accent)]" :placeholder="t('landlord.descriptionEn')" />
          </div>

          <div>
            <label class="block text-sm font-medium text-[var(--color-text)] mb-2">{{ t('landlord.unitFeatures') }}</label>
            <div class="flex flex-wrap gap-3">
              <label v-for="f in featureOptions" :key="f.value" class="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" :checked="form.features.includes(f.value)" class="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]" @change="toggleFeature(f.value)" />
                <span class="text-sm text-[var(--color-text)]">{{ f.label }}</span>
              </label>
            </div>
            <p v-if="form.ref_type_id && !refFeatures.length" class="text-sm text-[var(--color-muted)]">{{ t('admin.references.noFeatures') }}</p>
          </div>

          <AppDropzone :label="t('landlord.stepDocuments')" :max-files="10" @update:files="photoFiles = $event" />
          <div v-if="imageItems.length" class="space-y-3">
            <p class="text-sm font-medium text-[var(--color-text)]">{{ t('landlord.imageDescription') }}</p>
            <ImageWithMeta v-for="(item, idx) in imageItems" :key="idx" :item="item" :index="idx" :can-remove="true" @update:item="(p) => updateImageItem(idx, p)" @remove="removeImageItem(idx)" />
          </div>
        </div>

        <div v-if="errorMessage" class="px-6 py-2 text-sm text-red-600">{{ errorMessage }}</div>
        <footer class="flex items-center justify-end gap-4 p-4 border-t border-gray-200 dark:border-gray-700">
          <AppButton variant="ghost" @click="close">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="primary" :loading="submitting" :disabled="!isValid" @click="submit">{{ t('landlord.submitUnit') }}</AppButton>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
