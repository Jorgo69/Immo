<script setup lang="ts">
/**
 * Panneau latéral Master-Detail (ARCHITECTURE §6).
 * 40 % de la largeur, onglets Aperçu / Unités / Docs. Système de pile : clic sur une unité ouvre l’édition dans le panneau.
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Pencil, Plus, ArrowLeft, FileText, LayoutGrid, TrendingUp, Trash2 } from 'lucide-vue-next'
import { updateUnit, type UpdateUnitPayload, type UnitDto, type PropertyDetailDto } from '../../services/property.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import PropertyCardImage from '../../components/landlord/PropertyCardImage.vue'
import { AppButton, AppInput } from '../../components/ui'

const UNIT_TYPES = [
  { value: 'studio', labelKey: 'landlord.unitTypeStudio' },
  { value: 'chambre_salon', labelKey: 'landlord.unitTypeChambreSalon' },
  { value: '2_chambres_salon', labelKey: 'landlord.unitType2Chambres' },
  { value: '3_chambres_salon', labelKey: 'landlord.unitType3Chambres' },
  { value: '4_chambres_salon', labelKey: 'landlord.unitType4Chambres' },
  { value: 'maison', labelKey: 'landlord.unitTypeMaison' },
] as const

const props = withDefaults(
  defineProps<{
    show: boolean
    property: PropertyDetailDto | null
    primaryImageUrl: string | undefined
    displayName: string
    formatPrice: (price: string) => string
    /** Onglet affiché à l'ouverture (ex. 'units' depuis « Gérer les unités »). */
    initialTab?: 'overview' | 'units' | 'docs'
  }>(),
  { initialTab: 'overview' }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit-property'): void
  (e: 'add-unit'): void
  (e: 'edit-unit', unit: UnitDto): void
  (e: 'saved-unit'): void
  (e: 'delete'): void
}>()

const { t } = useI18n()
const activeTab = ref<'overview' | 'units' | 'docs'>('overview')
const editingUnit = ref<UnitDto | null>(null)
const unitForm = ref({ name: '', type: 'studio', price: 0 })
const priceInput = ref('0')
const savingUnit = ref(false)
const unitError = ref('')

const units = computed(() => props.property?.units ?? [])

const revenue = computed(() => {
  const u = units.value
  if (!u.length) return '—'
  const total = u.reduce((sum, x) => sum + Number(x.price || 0), 0)
  return props.formatPrice(String(total))
})

const occupiedCount = computed(() =>
  units.value.filter((u) => !u.is_available).length
)
const occupancyRate = computed(() => {
  const total = units.value.length
  if (!total) return 0
  return Math.round((occupiedCount.value / total) * 100)
})

const typeOptions = computed(() =>
  UNIT_TYPES.map((u) => ({ value: u.value, label: t(u.labelKey) }))
)

function setPriceFromInput() {
  const n = Number(priceInput.value)
  unitForm.value.price = Number.isNaN(n) ? 0 : n
}

function openUnitEdit(unit: UnitDto) {
  editingUnit.value = unit
  unitForm.value = {
    name: unit.name ?? '',
    type: (unit.type as string) ?? 'studio',
    price: Number(unit.price) || 0,
  }
  priceInput.value = String(unitForm.value.price)
  unitError.value = ''
}

function closeUnitEdit() {
  editingUnit.value = null
  unitError.value = ''
}

async function saveUnitEdit() {
  const u = editingUnit.value
  if (!u || !props.property?.id) return
  const name = unitForm.value.name.trim()
  if (!name) {
    unitError.value = t('landlord.unitName') + ' requis'
    return
  }
  setPriceFromInput()
  savingUnit.value = true
  unitError.value = ''
  try {
    const payload: UpdateUnitPayload = {
      name,
      type: unitForm.value.type,
      price: unitForm.value.price,
    }
    await updateUnit(props.property.id, u.id, payload)
    toast.success(t('landlord.assets.statusUpdated'))
    emit('saved-unit')
    closeUnitEdit()
  } catch (e) {
    const msg = getApiErrorMessage(e)
    unitError.value = msg
    toast.error(t('landlord.toast.unitUpdateError', { message: msg }))
  } finally {
    savingUnit.value = false
  }
}

watch(
  () => props.show,
  (v) => {
    if (v) activeTab.value = props.initialTab
    else {
      activeTab.value = 'overview'
      closeUnitEdit()
    }
  }
)
watch(
  () => props.property?.id,
  () => { closeUnitEdit() }
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
        class="absolute inset-0 bg-black/30 pointer-events-auto"
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
      aria-label="Détail du bien"
    >
      <div v-if="!property" class="flex-1 flex items-center justify-center text-[var(--color-muted)] text-sm p-6">
        {{ t('landlord.loading') }}
      </div>
      <template v-else>
      <!-- Header -->
      <header class="shrink-0 border-b border-gray-200 dark:border-gray-700">
        <div class="aspect-[16/9] bg-gray-100 dark:bg-gray-800 relative">
          <PropertyCardImage
            :src="primaryImageUrl"
            :alt="displayName"
            class="absolute inset-0 w-full h-full"
          />
        </div>
        <div class="p-4 flex items-start justify-between gap-2">
          <h2 class="text-lg font-semibold text-[var(--color-text)] truncate flex-1 min-w-0">
            {{ displayName }}
          </h2>
          <div class="flex items-center gap-1 shrink-0">
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
              class="p-2 rounded-lg text-[var(--color-muted)] hover:bg-gray-100 dark:hover:bg-gray-700"
              :aria-label="t('common.cancel')"
              @click="emit('close')"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <!-- Stack: unit edit -->
      <div v-if="editingUnit" class="flex-1 flex flex-col overflow-hidden">
        <div class="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <AppButton variant="ghost" size="sm" class="gap-1" @click="closeUnitEdit">
            <ArrowLeft class="w-4 h-4" />
            {{ t('landlord.back') }}
          </AppButton>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <AppInput v-model="unitForm.name" :label="t('landlord.unitName')" :placeholder="t('landlord.unitNamePlaceholder')" />
          <div>
            <label class="block text-sm font-medium text-[var(--color-text)] mb-1">{{ t('landlord.unitType') }}</label>
            <select
              v-model="unitForm.type"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-[var(--color-text)] bg-white dark:bg-gray-800"
            >
              <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-[var(--color-text)] mb-1">{{ t('landlord.unitPrice') }}</label>
            <input
              v-model="priceInput"
              type="text"
              inputmode="numeric"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-[var(--color-text)] bg-white dark:bg-gray-800"
              @blur="setPriceFromInput"
            >
          </div>
          <p v-if="unitError" class="text-sm text-red-600 dark:text-red-400">{{ unitError }}</p>
          <AppButton
            variant="primary"
            class="w-full"
            :disabled="savingUnit"
            @click="saveUnitEdit"
          >
            {{ savingUnit ? t('landlord.loading') : t('landlord.assets.save') }}
          </AppButton>
        </div>
      </div>

      <!-- Tabs + content -->
      <template v-else>
        <nav class="shrink-0 flex border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 'overview' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'"
            @click="activeTab = 'overview'"
          >
            {{ t('landlord.sidePanel.overview') }}
          </button>
          <button
            type="button"
            class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 'units' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'"
            @click="activeTab = 'units'"
          >
            {{ t('landlord.sidePanel.units') }}
          </button>
          <button
            type="button"
            class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 'docs' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'"
            @click="activeTab = 'docs'"
          >
            {{ t('landlord.sidePanel.docs') }}
          </button>
        </nav>

        <div class="flex-1 overflow-y-auto p-4">
          <!-- Aperçu -->
          <div v-show="activeTab === 'overview'" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl border border-gray-200 dark:border-gray-600 p-4">
                <div class="flex items-center gap-2 text-[var(--color-muted)] text-sm mb-1">
                  <TrendingUp class="w-4 h-4" />
                  {{ t('landlord.assets.revenue') }}
                </div>
                <p class="text-lg font-semibold text-[var(--color-text)]">{{ revenue }}</p>
              </div>
              <div class="rounded-xl border border-gray-200 dark:border-gray-600 p-4">
                <div class="flex items-center gap-2 text-[var(--color-muted)] text-sm mb-1">
                  <LayoutGrid class="w-4 h-4" />
                  {{ t('landlord.sidePanel.occupancyRate') }}
                </div>
                <p class="text-lg font-semibold text-[var(--color-text)]">{{ occupancyRate }} %</p>
              </div>
            </div>
          </div>

          <!-- Unités -->
          <div v-show="activeTab === 'units'" class="space-y-3">
            <AppButton variant="primary" size="sm" class="w-full gap-2" @click="emit('add-unit')">
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
                @click="openUnitEdit(u)"
              >
                <div class="min-w-0">
                  <p class="font-medium text-[var(--color-text)] truncate">{{ u.name }}</p>
                  <p class="text-xs text-[var(--color-muted)]">{{ u.type }} · {{ formatPrice(u.price) }}</p>
                </div>
                <span
                  class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="u.is_available ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200'"
                >
                  {{ u.is_available ? t('landlord.statusAvailable') : t('landlord.statusOccupied') }}
                </span>
              </li>
            </ul>
          </div>

          <!-- Docs -->
          <div v-show="activeTab === 'docs'" class="py-6 text-center">
            <FileText class="w-12 h-12 mx-auto text-[var(--color-muted)] mb-3" />
            <p class="text-sm text-[var(--color-muted)]">{{ t('landlord.sidePanel.docsHint') }}</p>
          </div>
        </div>
      </template>
      </template>
    </aside>
  </Transition>
</template>
