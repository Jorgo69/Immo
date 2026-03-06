<script setup lang="ts">
/**
 * AppDataView — Composant orchestrateur pour les listes de données.
 * 
 * Gère automatiquement :
 * - Loading (spinner)
 * - État vide (icône + message i18n)
 * - Compteur de résultats
 * - Toggle grille/tableau/compact
 * - Pagination intégrée
 * 
 * Usage :
 * <AppDataView
 *   :loading="loading"
 *   :empty="data.length === 0"
 *   :empty-label="t('...')"
 *   :total="total"
 *   :total-pages="totalPages"
 *   :page="currentPage"
 *   :page-size="pageSize"
 *   :modes="['grid', 'table']"
 *   v-model:view-mode="viewMode"
 *   @page-change="onPageChange"
 * >
 *   <template #toolbar>...</template>
 *   <template #grid>...</template>
 *   <template #table>...</template>
 * </AppDataView>
 */
import { useI18n } from 'vue-i18n'
import { CheckCircle2 } from 'lucide-vue-next'
import ViewSwitcher from './ViewSwitcher.vue'
import type { ViewMode } from './ViewSwitcher.vue'
import AppPagination from './AppPagination.vue'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    /** État de chargement */
    loading?: boolean
    /** Aucune donnée à afficher */
    empty?: boolean
    /** Message pour l'état vide (i18n) */
    emptyLabel?: string
    /** Icône pour l'état vide */
    emptyIcon?: any
    /** Nombre total de résultats */
    total?: number
    /** Afficher le compteur de résultats */
    showCount?: boolean
    /** Modes d'affichage disponibles */
    modes?: ViewMode[]
    /** Mode d'affichage courant */
    viewMode?: ViewMode
    /** Clé de persistance pour le mode d'affichage */
    storageKey?: string
    /** Page courante */
    page?: number
    /** Nombre total de pages */
    totalPages?: number
    /** Taille de page */
    pageSize?: number
  }>(),
  {
    loading: false,
    empty: false,
    emptyLabel: '',
    total: 0,
    showCount: true,
    modes: () => ['grid', 'table'],
    viewMode: 'grid',
    storageKey: '',
    page: 1,
    totalPages: 1,
    pageSize: 20,
  }
)

const emit = defineEmits<{
  'update:viewMode': [mode: ViewMode]
  'page-change': [page: number]
}>()

function onViewModeChange(mode: ViewMode) {
  emit('update:viewMode', mode)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header : Toolbar + ViewSwitcher + Compteur -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex-1 min-w-0">
        <slot name="toolbar" />
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <!-- Compteur -->
        <p v-if="showCount && !loading" class="text-sm text-ui-muted whitespace-nowrap">
          {{ t('dataView.totalResults', { count: total }) }}
        </p>

        <!-- ViewSwitcher (si plusieurs modes) -->
        <ViewSwitcher
          v-if="modes.length > 1"
          :model-value="viewMode"
          :storage-key="storageKey"
          @update:model-value="onViewModeChange"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex h-64 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-emerald border-t-transparent" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="empty"
      class="rounded-2xl border border-dashed border-ui-border py-16 text-center dark:border-ui-border-dark"
    >
      <component
        :is="emptyIcon || CheckCircle2"
        class="mx-auto mb-3 h-12 w-12 text-primary-emerald"
      />
      <p class="text-ui-muted">{{ emptyLabel || t('dataView.empty') }}</p>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Grille -->
      <div v-if="viewMode === 'grid'" v-show="viewMode === 'grid'">
        <slot name="grid" />
      </div>

      <!-- Tableau -->
      <div v-if="viewMode === 'table'" v-show="viewMode === 'table'">
        <slot name="table" />
      </div>

      <!-- Compact -->
      <div v-if="viewMode === 'compact'" v-show="viewMode === 'compact'">
        <slot name="compact" />
      </div>

      <!-- Pagination -->
      <AppPagination
        v-if="totalPages > 1"
        :page="page"
        :total-pages="totalPages"
        :total="total"
        :limit="pageSize"
        @page-change="(p) => emit('page-change', p)"
      />
    </template>
  </div>
</template>
