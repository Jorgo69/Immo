<script setup lang="ts">
/**
 * Vue tableau pro — PATTERN DE VISUALISATION (ARCHITECTURE §6).
 * Colonnes : [Miniature ronde] | Nom du bien | Ville | Unités (Total/Occupé) | Revenu (FCFA) | Statut | Quick Actions (menu déroulant).
 * @props properties - liste filtrée
 * @props displayName - nom formaté (fr JSONB ou chaîne, jamais d'ID brut)
 * @emits manage-units, add-unit, quick-edit, view-details
 */
import { ref, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { MapPin, Layers, TrendingUp, MoreVertical, Pencil, Plus, Eye } from 'lucide-vue-next'
import type { PropertyListItemDto, UnitDto } from '../../services/property.service'
import { AppButton } from '../../components/ui'
import PropertyCardImage from '../../components/landlord/PropertyCardImage.vue'

const props = defineProps<{
  properties: PropertyListItemDto[]
  primaryImageUrl: (p: PropertyListItemDto) => string | undefined
  displayName: (p: PropertyListItemDto) => string
  cityDisplay: (p: PropertyListItemDto) => string
  statusLabel: (status: string) => string
  formatPrice: (price: string) => string
}>()

const emit = defineEmits<{
  (e: 'select-property', p: PropertyListItemDto): void
  (e: 'select-property-units', p: PropertyListItemDto): void
  (e: 'add-unit', p: PropertyListItemDto): void
  (e: 'quick-edit', p: PropertyListItemDto): void
  (e: 'edit-property', p: PropertyListItemDto): void
  (e: 'view-details', p: PropertyListItemDto): void
}>()

const { t } = useI18n()
const openMenuId = ref<string | null>(null)

function toggleMenu(propertyId: string) {
  openMenuId.value = openMenuId.value === propertyId ? null : propertyId
}

function closeMenu() {
  openMenuId.value = null
}

function onEdit(p: PropertyListItemDto) {
  closeMenu()
  emit('quick-edit', p)
}

function onAddUnit(p: PropertyListItemDto) {
  closeMenu()
  emit('add-unit', p)
}

function onEditProperty(p: PropertyListItemDto) {
  closeMenu()
  emit('edit-property', p)
}

function onViewDetails(p: PropertyListItemDto) {
  closeMenu()
  emit('view-details', p)
}

function onSelectProperty(p: PropertyListItemDto) {
  closeMenu()
  emit('select-property', p)
}

function onSelectPropertyUnits(p: PropertyListItemDto) {
  closeMenu()
  emit('select-property-units', p)
}

function unitCount(p: PropertyListItemDto): number {
  return p.units?.length ?? 0
}

function occupiedCount(p: PropertyListItemDto): number {
  if (!p.units?.length) return 0
  return p.units.filter((u: UnitDto) => !u.is_available).length
}

function estimatedRevenue(p: PropertyListItemDto): string {
  if (!p.units?.length) return '—'
  const total = p.units.reduce((sum, u) => sum + Number(u.price || 0), 0)
  return props.formatPrice(String(total))
}

function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target?.closest?.('[data-quick-actions]')) return
  closeMenu()
}

watch(openMenuId, (id) => {
  if (id) {
    setTimeout(() => document.addEventListener('click', onDocClick), 0)
  } else {
    document.removeEventListener('click', onDocClick)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-600">
    <table class="w-full text-sm text-left">
      <thead class="bg-gray-50 dark:bg-gray-800/80 text-[var(--color-muted)]">
        <tr>
          <th class="w-12 px-2 py-2.5 font-medium">{{ t('landlord.assets.thumbnail') }}</th>
          <th class="px-3 py-2.5 font-medium">{{ t('landlord.assets.name') }}</th>
          <th class="px-3 py-2.5 font-medium">{{ t('landlord.assets.location') }}</th>
          <th class="px-3 py-2.5 font-medium">{{ t('landlord.assets.units') }}</th>
          <th class="px-3 py-2.5 font-medium">{{ t('landlord.assets.revenue') }}</th>
          <th class="px-3 py-2.5 font-medium">{{ t('landlord.assets.status') }}</th>
          <th class="px-3 py-2.5 font-medium text-right">{{ t('landlord.assets.actions') }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
        <tr
          v-for="p in properties"
          :key="p.id"
          class="text-[var(--color-text)] hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
        >
          <td class="px-2 py-2 w-12">
            <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 flex items-center justify-center">
              <PropertyCardImage
                :src="primaryImageUrl(p)"
                :alt="displayName(p)"
                rounded="full"
                class="w-full h-full"
              />
            </div>
          </td>
          <td class="px-3 py-2.5 font-medium max-w-[180px]">
            <button
              type="button"
              class="text-left truncate block w-full text-[var(--color-accent)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 rounded"
              @click="onSelectProperty(p)"
            >
              {{ displayName(p) }}
            </button>
          </td>
          <td class="px-3 py-2.5 text-[var(--color-muted)]">
            <span class="inline-flex items-center gap-1">
              <MapPin class="w-3.5 h-3.5 shrink-0" />
              {{ cityDisplay(p) }}
            </span>
          </td>
          <td class="px-3 py-2.5">
            <span class="inline-flex items-center gap-1">
              <Layers class="w-3.5 h-3.5 text-[var(--color-muted)]" />
              {{ unitCount(p) }} / {{ occupiedCount(p) }}
            </span>
          </td>
          <td class="px-3 py-2.5 text-[var(--color-muted)]">
            <span class="inline-flex items-center gap-1">
              <TrendingUp class="w-3.5 h-3.5" />
              {{ estimatedRevenue(p) }}
            </span>
          </td>
          <td class="px-3 py-2.5">
            <span
              class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
              :class="{
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': p.status === 'available',
                'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300': p.status === 'coming_soon',
                'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200': p.status === 'occupied',
                'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300': p.status === 'maintenance',
              }"
            >
              {{ statusLabel(p.status) }}
            </span>
          </td>
          <td class="px-3 py-2.5 text-right relative" data-quick-actions>
            <div class="flex justify-end">
              <AppButton
                variant="ghost"
                size="sm"
                class="min-w-0 p-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                :aria-label="t('landlord.assets.quickActions')"
                :aria-expanded="openMenuId === p.id"
                @click="toggleMenu(p.id)"
              >
                <MoreVertical class="w-4 h-4" />
              </AppButton>
            </div>
            <div
              v-show="openMenuId === p.id"
              class="absolute right-0 top-full z-10 mt-0.5 min-w-[160px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1"
              role="menu"
            >
              <button
                type="button"
                class="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                role="menuitem"
                @click="onEdit(p)"
              >
                <Pencil class="w-3.5 h-3.5 text-[var(--color-muted)]" />
                {{ t('landlord.assets.quickEdit') }}
              </button>
              <button
                type="button"
                class="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                role="menuitem"
                @click="onAddUnit(p)"
              >
                <Plus class="w-3.5 h-3.5 text-[var(--color-muted)]" />
                {{ t('landlord.addUnit') }}
              </button>
              <button
                type="button"
                class="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                role="menuitem"
                @click="onEditProperty(p)"
              >
                <Pencil class="w-3.5 h-3.5 text-[var(--color-muted)]" />
                {{ t('landlord.editProperty') }}
              </button>
              <button
                type="button"
                class="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                role="menuitem"
                @click="onViewDetails(p)"
              >
                <Eye class="w-3.5 h-3.5 text-[var(--color-muted)]" />
                {{ t('landlord.assets.viewDetails') }}
              </button>
              <button
                type="button"
                class="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700"
                role="menuitem"
                @click="onSelectPropertyUnits(p)"
              >
                {{ t('landlord.manageUnits') }}
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
