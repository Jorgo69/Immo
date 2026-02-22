<script setup lang="ts">
/**
 * Drawer Détails & Unités (ARCHITECTURE §6).
 * Panneau latéral au clic sur une ligne ou « Voir détails » : résumé (Image, Nom, Ville), liste compacte des unités, bouton « Ajouter une unité ».
 * Pas de dépliage de ligne — tout dans le drawer.
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Pencil, Plus, Trash2, MapPin } from 'lucide-vue-next'
import { deleteUnit, type UnitDto, type PropertyDetailDto } from '../../services/property.service'
import { useReferenceStore } from '../../stores/references'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import PropertyCardImage from '../../components/landlord/PropertyCardImage.vue'
import { AppButton, ConfirmModal } from '../../components/ui'

const props = defineProps<{
  show: boolean
  property: PropertyDetailDto | null
  primaryImageUrl: string | undefined
  displayName: string
  cityName: string
  formatPrice: (price: string) => string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit-property'): void
  (e: 'add-unit'): void
  (e: 'edit-unit', unit: UnitDto): void
  (e: 'saved-unit'): void
  (e: 'delete'): void
}>()

const { t, locale } = useI18n()
const referenceStore = useReferenceStore()
const unitToDelete = ref<UnitDto | null>(null)
const deletingUnit = ref(false)
const activeTab = ref<'units' | 'conditions'>('units')

const units = computed(() => props.property?.units ?? [])

/** Calcule le total à l'entrée pour une unité : Loyer + Caution + Avance + Frais dossier. */
function getMoveInTotal(u: UnitDto): { rent: number; caution: number; avance: number; fees: number; total: number } {
  const rent = Number(u.price) || 0
  const cautionMonths = u.caution_months ?? 0
  const avanceMonths = u.avance_months ?? 0
  const fees = u.frais_dossier != null ? Number(u.frais_dossier) : 0
  const caution = cautionMonths * rent
  const avance = avanceMonths * rent
  const total = rent + caution + avance + fees
  return { rent, caution, avance, fees, total }
}

watch(
  () => props.show,
  (v) => { if (!v) { activeTab.value = 'units'; closeDeleteUnitConfirm() } }
)

function openDeleteUnitConfirm(unit: UnitDto) {
  unitToDelete.value = unit
}

function closeDeleteUnitConfirm() {
  unitToDelete.value = null
}

async function confirmDeleteUnit() {
  const u = unitToDelete.value
  if (!u || !props.property?.id) return
  deletingUnit.value = true
  try {
    await deleteUnit(props.property.id, u.id)
    toast.success(t('landlord.toast.unitDeleted'))
    emit('saved-unit')
    closeDeleteUnitConfirm()
  } catch (e) {
    toast.error(t('landlord.toast.unitDeleteError', { message: getApiErrorMessage(e) }))
  } finally {
    deletingUnit.value = false
  }
}

watch(
  () => props.property?.id,
  () => { closeDeleteUnitConfirm() }
)
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed inset-0 z-40 pointer-events-none"
      aria-hidden="true"
    >
      <div
        class="absolute inset-0 bg-black/40 pointer-events-auto"
        @click="emit('close')"
      />
    </div>
  </Transition>
  <Transition
    enter-active-class="transition duration-300 ease-out transform"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition duration-200 ease-in transform"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <aside
      v-if="show"
      class="fixed top-0 right-0 bottom-0 z-50 w-[90vw] sm:w-[40%] max-w-xl bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl flex flex-col pointer-events-auto overflow-hidden"
      role="dialog"
      aria-label="Détails du bien"
    >
      <div v-if="!property" class="flex-1 flex items-center justify-center text-[var(--color-muted)] text-sm p-6">
        {{ t('landlord.loading') }}
      </div>
      <template v-else>
        <!-- Résumé : Image, Nom, Ville -->
        <header class="shrink-0 border-b border-gray-200 dark:border-gray-700">
          <div class="aspect-[16/9] bg-gray-100 dark:bg-gray-800 relative">
            <PropertyCardImage
              :src="primaryImageUrl"
              :alt="displayName"
              class="absolute inset-0 w-full h-full"
            />
          </div>
          <div class="p-4">
            <h2 class="text-lg font-semibold text-[var(--color-text)] truncate">
              {{ displayName }}
            </h2>
            <p class="text-sm text-[var(--color-muted)] flex items-center gap-1 mt-0.5">
              <MapPin class="w-4 h-4 shrink-0" />
              {{ cityName }}
            </p>
            <div class="flex items-center gap-2 mt-3 flex-wrap">
              <AppButton variant="outline" size="sm" class="gap-1.5" @click="emit('edit-property')">
                <Pencil class="w-4 h-4" />
                {{ t('landlord.sidePanel.edit') }}
              </AppButton>
              <AppButton variant="ghost" size="sm" class="gap-1.5 text-red-600 hover:text-red-700 dark:text-red-400" @click="emit('delete')">
                <Trash2 class="w-4 h-4" />
                {{ t('landlord.deleteConfirm.delete') }}
              </AppButton>
              <button
                type="button"
                class="p-2 rounded-lg text-[var(--color-muted)] hover:bg-gray-100 dark:hover:bg-gray-700 ml-auto"
                :aria-label="t('common.cancel')"
                @click="emit('close')"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <!-- Onglets Unités / Conditions -->
        <div class="flex-1 overflow-y-auto flex flex-col">
          <div class="shrink-0 flex border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              :class="['px-4 py-3 text-sm font-medium', activeTab === 'units' ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]']"
              @click="activeTab = 'units'"
            >
              {{ t('landlord.conditions.unitsTab') }}
            </button>
            <button
              type="button"
              :class="['px-4 py-3 text-sm font-medium', activeTab === 'conditions' ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]']"
              @click="activeTab = 'conditions'"
            >
              {{ t('landlord.conditions.tab') }}
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <!-- Liste compacte des unités -->
            <div v-if="activeTab === 'units'" class="flex flex-col">
              <AppButton variant="primary" size="sm" class="w-full gap-2 mb-4" @click="emit('add-unit')">
            <Plus class="w-4 h-4" />
            {{ t('landlord.sidePanel.addUnit') }}
          </AppButton>
          <p v-if="!units.length" class="text-sm text-[var(--color-muted)] py-4 text-center">
            {{ t('landlord.noUnits') }}
          </p>
          <ul v-else class="space-y-2">
            <li
              v-for="u in units"
              :key="u.id"
              class="flex items-center justify-between gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
              @click="emit('edit-unit', u)"
            >
              <div class="min-w-0">
                <p class="font-medium text-[var(--color-text)] truncate">{{ u.name }}</p>
                <p class="text-xs text-[var(--color-muted)]">{{ u.type }} · {{ formatPrice(u.price) }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="u.is_available ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200'"
                >
                  {{ u.is_available ? t('landlord.statusAvailable') : t('landlord.statusOccupied') }}
                </span>
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-[var(--color-muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  :aria-label="t('landlord.deleteConfirm.delete')"
                  @click.stop="openDeleteUnitConfirm(u)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </li>
          </ul>
            </div>
            <!-- Onglet Conditions : calcul total à l'entrée par unité -->
            <div v-else class="space-y-4">
              <p v-if="!units.length" class="text-sm text-[var(--color-muted)] py-4 text-center">
                {{ t('landlord.noUnits') }}
              </p>
              <div
                v-for="u in units"
                :key="u.id"
                class="rounded-lg border border-gray-200 dark:border-gray-600 p-4 space-y-3"
              >
                <p class="font-medium text-[var(--color-text)]">{{ u.name }}</p>
                <template v-if="Number(u.price) > 0 || (u.caution_months ?? 0) > 0 || (u.avance_months ?? 0) > 0 || (u.frais_dossier != null && Number(u.frais_dossier) > 0)">
                  <div class="space-y-1.5 text-sm">
                    <div class="flex justify-between text-[var(--color-text)]">
                      <span>{{ t('landlord.conditions.rent') }}</span>
                      <span>{{ formatPrice(u.price) }}</span>
                    </div>
                    <div v-if="(u.caution_months ?? 0) > 0" class="flex justify-between text-[var(--color-text)]">
                      <span>{{ t('landlord.conditions.cautionMonths', { months: u.caution_months }) }}</span>
                      <span>{{ formatPrice(String(getMoveInTotal(u).caution)) }}</span>
                    </div>
                    <div v-if="(u.avance_months ?? 0) > 0" class="flex justify-between text-[var(--color-text)]">
                      <span>{{ t('landlord.conditions.avanceMonths', { months: u.avance_months }) }}</span>
                      <span>{{ formatPrice(String(getMoveInTotal(u).avance)) }}</span>
                    </div>
                    <div v-if="u.frais_dossier != null && Number(u.frais_dossier) > 0" class="flex justify-between text-[var(--color-text)]">
                      <span>{{ t('landlord.conditions.fees') }}</span>
                      <span>{{ formatPrice(u.frais_dossier) }}</span>
                    </div>
                    <div class="flex justify-between font-semibold text-[var(--color-accent)] pt-2 border-t border-gray-200 dark:border-gray-600">
                      <span>{{ t('landlord.conditions.moveInTotal') }}</span>
                      <span>{{ formatPrice(String(getMoveInTotal(u).total)) }}</span>
                    </div>
                  </div>
                </template>
                <p v-else class="text-sm text-[var(--color-muted)]">{{ t('landlord.conditions.noData') }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </aside>
  </Transition>
  <ConfirmModal
    :show="!!unitToDelete"
    :title="t('landlord.deleteConfirm.unitTitle')"
    :message="t('landlord.deleteConfirm.unitMessage')"
    :confirm-label="t('landlord.deleteConfirm.delete')"
    variant="danger"
    :loading="deletingUnit"
    @close="closeDeleteUnitConfirm"
    @confirm="confirmDeleteUnit"
  />
</template>
