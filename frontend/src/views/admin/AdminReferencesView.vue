<script setup lang="ts">
/**
 * Configuration des référentiels (Admin) — Catégories, Types, Équipements, Types de bâtiments, Types d'unités.
 * Chaque section est gérée par le composant générique RefSection.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Settings2 } from 'lucide-vue-next'
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
  type RefDto,
  type RefTypeDto,
  type RefFeatureDto,
  type PropertyTypeDto,
  type UnitTypeDto,
} from '../../services/references.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppSelect, AppTitle, AppParagraph } from '../../components/ui'
import RefSection, { type RefForm, type RefItem } from '../../components/admin/RefSection.vue'

const { t } = useI18n()

// ── État global ───────────────────────────────────────────────────────────
const loading = ref(true)
const error = ref('')

const categories = ref<RefDto[]>([])
const types = ref<RefTypeDto[]>([])
const features = ref<RefFeatureDto[]>([])
const propertyTypes = ref<PropertyTypeDto[]>([])
const unitTypes = ref<UnitTypeDto[]>([])

const selectedCategoryId = ref('')
const selectedTypeId = ref('')

// ── Saving flags par section ──────────────────────────────────────────────
const savingCategory = ref(false)
const savingType = ref(false)
const savingFeature = ref(false)
const savingPropertyType = ref(false)
const savingUnitType = ref(false)

// ── Options de filtre ─────────────────────────────────────────────────────
const categoryOptions = computed(() =>
  categories.value.map((c) => ({ value: c.id, label: c.label_fr }))
)
const typeOptions = computed(() =>
  types.value.map((ty) => ({ value: ty.id, label: ty.label_fr }))
)
const propertyTypeOptions = computed(() =>
  propertyTypes.value.map((pt) => ({ value: pt.id, label: pt.label_fr }))
)

// ── Chargement ────────────────────────────────────────────────────────────
async function loadCategories() {
  categories.value = await getRefCategories()
  if (!selectedCategoryId.value && categories.value.length)
    selectedCategoryId.value = categories.value[0].id
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

watch(selectedCategoryId, () => loadTypes().then(loadFeatures))
watch(selectedTypeId, loadFeatures)
onMounted(load)

// ── Handlers génériques ───────────────────────────────────────────────────

async function onSaveCategory(form: RefForm, editingId: string) {
  savingCategory.value = true
  try {
    const payload = {
      code: form.code.trim(),
      label_fr: form.label_fr.trim(),
      label_en: form.label_en?.trim() || '',
      sort_order: form.sort_order || 0,
    }
    if (editingId) {
      await updateRefCategory(editingId, payload)
      toast.success(t('admin.references.updated'))
    } else {
      await createRefCategory(payload)
      toast.success(t('admin.references.categoryCreated'))
    }
    await loadCategories()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    savingCategory.value = false
  }
}

async function onDeleteCategory(id: string) {
  try {
    await deleteRefCategory(id)
    toast.success(t('admin.references.deleted'))
    await loadCategories()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  }
}

async function onSaveType(form: RefForm, editingId: string) {
  const ref_category_id = (form.ref_category_id as string) || selectedCategoryId.value
  savingType.value = true
  try {
    const payload = {
      ref_category_id,
      code: form.code.trim(),
      label_fr: form.label_fr.trim(),
      label_en: form.label_en?.trim() || '',
      sort_order: form.sort_order || 0,
    }
    if (editingId) {
      await updateRefType(editingId, payload)
      toast.success(t('admin.references.updated'))
    } else {
      await createRefType(payload)
      toast.success(t('admin.references.typeCreated'))
    }
    await loadTypes()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    savingType.value = false
  }
}

async function onDeleteType(id: string) {
  try {
    await deleteRefType(id)
    toast.success(t('admin.references.deleted'))
    await loadTypes()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  }
}

async function onSaveFeature(form: RefForm, editingId: string) {
  const ref_type_id = (form.ref_type_id as string) || selectedTypeId.value
  savingFeature.value = true
  try {
    const payload = {
      ref_type_id,
      code: form.code.trim(),
      label_fr: form.label_fr.trim(),
      label_en: form.label_en?.trim() || '',
      sort_order: form.sort_order || 0,
    }
    if (editingId) {
      await updateRefFeature(editingId, payload)
      toast.success(t('admin.references.updated'))
    } else {
      await createRefFeature(payload)
      toast.success(t('admin.references.featureCreated'))
    }
    await loadFeatures()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    savingFeature.value = false
  }
}

async function onDeleteFeature(id: string) {
  try {
    await deleteRefFeature(id)
    toast.success(t('admin.references.deleted'))
    await loadFeatures()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  }
}

async function onSavePropertyType(form: RefForm, editingId: string) {
  savingPropertyType.value = true
  try {
    const payload = {
      code: form.code.trim(),
      label_fr: form.label_fr.trim(),
      label_en: form.label_en?.trim() || '',
      sort_order: form.sort_order || 0,
    }
    if (editingId) {
      await updatePropertyType(editingId, payload)
      toast.success(t('admin.references.updated'))
    } else {
      await createPropertyType(payload)
      toast.success(t('admin.references.propertyTypeCreated'))
    }
    await loadPropertyTypes()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    savingPropertyType.value = false
  }
}

async function onDeletePropertyType(id: string) {
  try {
    await deletePropertyType(id)
    toast.success(t('admin.references.deleted'))
    await loadPropertyTypes()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  }
}

async function onSaveUnitType(form: RefForm, editingId: string) {
  savingUnitType.value = true
  try {
    const payload = {
      property_type_id: (form.property_type_id as string) || undefined,
      code: form.code.trim(),
      label_fr: form.label_fr.trim(),
      label_en: form.label_en?.trim() || '',
      sort_order: form.sort_order || 0,
    }
    if (editingId) {
      await updateUnitType(editingId, payload)
      toast.success(t('admin.references.updated'))
    } else {
      await createUnitType(payload)
      toast.success(t('admin.references.unitTypeCreated'))
    }
    await loadUnitTypes()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    savingUnitType.value = false
  }
}

async function onDeleteUnitType(id: string) {
  try {
    await deleteUnitType(id)
    toast.success(t('admin.references.deleted'))
    await loadUnitTypes()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  }
}

// ── Helpers de cast pour le template ───────────────────────────────────────
function asItems<T extends RefItem>(arr: T[]): RefItem[] {
  return arr as RefItem[]
}

function labelOf(items: RefItem[], id: string | unknown): string {
  const found = items.find((i) => i.id === id)
  return found ? found.label_fr : '?'
}
</script>

<template>
  <div class="max-w-4xl space-y-6">
    <!-- En-tête -->
    <div>
      <AppTitle :level="2" class="flex items-center gap-2">
        <Settings2 class="w-7 h-7 text-primary-emerald" />
        {{ t('admin.references.title') }}
      </AppTitle>
      <AppParagraph muted class="mt-1">
        {{ t('admin.references.subtitle') }}
      </AppParagraph>
    </div>

    <p v-if="error" class="text-sm text-danger-red">{{ error }}</p>

    <div v-if="loading" class="py-12 text-center text-ui-muted text-sm">
      Chargement…
    </div>

    <template v-else>

      <!-- ── Catégories ── -->
      <RefSection
        :title="t('admin.references.categories')"
        :items="asItems(categories)"
        :saving="savingCategory"
        :empty-label="t('admin.references.noCategories')"
        @save="onSaveCategory"
        @delete="onDeleteCategory"
      />

      <!-- ── Types de bâtiments (PropertyTypes) ── -->
      <RefSection
        :title="t('admin.references.propertyTypes')"
        :items="asItems(propertyTypes)"
        :saving="savingPropertyType"
        :empty-label="t('admin.references.noPropertyTypes')"
        @save="onSavePropertyType"
        @delete="onDeletePropertyType"
      />

      <!-- ── Types d'unités (UnitTypes) ── -->
      <RefSection
        :title="t('admin.references.unitTypes')"
        :items="asItems(unitTypes)"
        :saving="savingUnitType"
        :empty-label="t('admin.references.noUnitTypes')"
        @save="onSaveUnitType"
        @delete="onDeleteUnitType"
      >
        <!-- Champ additionnel : Type de bâtiment parent -->
        <template #extra="{ form }">
          <AppSelect
            v-model="form.property_type_id as string"
            :label="t('admin.references.propertyTypeOptional')"
            :options="propertyTypeOptions"
            placeholder="—"
            class="min-w-[180px]"
          />
        </template>

        <!-- Affichage du type parent dans la liste -->
        <template #item-extra="{ item }">
          <span
            v-if="item.property_type_id"
            class="text-[10px] font-semibold text-primary-emerald"
          >
            {{ t('admin.references.propertyType') }}: {{ labelOf(asItems(propertyTypes), item.property_type_id) }}
          </span>
        </template>
      </RefSection>

      <!-- ── Types par catégorie ── -->
      <RefSection
        :title="t('admin.references.types')"
        :items="asItems(types)"
        :saving="savingType"
        :empty-label="t('admin.references.noTypes')"
        :hidden="!selectedCategoryId"
        @save="(form, id) => onSaveType({ ...form, ref_category_id: form.ref_category_id || selectedCategoryId }, id)"
        @delete="onDeleteType"
      >
        <!-- Sélecteur de catégorie au-dessus du formulaire -->
        <template #extra>
          <AppSelect
            v-model="selectedCategoryId"
            :label="t('admin.references.category')"
            :options="categoryOptions"
            :placeholder="t('admin.references.selectCategory')"
            class="min-w-[180px]"
          />
        </template>
      </RefSection>

      <!-- ── Équipements par type ── -->
      <RefSection
        :title="t('admin.references.features')"
        :items="asItems(features)"
        :saving="savingFeature"
        :empty-label="t('admin.references.noFeatures')"
        :hidden="!selectedTypeId"
        @save="(form, id) => onSaveFeature({ ...form, ref_type_id: form.ref_type_id || selectedTypeId }, id)"
        @delete="onDeleteFeature"
      >
        <!-- Sélecteur de type au-dessus du formulaire -->
        <template #extra>
          <AppSelect
            v-model="selectedTypeId"
            :label="t('admin.references.type')"
            :options="typeOptions"
            :placeholder="t('admin.references.selectType')"
            class="min-w-[180px]"
          />
        </template>
      </RefSection>

    </template>
  </div>
</template>
