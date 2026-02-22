<script setup lang="ts">
/**
 * Modal d'ajout de bien (Property) — Stepper, validation stricte (alignée CreatePropertyCommand).
 * - Champs i18n : description avec onglets FR/EN (défaut fr).
 * - Localisation : chargement dynamique Pays → Villes (/location).
 * - Images : AppDropzone + pour chaque image : toggle Image principale, rang, description i18n.
 * @emits close - avec result { created, propertyId?, propertyName? } si création OK.
 */
import { ref, watch, computed, onMounted, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, ChevronRight, MapPin } from 'lucide-vue-next'
import { getCountries, getCities, type CountryDto, type CityDto } from '../../services/location.service'
import { useReferenceStore } from '../../stores/references'
import { createProperty, uploadPropertyImage, type CreatePropertyPayload, type PropertyImageItemDto } from '../../services/property.service'
import { getApiErrorMessage } from '../../services/http'
import { AppButton, AppInput, AppTitle, AppSelect, AppDropzone } from '../../components/ui'
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
  country_id: '',
  city_id: '',
  status: 'available' as string,
  title_deed: '',
  gps_latitude: '' as string | number,
  gps_longitude: '' as string | number,
  /** Description i18n (défaut fr). */
  description: { fr: '', en: '' } as Record<string, string>,
})
const descriptionLangTab = ref<'fr' | 'en'>('fr')
const photoFiles = ref<File[]>([])
/** Pour chaque fichier : preview, rank, is_primary, description i18n. URLs réelles après upload. */
interface ImageItemState {
  file: File
  previewUrl: string
  rank: number
  is_primary: boolean
  description: Record<string, string>
}
const imageItems = ref<ImageItemState[]>([])

const stepTitles = [
  { key: 'landlord.stepInfo', icon: MapPin },
  { key: 'landlord.stepLocation', icon: MapPin },
  { key: 'landlord.stepDocuments', icon: MapPin },
]

/** Validation alignée CreatePropertyCommand : name (ou défaut), building_type, address, city_id obligatoires à l'étape 1. */
const step1Valid = computed(() => {
  const f = form.value
  const nameVal = (f.name?.trim() || 'Sans nom')
  return (
    typeof f.name === 'string' &&
    nameVal.length > 0 &&
    nameVal.length <= 255 &&
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
const buildingTypeOptions = computed(() =>
  referenceStore.propertyTypes.map((r) => ({
    value: r.code,
    label: locale.value === 'fr' ? r.label_fr : r.label_en || r.label_fr,
  }))
)

/** Suggestion pour la carte (étape 2) : ville + pays choisis à l'étape 1 — au Bénin l'adresse est peu fiable, on privilégie ville et pays. */
const suggestedMapQuery = computed(() => {
  const country = countries.value.find((c) => c.id === form.value.country_id)
  const city = cities.value.find((c) => c.id === form.value.city_id)
  if (!city?.name || !country?.name) return ''
  return `${city.name}, ${country.name}`
})

async function loadCountries() {
  try {
    countries.value = await getCountries()
  } catch {
    countries.value = []
  }
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

watch(
  () => form.value.country_id,
  (id) => {
    if (id) loadCities(id)
    else cities.value = []
  }
)

/** Synchronise imageItems avec photoFiles : crée previews, premier = principale, revoke anciens URLs. */
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

function next() {
  if (currentStep.value < totalSteps) currentStep.value++
  else submit()
}

function back() {
  if (currentStep.value > 1) currentStep.value--
  else emit('close')
}

function close() {
  emit('close')
}

/**
 * Upload des photos sélectionnées puis création du bien avec les URLs (ARCHITECTURE §2, §6 — image is_primary).
 */
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
    const descriptionNorm =
      (desc?.fr?.trim() || desc?.en?.trim())
        ? { fr: desc?.fr?.trim() || desc?.en?.trim() || '', en: desc?.en?.trim() || desc?.fr?.trim() || '' }
        : undefined
    const payload: CreatePropertyPayload = {
      name: form.value.name?.trim() || 'Sans nom',
      building_type: form.value.building_type || 'villa',
      address: form.value.address.trim(),
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
      currentStep.value = 1
      form.value = {
        name: 'Sans nom',
        building_type: 'villa',
        address: '',
        country_id: '',
        city_id: '',
        status: 'available',
        title_deed: '',
        gps_latitude: '',
        gps_longitude: '',
        description: { fr: '', en: '' },
      }
      descriptionLangTab.value = 'fr'
      cities.value = []
      photoFiles.value = []
      imageItems.value.forEach((it) => URL.revokeObjectURL(it.previewUrl))
      imageItems.value = []
      errorMessage.value = ''
      loadCountries()
    }
  }
)

onMounted(() => {
  if (props.show) loadCountries()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/60"
      @click.self="close"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-property-title"
      >
        <header class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <AppTitle id="add-property-title" :level="3">{{ t('landlord.addProperty') }}</AppTitle>
          <button
            type="button"
            class="p-2 rounded-lg text-[var(--color-muted)] hover:bg-gray-100 dark:hover:bg-gray-700"
            :aria-label="t('common.cancel')"
            @click="close"
          >
            <X class="w-5 h-5" />
          </button>
        </header>

        <div class="flex border-b border-gray-200 dark:border-gray-700 px-4 gap-4 py-3">
          <span
            v-for="(step, i) in stepTitles"
            :key="i"
            :class="[
              'flex items-center gap-2 text-sm font-medium',
              currentStep === i + 1 ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]',
            ]"
          >
            {{ t(step.key) }}
          </span>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <!-- Step 1: Nom, type, adresse, pays, ville -->
          <div v-show="currentStep === 1" class="space-y-4">
            <AppInput
              v-model="form.name"
              :label="t('landlord.name')"
              :placeholder="t('landlord.namePlaceholder')"
            />
            <AppSelect
              v-model="form.building_type"
              :label="t('landlord.propertyType')"
              :options="buildingTypeOptions"
              :placeholder="t('landlord.propertyType')"
            />
            <p class="text-xs text-[var(--color-muted)] -mt-2">{{ t('landlord.propertyTypeDefaultHint') }}</p>
            <AppInput
              v-model="form.address"
              :label="t('landlord.address')"
              :placeholder="t('landlord.addressPlaceholder')"
            />
            <AppSelect
              v-model="form.country_id"
              :label="t('landlord.country')"
              :options="countryOptions"
              :placeholder="t('landlord.countryPlaceholder')"
            />
            <AppSelect
              v-model="form.city_id"
              :label="t('landlord.city')"
              :options="cityOptions"
              :placeholder="t('landlord.cityPlaceholder')"
              :disabled="!form.country_id || loadingCities"
            />
            <div>
              <label class="block text-sm font-medium text-[var(--color-text)] mb-1">{{ t('landlord.status') }}</label>
              <select
                v-model="form.status"
                class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-[var(--color-text)] bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--color-accent)]"
              >
                <option v-for="s in referenceStore.propertyStatuses" :key="s.code" :value="s.code">
                  {{ locale === 'fr' ? s.label_fr : s.label_en || s.label_fr }}
                </option>
              </select>
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
          </div>

          <!-- Step 2: Position sur la carte (optionnel) — pré-rempli selon ville + pays, guide utilisateur -->
          <div v-show="currentStep === 2" class="space-y-4">
            <label class="block text-sm font-medium text-[var(--color-text)]">{{ t('landlord.mapLocationTitle') }}</label>
            <p class="text-sm text-[var(--color-muted)]">
              {{ t('landlord.mapStep2Guide', { example: suggestedMapQuery || t('landlord.mapStep2Example') }) }}
            </p>
            <MapLocationPicker
              v-if="currentStep === 2"
              :latitude="form.gps_latitude"
              :longitude="form.gps_longitude"
              :suggested-query="suggestedMapQuery"
              :suggested-hint-text="suggestedMapQuery ? t('landlord.mapSuggestedHint') : ''"
              height="320px"
              :placeholder="t('landlord.mapSearchPlaceholder')"
              :search-button-label="t('landlord.mapSearch')"
              :clear-label="t('landlord.mapClear')"
              :hint-text="t('landlord.mapClickHint')"
              :error-no-results="t('landlord.mapErrorNoResults')"
              :error-search="t('landlord.mapErrorSearch')"
              @update:latitude="(v) => (form.gps_latitude = v)"
              @update:longitude="(v) => (form.gps_longitude = v)"
            />
          </div>

          <!-- Step 3: Documents & photos + images avec métadonnées -->
          <div v-show="currentStep === 3" class="space-y-4">
            <AppInput
              v-model="form.title_deed"
              :label="t('landlord.titleDeed')"
              :placeholder="t('landlord.titleDeedPlaceholder')"
            />
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
        </div>

        <div v-if="errorMessage" class="px-6 py-2 text-sm text-red-600">
          {{ errorMessage }}
        </div>

        <footer class="flex items-center justify-between gap-4 p-4 border-t border-gray-200 dark:border-gray-700">
          <AppButton variant="ghost" @click="back">
            {{ currentStep === 1 ? t('common.cancel') : t('landlord.back') }}
          </AppButton>
          <AppButton
            variant="primary"
            :loading="submitting && currentStep === totalSteps"
            :disabled="!canNext"
            @click="next"
          >
            {{ currentStep === totalSteps ? t('landlord.submitCreate') : t('landlord.next') }}
            <ChevronRight v-if="currentStep < totalSteps" class="w-4 h-4" />
          </AppButton>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
