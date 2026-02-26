<script setup lang="ts">
/**
 * RefSection — Section générique pour les référentiels admin.
 * Design : grille 2 colonnes, bouton Créer en haut à droite,
 * formulaire à bascule (inline collapse), clic sur un item pour éditer.
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Layers, Trash2, Plus, X } from 'lucide-vue-next'
import { AppButton, AppCard, AppInput } from '../ui'
import ConfirmModal from '../ui/ConfirmModal.vue'

export interface RefItem {
  id: string
  code: string
  label_fr: string
  label_en?: string
  sort_order?: number
  [key: string]: unknown
}

export interface RefForm {
  code: string
  label_fr: string
  label_en: string
  sort_order: number
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    title: string
    items: RefItem[]
    saving: boolean
    emptyLabel: string
    /** Masquer le formulaire (section conditionnelle — ex: types sans catégorie choisie) */
    hidden?: boolean
  }>(),
  { hidden: false }
)

const emit = defineEmits<{
  save: [form: RefForm, editingId: string]
  delete: [id: string]
}>()

const { locale } = useI18n()

// ── Formulaire & état ──────────────────────────────────────────────────────
const showForm = ref(false)
const editingId = ref('')
const form = ref<RefForm>({ code: '', label_fr: '', label_en: '', sort_order: 0 })

defineExpose({ form, editingId })

const isValid = computed(() => form.value.code.trim() !== '' && form.value.label_fr.trim() !== '')

// ── Helpers ────────────────────────────────────────────────────────────────
function label(item: { label_fr: string; label_en?: string }) {
  return locale.value === 'fr' ? item.label_fr : (item.label_en || item.label_fr)
}

// ── Ouvrir / fermer le formulaire ──────────────────────────────────────────
function openCreate() {
  editingId.value = ''
  form.value = { code: '', label_fr: '', label_en: '', sort_order: 0 }
  showForm.value = true
}

function startEdit(item: RefItem) {
  editingId.value = item.id
  form.value = {
    code: item.code,
    label_fr: item.label_fr,
    label_en: item.label_en || '',
    sort_order: item.sort_order ?? 0,
    ...Object.fromEntries(
      Object.entries(item).filter(([k]) => !['id', 'code', 'label_fr', 'label_en', 'sort_order'].includes(k))
    ),
  }
  showForm.value = true
}

function cancelEdit() {
  editingId.value = ''
  form.value = { code: '', label_fr: '', label_en: '', sort_order: 0 }
  showForm.value = false
}

function onSubmit() {
  if (!isValid.value) return
  emit('save', { ...form.value }, editingId.value)
}

// Fermeture auto du formulaire quand saving se termine
let prevSaving = false
watch(() => props.saving, (val) => {
  if (prevSaving && !val) {
    editingId.value = ''
    form.value = { code: '', label_fr: '', label_en: '', sort_order: 0 }
    showForm.value = false
  }
  prevSaving = val
})

// ── Suppression ────────────────────────────────────────────────────────────
const confirmItem = ref<RefItem | null>(null)

function askDelete(item: RefItem, e: MouseEvent) {
  e.stopPropagation()
  confirmItem.value = item
}

function doDelete() {
  if (!confirmItem.value) return
  emit('delete', confirmItem.value.id)
  confirmItem.value = null
}
</script>

<template>
  <div class="space-y-3">
    <!-- En-tête de section -->
    <div class="flex items-center justify-between">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
        <Layers class="w-4 h-4 text-primary-emerald shrink-0" />
        {{ title }}
      </h3>
      <AppButton
        v-if="!showForm && !hidden"
        type="button"
        variant="primary"
        size="sm"
        @click="openCreate"
      >
        <Plus class="w-3.5 h-3.5" />
        {{ $t('admin.references.create') }}
      </AppButton>
    </div>

    <!-- Formulaire inline (bascule) -->
    <AppCard v-if="showForm && !hidden" padding="md" class="border-primary-emerald/40">
      <div class="flex items-center justify-between mb-4">
        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
          {{ editingId ? $t('admin.references.edit') : $t('admin.references.create') }} — {{ title }}
        </span>
        <button
          type="button"
          class="text-ui-muted hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          @click="cancelEdit"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <form class="flex flex-wrap items-end gap-3" @submit.prevent="onSubmit">
        <AppInput
          v-model="form.code"
          :label="$t('admin.references.code')"
          :placeholder="$t('admin.references.codePlaceholder')"
          class="min-w-[120px]"
        />
        <AppInput
          v-model="form.label_fr"
          :label="$t('admin.references.labelFr')"
          class="min-w-[160px]"
        />
        <AppInput
          v-model="form.label_en"
          :label="$t('admin.references.labelEn')"
          class="min-w-[160px]"
        />
        <AppInput
          :model-value="form.sort_order"
          type="number"
          :label="$t('admin.references.sortOrder')"
          class="w-20"
          @update:model-value="(v) => (form.sort_order = Number(v) || 0)"
        />
        <!-- Slot champs additionnels -->
        <slot name="extra" :form="form" />

        <div class="flex gap-2">
          <AppButton
            type="submit"
            variant="primary"
            size="sm"
            :loading="saving"
            :disabled="!isValid"
          >
            {{ editingId ? $t('admin.references.save') : $t('admin.references.create') }}
          </AppButton>
          <AppButton type="button" variant="ghost" size="sm" @click="cancelEdit">
            {{ $t('common.cancel') }}
          </AppButton>
        </div>
      </form>
    </AppCard>

    <!-- Sélecteur conditionnel (ex: catégorie, type) — slot affiché même sans formulaire -->
    <slot v-if="!showForm" name="filter" />

    <!-- Grille 2 colonnes d'items -->
    <div v-if="items.length" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="group flex items-center justify-between px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 transition-all duration-150 text-left w-full focus:outline-none focus:ring-2 focus:ring-primary-emerald"
        :class="
          editingId === item.id
            ? 'border-primary-emerald shadow-glow-emerald'
            : 'border-ui-border dark:border-ui-border-dark hover:border-primary-emerald/50 hover:shadow-soft'
        "
        @click="startEdit(item)"
      >
        <!-- Infos -->
        <div class="flex flex-col gap-0.5 min-w-0">
          <span class="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{{ label(item) }}</span>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-mono tracking-widest text-ui-muted uppercase">{{ item.code }}</span>
            <span v-if="item.label_en && locale === 'fr'" class="text-[10px] text-ui-muted italic">EN: {{ item.label_en }}</span>
            <span v-if="item.label_fr && locale === 'en'" class="text-[10px] text-ui-muted italic">FR: {{ item.label_fr }}</span>
          </div>
          <!-- Slot pour infos additionnelles (ex: type parent) -->
          <slot name="item-extra" :item="item" />
        </div>

        <!-- Bouton supprimer -->
        <AppButton
          type="button"
          variant="ghost"
          size="sm"
          :aria-label="$t('admin.references.delete')"
          class="shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          @click="(e: MouseEvent) => askDelete(item, e)"
        >
          <Trash2 class="w-3.5 h-3.5 text-danger-red" />
        </AppButton>
      </button>
    </div>

    <p v-else-if="!hidden" class="text-sm text-ui-muted">{{ emptyLabel }}</p>
  </div>

  <!-- Modal de confirmation suppression -->
  <ConfirmModal
    :show="!!confirmItem"
    :title="$t('admin.references.confirmDelete')"
    :message="confirmItem ? label(confirmItem) : ''"
    :confirm-label="$t('admin.references.delete')"
    variant="danger"
    @close="confirmItem = null"
    @confirm="doDelete"
  />
</template>
