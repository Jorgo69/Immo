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
import { AppButton } from '../../components/ui'
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
  <main class="min-h-screen bg-ui-background pb-24 pt-8 dark:bg-brand-dark lg:pb-8 relative">
    <!-- Subtle Background Glow -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-30">
      <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary-emerald blur-[120px] rounded-full" />
      <div class="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-500 blur-[100px] rounded-full" />
    </div>

    <div class="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
      <header>
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-2xl bg-primary-emerald shadow-glow-emerald text-white">
            <Settings2 class="w-8 h-8" />
          </div>
          <div>
            <h1 class="text-3xl font-extrabold tracking-tight text-[var(--color-text)] lg:text-4xl">
              {{ t('admin.references.title') }}
            </h1>
            <p class="mt-1 text-ui-muted font-medium">
              {{ t('admin.references.subtitle') }}
            </p>
          </div>
        </div>
      </header>

      <p v-if="error" class="text-sm font-bold text-danger-red">{{ error }}</p>

      <AppCardPremium v-if="loading" class="py-20 text-center">
        <p class="text-ui-muted font-bold animate-pulse">{{ t('profile.loading') }}</p>
      </AppCardPremium>

      <template v-else>
        <div class="grid grid-cols-1 gap-10">
          
          <!-- Catégories -->
          <AppCardPremium>
            <template #title>
              <h3 class="text-xl font-bold text-[var(--color-text)] flex items-center gap-3">
                <div class="p-2 rounded-xl bg-primary-emerald/10 text-primary-emerald">
                  <Layers class="w-6 h-6" />
                </div>
                {{ t('admin.references.categories') }}
              </h3>
            </template>
            <form class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end gap-6 mb-8" @submit.prevent="saveCategory">
              <AppInputPremium v-model="newCategory.code" :label="t('admin.references.code')" :placeholder="t('admin.references.codePlaceholder')" />
              <AppInputPremium v-model="newCategory.label_fr" :label="t('admin.references.labelFr')" />
              <AppInputPremium v-model="newCategory.label_en" :label="t('admin.references.labelEn')" />
              <div class="flex items-end gap-3">
                <AppInputPremium :model-value="newCategory.sort_order" type="number" :label="t('admin.references.sortOrder')" class="flex-1" @update:model-value="(v: any) => (newCategory.sort_order = Number(v) || 0)" />
                <div class="flex gap-2 mb-0.5">
                  <AppButton type="submit" variant="primary" class="h-[52px] px-6 font-bold shadow-glow-emerald" :loading="creatingCategory">
                    {{ editingCategoryId ? t('admin.references.save') : t('admin.references.create') }}
                  </AppButton>
                  <AppButton v-if="editingCategoryId" type="button" variant="ghost" class="h-[52px]" @click="cancelEditCategory">
                    {{ t('common.cancel') }}
                  </AppButton>
                </div>
              </div>
            </form>
            <div v-if="categories.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="c in categories"
                :key="c.id"
                class="group flex items-center justify-between p-4 rounded-2xl border border-ui-border/40 transition-all hover:bg-ui-background dark:border-ui-border-dark/40 dark:hover:bg-ui-surface-dark/50 cursor-pointer"
                @click="startEditCategory(c)"
              >
                <div class="flex flex-col min-w-0">
                  <span class="font-bold text-[var(--color-text)] text-lg truncate">{{ label(c) }}</span>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] font-bold text-ui-muted uppercase tracking-wider bg-ui-background dark:bg-ui-surface-dark px-2 py-0.5 rounded-lg">{{ c.code }}</span>
                    <span v-if="c.label_en && locale === 'fr'" class="text-[10px] text-ui-muted font-medium italic">EN: {{ c.label_en }}</span>
                    <span v-if="c.label_fr && locale === 'en'" class="text-[10px] text-ui-muted font-medium italic">FR: {{ c.label_fr }}</span>
                  </div>
                </div>
                <div @click.stop>
                  <AppButton variant="ghost" size="sm" class="text-danger-red hover:bg-danger-red/10" @click="openDeleteConfirm('category', c)">
                    <Trash2 class="w-5 h-5" />
                  </AppButton>
                </div>
              </div>
            </div>
            <p v-else class="py-10 text-center text-ui-muted italic font-medium">{{ t('admin.references.noCategories') }}</p>
          </AppCardPremium>

          <!-- Types de bâtiments (PropertyTypes) -->
          <AppCardPremium>
            <template #title>
              <h3 class="text-xl font-bold text-[var(--color-text)] flex items-center gap-3">
                <div class="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Layers class="w-6 h-6" />
                </div>
                {{ t('admin.references.propertyTypes') }}
              </h3>
            </template>
            <form class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end gap-6 mb-8" @submit.prevent="savePropertyType">
              <AppInputPremium v-model="newPropertyType.code" :label="t('admin.references.code')" />
              <AppInputPremium v-model="newPropertyType.label_fr" :label="t('admin.references.labelFr')" />
              <AppInputPremium v-model="newPropertyType.label_en" :label="t('admin.references.labelEn')" />
              <div class="flex items-end gap-3">
                <AppInputPremium :model-value="newPropertyType.sort_order" type="number" :label="t('admin.references.sortOrder')" class="flex-1" @update:model-value="(v: any) => (newPropertyType.sort_order = Number(v) || 0)" />
                <div class="flex gap-2 mb-0.5">
                  <AppButton type="submit" variant="primary" class="h-[52px] px-6 font-bold shadow-glow-emerald" :loading="creatingPropertyType">
                    {{ editingPropertyTypeId ? t('admin.references.save') : t('admin.references.create') }}
                  </AppButton>
                  <AppButton v-if="editingPropertyTypeId" type="button" variant="ghost" class="h-[52px]" @click="cancelEditPropertyType">
                    {{ t('common.cancel') }}
                  </AppButton>
                </div>
              </div>
            </form>
            <div v-if="propertyTypes.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="pt in propertyTypes"
                :key="pt.id"
                class="group flex items-center justify-between p-4 rounded-2xl border border-ui-border/40 transition-all hover:bg-ui-background dark:border-ui-border-dark/40 dark:hover:bg-ui-surface-dark/50 cursor-pointer"
                @click="startEditPropertyType(pt)"
              >
                <div class="flex flex-col min-w-0">
                  <span class="font-bold text-[var(--color-text)] text-lg truncate">{{ label(pt) }}</span>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] font-bold text-ui-muted uppercase tracking-wider bg-ui-background dark:bg-ui-surface-dark px-2 py-0.5 rounded-lg">{{ pt.code }}</span>
                    <span v-if="pt.label_en && locale === 'fr'" class="text-[10px] text-ui-muted font-medium italic">EN: {{ pt.label_en }}</span>
                    <span v-if="pt.label_fr && locale === 'en'" class="text-[10px] text-ui-muted font-medium italic">FR: {{ pt.label_fr }}</span>
                  </div>
                </div>
                <div @click.stop>
                  <AppButton variant="ghost" size="sm" class="text-danger-red hover:bg-danger-red/10" @click="openDeleteConfirm('propertyType', pt)">
                    <Trash2 class="w-5 h-5" />
                  </AppButton>
                </div>
              </div>
            </div>
            <p v-else class="py-10 text-center text-ui-muted italic font-medium">{{ t('admin.references.noPropertyTypes') }}</p>
          </AppCardPremium>

          <!-- Types d'unités (UnitTypes) -->
          <AppCardPremium>
            <template #title>
              <h3 class="text-xl font-bold text-[var(--color-text)] flex items-center gap-3">
                <div class="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                  <Layers class="w-6 h-6" />
                </div>
                {{ t('admin.references.unitTypes') }}
              </h3>
            </template>
            <form class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end gap-6 mb-8" @submit.prevent="saveUnitType">
              <AppInputPremium v-model="newUnitType.code" :label="t('admin.references.code')" />
              <AppInputPremium v-model="newUnitType.label_fr" :label="t('admin.references.labelFr')" />
              <AppInputPremium v-model="newUnitType.label_en" :label="t('admin.references.labelEn')" />
              <AppSelectPremium v-model="newUnitType.property_type_id" :label="t('admin.references.propertyType')" :options="propertyTypeOptions" :placeholder="t('common.optional')" />
              <div class="flex items-end gap-3 lg:col-span-1">
                <AppInputPremium :model-value="newUnitType.sort_order" type="number" :label="t('admin.references.sortOrder')" class="flex-1" @update:model-value="(v: any) => (newUnitType.sort_order = Number(v) || 0)" />
                <div class="flex gap-2 mb-0.5">
                  <AppButton type="submit" variant="primary" class="h-[52px] px-6 font-bold shadow-glow-emerald" :loading="creatingUnitType">
                    {{ editingUnitTypeId ? t('admin.references.save') : t('admin.references.create') }}
                  </AppButton>
                  <AppButton v-if="editingUnitTypeId" type="button" variant="ghost" class="h-[52px]" @click="cancelEditUnitType">
                    {{ t('common.cancel') }}
                  </AppButton>
                </div>
              </div>
            </form>
            <div v-if="unitTypes.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="ut in unitTypes"
                :key="ut.id"
                class="group flex items-center justify-between p-4 rounded-2xl border border-ui-border/40 transition-all hover:bg-ui-background dark:border-ui-border-dark/40 dark:hover:bg-ui-surface-dark/50 cursor-pointer"
                @click="startEditUnitType(ut)"
              >
                <div class="flex flex-col min-w-0">
                  <span class="font-bold text-[var(--color-text)] text-lg truncate">{{ label(ut) }}</span>
                  <div class="flex flex-wrap items-center gap-2 mt-1">
                    <span class="text-[10px] font-bold text-ui-muted uppercase tracking-wider bg-ui-background dark:bg-ui-surface-dark px-2 py-0.5 rounded-lg">{{ ut.code }}</span>
                    <span v-if="ut.property_type_id" class="text-[10px] font-bold text-orange-500 uppercase tracking-widest px-2 py-0.5 rounded-lg bg-orange-500/10">
                      {{ label(propertyTypes.find(p => p.id === ut.property_type_id) || { label_fr: '?' }) }}
                    </span>
                    <span v-if="ut.label_en && locale === 'fr'" class="text-[10px] text-ui-muted font-medium italic">EN: {{ ut.label_en }}</span>
                    <span v-if="ut.label_fr && locale === 'en'" class="text-[10px] text-ui-muted font-medium italic">FR: {{ ut.label_fr }}</span>
                  </div>
                </div>
                <div @click.stop>
                  <AppButton variant="ghost" size="sm" class="text-danger-red hover:bg-danger-red/10" @click="openDeleteConfirm('unitType', ut)">
                    <Trash2 class="w-5 h-5" />
                  </AppButton>
                </div>
              </div>
            </div>
            <p v-else class="py-10 text-center text-ui-muted italic font-medium">{{ t('admin.references.noUnitTypes') }}</p>
          </AppCardPremium>

          <!-- Types par catégorie -->
          <AppCardPremium>
            <template #title>
              <h3 class="text-xl font-bold text-[var(--color-text)] flex items-center gap-3">
                <div class="p-2 rounded-xl bg-primary-emerald/10 text-primary-emerald">
                  <Layers class="w-6 h-6" />
                </div>
                {{ t('admin.references.types') }}
              </h3>
            </template>
            <div class="flex flex-col gap-6">
              <div class="max-w-md">
                <AppSelectPremium
                  v-model="selectedCategoryId"
                  :label="t('admin.references.category')"
                  :options="categoryOptions"
                  :placeholder="t('admin.references.selectCategory')"
                />
              </div>
              
              <form v-if="selectedCategoryId" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end gap-6 border-t border-ui-border/50 dark:border-ui-border-dark/50 pt-8 mt-4" @submit.prevent="saveType">
                <AppInputPremium v-model="newType.code" :label="t('admin.references.code')" placeholder="ex. parcelle" />
                <AppInputPremium v-model="newType.label_fr" :label="t('admin.references.labelFr')" />
                <AppInputPremium v-model="newType.label_en" :label="t('admin.references.labelEn')" />
                <div class="flex items-end gap-3">
                  <AppInputPremium :model-value="newType.sort_order" type="number" :label="t('admin.references.sortOrder')" class="flex-1" @update:model-value="(v: any) => (newType.sort_order = Number(v) || 0)" />
                  <div class="flex gap-2 mb-0.5">
                    <AppButton type="submit" variant="primary" class="h-[52px] px-6 font-bold shadow-glow-emerald" :loading="creatingType">
                      {{ editingTypeId ? t('admin.references.save') : t('admin.references.create') }}
                    </AppButton>
                    <AppButton v-if="editingTypeId" type="button" variant="ghost" class="h-[52px]" @click="cancelEditType">
                      {{ t('common.cancel') }}
                    </AppButton>
                  </div>
                </div>
              </form>

              <div v-if="types.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="ty in types"
                  :key="ty.id"
                  class="group flex items-center justify-between p-4 rounded-2xl border border-ui-border/40 transition-all hover:bg-ui-background dark:border-ui-border-dark/40 dark:hover:bg-ui-surface-dark/50 cursor-pointer"
                  @click="startEditType(ty)"
                >
                  <div class="flex flex-col min-w-0">
                    <span class="font-bold text-[var(--color-text)] text-lg truncate">{{ label(ty) }}</span>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-[10px] font-bold text-ui-muted uppercase tracking-wider bg-ui-background dark:bg-ui-surface-dark px-2 py-0.5 rounded-lg">{{ ty.code }}</span>
                    </div>
                  </div>
                  <div @click.stop>
                    <AppButton variant="ghost" size="sm" class="text-danger-red hover:bg-danger-red/10" @click="openDeleteConfirm('type', ty)">
                      <Trash2 class="w-5 h-5" />
                    </AppButton>
                  </div>
                </div>
              </div>
              <p v-else-if="selectedCategoryId" class="py-10 text-center text-ui-muted italic font-medium">{{ t('admin.references.noTypes') }}</p>
            </div>
          </AppCardPremium>

          <!-- Équipements par type -->
          <AppCardPremium>
            <template #title>
              <h3 class="text-xl font-bold text-[var(--color-text)] flex items-center gap-3">
                <div class="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Layers class="w-6 h-6" />
                </div>
                {{ t('admin.references.features') }}
              </h3>
            </template>
            <div class="flex flex-col gap-6">
              <div class="max-w-md">
                <AppSelectPremium
                  v-model="selectedTypeId"
                  :label="t('admin.references.type')"
                  :options="typeOptionsForSelect"
                  :placeholder="t('admin.references.selectType')"
                />
              </div>

              <form v-if="selectedTypeId" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end gap-6 border-t border-ui-border/50 dark:border-ui-border-dark/50 pt-8 mt-4" @submit.prevent="saveFeature">
                <AppInputPremium v-model="newFeature.code" :label="t('admin.references.code')" placeholder="ex. Titre foncier" />
                <AppInputPremium v-model="newFeature.label_fr" :label="t('admin.references.labelFr')" />
                <AppInputPremium v-model="newFeature.label_en" :label="t('admin.references.labelEn')" />
                <div class="flex items-end gap-3">
                  <AppInputPremium :model-value="newFeature.sort_order" type="number" :label="t('admin.references.sortOrder')" class="flex-1" @update:model-value="(v: any) => (newFeature.sort_order = Number(v) || 0)" />
                  <div class="flex gap-2 mb-0.5">
                    <AppButton type="submit" variant="primary" class="h-[52px] px-6 font-bold shadow-glow-emerald" :loading="creatingFeature">
                      {{ editingFeatureId ? t('admin.references.save') : t('admin.references.create') }}
                    </AppButton>
                    <AppButton v-if="editingFeatureId" type="button" variant="ghost" class="h-[52px]" @click="cancelEditFeature">
                      {{ t('common.cancel') }}
                    </AppButton>
                  </div>
                </div>
              </form>

              <div v-if="features.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="f in features"
                  :key="f.id"
                  class="group flex items-center justify-between p-4 rounded-2xl border border-ui-border/40 transition-all hover:bg-ui-background dark:border-ui-border-dark/40 dark:hover:bg-ui-surface-dark/50 cursor-pointer"
                  @click="startEditFeature(f)"
                >
                  <div class="flex flex-col min-w-0">
                    <span class="font-bold text-[var(--color-text)] text-lg truncate">{{ label(f) }}</span>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-[10px] font-bold text-ui-muted uppercase tracking-wider bg-ui-background dark:bg-ui-surface-dark px-2 py-0.5 rounded-lg">{{ f.code }}</span>
                    </div>
                  </div>
                  <div @click.stop>
                    <AppButton variant="ghost" size="sm" class="text-danger-red hover:bg-danger-red/10" @click="openDeleteConfirm('feature', f)">
                      <Trash2 class="w-5 h-5" />
                    </AppButton>
                  </div>
                </div>
              </div>
              <p v-else-if="selectedTypeId" class="py-10 text-center text-ui-muted italic font-medium">{{ t('admin.references.noFeatures') }}</p>
            </div>
          </AppCardPremium>
        </div>
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
  </main>
</template>

