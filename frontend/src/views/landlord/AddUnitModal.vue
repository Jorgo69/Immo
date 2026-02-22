<script setup lang="ts">
/**
 * Modal d'ajout d'unité (chambre/appart) — Nom, Type, Prix, Description (i18n), Features, Images.
 * Reçoit propertyId en prop. Même gestion d'images que AddPropertyModal (ImageWithMeta).
 * @props show, propertyId, propertyName?
 * @emits close - avec result { created: boolean } si création OK.
 */
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'
import { createUnit, type CreateUnitPayload } from '../../services/property.service'
import { useReferenceStore } from '../../stores/references'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, AppInput, AppTitle, AppDropzone } from '../../components/ui'
import ImageWithMeta from '../../components/landlord/ImageWithMeta.vue'

const props = defineProps<{
  show: boolean
  propertyId: string | null
  propertyName?: string
}>()
const emit = defineEmits<{ (e: 'close', result?: { created: boolean }): void }>()

const { t, locale } = useI18n()
const referenceStore = useReferenceStore()
const submitting = ref(false)
const errorMessage = ref('')

const form = ref<{
  name: string
  type: string
  price: number
  caution_months: number | null
  avance_months: number | null
  frais_dossier: number | null
  prepaid_electricity: boolean
  water_included: boolean
  features: string[]
  description: Record<string, string>
}>({
  name: '',
  type: '',
  price: 0,
  caution_months: null,
  avance_months: null,
  frais_dossier: null,
  prepaid_electricity: false,
  water_included: false,
  features: [],
  description: { fr: '', en: '' },
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
  if (payload.is_primary !== undefined) {
    imageItems.value.forEach((x, i) => { x.is_primary = i === index })
  }
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
  if (!props.propertyId || !isValid.value) return
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
      type: form.value.type,
      price: form.value.price,
      caution_months: form.value.caution_months ?? undefined,
      avance_months: form.value.avance_months ?? undefined,
      frais_dossier: form.value.frais_dossier ?? undefined,
      prepaid_electricity: form.value.prepaid_electricity,
      water_included: form.value.water_included,
      features: form.value.features.length ? form.value.features : undefined,
      description: descriptionNorm,
      images: [],
    }
    await createUnit(props.propertyId, payload)
    emit('close', { created: true })
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
  (visible) => {
    if (visible) {
      form.value = {
        name: '',
        type: '',
        price: 0,
        caution_months: null,
        avance_months: null,
        frais_dossier: null,
        prepaid_electricity: false,
        water_included: false,
        features: [],
        description: { fr: '', en: '' },
      }
      descriptionLangTab.value = 'fr'
      priceInput.value = '0'
      photoFiles.value = []
      imageItems.value.forEach((it) => URL.revokeObjectURL(it.previewUrl))
      imageItems.value = []
      errorMessage.value = ''
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show && propertyId"
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
          <button
            type="button"
            class="p-2 rounded-lg text-[var(--color-muted)] hover:bg-gray-100 dark:hover:bg-gray-700"
            :aria-label="t('common.cancel')"
            @click="close"
          >
            <X class="w-5 h-5" />
          </button>
        </header>
        <p v-if="propertyName" class="px-4 pb-2 text-sm text-[var(--color-muted)]">
          {{ propertyName }}
        </p>
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <AppInput
            v-model="form.name"
            :label="t('landlord.unitName')"
            :placeholder="t('landlord.unitNamePlaceholder')"
          />
          <div>
            <label class="block text-sm font-medium text-[var(--color-text)] mb-1">{{ t('landlord.unitType') }}</label>
            <select
              v-model="form.type"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-[var(--color-text)] bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              <option value="" disabled>—</option>
              <option
                v-for="opt in typeOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>
          <AppInput
            :model-value="priceInput"
            type="number"
            :label="t('landlord.unitPrice')"
            :min="0"
            @update:model-value="onPriceInput"
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
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-[var(--color-text)] bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--color-accent)]"
              :placeholder="t('landlord.descriptionFr')"
            />
            <textarea
              v-else
              v-model="form.description.en"
              rows="3"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-[var(--color-text)] bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--color-accent)]"
              :placeholder="t('landlord.descriptionEn')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-[var(--color-text)] mb-2">{{ t('landlord.unitFeatures') }}</label>
            <div class="flex flex-wrap gap-3">
              <label
                v-for="f in referenceStore.unitFeatures"
                :key="f.id"
                class="inline-flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :checked="form.features.includes(f.code)"
                  class="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                  @change="toggleFeature(f.code)"
                />
                <span class="text-sm text-[var(--color-text)]">{{ locale === 'fr' ? f.label_fr : f.label_en || f.label_fr }}</span>
              </label>
            </div>
          </div>
          <AppDropzone
            :label="t('landlord.stepDocuments')"
            :max-files="10"
            @update:files="photoFiles = $event"
          />
          <div v-if="imageItems.length" class="space-y-3">
            <p class="text-sm font-medium text-[var(--color-text)]">{{ t('landlord.imageDescription') }}</p>
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
        <div v-if="errorMessage" class="px-6 py-2 text-sm text-red-600">
          {{ errorMessage }}
        </div>
        <footer class="flex items-center justify-end gap-4 p-4 border-t border-gray-200 dark:border-gray-700">
          <AppButton variant="ghost" @click="close">{{ t('common.cancel') }}</AppButton>
          <AppButton
            variant="primary"
            :loading="submitting"
            :disabled="!isValid"
            @click="submit"
          >
            {{ t('landlord.submitUnit') }}
          </AppButton>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
