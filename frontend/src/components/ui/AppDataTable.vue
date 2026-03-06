<script setup lang="ts">
/**
 * AppDataTable — Tableau de données configurable par colonnes.
 *
 * Usage :
 * <AppDataTable
 *   :columns="[
 *     { key: 'name', label: t('...'), render: 'text' },
 *     { key: 'status', label: t('...'), render: 'badge', badgeMap: { active: 'success', inactive: 'muted' } },
 *     { key: 'created_at', label: t('...'), render: 'date' },
 *   ]"
 *   :rows="data"
 *   :row-key="'id'"
 *   @row-click="onRowClick"
 * >
 *   <template #cell-actions="{ row }">
 *     <AppButton size="sm" @click="edit(row)">Edit</AppButton>
 *   </template>
 * </AppDataTable>
 */
import { useI18n } from 'vue-i18n'
import { useCurrency } from '../../composables/useCurrency'

export interface ColumnDef<T = any> {
  /** Clé de la donnée dans l'objet row */
  key: string
  /** Label i18n de la colonne */
  label: string
  /** Type de rendu prédéfini */
  render?: 'text' | 'date' | 'badge' | 'price' | 'avatar' | 'truncate'
  /** Correspondance statut → variante pour les badges */
  badgeMap?: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'muted'>
  /** Formateur personnalisé */
  formatter?: (value: any, row: T) => string
  /** Largeur CSS */
  width?: string
  /** Alignement */
  align?: 'left' | 'center' | 'right'
  /** Rend la colonne invisible sur mobile */
  hiddenOnMobile?: boolean
}

const props = withDefaults(
  defineProps<{
    columns: ColumnDef[]
    rows: any[]
    rowKey?: string
    clickable?: boolean
  }>(),
  { rowKey: 'id', clickable: false }
)

const emit = defineEmits<{
  'row-click': [row: any]
}>()

const { locale } = useI18n()
const { formatPrice: formatPriceC } = useCurrency()

const badgeVariants: Record<string, string> = {
  success: 'bg-primary-emerald-light text-primary-emerald',
  warning: 'bg-warning-orange-light text-warning-orange',
  danger: 'bg-red-100 text-danger-red',
  info: 'bg-blue-100 text-blue-800',
  muted: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

function getCellValue(row: any, col: ColumnDef): any {
  // Support nested keys like 'profile.kyc_status'
  return col.key.split('.').reduce((obj, k) => obj?.[k], row)
}

function formatCell(row: any, col: ColumnDef): string {
  const value = getCellValue(row, col)
  if (col.formatter) return col.formatter(value, row)
  
  switch (col.render) {
    case 'date':
      if (!value) return '—'
      return new Date(value).toLocaleDateString(
        locale.value === 'fr' ? 'fr-FR' : 'en-US',
        { day: '2-digit', month: 'short', year: 'numeric' }
      )
    case 'price':
      return formatPriceC(Number(value) || 0)
    case 'truncate':
      if (!value) return '—'
      return String(value).length > 12 ? String(value).slice(0, 10) + '…' : String(value)
    default:
      return value ?? '—'
  }
}

function getBadgeClass(row: any, col: ColumnDef): string {
  if (!col.badgeMap) return badgeVariants.muted
  const value = getCellValue(row, col)
  const variant = col.badgeMap[value] ?? 'muted'
  return badgeVariants[variant] ?? badgeVariants.muted
}

function alignClass(col: ColumnDef): string {
  if (col.align === 'center') return 'text-center'
  if (col.align === 'right') return 'text-right'
  return 'text-left'
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead class="border-b border-ui-border bg-ui-background/30 dark:border-ui-border-dark dark:bg-brand-dark/30">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
              'px-4 py-3 font-semibold text-xs uppercase tracking-wider text-ui-muted',
              alignClass(col),
              col.hiddenOnMobile ? 'hidden md:table-cell' : '',
              col.width ?? ''
            ]"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-ui-border/30 dark:divide-ui-border-dark/30">
        <tr
          v-for="row in rows"
          :key="row[rowKey]"
          :class="[
            'transition-colors',
            clickable
              ? 'cursor-pointer hover:bg-ui-background/50 dark:hover:bg-brand-dark/50'
              : ''
          ]"
          @click="clickable ? emit('row-click', row) : undefined"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            :class="[
              'px-4 py-3',
              alignClass(col),
              col.hiddenOnMobile ? 'hidden md:table-cell' : ''
            ]"
          >
            <!-- Slot personnalisé par colonne -->
            <slot :name="`cell-${col.key}`" :row="row" :value="getCellValue(row, col)">
              <!-- Badge -->
              <span
                v-if="col.render === 'badge'"
                class="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                :class="getBadgeClass(row, col)"
              >
                {{ formatCell(row, col) }}
              </span>

              <!-- Avatar -->
              <div v-else-if="col.render === 'avatar'" class="flex items-center gap-3">
                <img
                  v-if="getCellValue(row, col)"
                  :src="getCellValue(row, col)"
                  class="h-8 w-8 rounded-full object-cover ring-2 ring-primary-emerald/20"
                  :alt="row[rowKey]"
                />
                <div
                  v-else
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-emerald-light text-xs font-bold text-primary-emerald"
                >
                  —
                </div>
              </div>

              <!-- Text / Date / Price / Truncate (formatted) -->
              <span v-else class="text-[var(--color-text)]">
                {{ formatCell(row, col) }}
              </span>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
