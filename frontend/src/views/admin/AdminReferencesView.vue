<script setup lang="ts">
/**
 * Configuration des référentiels (Admin) — 3 groupes visuels :
 *   1. Bâtiment : PropertyTypes + PropertyStatuses
 *   2. Annonces (moteur) : Catégories → Types → Équipements moteur
 *   3. Unité : UnitTypes + UnitFeatures enrichis (avec icônes)
 * Architecture §8 : appels API centralisés dans @/services/references.service.
 * Architecture §11 : composants atomiques AppInput, AppSelect, RefSection, FeatureIcon.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Building2, FileText, Key, Settings2, Plus, Trash2, Pencil, X, Eye, EyeOff, ChevronDown, ChevronRight, Flag } from 'lucide-vue-next'
import {
  getRefCategories,
  getRefTypes,
  getRefFeaturesByTypeId,
  createRefCategory, updateRefCategory, deleteRefCategory,
  createRefType, updateRefType, deleteRefType,
  createRefFeature, updateRefFeature, deleteRefFeature,
  getPropertyTypes, createPropertyType, updatePropertyType, deletePropertyType,
  getPropertyStatuses, updatePropertyStatus,
  getUnitTypes, createUnitType, updateUnitType, deleteUnitType,
  getUnitFeatures, createUnitFeature, updateUnitFeature, deleteUnitFeature,
  type RefDto,
  type RefTypeDto,
  type RefFeatureDto,
  type PropertyTypeDto,
  type PropertyStatusDto,
  type UnitTypeDto,
  type UnitFeatureDto,
} from '../../services/references.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppSelect, AppInput, AppTitle, AppParagraph, FeatureIcon } from '../../components/ui'
import RefSection, { type RefForm, type RefItem } from '../../components/admin/RefSection.vue'

const { t } = useI18n()

// ── État global ───────────────────────────────────────────────────────────
const loading = ref(true)
const error = ref('')

// Données par groupe
const categories = ref<RefDto[]>([])
const refTypes = ref<RefTypeDto[]>([])
const refFeatures = ref<RefFeatureDto[]>([])
const propertyTypes = ref<PropertyTypeDto[]>([])
const propertyStatuses = ref<PropertyStatusDto[]>([])
const unitTypes = ref<UnitTypeDto[]>([])
const unitFeatures = ref<UnitFeatureDto[]>([])

// Sélecteurs moteur
const selectedCategoryId = ref('')
const selectedTypeId = ref('')

// Sections ouverts/fermés (accordéon)
const openGroups = ref<Record<string, boolean>>({
  building: true,
  engine: true,
  unit: true,
})
function toggleGroup(key: string) {
  openGroups.value[key] = !openGroups.value[key]
}

// ── Saving flags par section ──────────────────────────────────────────────
const savingCategory = ref(false)
const savingType = ref(false)
const savingFeature = ref(false)
const savingPropertyType = ref(false)
const savingPropertyStatus = ref(false)
const savingUnitType = ref(false)
const savingUnitFeature = ref(false)

// ── État d'édition inline des statuts (labels + couleur uniquement — valeurs système) ───
const editingStatusId = ref('')
const editStatusForm = ref({ label_fr: '', label_en: '', color: '' })

function startEditStatus(status: PropertyStatusDto) {
  editingStatusId.value = status.id
  editStatusForm.value = {
    label_fr: status.label_fr,
    label_en: status.label_en ?? '',
    color: (status.color as string | null) ?? '',
  }
}

async function submitEditStatus(id: string) {
  savingPropertyStatus.value = true
  try {
    await updatePropertyStatus(id, {
      label_fr: editStatusForm.value.label_fr.trim() || undefined,
      label_en: editStatusForm.value.label_en.trim() || undefined,
      color: editStatusForm.value.color.trim() || undefined,
    })
    toast.success(t('admin.references.updated'))
    editingStatusId.value = ''
    await loadPropertyStatuses()
  } catch (e) { toast.error(getApiErrorMessage(e)) } finally { savingPropertyStatus.value = false }
}

// ── État du formulaire UnitFeature (inline) ───────────────────────────────
interface UnitFeatureForm {
  code: string
  label_fr: string
  label_en: string
  sort_order: number
  icon_lucide: string
  icon_svg: string
}
const unitFeatureForm = ref<UnitFeatureForm>({ code: '', label_fr: '', label_en: '', sort_order: 0, icon_lucide: '', icon_svg: '' })
const editingUnitFeatureId = ref('')
const showUnitFeatureForm = ref(false)
const showIconPreview = ref(true)

function openUnitFeatureCreate() {
  unitFeatureForm.value = { code: '', label_fr: '', label_en: '', sort_order: unitFeatures.value.length, icon_lucide: '', icon_svg: '' }
  editingUnitFeatureId.value = ''
  showUnitFeatureForm.value = true
}

function openUnitFeatureEdit(f: UnitFeatureDto) {
  unitFeatureForm.value = {
    code: f.code,
    label_fr: f.label_fr,
    label_en: f.label_en,
    sort_order: f.sort_order ?? 0,
    icon_lucide: f.icon_lucide ?? '',
    icon_svg: f.icon_svg ?? '',
  }
  editingUnitFeatureId.value = f.id
  showUnitFeatureForm.value = true
}

function closeUnitFeatureForm() {
  showUnitFeatureForm.value = false
  editingUnitFeatureId.value = ''
}

// ── Options de filtre ─────────────────────────────────────────────────────
const categoryOptions = computed(() =>
  categories.value.map((c) => ({ value: c.id, label: c.label_fr }))
)
const typeOptions = computed(() =>
  refTypes.value.map((ty) => ({ value: ty.id, label: ty.label_fr }))
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
async function loadRefTypes() {
  refTypes.value = selectedCategoryId.value ? await getRefTypes(selectedCategoryId.value) : []
  selectedTypeId.value = ''
}
async function loadRefFeatures() {
  refFeatures.value = selectedTypeId.value ? await getRefFeaturesByTypeId(selectedTypeId.value) : []
}
async function loadPropertyTypes() { propertyTypes.value = await getPropertyTypes() }
async function loadPropertyStatuses() { propertyStatuses.value = await getPropertyStatuses() }
async function loadUnitTypes() { unitTypes.value = await getUnitTypes() }
async function loadUnitFeatures() { unitFeatures.value = await getUnitFeatures() }

async function load() {
  loading.value = true
  error.value = ''
  try {
    await Promise.all([
      loadCategories(),
      loadPropertyTypes(),
      loadPropertyStatuses(),
      loadUnitTypes(),
      loadUnitFeatures(),
    ])
    await loadRefTypes()
    await loadRefFeatures()
  } catch (e) {
    error.value = getApiErrorMessage(e)
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

watch(selectedCategoryId, () => loadRefTypes().then(loadRefFeatures))
watch(selectedTypeId, loadRefFeatures)
onMounted(load)

// ── Helpers de cast ───────────────────────────────────────────────────────
function asItems<T extends RefItem>(arr: T[]): RefItem[] { return arr as RefItem[] }
function labelOf(items: RefItem[], id: string | unknown): string {
  const found = items.find((i) => i.id === id)
  return found ? found.label_fr : '?'
}

// ── Handlers RefSection génériques ───────────────────────────────────────

async function onSaveCategory(form: RefForm, editingId: string) {
  savingCategory.value = true
  try {
    const payload = { code: form.code.trim(), label_fr: form.label_fr.trim(), label_en: form.label_en?.trim() || '', sort_order: form.sort_order || 0 }
    editingId ? await updateRefCategory(editingId, payload) : await createRefCategory(payload)
    toast.success(editingId ? t('admin.references.updated') : t('admin.references.categoryCreated'))
    await loadCategories()
  } catch (e) { toast.error(getApiErrorMessage(e)) } finally { savingCategory.value = false }
}
async function onDeleteCategory(id: string) {
  try { await deleteRefCategory(id); toast.success(t('admin.references.deleted')); await loadCategories() }
  catch (e) { toast.error(getApiErrorMessage(e)) }
}

async function onSavePropertyType(form: RefForm, editingId: string) {
  savingPropertyType.value = true
  try {
    const payload = { code: form.code.trim(), label_fr: form.label_fr.trim(), label_en: form.label_en?.trim() || '', sort_order: form.sort_order || 0 }
    editingId ? await updatePropertyType(editingId, payload) : await createPropertyType(payload)
    toast.success(editingId ? t('admin.references.updated') : t('admin.references.propertyTypeCreated'))
    await loadPropertyTypes()
  } catch (e) { toast.error(getApiErrorMessage(e)) } finally { savingPropertyType.value = false }
}
async function onDeletePropertyType(id: string) {
  try { await deletePropertyType(id); toast.success(t('admin.references.deleted')); await loadPropertyTypes() }
  catch (e) { toast.error(getApiErrorMessage(e)) }
}

// (onSavePropertyStatus / onDeletePropertyStatus retirés : édition inline uniquement, voir startEditStatus/submitEditStatus)

async function onSaveType(form: RefForm, editingId: string) {
  const ref_category_id = (form.ref_category_id as string) || selectedCategoryId.value
  savingType.value = true
  try {
    const payload = { ref_category_id, code: form.code.trim(), label_fr: form.label_fr.trim(), label_en: form.label_en?.trim() || '', sort_order: form.sort_order || 0 }
    editingId ? await updateRefType(editingId, payload) : await createRefType(payload)
    toast.success(editingId ? t('admin.references.updated') : t('admin.references.typeCreated'))
    await loadRefTypes()
  } catch (e) { toast.error(getApiErrorMessage(e)) } finally { savingType.value = false }
}
async function onDeleteType(id: string) {
  try { await deleteRefType(id); toast.success(t('admin.references.deleted')); await loadRefTypes() }
  catch (e) { toast.error(getApiErrorMessage(e)) }
}

async function onSaveFeature(form: RefForm, editingId: string) {
  const ref_type_id = (form.ref_type_id as string) || selectedTypeId.value
  savingFeature.value = true
  try {
    const payload = { ref_type_id, code: form.code.trim(), label_fr: form.label_fr.trim(), label_en: form.label_en?.trim() || '', sort_order: form.sort_order || 0 }
    editingId ? await updateRefFeature(editingId, payload) : await createRefFeature(payload)
    toast.success(editingId ? t('admin.references.updated') : t('admin.references.featureCreated'))
    await loadRefFeatures()
  } catch (e) { toast.error(getApiErrorMessage(e)) } finally { savingFeature.value = false }
}
async function onDeleteFeature(id: string) {
  try { await deleteRefFeature(id); toast.success(t('admin.references.deleted')); await loadRefFeatures() }
  catch (e) { toast.error(getApiErrorMessage(e)) }
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
    editingId ? await updateUnitType(editingId, payload) : await createUnitType(payload)
    toast.success(editingId ? t('admin.references.updated') : t('admin.references.unitTypeCreated'))
    await loadUnitTypes()
  } catch (e) { toast.error(getApiErrorMessage(e)) } finally { savingUnitType.value = false }
}
async function onDeleteUnitType(id: string) {
  try { await deleteUnitType(id); toast.success(t('admin.references.deleted')); await loadUnitTypes() }
  catch (e) { toast.error(getApiErrorMessage(e)) }
}

// ── Handler UnitFeature (formulaire inline enrichi) ───────────────────────
async function submitUnitFeature() {
  savingUnitFeature.value = true
  try {
    const payload = {
      code: unitFeatureForm.value.code.trim(),
      label_fr: unitFeatureForm.value.label_fr.trim(),
      label_en: unitFeatureForm.value.label_en.trim() || '',
      sort_order: unitFeatureForm.value.sort_order || 0,
      icon_lucide: unitFeatureForm.value.icon_lucide.trim() || null,
      icon_svg: unitFeatureForm.value.icon_svg.trim() || null,
    }
    if (editingUnitFeatureId.value) {
      await updateUnitFeature(editingUnitFeatureId.value, payload)
      toast.success(t('admin.references.updated'))
    } else {
      await createUnitFeature(payload)
      toast.success(t('admin.references.featureCreated'))
    }
    closeUnitFeatureForm()
    await loadUnitFeatures()
  } catch (e) { toast.error(getApiErrorMessage(e)) } finally { savingUnitFeature.value = false }
}

async function onDeleteUnitFeature(id: string) {
  try { await deleteUnitFeature(id); toast.success(t('admin.references.deleted')); await loadUnitFeatures() }
  catch (e) { toast.error(getApiErrorMessage(e)) }
}

/** Couleur du dot de statut à partir du code couleur stocké. */
function statusColor(color: string | null): string {
  const map: Record<string, string> = {
    green: 'bg-emerald-500',
    amber: 'bg-amber-400',
    gray: 'bg-slate-400',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
  }
  return map[color ?? ''] ?? 'bg-ui-muted'
}
</script>

<template>
  <div class="max-w-4xl space-y-8">
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

    <div v-if="loading" class="py-12 text-center text-ui-muted text-sm">Chargement…</div>

    <template v-else>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- GROUPE 1 — 🏢 Référentiels Bâtiment                       -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <section class="bg-ui-surface dark:bg-ui-surface-dark border border-ui-border dark:border-ui-border-dark rounded-2xl shadow-soft overflow-hidden">
        <button
          class="w-full flex items-center gap-3 px-6 py-4 border-b border-ui-border dark:border-ui-border-dark hover:bg-ui-border/20 dark:hover:bg-ui-border-dark/20 transition-colors"
          @click="toggleGroup('building')"
        >
          <div class="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <Building2 :size="16" class="text-blue-500" />
          </div>
          <span class="text-sm font-semibold text-left flex-1">Référentiels Bâtiment</span>
          <span class="text-[10px] text-ui-muted uppercase tracking-widest">Types de biens · Statuts</span>
          <ChevronDown v-if="openGroups.building" :size="16" class="text-ui-muted" />
          <ChevronRight v-else :size="16" class="text-ui-muted" />
        </button>

        <div v-show="openGroups.building" class="p-6 space-y-6">
          <!-- Types de bâtiments -->
          <RefSection
            :title="t('admin.references.propertyTypes')"
            :items="asItems(propertyTypes)"
            :saving="savingPropertyType"
            :empty-label="t('admin.references.noPropertyTypes')"
            @save="onSavePropertyType"
            @delete="onDeletePropertyType"
          />

          <!-- Statuts de bien — édition labels/couleur uniquement (valeurs système, pas de création/suppression) -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="flex items-center gap-2 text-sm font-semibold text-ui-base dark:text-white">
                  <Flag class="w-4 h-4 text-primary-emerald" />
                  Statuts de bien
                </h3>
                <p class="text-[10px] text-ui-muted mt-0.5 ml-6">Valeurs système — seuls les labels et la couleur sont modifiables</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="status in propertyStatuses"
                :key="status.id"
                class="group relative"
              >
                <!-- Vue normale -->
                <div
                  v-if="editingStatusId !== status.id"
                  class="flex items-center gap-3 px-4 py-3 rounded-xl border border-ui-border dark:border-ui-border-dark bg-ui-surface dark:bg-ui-surface-dark hover:border-primary-emerald/30 transition-all cursor-pointer"
                  @click="startEditStatus(status)"
                >
                  <span :class="['w-3 h-3 rounded-full shrink-0', statusColor(status.color ?? null)]" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-ui-base dark:text-white truncate">{{ status.label_fr }}</p>
                    <p class="text-[10px] text-ui-muted">{{ status.label_en }} · <span class="font-mono">{{ status.code }}</span></p>
                  </div>
                  <Pencil :size="13" class="text-ui-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>

                <!-- Formulaire d'édition inline -->
                <div
                  v-else
                  class="p-4 rounded-xl border border-primary-emerald/40 bg-primary-emerald/5 space-y-3 animate-in slide-in-from-top-1 duration-150"
                >
                  <div class="grid grid-cols-2 gap-2">
                    <AppInput v-model="editStatusForm.label_fr" label="Label FR" />
                    <AppInput v-model="editStatusForm.label_en" label="Label EN" />
                  </div>
                  <AppInput
                    v-model="editStatusForm.color"
                    label="Couleur (green, amber, gray, orange, red, blue)"
                    placeholder="green"
                  />
                  <div class="flex gap-2">
                    <button
                      class="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-primary-emerald text-white hover:bg-primary-emerald/90 disabled:opacity-50 transition-colors"
                      :disabled="savingPropertyStatus"
                      @click="submitEditStatus(status.id)"
                    >
                      {{ savingPropertyStatus ? 'Enregistrement…' : 'Sauvegarder' }}
                    </button>
                    <button
                      class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-ui-border dark:border-ui-border-dark text-ui-muted hover:bg-ui-border/20 transition-colors"
                      @click="editingStatusId = ''"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- GROUPE 2 — 📋 Référentiels Annonces (moteur catégorisé)    -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <section class="bg-ui-surface dark:bg-ui-surface-dark border border-ui-border dark:border-ui-border-dark rounded-2xl shadow-soft overflow-hidden">
        <button
          class="w-full flex items-center gap-3 px-6 py-4 border-b border-ui-border dark:border-ui-border-dark hover:bg-ui-border/20 dark:hover:bg-ui-border-dark/20 transition-colors"
          @click="toggleGroup('engine')"
        >
          <div class="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <FileText :size="16" class="text-violet-500" />
          </div>
          <span class="text-sm font-semibold text-left flex-1">Référentiels Annonces</span>
          <span class="text-[10px] text-ui-muted uppercase tracking-widest">Catégories · Types · Équipements moteur</span>
          <ChevronDown v-if="openGroups.engine" :size="16" class="text-ui-muted" />
          <ChevronRight v-else :size="16" class="text-ui-muted" />
        </button>

        <div v-show="openGroups.engine" class="p-6 space-y-6">
          <!-- Catégories (Location, Vente…) -->
          <RefSection
            :title="t('admin.references.categories')"
            :items="asItems(categories)"
            :saving="savingCategory"
            :empty-label="t('admin.references.noCategories')"
            @save="onSaveCategory"
            @delete="onDeleteCategory"
          />

          <!-- Types par catégorie -->
          <RefSection
            :title="t('admin.references.types')"
            :items="asItems(refTypes)"
            :saving="savingType"
            :empty-label="t('admin.references.noTypes')"
            :hidden="!selectedCategoryId"
            @save="(form, id) => onSaveType({ ...form, ref_category_id: form.ref_category_id || selectedCategoryId }, id)"
            @delete="onDeleteType"
          >
            <!-- Sélecteur affiché en dehors du formulaire -->
            <template #filter>
              <AppSelect
                v-model="selectedCategoryId"
                :label="t('admin.references.category')"
                :options="categoryOptions"
                :placeholder="t('admin.references.selectCategory')"
                class="min-w-[180px]"
              />
            </template>
          </RefSection>

          <!-- Équipements moteur par type -->
          <RefSection
            :title="t('admin.references.features')"
            :items="asItems(refFeatures)"
            :saving="savingFeature"
            :empty-label="t('admin.references.noFeatures')"
            :hidden="!selectedTypeId"
            @save="(form, id) => onSaveFeature({ ...form, ref_type_id: form.ref_type_id || selectedTypeId }, id)"
            @delete="onDeleteFeature"
          >
            <template #filter>
              <AppSelect
                v-model="selectedTypeId"
                :label="t('admin.references.type')"
                :options="typeOptions"
                :placeholder="t('admin.references.selectType')"
                class="min-w-[180px]"
              />
            </template>
          </RefSection>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- GROUPE 3 — 🔑 Référentiels Unité                          -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <section class="bg-ui-surface dark:bg-ui-surface-dark border border-ui-border dark:border-ui-border-dark rounded-2xl shadow-soft overflow-hidden">
        <button
          class="w-full flex items-center gap-3 px-6 py-4 border-b border-ui-border dark:border-ui-border-dark hover:bg-ui-border/20 dark:hover:bg-ui-border-dark/20 transition-colors"
          @click="toggleGroup('unit')"
        >
          <div class="w-8 h-8 rounded-lg bg-primary-emerald/10 flex items-center justify-center shrink-0">
            <Key :size="16" class="text-primary-emerald" />
          </div>
          <span class="text-sm font-semibold text-left flex-1">Référentiels Unité</span>
          <span class="text-[10px] text-ui-muted uppercase tracking-widest">Types · Équipements avec icônes</span>
          <ChevronDown v-if="openGroups.unit" :size="16" class="text-ui-muted" />
          <ChevronRight v-else :size="16" class="text-ui-muted" />
        </button>

        <div v-show="openGroups.unit" class="p-6 space-y-6">
          <!-- Types d'unités -->
          <RefSection
            :title="t('admin.references.unitTypes')"
            :items="asItems(unitTypes)"
            :saving="savingUnitType"
            :empty-label="t('admin.references.noUnitTypes')"
            @save="onSaveUnitType"
            @delete="onDeleteUnitType"
          >
            <template #extra="{ form }">
              <AppSelect
                v-model="form.property_type_id as string"
                :label="t('admin.references.propertyTypeOptional')"
                :options="propertyTypeOptions"
                placeholder="—"
                class="min-w-[180px]"
              />
            </template>
            <template #item-extra="{ item }">
              <span v-if="item.property_type_id" class="text-[10px] font-semibold text-primary-emerald">
                {{ t('admin.references.propertyType') }}: {{ labelOf(asItems(propertyTypes), item.property_type_id) }}
              </span>
            </template>
          </RefSection>

          <!-- ── Équipements enrichis (unit_features) ── -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-ui-base dark:text-white">
                Équipements disponibles
                <span class="ml-2 text-[10px] font-normal text-ui-muted">Eau, clim, gardien… — liés aux unités pendant la création</span>
              </h3>
              <button
                class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-emerald bg-primary-emerald/10 rounded-lg hover:bg-primary-emerald/20 transition-colors"
                @click="openUnitFeatureCreate"
              >
                <Plus :size="14" />
                Ajouter
              </button>
            </div>

            <!-- Formulaire inline création/édition -->
            <div v-if="showUnitFeatureForm" class="p-5 rounded-xl border border-primary-emerald/30 bg-primary-emerald/5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div class="flex items-center justify-between mb-1">
                <p class="text-xs font-semibold text-primary-emerald uppercase tracking-wider">
                  {{ editingUnitFeatureId ? 'Modifier l\'équipement' : 'Nouvel équipement' }}
                </p>
                <button class="text-ui-muted hover:text-danger-red transition-colors" @click="closeUnitFeatureForm">
                  <X :size="16" />
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppInput v-model="unitFeatureForm.label_fr" label="Nom (FR) *" placeholder="Eau courante" />
                <AppInput v-model="unitFeatureForm.label_en" label="Nom (EN)" placeholder="Running water" />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppInput v-model="unitFeatureForm.code" label="Code unique *" placeholder="eau_courante" />
                <AppInput
                  v-model.number="unitFeatureForm.sort_order"
                  label="Ordre d'affichage"
                  type="number"
                  :min="0"
                  placeholder="0"
                />
              </div>

              <!-- Icônes -->
              <div class="p-4 rounded-xl bg-ui-surface dark:bg-ui-surface-dark border border-ui-border dark:border-ui-border-dark space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-semibold text-ui-muted uppercase tracking-wider">Icône</p>
                  <button class="flex items-center gap-1 text-[10px] text-ui-muted hover:text-primary-emerald" @click="showIconPreview = !showIconPreview">
                    <component :is="showIconPreview ? EyeOff : Eye" :size="12" />
                    {{ showIconPreview ? 'Masquer prévisualisation' : 'Prévisualiser' }}
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div class="space-y-1">
                    <AppInput
                      v-model="unitFeatureForm.icon_lucide"
                      label="Icône Lucide (prioritaire)"
                      placeholder="Droplets, Wifi, Car, Zap…"
                    />
                    <p class="text-[10px] text-ui-muted pl-1">
                      Voir <a href="https://lucide.dev/icons/" target="_blank" class="underline text-primary-emerald">lucide.dev/icons</a> pour les noms
                    </p>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-ui-muted mb-1 ml-1">SVG custom (fallback)</label>
                    <textarea
                      v-model="unitFeatureForm.icon_svg"
                      rows="3"
                      class="w-full text-xs p-3 rounded-xl border border-ui-border dark:border-ui-border-dark bg-ui-surface dark:bg-ui-surface-dark text-ui-base dark:text-white placeholder-ui-muted focus:border-primary-emerald focus:outline-none transition-colors font-mono resize-none"
                      placeholder="<svg>…</svg>"
                    />
                  </div>
                </div>

                <!-- Prévisualisation en temps réel -->
                <div v-if="showIconPreview" class="flex items-center gap-3 p-3 rounded-lg bg-ui-border/20 dark:bg-ui-border-dark/20">
                  <div class="w-10 h-10 rounded-lg bg-primary-emerald/10 flex items-center justify-center text-primary-emerald">
                    <FeatureIcon
                      :icon-lucide="unitFeatureForm.icon_lucide || null"
                      :icon-svg="unitFeatureForm.icon_svg || null"
                      :size="20"
                    />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-ui-base dark:text-white">{{ unitFeatureForm.label_fr || 'Nom FR' }}</p>
                    <p class="text-[10px] text-ui-muted">{{ unitFeatureForm.label_en || 'Nom EN' }}</p>
                  </div>
                  <span class="ml-auto text-[10px] font-mono text-ui-muted">{{ unitFeatureForm.code || 'code' }}</span>
                </div>
              </div>

              <div class="flex gap-3 pt-1">
                <button
                  class="flex-1 py-2 text-sm font-semibold rounded-xl border border-ui-border dark:border-ui-border-dark text-ui-muted hover:bg-ui-border/20 transition-colors"
                  @click="closeUnitFeatureForm"
                >
                  Annuler
                </button>
                <button
                  class="flex-1 py-2 text-sm font-semibold rounded-xl bg-primary-emerald text-white hover:bg-primary-emerald/90 transition-colors disabled:opacity-50"
                  :disabled="savingUnitFeature || !unitFeatureForm.label_fr || !unitFeatureForm.code"
                  @click="submitUnitFeature"
                >
                  {{ savingUnitFeature ? 'Enregistrement…' : (editingUnitFeatureId ? 'Mettre à jour' : 'Créer') }}
                </button>
              </div>
            </div>

            <!-- Liste des équipements -->
            <div v-if="!unitFeatures.length" class="py-6 text-center text-ui-muted text-sm">
              Aucun équipement configuré
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="f in unitFeatures"
                :key="f.id"
                class="flex items-center gap-3 px-4 py-3 rounded-xl bg-ui-surface dark:bg-ui-surface-dark border border-ui-border dark:border-ui-border-dark group hover:border-primary-emerald/30 transition-all"
              >
                <!-- Icône -->
                <div class="w-9 h-9 rounded-lg bg-primary-emerald/10 flex items-center justify-center text-primary-emerald shrink-0">
                  <FeatureIcon :icon-lucide="f.icon_lucide" :icon-svg="f.icon_svg" :size="18" />
                </div>
                <!-- Labels -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-ui-base dark:text-white truncate">{{ f.label_fr }}</p>
                  <p class="text-[10px] text-ui-muted truncate">{{ f.label_en }} · <span class="font-mono">{{ f.code }}</span></p>
                </div>
                <!-- Actions -->
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-ui-muted hover:text-primary-emerald hover:bg-primary-emerald/10 transition-all"
                    title="Modifier"
                    @click="openUnitFeatureEdit(f)"
                  >
                    <Pencil :size="14" />
                  </button>
                  <button
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-ui-muted hover:text-danger-red hover:bg-danger-red/10 transition-all"
                    title="Supprimer"
                    @click="onDeleteUnitFeature(f.id)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </template>
  </div>
</template>
