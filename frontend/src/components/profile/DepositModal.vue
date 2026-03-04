<script setup lang="ts">
/**
 * Modal de dépôt Mobile Money — Permet de recharger la Tirelire (Wallet).
 * Intégration FedaPay (MTN / Moov Bénin).
 */
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Wallet, Smartphone, ShieldCheck, ArrowRight, CheckCircle2, X } from 'lucide-vue-next'
import { createCheckout, getGateways, type PaymentGateway } from '../../services/payment.service'
import { AppButton, AppTitle } from '../ui'
import { toast } from 'vue-sonner'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])

const { t } = useI18n()
const amount = ref<number>(5000)
const loading = ref(false)
const gateways = ref<PaymentGateway[]>([])
const selectedGatewayId = ref<string>('')

const quickAmounts = [2000, 5000, 10000, 25000, 50000]

// Bloquer le scroll du body quand le modal est ouvert
watch(() => props.show, (show) => {
  if (show) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}, { immediate: true })

onUnmounted(() => {
  document.body.style.overflow = ''
})

onMounted(async () => {
  try {
    gateways.value = await getGateways()
    if (gateways.value.length > 0) {
      selectedGatewayId.value = gateways.value[0].id
    }
  } catch (error) {
    console.error('Failed to load gateways', error)
  }
})

async function handleDeposit() {
  if (!selectedGatewayId.value) {
    toast.error(t('wallet.selectGatewayError'))
    return
  }
  if (amount.value < 100) {
    toast.error(t('wallet.minAmountError'))
    return
  }

  loading.value = true
  try {
    const { url } = await createCheckout({
      gatewayId: selectedGatewayId.value,
      amount: amount.value,
      description: t('wallet.depositDescription')
    })
    
    // Redimensionner vers FedaPay ou simulateur
    window.location.href = url
  } catch (error) {
    toast.error(t('error.GENERIC'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
    <div class="relative w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
      
      <!-- Header -->
      <div class="bg-[var(--color-accent)] p-6 text-white text-center shrink-0 relative">
        <button 
          @click="emit('close')"
          class="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          <X class="h-5 w-5" />
        </button>
        <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
          <Wallet class="h-7 w-7" />
        </div>
        <AppTitle :level="3" class="text-white">{{ t('wallet.depositModalTitle') }}</AppTitle>
        <p class="mt-1 text-sm text-white/80">{{ t('wallet.depositStatus') }}</p>
      </div>

      <!-- Content Area (Scrollable) -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <!-- Montant -->
        <div class="space-y-3">
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{{ t('wallet.amountLabel') }}</label>
          <div class="relative group">
            <input 
              v-model.number="amount"
              type="number"
              class="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-5 py-4 text-2xl font-black text-gray-900 outline-none transition-all focus:border-[var(--color-accent)] focus:bg-white dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:focus:border-[var(--color-accent)]"
              :placeholder="t('wallet.amountPlaceholder')"
            />
            <span class="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-gray-400">XOF</span>
          </div>
          
          <!-- Quick amounts -->
          <div class="flex flex-wrap gap-2 pt-1">
            <button 
              v-for="val in quickAmounts" 
              :key="val"
              @click="amount = val"
              class="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] dark:border-gray-700"
              :class="amount === val ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-[var(--color-accent)]' : 'text-gray-500'"
            >
              {{ t('wallet.quickAmount', { amount: val }) }}
            </button>
          </div>
        </div>

        <!-- Méthodes de paiement Dynamiques -->
        <div class="space-y-3">
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Méthode de paiement</label>
          <div class="grid grid-cols-1 gap-2">
            <button 
              v-for="gateway in gateways" 
              :key="gateway.id"
              @click="selectedGatewayId = gateway.id"
              class="flex items-center justify-between rounded-2xl border-2 px-4 py-3 transition-all hover:border-[var(--color-accent)]/50"
              :class="selectedGatewayId === gateway.id 
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 shadow-sm' 
                : 'border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50'"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-gray-700">
                  <Smartphone v-if="gateway.type.includes('GSM')" class="h-5 w-5 text-gray-500" />
                  <Wallet v-else class="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                <div class="text-left">
                  <p class="text-xs font-black uppercase text-gray-900 dark:text-white">{{ gateway.name }}</p>
                  <p v-if="gateway.isTestMode" class="text-[10px] font-bold text-gray-400">Sandbox / Test</p>
                </div>
              </div>
              <CheckCircle2 v-if="selectedGatewayId === gateway.id" class="h-5 w-5 text-[var(--color-accent)] animate-in zoom-in duration-300" />
            </button>
          </div>
        </div>

        <!-- Infos Sécurité -->
        <div class="flex items-start gap-3 rounded-2xl bg-blue-50/50 p-4 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/20">
          <ShieldCheck class="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <p class="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
            {{ t('wallet.securityHint') }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-3 pt-2">
          <AppButton 
            class="w-full !rounded-2xl !py-4 h-auto text-lg" 
            variant="primary" 
            :loading="loading"
            @click="handleDeposit"
          >
            {{ t('wallet.continue') }}
            <ArrowRight v-if="!loading" class="ml-2 h-5 w-5" />
          </AppButton>
          
          <button 
            @click="emit('close')"
            class="text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors py-2"
          >
            {{ t('wallet.cancel') }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
