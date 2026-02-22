<script setup lang="ts">
/**
 * Modal d'édition d'une unité (chambre/appart) — ARCHITECTURE §2, §7.
 * Modifier : nom, type, prix, description i18n, équipements, images.
 * @props show, propertyId, unit (UnitDto à éditer)
 * @emits close, saved
 */
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'
import { getUploadUrl } from '../../config/api'
import { updateUnit, uploadPropertyImage, type UpdateUnitPayload, type UnitDto, type PropertyImageItemDto } from '../../services/property.service'
import { useReferenceStore } from '../../stores/references'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, AppInput, AppTitle, AppDropzone } from '../../components/ui'
import ImageWithMeta from '../../components/landlord/ImageWithMeta.vue'

const props = defineProps<{
  show: boolean
  propertyId: string | null
  unit: UnitDto | null
}>()

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const { t, locale } = useI18n()
const referenceStore = useReferenceStore()
const submitting = ref(false)
const errorMessage = ref('')

const form = ref({
  name: '',
  type: '',
  price: 0,
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

function setPriceFromInput() {
  const num = Number(priceInput.value)
  form.value.price = Number.isNaN(num) ? 0 : num
}

const typeOptions = computed(() =>
  referenceStore.unitTypes.map((r) => ({
    value: r.code,
    label: locale.value === 'fr' ? r.label_fr : r.label_en || r.label_fr,
  }))
)

const isValid = computed(() => {
  const f = form.value
  return (
    typeof f.name === 'string' &&
    f.name.trim().length > 0 &&
    f.name.length <= 150 &&
    referenceStore.unitTypes.some((r) => r.code === f.type) &&
    typeof f.price === 'number' &&
    f.price >= 0
  )
})

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
  form.value.type = (u.type as string) ?? 'studio'
  form.value.price = Number(u.price) || 0
  priceInput.value = String(form.value.price)
  form.value.caution_months = u.caution_months ?? null
  form.value.avance_months = u.avance_months ?? null
  form.value.frais_dossier = u.frais_dossier != null ? Number(u.frais_dossier) : null
  form.value.prepaid_electricity = u.prepaid_electricity ?? false
  form.value.water_included = u.water_included ?? false
  const feat = u.features
  form.value.features = Array.isArray(feat) ? feat : (feat?.fr ? feat.fr : []) ?? []
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
  ([show, unit]) => {
    if (show && unit) fillFromUnit(unit)
    if (!show) errorMessage.value = ''
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
      type: form.value.type,
      price: form.value.price,
      caution_months: form.value.caution_months ?? undefined,
      avance_months: form.value.avance_months ?? undefined,
      frais_dossier: form.value.frais_dossier ?? undefined,
      prepaid_electricity: form.value.prepaid_electricity,
      water_included: form.value.water_included,
      features: form.value.features.length ? { fr: form.value.features, en: form.value.features } : undefined,
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
    <div
      v-if="show && propertyId && unit"
      class="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/60"
      @click.self="close"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-unit-title"
      >
        <header class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <AppTitle id="edit-unit-title" :level="3">{{ t('landlord.editUnit') }}</AppTitle>
          <button
            type="button"
            class="p-2 rounded-lg text-[var(--color-muted)] hover:bg-gray-100 dark:hover:bg-gray-700"
            :aria-label="t('common.cancel')"
            @click="close"
          >
            <X class="w-5 h-5" />
          </button>
        </header>
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <AppInput v-model="form.name" :label="t('landlord.unitName')" :placeholder="t('landlord.unitNamePlaceholder')" />
          <div>
            <label class="block text-sm font-medium text-[var(--color-text)] mb-1">{{ t('landlord.unitType') }}</label>
            <select
              v-model="form.type"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-[var(--color-text)] bg-white dark:bg-gray-800"
            >
              <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <AppInput
            :model-value="priceInput"
            type="number"
            :label="t('landlord.unitPrice')"
            :min="0"
            @update:model-value="(v) => { priceInput = v === '' || v == null ? '' : String(v); setPriceFromInput() }"
          />
          <div class="grid grid-cols-2 gap-4">
            <AppInput
              v-model.number="form.caution_months"
              type="number"
              :label="t('landlord.cautionMonths')"
              :min="0"
              :max="24"
            />
            <AppInput
              v-model.number="form.avance_months"
              type="number"
              :label="t('landlord.avanceMonths')"
              :min="0"
              :max="24"
            />
          </div>
          <AppInput
            v-model.number="form.frais_dossier"
            type="number"
            :label="t('landlord.fraisDossier')"
            :min="0"
          />
          <div class="flex flex-wrap gap-4">
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.prepaid_electricity"
                type="checkbox"
                class="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
              />
              <span class="text-sm text-[var(--color-text)]">{{ t('landlord.prepaidElectricity') }}</span>
            </label>
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.water_included"
                type="checkbox"
                class="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
              />
              <span class="text-sm text-[var(--color-text)]">{{ t('landlord.waterIncluded') }}</span>
            </label>
          </div>
          <div>
            <label class="block text-sm font-medium text-[var(--color-text)] mb-2">{{ t('landlord.description') }}</label>
            <div class="flex gap-2 mb-2">
              <button
                type="button"
                :class="['px-3 py-1.5 rounded-lg text-sm font-medium', descriptionLangTab === 'fr' ? 'bg-[var(--color-accent)] text-white' : 'bg-gray-100 dark:bg-gray-700 text-[var(--color-text)]']"
                @click="descriptionLangTab = 'fr'"
              >
                {{ t('landlord.langFr') }}
              </button>
              <button
                type="button"
                :class="['px-3 py-1.5 rounded-lg text-sm font-medium', descriptionLangTab === 'en' ? 'bg-[var(--color-accent)] text-white' : 'bg-gray-100 dark:bg-gray-700 text-[var(--color-text)]']"
                @click="descriptionLangTab = 'en'"
              >
                {{ t('landlord.langEn') }}
              </button>
            </div>
            <textarea
              v-if="descriptionLangTab === 'fr'"
              v-model="form.description.fr"
              rows="3"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-[var(--color-text)] bg-white dark:bg-gray-800"
              :placeholder="t('landlord.descriptionFr')"
            />
            <textarea
              v-else
              v-model="form.description.en"
              rows="3"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-[var(--color-text)] bg-white dark:bg-gray-800"
              :placeholder="t('landlord.descriptionEn')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-[var(--color-text)] mb-2">{{ t('landlord.unitFeatures') }}</label>
            <div class="flex flex-wrap gap-3">
              <label
                v-for="f in referenceStore.unitFeatures"
                :key="f.code"
                class="inline-flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :checked="form.features.includes(f.code)"
                  class="rounded border-gray-300 text-[var(--color-accent)]"
                  @change="toggleFeature(f.code)"
                />
                <span class="text-sm text-[var(--color-text)]">{{ locale === 'fr' ? f.label_fr : f.label_en || f.label_fr }}</span>
              </label>
            </div>
          </div>
          <div>
            <p class="text-sm font-medium text-[var(--color-text)] mb-2">{{ t('landlord.stepDocuments') }}</p>
            <div v-if="existingImageItems.filter((x) => !x._removed).length" class="space-y-2 mb-2">
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
            <AppDropzone :max-files="10" @update:files="photoFiles = $event" />
            <div v-if="newImageItems.length" class="space-y-2 mt-2">
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
        <div v-if="errorMessage" class="px-6 py-2 text-sm text-red-600">{{ errorMessage }}</div>
        <footer class="flex justify-end gap-4 p-4 border-t border-gray-200 dark:border-gray-700">
          <AppButton variant="ghost" @click="close">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="primary" :loading="submitting" :disabled="!isValid" @click="submit">
            {{ t('landlord.assets.save') }}
          </AppButton>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
