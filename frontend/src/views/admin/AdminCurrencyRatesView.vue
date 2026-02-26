<script setup lang="ts">
/**
 * Vue d'administration des taux de change (Devises).
 * Permet d'ajouter, éditer et activer/désactiver les devises.
 * DESIGN: Ultra-Premium Apple Glass / MallOS.
 */
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-vue-next'
import { 
  getAllCurrencies, 
  createCurrency, 
  updateCurrency, 
  deleteCurrency, 
  type CurrencyRateDto 
} from '../../services/currency.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, AppInput, AppTitle } from '../../components/ui'

const rates = ref<CurrencyRateDto[]>([])
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

const { t } = useI18n()

const isModalOpen = ref(false)
const isEditing = ref(false)
const editId = ref<string | null>(null)

const form = ref({
  currency_code: '',
  currency_symbol: '',
  rate_to_cfa: 1,
  is_active: true
})

async function fetchRates() {
  loading.value = true
  errorMessage.value = ''
  try {
    rates.value = await getAllCurrencies()
  } catch (e) {
    errorMessage.value = getApiErrorMessage(e)
    toast.error(t('admin.currencies.toastLoadError'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRates()
})

function openAddModal() {
  isEditing.value = false
  editId.value = null
  form.value = { currency_code: '', currency_symbol: '', rate_to_cfa: 1, is_active: true }
  isModalOpen.value = true
}

function openEditModal(rate: CurrencyRateDto) {
  isEditing.value = true
  editId.value = rate.id
  form.value = {
    currency_code: rate.currency_code,
    currency_symbol: rate.currency_symbol || '',
    rate_to_cfa: Number(rate.rate_to_cfa),
    is_active: rate.is_active
  }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

async function submitForm() {
  if (!form.value.currency_code || form.value.rate_to_cfa <= 0) {
    toast.error(t('admin.currencies.toastErrorRequired'))
    return
  }
  
  submitting.value = true
  try {
    if (isEditing.value && editId.value) {
      await updateCurrency(editId.value, {
        currency_code: form.value.currency_code.trim().toUpperCase(),
        currency_symbol: form.value.currency_symbol || undefined,
        rate_to_cfa: form.value.rate_to_cfa,
        is_active: form.value.is_active
      })
      toast.success(t('admin.currencies.toastUpdated'))
    } else {
      await createCurrency({
        currency_code: form.value.currency_code.trim().toUpperCase(),
        currency_symbol: form.value.currency_symbol || undefined,
        rate_to_cfa: form.value.rate_to_cfa,
        is_active: form.value.is_active
      })
      toast.success(t('admin.currencies.toastAdded'))
    }
    closeModal()
    fetchRates()
  } catch (e) {
    toast.error(getApiErrorMessage(e) || 'Erreur lors de la sauvegarde.')
  } finally {
    submitting.value = false
  }
}

async function toggleActive(rate: CurrencyRateDto) {
  try {
    const updated = await updateCurrency(rate.id, { is_active: !rate.is_active })
    const idx = rates.value.findIndex(r => r.id === rate.id)
    if (idx !== -1) rates.value[idx] = updated
    toast.success(t('admin.currencies.toastStatusUpdated', { code: updated.currency_code, status: updated.is_active ? t('admin.currencies.statusActive') : t('admin.currencies.statusInactive') }))
  } catch (e) {
    toast.error(t('admin.currencies.toastStatusUpdateError'))
  }
}

async function removeRate(id: string) {
  if (!confirm(t('admin.currencies.confirmDelete'))) return
  try {
    await deleteCurrency(id)
    rates.value = rates.value.filter(r => r.id !== id)
    toast.success(t('admin.currencies.toastDeleted'))
  } catch (e) {
    toast.error(t('admin.currencies.toastDeleteError'))
  }
}
</script>

<template>
  <div class="px-4 py-8 md:p-12 md:max-w-7xl md:mx-auto space-y-12 animate-in fade-in duration-500">
    <!-- Header -->
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-4 max-w-2xl">
        <h2 class="text-[10px] font-black uppercase tracking-widest-xl text-primary-emerald">
          {{ t('admin.title') }} > {{ t('admin.currencies.navTitle') }}
        </h2>
        <AppTitle :level="1" class="text-4xl md:text-5xl font-black tracking-tighter leading-none inline-flex flex-wrap items-center gap-4">
          {{ t('admin.currencies.title') }}
        </AppTitle>
        <p class="text-xs md:text-sm font-bold text-slate-500 max-w-xl leading-relaxed">
          {{ t('admin.currencies.subtitle') }}
        </p>
      </div>

      <AppButton
        variant="primary"
        class="rounded-full px-6 py-4 shadow-xl shadow-emerald-500/20 font-black tracking-widest text-[10px] uppercase w-full md:w-auto"
        @click="openAddModal"
      >
        <Plus :size="16" class="mr-2" />
        {{ t('admin.currencies.addCurrency') }}
      </AppButton>
    </header>

    <!-- Main Content -->
    <div v-if="loading" class="flex items-center justify-center py-24">
       <div class="flex flex-col items-center gap-4">
         <div class="w-16 h-16 border-4 border-primary-emerald/20 border-t-primary-emerald rounded-full animate-spin" />
         <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Chargement...</p>
       </div>
    </div>
    
    <div v-else-if="errorMessage" class="p-6 bg-rose-500/10 text-rose-500 rounded-3xl text-sm font-bold text-center border border-rose-500/20">
       {{ errorMessage }}
    </div>

    <div v-else class="rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 shadow-2xl overflow-hidden backdrop-blur-xl group">
        <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                <th class="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">{{ t('admin.currencies.tableCurrency') }}</th>
                <th class="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">{{ t('admin.currencies.tableRate') }}</th>
                <th class="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">{{ t('admin.currencies.tableStatus') }}</th>
                <th class="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">{{ t('admin.currencies.tableActions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200/50 dark:divide-white/5">
              <tr v-if="rates.length === 0">
                <td colspan="4" class="p-12 text-center">
                  <p class="text-sm font-bold text-slate-400">{{ t('admin.currencies.empty') }}</p>
                </td>
              </tr>
              <tr 
                v-for="rate in rates" 
                :key="rate.id"
                class="hover:bg-white/60 dark:hover:bg-white/5 transition-colors group/row"
              >
                <td class="py-5 px-6 align-middle">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-primary-emerald/10 text-primary-emerald flex items-center justify-center font-black text-sm">
                      {{ rate.currency_symbol || rate.currency_code }}
                    </div>
                    <span class="font-bold text-sm text-slate-700 dark:text-slate-200">{{ rate.currency_code }}</span>
                  </div>
                </td>
                <td class="py-5 px-6 align-middle">
                  <span class="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                    {{ Number(rate.rate_to_cfa).toLocaleString('fr-FR') }} XOF
                  </span>
                </td>
                <td class="py-5 px-6 align-middle">
                  <button 
                    class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    :class="rate.is_active ? 'bg-primary-emerald/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20'"
                    @click="toggleActive(rate)"
                  >
                    <CheckCircle2 v-if="rate.is_active" :size="14" />
                    <XCircle v-else :size="14" />
                    {{ rate.is_active ? t('admin.currencies.statusActive') : t('admin.currencies.statusInactive') }}
                  </button>
                </td>
                <td class="py-5 px-6 align-middle text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button 
                      class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-primary-emerald hover:bg-primary-emerald/10 flex items-center justify-center transition-all"
                      @click="openEditModal(rate)"
                    >
                      <Edit2 :size="16" />
                    </button>
                    <button 
                      class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-all"
                      @click="removeRate(rate.id)"
                    >
                      <Trash2 :size="16" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
        </table>
    </div>

    <!-- Modal Form -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md" @click.self="closeModal">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-2xl w-full max-w-md flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300 p-8">
            <header class="flex items-center justify-between mb-8">
              <AppTitle :level="3" class="text-2xl font-black tracking-tighter">
                {{ isEditing ? t('admin.currencies.modalEditTitle') : t('admin.currencies.modalAddTitle') }}
              </AppTitle>
               <button type="button" class="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 transition-all text-slate-400" @click="closeModal">
                 <XCircle :size="20" />
               </button>
            </header>

            <form @submit.prevent="submitForm" class="space-y-6">
               <AppInput 
                  v-model="form.currency_code" 
                  :label="t('admin.currencies.formCode')" 
                  :placeholder="t('admin.currencies.formCodePlaceholder')" 
                  maxlength="10"
                  :disabled="isEditing && form.currency_code === 'XOF'"
               />
               
               <AppInput 
                  v-model="form.currency_symbol" 
                  :label="t('admin.currencies.formSymbol')" 
                  :placeholder="t('admin.currencies.formSymbolPlaceholder')" 
                  maxlength="10"
               />
               
               <AppInput 
                  v-model="form.rate_to_cfa" 
                  type="number" 
                  step="0.000001"
                  :label="t('admin.currencies.formRate')" 
                  :placeholder="t('admin.currencies.formRatePlaceholder')"
               />

               <div class="flex items-center justify-between p-4 rounded-3xl bg-black/5 dark:bg-white/5">
                 <div>
                   <span class="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{{ t('admin.currencies.formActiveLabel') }}</span>
                   <p class="text-[10px] text-slate-500 font-bold">{{ t('admin.currencies.formActiveHint') }}</p>
                 </div>
                 <label class="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" v-model="form.is_active" class="sr-only peer">
                   <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-emerald"></div>
                 </label>
               </div>

               <AppButton 
                  type="submit" 
                  variant="primary" 
                  class="w-full rounded-2xl h-14 font-black tracking-widest text-xs uppercase mt-4"
                  :loading="submitting"
               >
                 {{ isEditing ? t('admin.currencies.btnUpdate') : t('admin.currencies.btnAdd') }}
               </AppButton>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
