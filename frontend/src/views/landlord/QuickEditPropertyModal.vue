<script setup lang="ts">
/**
 * Modal Quick Edit : modifier le statut du bien sans ouvrir la fiche complète.
 * DESIGN: Mini-Premium, moins de transparence sur demande utilisateur.
 */
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Save, Calendar } from 'lucide-vue-next'
import { updateProperty } from '../../services/property.service'
import { useReferenceStore } from '../../stores/references'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, AppTitle, AppSelect, AppInput } from '../../components/ui'
import type { PropertyListItemDto } from '../../services/property.service'

const props = defineProps<{
  show: boolean
  property: PropertyListItemDto | null
}>()

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const { t, locale } = useI18n()
const referenceStore = useReferenceStore()
const status = ref('available')
const available_from = ref('')
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
    if (p) {
      status.value = p.status || 'available'
      available_from.value = p.available_from || ''
    }
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
    const payload: any = { status: status.value }
    if (status.value === 'coming_soon') {
      payload.available_from = available_from.value || undefined
    }
    await updateProperty(props.property.id, payload)
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
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="show && property"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-2xl w-full max-w-sm relative overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          <!-- Subtle decoration -->
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary-emerald/5 blur-3xl rounded-full" />
          
          <header class="flex items-center justify-between p-6 pb-2 relative z-10">
            <div class="space-y-1">
              <AppTitle id="quick-edit-title" :level="4" class="text-xl font-black tracking-tighter text-slate-900 dark:text-white">{{ t('landlord.assets.quickEdit') }}</AppTitle>
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate max-w-[200px]">{{ property.name }}</p>
            </div>
            <button 
              type="button" 
              class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-all shadow-sm" 
              @click="close"
            >
              <X class="w-5 h-5 text-slate-400" />
            </button>
          </header>

          <div class="p-6 space-y-6 relative z-10">
            <div class="space-y-3">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{{ t('landlord.status') }}</label>
              <div class="p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                 <AppSelect 
                  v-model="status" 
                  label="" 
                  :options="statusOptions" 
                  class="bg-transparent border-none shadow-none"
                 />
              </div>
            </div>

            <!-- Conditional Date Picker (as requested) -->
            <Transition
              enter-active-class="transition duration-300 ease-out"
              enter-from-class="opacity-0 -translate-y-4"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-200 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-4"
            >
              <div v-if="status === 'coming_soon'" class="p-5 rounded-3xl bg-primary-emerald/5 border border-primary-emerald/20 animate-in">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-8 h-8 rounded-xl bg-primary-emerald/10 flex items-center justify-center text-primary-emerald">
                    <Calendar :size="16" />
                  </div>
                  <div>
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{{ t('landlord.availableFrom') }}</h4>
                  </div>
                </div>
                <AppInput v-model="available_from" type="date" label="" class="h-12 rounded-2xl" />
              </div>
            </Transition>

            <div v-if="errorMessage" class="text-[10px] font-black uppercase tracking-widest text-rose-500 text-center animate-pulse">
              {{ errorMessage }}
            </div>
          </div>

          <footer class="p-6 pt-2 flex gap-3 relative z-10">
            <AppButton variant="ghost" size="lg" class="flex-1 h-14 rounded-3xl font-black text-slate-400" @click="close">
              {{ t('common.cancel') }}
            </AppButton>
            <AppButton 
              variant="primary" 
              size="lg" 
              class="flex-[2] h-14 rounded-3xl font-black shadow-lg shadow-emerald-500/10" 
              :loading="saving" 
              @click="save"
            >
              <Save :size="18" class="mr-2" />
              {{ t('landlord.assets.save') }}
            </AppButton>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
