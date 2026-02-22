<script setup lang="ts">
/**
 * Modal Quick Edit : modifier le statut du bien sans ouvrir la fiche complète.
 * @props show, property (name pour affichage)
 * @emits close, saved
 */
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'
import { updateProperty } from '../../services/property.service'
import { useReferenceStore } from '../../stores/references'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, AppTitle } from '../../components/ui'
import type { PropertyListItemDto } from '../../services/property.service'

const props = defineProps<{
  show: boolean
  property: PropertyListItemDto | null
}>()

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const { t, locale } = useI18n()
const referenceStore = useReferenceStore()
const status = ref('available')
const saving = ref(false)
const errorMessage = ref('')

const statusOptions = computed(() =>
  referenceStore.propertyStatuses.map((r) => ({
    value: r.code,
    label: locale.value === 'fr' ? r.label_fr : r.label_en || r.label_fr,
  }))
)

watch(
  () => props.property,
  (p) => {
    if (p) status.value = p.status || 'available'
    errorMessage.value = ''
  },
  { immediate: true }
)

watch(() => props.show, (v) => { if (!v) errorMessage.value = '' })

async function save() {
  if (!props.property) return
  saving.value = true
  errorMessage.value = ''
  try {
    await updateProperty(props.property.id, { status: status.value })
    toast.success(t('landlord.assets.statusUpdated'))
    emit('saved')
    emit('close')
  } catch (e) {
    const msg = getApiErrorMessage(e)
    errorMessage.value = msg
    toast.error(t('landlord.toast.apiError', { message: msg }))
  } finally {
    saving.value = false
  }
}

function close() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show && property"
      class="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/60"
      @click.self="close"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-edit-title"
      >
        <header class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-600">
          <AppTitle id="quick-edit-title" :level="4">{{ t('landlord.assets.quickEdit') }}</AppTitle>
          <button type="button" class="p-1.5 rounded-lg text-[var(--color-muted)] hover:bg-gray-100 dark:hover:bg-gray-700" :aria-label="t('common.cancel')" @click="close">
            <X class="w-5 h-5" />
          </button>
        </header>
        <div class="p-4 space-y-3">
          <p class="text-sm text-[var(--color-muted)] truncate">{{ property.name }}</p>
          <div>
            <label class="block text-sm font-medium text-[var(--color-text)] mb-1">{{ t('landlord.status') }}</label>
            <select
              v-model="status"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[var(--color-text)]"
            >
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        </div>
        <footer class="flex justify-end gap-2 p-3 border-t border-gray-200 dark:border-gray-600">
          <AppButton variant="ghost" size="sm" @click="close">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="primary" size="sm" :loading="saving" @click="save">{{ t('landlord.assets.save') }}</AppButton>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
