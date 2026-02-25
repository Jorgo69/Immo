<script setup lang="ts">
/**
 * Configuration des référentiels (Admin) — Catégories, Types par catégorie, Équipements par type.
 * CRUD complet : ajout d'une catégorie (ex. Vente), d'un type (ex. Parcelle), d'un équipement (ex. Titre foncier).
 */
import { ref, computed, onMounted, watch } from 'vue'
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
  getPropertyTypes,
  getUnitTypes,
  createPropertyType,
  createUnitType,
  deletePropertyType,
  deleteUnitType,
  updateRefCategory,
  updateRefType,
  updateRefFeature,
  updatePropertyType,
  updateUnitType,
  type PropertyTypeDto,
  type UnitTypeDto,
} from '../../services/references.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, AppCard, AppInput, AppSelect, AppTitle, AppParagraph } from '../../components/ui'
import ConfirmModal from '../../components/ui/ConfirmModal.vue'

const { t, locale } = useI18n()
const loading = ref(true)
const error = ref('')

const categories = ref<RefDto[]>([])
const types = ref<RefTypeDto[]>([])
const features = ref<RefFeatureDto[]>([])
const propertyTypes = ref<PropertyTypeDto[]>([])
const unitTypes = ref<UnitTypeDto[]>([])

const selectedCategoryId = ref('')
const selectedTypeId = ref('')

// Form states
const newCategory = ref({ code: '', label_fr: '', label_en: '', sort_order: 0 })
const newType = ref({ ref_category_id: '', code: '', label_fr: '', label_en: '', sort_order: 0 })
const newFeature = ref({ ref_type_id: '', code: '', label_fr: '', label_en: '', sort_order: 0 })
const newPropertyType = ref({ code: '', label_fr: '', label_en: '', sort_order: 0 })
const newUnitType = ref({ property_type_id: '', code: '', label_fr: '', label_en: '', sort_order: 0 })

const creatingCategory = ref(false)
const creatingType = ref(false)
const creatingFeature = ref(false)
const creatingPropertyType = ref(false)
const creatingUnitType = ref(false)
const editingCategoryId = ref('')
const editingPropertyTypeId = ref('')
const editingUnitTypeId = ref('')
const editingTypeId = ref('')
const editingFeatureId = ref('')

const confirmDelete = ref<
  { kind: 'category' | 'type' | 'feature' | 'propertyType' | 'unitType'; id: string; label: string } | null
>(null)

const label = (r: { label_fr: string; label_en?: string }) => (locale.value === 'fr' ? r.label_fr : (r.label_en || r.label_fr))

const categoryOptions = computed(() =>
  categories.value.map((c) => ({ value: c.id, label: label(c) }))
)
const typeOptionsForSelect = computed(() =>
  types.value.map((ty) => ({ value: ty.id, label: label(ty) }))
)

const propertyTypeOptions = computed(() => propertyTypes.value.map((pt) => ({ value: pt.id, label: label(pt) })))

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

async function loadPropertyTypes() {
  propertyTypes.value = await getPropertyTypes()
}

async function loadUnitTypes() {
  unitTypes.value = await getUnitTypes()
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    await Promise.all([loadCategories(), loadPropertyTypes(), loadUnitTypes()])
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

async function saveCategory() {
  const { code, label_fr, label_en, sort_order } = newCategory.value
  if (!code?.trim() || !label_fr?.trim()) {
    toast.error(t('admin.references.code') + ' / ' + t('admin.references.labelFr') + ' requis')
    return
  }
  creatingCategory.value = true
  try {
    const payload = { code: code.trim(), label_fr: label_fr.trim(), label_en: label_en?.trim() || '', sort_order: sort_order || 0 }
    if (editingCategoryId.value) {
      await updateRefCategory(editingCategoryId.value, payload)
      toast.success(t('admin.references.updated'))
    } else {
      await createRefCategory(payload)
      toast.success(t('admin.references.categoryCreated'))
    }
    cancelEditCategory()
    await loadCategories()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    creatingCategory.value = false
  }
}

function startEditCategory(c: RefDto) {
  editingCategoryId.value = c.id
  newCategory.value = { code: c.code, label_fr: c.label_fr, label_en: c.label_en || '', sort_order: c.sort_order || 0 }
}

function cancelEditCategory() {
  editingCategoryId.value = ''
  newCategory.value = { code: '', label_fr: '', label_en: '', sort_order: 0 }
}

async function saveType() {
  newType.value.ref_category_id = selectedCategoryId.value
  const { ref_category_id, code, label_fr, label_en, sort_order } = newType.value
  if (!ref_category_id || !code?.trim() || !label_fr?.trim()) {
    toast.error(t('admin.references.category') + ' / ' + t('admin.references.code') + ' / ' + t('admin.references.labelFr') + ' requis')
    return
  }
  creatingType.value = true
  try {
    const payload = { ref_category_id, code: code.trim(), label_fr: label_fr.trim(), label_en: label_en?.trim() || '', sort_order: sort_order || 0 }
    if (editingTypeId.value) {
      await updateRefType(editingTypeId.value, payload)
      toast.success(t('admin.references.updated'))
    } else {
      await createRefType(payload)
      toast.success(t('admin.references.typeCreated'))
    }
    cancelEditType()
    await loadTypes()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    creatingType.value = false
  }
}

function startEditType(ty: RefTypeDto) {
  editingTypeId.value = ty.id
  newType.value = { ref_category_id: ty.ref_category_id, code: ty.code, label_fr: ty.label_fr, label_en: ty.label_en || '', sort_order: ty.sort_order || 0 }
}

function cancelEditType() {
  editingTypeId.value = ''
  newType.value = { ref_category_id: selectedCategoryId.value, code: '', label_fr: '', label_en: '', sort_order: 0 }
}

async function saveFeature() {
  newFeature.value.ref_type_id = selectedTypeId.value
  const { ref_type_id, code, label_fr, label_en, sort_order } = newFeature.value
  if (!ref_type_id || !code?.trim() || !label_fr?.trim()) {
    toast.error(t('admin.references.type') + ' / ' + t('admin.references.code') + ' / ' + t('admin.references.labelFr') + ' requis')
    return
  }
  creatingFeature.value = true
  try {
    const payload = { ref_type_id, code: code.trim(), label_fr: label_fr.trim(), label_en: label_en?.trim() || '', sort_order: sort_order || 0 }
    if (editingFeatureId.value) {
      await updateRefFeature(editingFeatureId.value, payload)
      toast.success(t('admin.references.updated'))
    } else {
      await createRefFeature(payload)
      toast.success(t('admin.references.featureCreated'))
    }
    cancelEditFeature()
    await loadFeatures()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    creatingFeature.value = false
  }
}

function startEditFeature(f: RefFeatureDto) {
  editingFeatureId.value = f.id
  newFeature.value = { ref_type_id: f.ref_type_id, code: f.code, label_fr: f.label_fr, label_en: f.label_en || '', sort_order: f.sort_order || 0 }
}

function cancelEditFeature() {
  editingFeatureId.value = ''
  newFeature.value = { ref_type_id: selectedTypeId.value, code: '', label_fr: '', label_en: '', sort_order: 0 }
}

async function savePropertyType() {
  const { code, label_fr, label_en, sort_order } = newPropertyType.value
  if (!code?.trim() || !label_fr?.trim()) {
    toast.error(t('admin.references.code') + ' / ' + t('admin.references.labelFr') + ' requis')
    return
  }
  creatingPropertyType.value = true
  try {
    const payload = { code: code.trim(), label_fr: label_fr.trim(), label_en: label_en?.trim() || '', sort_order: sort_order || 0 }
    if (editingPropertyTypeId.value) {
      await updatePropertyType(editingPropertyTypeId.value, payload)
      toast.success(t('admin.references.updated'))
    } else {
      await createPropertyType(payload)
      toast.success(t('admin.references.propertyTypeCreated'))
    }
    cancelEditPropertyType()
    await loadPropertyTypes()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    creatingPropertyType.value = false
  }
}

function startEditPropertyType(pt: PropertyTypeDto) {
  editingPropertyTypeId.value = pt.id
  newPropertyType.value = { code: pt.code, label_fr: pt.label_fr, label_en: pt.label_en || '', sort_order: pt.sort_order || 0 }
}

function cancelEditPropertyType() {
  editingPropertyTypeId.value = ''
  newPropertyType.value = { code: '', label_fr: '', label_en: '', sort_order: 0 }
}

async function saveUnitType() {
  const { code, label_fr, label_en, sort_order } = newUnitType.value
  if (!code?.trim() || !label_fr?.trim()) {
    toast.error(t('admin.references.code') + ' / ' + t('admin.references.labelFr') + ' requis')
    return
  }
  creatingUnitType.value = true
  try {
    const payload = { 
      property_type_id: newUnitType.value.property_type_id || undefined,
      code: code.trim(), 
      label_fr: label_fr.trim(), 
      label_en: label_en?.trim() || '', 
      sort_order: sort_order || 0 
    }
    if (editingUnitTypeId.value) {
      await updateUnitType(editingUnitTypeId.value, payload)
      toast.success(t('admin.references.updated'))
    } else {
      await createUnitType(payload)
      toast.success(t('admin.references.unitTypeCreated'))
    }
    cancelEditUnitType()
    await loadUnitTypes()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    creatingUnitType.value = false
  }
}

function startEditUnitType(ut: UnitTypeDto) {
  editingUnitTypeId.value = ut.id
  newUnitType.value = { 
    property_type_id: ut.property_type_id || '',
    code: ut.code, 
    label_fr: ut.label_fr, 
    label_en: ut.label_en || '', 
    sort_order: ut.sort_order || 0 
  }
}

function cancelEditUnitType() {
  editingUnitTypeId.value = ''
  newUnitType.value = { property_type_id: '', code: '', label_fr: '', label_en: '', sort_order: 0 }
}

async function doDelete() {
  if (!confirmDelete.value) return
  const { kind, id } = confirmDelete.value
  try {
    if (kind === 'category') await deleteRefCategory(id)
    else if (kind === 'type') await deleteRefType(id)
    else if (kind === 'feature') await deleteRefFeature(id)
    else if (kind === 'propertyType') await deletePropertyType(id)
    else if (kind === 'unitType') await deleteUnitType(id)
    toast.success(t('admin.references.deleted'))
    confirmDelete.value = null
    await load()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  }
}

function openDeleteConfirm(
  kind: 'category' | 'type' | 'feature' | 'propertyType' | 'unitType',
  item: RefDto | RefTypeDto | RefFeatureDto | PropertyTypeDto | UnitTypeDto,
) {
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
        <form class="flex flex-wrap items-end gap-3 mb-4" @submit.prevent="saveCategory">
          <AppInput v-model="newCategory.code" :label="t('admin.references.code')" :placeholder="t('admin.references.codePlaceholder')" class="min-w-[120px]" />
          <AppInput v-model="newCategory.label_fr" :label="t('admin.references.labelFr')" class="min-w-[160px]" />
          <AppInput v-model="newCategory.label_en" :label="t('admin.references.labelEn')" class="min-w-[160px]" />
          <AppInput :model-value="newCategory.sort_order" type="number" :label="t('admin.references.sortOrder')" class="w-20" @update:model-value="(v) => (newCategory.sort_order = Number(v) || 0)" />
          <div class="flex gap-2">
            <AppButton type="submit" variant="primary" size="sm" :loading="creatingCategory">
              {{ editingCategoryId ? t('admin.references.save') : t('admin.references.create') }}
            </AppButton>
            <AppButton v-if="editingCategoryId" type="button" variant="ghost" size="sm" @click="cancelEditCategory">
              {{ t('common.cancel') }}
            </AppButton>
          </div>
        </form>
        <ul v-if="categories.length" class="space-y-1">
          <li
            v-for="c in categories"
            :key="c.id"
            class="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            @click="startEditCategory(c)"
          >
            <div class="flex flex-col">
              <span class="font-medium text-[var(--color-text)]">{{ label(c) }}</span>
              <span v-if="c.label_en && locale === 'fr'" class="text-[10px] text-[var(--color-muted)] italic">EN: {{ c.label_en }}</span>
              <span v-if="c.label_fr && locale === 'en'" class="text-[10px] text-[var(--color-muted)] italic">FR: {{ c.label_fr }}</span>
            </div>
            <span class="text-xs text-[var(--color-muted)]">{{ c.code }}</span>
            <div class="flex gap-2" @click.stop>
              <AppButton type="button" variant="ghost" size="sm" :aria-label="t('admin.references.delete')" @click="openDeleteConfirm('category', c)">
                <Trash2 class="w-4 h-4" />
              </AppButton>
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-[var(--color-muted)]">{{ t('admin.references.noCategories') }}</p>
      </AppCard>

      <!-- Types de bâtiments (PropertyTypes) -->
      <AppCard class="p-4">
        <h3 class="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
          <Layers class="w-4 h-4" />
          {{ t('admin.references.propertyTypes') }}
        </h3>
        <form class="flex flex-wrap items-end gap-3 mb-4" @submit.prevent="savePropertyType">
          <AppInput v-model="newPropertyType.code" :label="t('admin.references.code')" class="min-w-[120px]" />
          <AppInput v-model="newPropertyType.label_fr" :label="t('admin.references.labelFr')" class="min-w-[160px]" />
          <AppInput v-model="newPropertyType.label_en" :label="t('admin.references.labelEn')" class="min-w-[160px]" />
          <AppInput
            :model-value="newPropertyType.sort_order"
            type="number"
            :label="t('admin.references.sortOrder')"
            class="w-20"
            @update:model-value="(v) => (newPropertyType.sort_order = Number(v) || 0)"
          />
          <div class="flex gap-2">
            <AppButton type="submit" variant="primary" size="sm" :loading="creatingPropertyType">
              {{ editingPropertyTypeId ? t('admin.references.save') : t('admin.references.create') }}
            </AppButton>
            <AppButton v-if="editingPropertyTypeId" type="button" variant="ghost" size="sm" @click="cancelEditPropertyType">
              {{ t('common.cancel') }}
            </AppButton>
          </div>
        </form>
        <ul v-if="propertyTypes.length" class="space-y-1">
          <li
            v-for="pt in propertyTypes"
            :key="pt.id"
            class="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            @click="startEditPropertyType(pt)"
          >
            <div class="flex flex-col">
              <span class="font-medium text-[var(--color-text)]">{{ label(pt) }}</span>
              <span v-if="pt.label_en && locale === 'fr'" class="text-[10px] text-[var(--color-muted)] italic">EN: {{ pt.label_en }}</span>
              <span v-if="pt.label_fr && locale === 'en'" class="text-[10px] text-[var(--color-muted)] italic">FR: {{ pt.label_fr }}</span>
            </div>
            <span class="text-xs text-[var(--color-muted)]">{{ pt.code }}</span>
            <AppButton
              type="button"
              variant="ghost"
              size="sm"
              :aria-label="t('admin.references.delete')"
              @click.stop="openDeleteConfirm('propertyType', pt)"
            >
              <Trash2 class="w-4 h-4" />
            </AppButton>
          </li>
        </ul>
        <p v-else class="text-sm text-[var(--color-muted)]">
          {{ t('admin.references.noPropertyTypes') }}
        </p>
      </AppCard>

      <!-- Types d'unités (UnitTypes) -->
      <AppCard class="p-4">
        <h3 class="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
          <Layers class="w-4 h-4" />
          {{ t('admin.references.unitTypes') }}
        </h3>
        <form class="flex flex-wrap items-end gap-3 mb-4" @submit.prevent="saveUnitType">
          <AppInput v-model="newUnitType.code" :label="t('admin.references.code')" class="min-w-[120px]" />
          <AppInput v-model="newUnitType.label_fr" :label="t('admin.references.labelFr')" class="min-w-[160px]" />
          <AppInput v-model="newUnitType.label_en" :label="t('admin.references.labelEn')" class="min-w-[160px]" />
          <AppInput
            :model-value="newUnitType.sort_order"
            type="number"
            :label="t('admin.references.sortOrder')"
            class="w-20"
            @update:model-value="(v) => (newUnitType.sort_order = Number(v) || 0)"
          />
          <AppSelect
            v-model="newUnitType.property_type_id"
            :label="t('admin.references.propertyType') + ' (Optionnel)'"
            :options="propertyTypeOptions"
            placeholder="—"
            class="min-w-[160px]"
          />
          <div class="flex gap-2">
            <AppButton type="submit" variant="primary" size="sm" :loading="creatingUnitType">
              {{ editingUnitTypeId ? t('admin.references.save') : t('admin.references.create') }}
            </AppButton>
            <AppButton v-if="editingUnitTypeId" type="button" variant="ghost" size="sm" @click="cancelEditUnitType">
              {{ t('common.cancel') }}
            </AppButton>
          </div>
        </form>
        <ul v-if="unitTypes.length" class="space-y-1">
          <li
            v-for="ut in unitTypes"
            :key="ut.id"
            class="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            @click="startEditUnitType(ut)"
          >
            <div class="flex flex-col">
              <span class="font-medium text-[var(--color-text)]">{{ label(ut) }}</span>
              <span v-if="ut.label_en && locale === 'fr'" class="text-[10px] text-[var(--color-muted)] italic">EN: {{ ut.label_en }}</span>
              <span v-if="ut.label_fr && locale === 'en'" class="text-[10px] text-[var(--color-muted)] italic">FR: {{ ut.label_fr }}</span>
              <span v-if="ut.property_type_id" class="text-[10px] font-semibold text-[var(--color-accent)] mt-1">
                Parent: {{ label(propertyTypes.find(p => p.id === ut.property_type_id) || { label_fr: '?' }) }}
              </span>
            </div>
            <span class="text-xs text-[var(--color-muted)]">{{ ut.code }}</span>
            <AppButton
              type="button"
              variant="ghost"
              size="sm"
              :aria-label="t('admin.references.delete')"
              @click.stop="openDeleteConfirm('unitType', ut)"
            >
              <Trash2 class="w-4 h-4" />
            </AppButton>
          </li>
        </ul>
        <p v-else class="text-sm text-[var(--color-muted)]">
          {{ t('admin.references.noUnitTypes') }}
        </p>
      </AppCard>

      <!-- Types par catégorie -->
      <AppCard class="p-4">
        <h3 class="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
          <Layers class="w-4 h-4" />
          {{ t('admin.references.types') }}
        </h3>
        <div class="flex flex-wrap gap-4 mb-4">
          <div class="min-w-[200px]">
            <AppSelect
              v-model="selectedCategoryId"
              :label="t('admin.references.category')"
              :options="categoryOptions"
              :placeholder="t('admin.references.selectCategory')"
            />
          </div>
        </div>
        <form v-if="selectedCategoryId" class="flex flex-wrap items-end gap-3 mb-4" @submit.prevent="saveType">
          <AppInput v-model="newType.code" :label="t('admin.references.code')" placeholder="ex. parcelle" class="min-w-[120px]" />
          <AppInput v-model="newType.label_fr" :label="t('admin.references.labelFr')" class="min-w-[160px]" />
          <AppInput v-model="newType.label_en" :label="t('admin.references.labelEn')" class="min-w-[160px]" />
          <AppInput :model-value="newType.sort_order" type="number" :label="t('admin.references.sortOrder')" class="w-20" @update:model-value="(v) => (newType.sort_order = Number(v) || 0)" />
          <div class="flex gap-2">
            <AppButton type="submit" variant="primary" size="sm" :loading="creatingType">
              {{ editingTypeId ? t('admin.references.save') : t('admin.references.create') }}
            </AppButton>
            <AppButton v-if="editingTypeId" type="button" variant="ghost" size="sm" @click="cancelEditType">
              {{ t('common.cancel') }}
            </AppButton>
          </div>
        </form>
        <ul v-if="types.length" class="space-y-1">
          <li
            v-for="ty in types"
            :key="ty.id"
            class="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            @click="startEditType(ty)"
          >
            <div class="flex flex-col">
              <span class="font-medium text-[var(--color-text)]">{{ label(ty) }}</span>
              <span v-if="ty.label_en && locale === 'fr'" class="text-[10px] text-[var(--color-muted)] italic">EN: {{ ty.label_en }}</span>
              <span v-if="ty.label_fr && locale === 'en'" class="text-[10px] text-[var(--color-muted)] italic">FR: {{ ty.label_fr }}</span>
            </div>
            <span class="text-xs text-[var(--color-muted)]">{{ ty.code }}</span>
            <AppButton type="button" variant="ghost" size="sm" :aria-label="t('admin.references.delete')" @click.stop="openDeleteConfirm('type', ty)">
              <Trash2 class="w-4 h-4" />
            </AppButton>
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
            <AppSelect
              v-model="selectedTypeId"
              :label="t('admin.references.type')"
              :options="typeOptionsForSelect"
              :placeholder="t('admin.references.selectType')"
            />
          </div>
        </div>
        <form v-if="selectedTypeId" class="flex flex-wrap items-end gap-3 mb-4" @submit.prevent="saveFeature">
          <AppInput v-model="newFeature.code" :label="t('admin.references.code')" placeholder="ex. Titre foncier" class="min-w-[140px]" />
          <AppInput v-model="newFeature.label_fr" :label="t('admin.references.labelFr')" class="min-w-[160px]" />
          <AppInput v-model="newFeature.label_en" :label="t('admin.references.labelEn')" class="min-w-[160px]" />
          <AppInput :model-value="newFeature.sort_order" type="number" :label="t('admin.references.sortOrder')" class="w-20" @update:model-value="(v) => (newFeature.sort_order = Number(v) || 0)" />
          <div class="flex gap-2">
            <AppButton type="submit" variant="primary" size="sm" :loading="creatingFeature">
              {{ editingFeatureId ? t('admin.references.save') : t('admin.references.create') }}
            </AppButton>
            <AppButton v-if="editingFeatureId" type="button" variant="ghost" size="sm" @click="cancelEditFeature">
              {{ t('common.cancel') }}
            </AppButton>
          </div>
        </form>
        <ul v-if="features.length" class="space-y-1">
          <li
            v-for="f in features"
            :key="f.id"
            class="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            @click="startEditFeature(f)"
          >
            <div class="flex flex-col">
              <span class="font-medium text-[var(--color-text)]">{{ label(f) }}</span>
              <span v-if="f.label_en && locale === 'fr'" class="text-[10px] text-[var(--color-muted)] italic">EN: {{ f.label_en }}</span>
              <span v-if="f.label_fr && locale === 'en'" class="text-[10px] text-[var(--color-muted)] italic">FR: {{ f.label_fr }}</span>
            </div>
            <span class="text-xs text-[var(--color-muted)]">{{ f.code }}</span>
            <AppButton type="button" variant="ghost" size="sm" :aria-label="t('admin.references.delete')" @click.stop="openDeleteConfirm('feature', f)">
              <Trash2 class="w-4 h-4" />
            </AppButton>
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
