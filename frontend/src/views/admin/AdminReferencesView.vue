<script setup lang="ts">
/**
 * Configuration des référentiels (Admin) — Catégories, Types par catégorie, Équipements par type.
 * CRUD complet : ajout d'une catégorie (ex. Vente), d'un type (ex. Parcelle), d'un équipement (ex. Titre foncier).
 */
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Settings2, Trash2, Layers } from 'lucide-vue-next'
import {
  getRefCategories,
  getRefTypes,
  getRefFeaturesByTypeId,
  createRefCategory,
  deleteRefCategory,
  createRefType,
  deleteRefType,
  createRefFeature,
  deleteRefFeature,
  type RefDto,
  type RefTypeDto,
  type RefFeatureDto,
} from '../../services/references.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, AppCard, AppInput, AppTitle, AppParagraph } from '../../components/ui'
import ConfirmModal from '../../components/ui/ConfirmModal.vue'

const { t, locale } = useI18n()
const loading = ref(true)
const error = ref('')

const categories = ref<RefDto[]>([])
const types = ref<RefTypeDto[]>([])
const features = ref<RefFeatureDto[]>([])

const selectedCategoryId = ref('')
const selectedTypeId = ref('')

// Form states
const newCategory = ref({ code: '', label_fr: '', label_en: '', sort_order: 0 })
const newType = ref({ ref_category_id: '', code: '', label_fr: '', label_en: '', sort_order: 0 })
const newFeature = ref({ ref_type_id: '', code: '', label_fr: '', label_en: '', sort_order: 0 })

const creatingCategory = ref(false)
const creatingType = ref(false)
const creatingFeature = ref(false)
const confirmDelete = ref<{ kind: 'category' | 'type' | 'feature'; id: string; label: string } | null>(null)

const label = (r: { label_fr: string; label_en?: string }) => (locale.value === 'fr' ? r.label_fr : (r.label_en || r.label_fr))

async function loadCategories() {
  categories.value = await getRefCategories()
  if (!selectedCategoryId.value && categories.value.length) selectedCategoryId.value = categories.value[0].id
}

async function loadTypes() {
  types.value = selectedCategoryId.value ? await getRefTypes(selectedCategoryId.value) : []
  selectedTypeId.value = ''
}

async function loadFeatures() {
  features.value = selectedTypeId.value ? await getRefFeaturesByTypeId(selectedTypeId.value) : []
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    await loadCategories()
    await loadTypes()
    await loadFeatures()
  } catch (e) {
    error.value = getApiErrorMessage(e)
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

watch(selectedCategoryId, () => {
  loadTypes().then(loadFeatures)
})
watch(selectedTypeId, loadFeatures)

onMounted(load)

async function addCategory() {
  const { code, label_fr, label_en, sort_order } = newCategory.value
  if (!code?.trim() || !label_fr?.trim()) {
    toast.error(t('admin.references.code') + ' / ' + t('admin.references.labelFr') + ' requis')
    return
  }
  creatingCategory.value = true
  try {
    await createRefCategory({ code: code.trim(), label_fr: label_fr.trim(), label_en: label_en?.trim() || '', sort_order: sort_order || 0 })
    toast.success(t('admin.references.categoryCreated'))
    newCategory.value = { code: '', label_fr: '', label_en: '', sort_order: 0 }
    await loadCategories()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    creatingCategory.value = false
  }
}

async function addType() {
  newType.value.ref_category_id = selectedCategoryId.value
  const { ref_category_id, code, label_fr, label_en, sort_order } = newType.value
  if (!ref_category_id || !code?.trim() || !label_fr?.trim()) {
    toast.error(t('admin.references.category') + ' / ' + t('admin.references.code') + ' / ' + t('admin.references.labelFr') + ' requis')
    return
  }
  creatingType.value = true
  try {
    await createRefType({ ref_category_id, code: code.trim(), label_fr: label_fr.trim(), label_en: label_en?.trim() || '', sort_order: sort_order || 0 })
    toast.success(t('admin.references.typeCreated'))
    newType.value = { ref_category_id: newType.value.ref_category_id, code: '', label_fr: '', label_en: '', sort_order: 0 }
    await loadTypes()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    creatingType.value = false
  }
}

async function addFeature() {
  newFeature.value.ref_type_id = selectedTypeId.value
  const { ref_type_id, code, label_fr, label_en, sort_order } = newFeature.value
  if (!ref_type_id || !code?.trim() || !label_fr?.trim()) {
    toast.error(t('admin.references.type') + ' / ' + t('admin.references.code') + ' / ' + t('admin.references.labelFr') + ' requis')
    return
  }
  creatingFeature.value = true
  try {
    await createRefFeature({ ref_type_id, code: code.trim(), label_fr: label_fr.trim(), label_en: label_en?.trim() || '', sort_order: sort_order || 0 })
    toast.success(t('admin.references.featureCreated'))
    newFeature.value = { ref_type_id: newFeature.value.ref_type_id, code: '', label_fr: '', label_en: '', sort_order: 0 }
    await loadFeatures()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    creatingFeature.value = false
  }
}

async function doDelete() {
  if (!confirmDelete.value) return
  const { kind, id } = confirmDelete.value
  try {
    if (kind === 'category') await deleteRefCategory(id)
    else if (kind === 'type') await deleteRefType(id)
    else await deleteRefFeature(id)
    toast.success(t('admin.references.deleted'))
    confirmDelete.value = null
    await load()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  }
}

function openDeleteConfirm(kind: 'category' | 'type' | 'feature', item: RefDto | RefTypeDto | RefFeatureDto) {
  confirmDelete.value = { kind, id: item.id, label: label(item) }
}
</script>

<template>
  <div class="max-w-4xl space-y-8">
    <div>
      <AppTitle :level="2" class="flex items-center gap-2">
        <Settings2 class="w-7 h-7 text-[var(--color-accent)]" />
        {{ t('admin.references.title') }}
      </AppTitle>
      <AppParagraph muted class="mt-1">
        {{ t('admin.references.subtitle') }}
      </AppParagraph>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <AppCard v-if="loading" class="p-6">
      <p class="text-[var(--color-muted)]">Chargement…</p>
    </AppCard>

    <template v-else>
      <!-- Catégories -->
      <AppCard class="p-4">
        <h3 class="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
          <Layers class="w-4 h-4" />
          {{ t('admin.references.categories') }}
        </h3>
        <form class="flex flex-wrap items-end gap-3 mb-4" @submit.prevent="addCategory">
          <AppInput v-model="newCategory.code" :label="t('admin.references.code')" :placeholder="t('admin.references.codePlaceholder')" class="min-w-[120px]" />
          <AppInput v-model="newCategory.label_fr" :label="t('admin.references.labelFr')" class="min-w-[160px]" />
          <AppInput v-model="newCategory.label_en" :label="t('admin.references.labelEn')" class="min-w-[160px]" />
          <AppInput v-model.number="newCategory.sort_order" type="number" :label="t('admin.references.sortOrder')" class="w-20" />
          <AppButton type="submit" variant="primary" size="sm" :loading="creatingCategory">
            {{ t('admin.references.create') }}
          </AppButton>
        </form>
        <ul v-if="categories.length" class="space-y-1">
          <li
            v-for="c in categories"
            :key="c.id"
            class="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <span class="font-medium text-[var(--color-text)]">{{ label(c) }}</span>
            <span class="text-xs text-[var(--color-muted)]">{{ c.code }}</span>
            <div class="flex gap-2">
              <button
                type="button"
                class="p-1.5 rounded text-[var(--color-muted)] hover:bg-gray-200 dark:hover:bg-gray-700"
                :aria-label="t('admin.references.delete')"
                @click="openDeleteConfirm('category', c)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-[var(--color-muted)]">{{ t('admin.references.noCategories') }}</p>
      </AppCard>

      <!-- Types par catégorie -->
      <AppCard class="p-4">
        <h3 class="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
          <Layers class="w-4 h-4" />
          {{ t('admin.references.types') }}
        </h3>
        <div class="flex flex-wrap gap-4 mb-4">
          <div class="min-w-[200px]">
            <label class="block text-sm font-medium text-[var(--color-text)] mb-1">{{ t('admin.references.category') }}</label>
            <select
              v-model="selectedCategoryId"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[var(--color-text)]"
            >
              <option value="">{{ t('admin.references.selectCategory') }}</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ label(c) }}</option>
            </select>
          </div>
        </div>
        <form v-if="selectedCategoryId" class="flex flex-wrap items-end gap-3 mb-4" @submit.prevent="addType">
          <AppInput v-model="newType.code" :label="t('admin.references.code')" placeholder="ex. parcelle" class="min-w-[120px]" />
          <AppInput v-model="newType.label_fr" :label="t('admin.references.labelFr')" class="min-w-[160px]" />
          <AppInput v-model="newType.label_en" :label="t('admin.references.labelEn')" class="min-w-[160px]" />
          <AppInput v-model.number="newType.sort_order" type="number" :label="t('admin.references.sortOrder')" class="w-20" />
          <AppButton type="submit" variant="primary" size="sm" :loading="creatingType">
            {{ t('admin.references.create') }}
          </AppButton>
        </form>
        <ul v-if="types.length" class="space-y-1">
          <li
            v-for="ty in types"
            :key="ty.id"
            class="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <span class="font-medium text-[var(--color-text)]">{{ label(ty) }}</span>
            <span class="text-xs text-[var(--color-muted)]">{{ ty.code }}</span>
            <button
              type="button"
              class="p-1.5 rounded text-[var(--color-muted)] hover:bg-gray-200 dark:hover:bg-gray-700"
              :aria-label="t('admin.references.delete')"
              @click="openDeleteConfirm('type', ty)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </li>
        </ul>
        <p v-else-if="selectedCategoryId" class="text-sm text-[var(--color-muted)]">{{ t('admin.references.noTypes') }}</p>
      </AppCard>

      <!-- Équipements par type -->
      <AppCard class="p-4">
        <h3 class="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
          <Layers class="w-4 h-4" />
          {{ t('admin.references.features') }}
        </h3>
        <div class="flex flex-wrap gap-4 mb-4">
          <div class="min-w-[200px]">
            <label class="block text-sm font-medium text-[var(--color-text)] mb-1">{{ t('admin.references.type') }}</label>
            <select
              v-model="selectedTypeId"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[var(--color-text)]"
            >
              <option value="">{{ t('admin.references.selectType') }}</option>
              <option v-for="ty in types" :key="ty.id" :value="ty.id">{{ label(ty) }}</option>
            </select>
          </div>
        </div>
        <form v-if="selectedTypeId" class="flex flex-wrap items-end gap-3 mb-4" @submit.prevent="addFeature">
          <AppInput v-model="newFeature.code" :label="t('admin.references.code')" placeholder="ex. Titre foncier" class="min-w-[140px]" />
          <AppInput v-model="newFeature.label_fr" :label="t('admin.references.labelFr')" class="min-w-[160px]" />
          <AppInput v-model="newFeature.label_en" :label="t('admin.references.labelEn')" class="min-w-[160px]" />
          <AppInput v-model.number="newFeature.sort_order" type="number" :label="t('admin.references.sortOrder')" class="w-20" />
          <AppButton type="submit" variant="primary" size="sm" :loading="creatingFeature">
            {{ t('admin.references.create') }}
          </AppButton>
        </form>
        <ul v-if="features.length" class="space-y-1">
          <li
            v-for="f in features"
            :key="f.id"
            class="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <span class="font-medium text-[var(--color-text)]">{{ label(f) }}</span>
            <span class="text-xs text-[var(--color-muted)]">{{ f.code }}</span>
            <button
              type="button"
              class="p-1.5 rounded text-[var(--color-muted)] hover:bg-gray-200 dark:hover:bg-gray-700"
              :aria-label="t('admin.references.delete')"
              @click="openDeleteConfirm('feature', f)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </li>
        </ul>
        <p v-else-if="selectedTypeId" class="text-sm text-[var(--color-muted)]">{{ t('admin.references.noFeatures') }}</p>
      </AppCard>
    </template>

    <ConfirmModal
      :show="!!confirmDelete"
      :title="t('admin.references.confirmDelete')"
      :message="confirmDelete ? confirmDelete.label : ''"
      :confirm-label="t('admin.references.delete')"
      variant="danger"
      @close="confirmDelete = null"
      @confirm="doDelete"
    />
  </div>
</template>
