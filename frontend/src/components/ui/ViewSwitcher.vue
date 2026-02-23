<script setup lang="ts">
/**
 * Composant de contrôle PATTERN DE VISUALISATION (ARCHITECTURE §6).
 * Toggle UI standardisé : Grille | Tableau | Compact.
 * v-model pour synchroniser l'état ; persistance optionnelle via storageKey.
 * Réutilisable pour tout module (Landlord, Locataires, Transactions).
 *
 * @props modelValue - 'grid' | 'table' | 'compact'
 * @props storageKey - Si fourni, persiste le choix en localStorage
 * @emits update:modelValue
 */
import { watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { LayoutGrid, List, Layout } from 'lucide-vue-next'

const { t } = useI18n()

export type ViewMode = 'grid' | 'table' | 'compact'

const props = withDefaults(
  defineProps<{
    modelValue: ViewMode
    storageKey?: string
  }>(),
  { storageKey: '' }
)

const emit = defineEmits<{ (e: 'update:modelValue', value: ViewMode): void }>()

function persist(value: ViewMode) {
  if (props.storageKey) {
    try {
      localStorage.setItem(props.storageKey, value)
    } catch {
      /* ignore */
    }
  }
}

function select(mode: ViewMode) {
  emit('update:modelValue', mode)
  persist(mode)
}

onMounted(() => {
  if (props.storageKey) persist(props.modelValue)
})

watch(() => props.modelValue, (v) => { if (props.storageKey) persist(v) })
</script>

<template>
  <div
    class="inline-flex rounded-lg border border-ui-border dark:border-ui-border-dark p-0.5 bg-ui-background dark:bg-ui-surface-dark/50"
    role="group"
    aria-label="Mode d'affichage"
  >
    <button
      type="button"
      :class="[
        'p-2 rounded-md transition-colors',
        props.modelValue === 'grid'
          ? 'bg-ui-surface dark:bg-ui-surface-dark shadow-soft-sm text-primary-emerald'
          : 'text-ui-muted hover:text-gray-900 dark:hover:text-gray-100',
      ]"
      :aria-label="t('common.viewGrid')"
      @click="select('grid')"
    >
      <LayoutGrid :size="18" class="shrink-0 text-current" />
    </button>
    <button
      type="button"
      :class="[
        'p-2 rounded-md transition-colors',
        props.modelValue === 'table'
          ? 'bg-ui-surface dark:bg-ui-surface-dark shadow-soft-sm text-primary-emerald'
          : 'text-ui-muted hover:text-gray-900 dark:hover:text-gray-100',
      ]"
      :aria-label="t('common.viewTable')"
      @click="select('table')"
    >
      <List :size="18" class="shrink-0 text-current" />
    </button>
    <button
      type="button"
      :class="[
        'p-2 rounded-md transition-colors',
        props.modelValue === 'compact'
          ? 'bg-ui-surface dark:bg-ui-surface-dark shadow-soft-sm text-primary-emerald'
          : 'text-ui-muted hover:text-gray-900 dark:hover:text-gray-100',
      ]"
      :aria-label="t('common.viewCompact')"
      @click="select('compact')"
    >
      <Layout :size="18" class="shrink-0 text-current" />
    </button>
  </div>
</template>
