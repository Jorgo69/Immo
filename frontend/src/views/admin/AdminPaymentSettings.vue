<script setup lang="ts">
/**
 * Admin Payment Settings — Gestion des passerelles Mobile Money.
 * Permet d'activer/pauser les méthodes de paiement et de configurer le mode Test.
 */
import { ref, onMounted } from 'vue'
import { Wallet, Smartphone, ShieldCheck, Pause, Play, Settings2, Loader2, Info } from 'lucide-vue-next'
import { http } from '../../services/http'
import { AppButton, AppTitle, AppCard } from '../../components/ui'
import { toast } from 'vue-sonner'

interface PaymentGateway {
  id: string
  name: string
  type: string
  isActive: boolean
  isTestMode: boolean
  config: any
}

const gateways = ref<PaymentGateway[]>([])
const loading = ref(true)
const savingId = ref<string | null>(null)

async function loadGateways() {
  loading.value = true
  try {
    const { data } = await http.get<PaymentGateway[]>('/admin/payment/gateways')
    gateways.value = data
  } catch (error) {
    toast.error("Erreur lors du chargement des passerelles")
  } finally {
    loading.value = false
  }
}

async function toggleActive(gateway: PaymentGateway) {
  savingId.value = gateway.id
  try {
    const { data } = await http.patch<PaymentGateway>(`/admin/payment/gateways/${gateway.id}`, {
      isActive: !gateway.isActive
    })
    Object.assign(gateway, data)
    toast.success(`${gateway.name} ${gateway.isActive ? 'activé' : 'mis en pause'}`)
  } catch (error) {
    toast.error("Échec de la modification")
  } finally {
    savingId.value = null
  }
}

async function toggleTestMode(gateway: PaymentGateway) {
  savingId.value = gateway.id
  try {
    const { data } = await http.patch<PaymentGateway>(`/admin/payment/gateways/${gateway.id}`, {
      isTestMode: !gateway.isTestMode
    })
    Object.assign(gateway, data)
    toast.info(`${gateway.name} passé en mode ${gateway.isTestMode ? 'TEST' : 'PRODUCTION'}`)
  } catch (error) {
    toast.error("Échec de la modification")
  } finally {
    savingId.value = null
  }
}

onMounted(loadGateways)
</script>

<template>
  <div class="space-y-8 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="flex items-center justify-between">
      <div>
        <AppTitle :level="1">Configuration des Paiements</AppTitle>
        <p class="text-[var(--color-muted)]">Gérez les passerelles Mobile Money (MTN, Moov, Celtis, FedaPay, KKiapya).</p>
      </div>
      <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
        <ShieldCheck class="h-6 w-6" />
      </div>
    </div>

    <div v-if="loading" class="flex h-64 items-center justify-center">
      <Loader2 class="h-8 w-8 animate-spin text-[var(--color-accent)]" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <AppCard v-for="gateway in gateways" :key="gateway.id" class="group relative overflow-hidden transition-all hover:shadow-xl dark:border-gray-800">
        <!-- Badge Statut -->
        <div class="absolute right-4 top-4">
          <span 
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
            :class="gateway.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'"
          >
            {{ gateway.isActive ? 'Actif' : 'En Pause' }}
          </span>
        </div>

        <div class="flex items-start gap-4 mb-6">
          <div 
            class="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110"
            :class="gateway.type.includes('GSM') ? 'bg-yellow-500/10 text-yellow-600' : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'"
          >
            <Smartphone v-if="gateway.type.includes('GSM')" class="h-6 w-6" />
            <Wallet v-else class="h-6 w-6" />
          </div>
          <div>
            <h3 class="font-black uppercase text-gray-900 dark:text-white leading-tight">{{ gateway.name }}</h3>
            <p class="text-xs font-bold text-gray-400 mt-0.5">{{ gateway.type }}</p>
          </div>
        </div>

        <div class="space-y-4">
          <!-- Switch Mode -->
          <div class="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
            <div class="flex items-center gap-2">
              <Settings2 class="h-4 w-4 text-gray-400" />
              <span class="text-xs font-bold text-gray-600 dark:text-gray-300">Mode Sandbox</span>
            </div>
            <button 
              @click="toggleTestMode(gateway)"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="gateway.isTestMode ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'"
            >
              <span 
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="gateway.isTestMode ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <AppButton 
              v-if="gateway.isActive"
              variant="outline" 
              class="flex-1 !border-red-100 !text-red-500 hover:!bg-red-50 dark:!border-red-900/30 dark:hover:!bg-red-900/10"
              @click="toggleActive(gateway)"
              :loading="savingId === gateway.id"
            >
              <Pause class="mr-2 h-4 w-4" />
              Mettre en Pause
            </AppButton>
            <AppButton 
              v-else
              variant="primary" 
              class="flex-1 !bg-emerald-500 !text-white hover:!bg-emerald-600 border-none"
              @click="toggleActive(gateway)"
              :loading="savingId === gateway.id"
            >
              <Play class="mr-2 h-4 w-4" />
              Activer
            </AppButton>
          </div>
        </div>

        <!-- Footer Info -->
        <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
           <Info class="h-3 w-3" />
           <span>Configurable via API Keys</span>
        </div>
      </AppCard>
    </div>

    <!-- Note Admin -->
    <div class="rounded-3xl bg-blue-50 p-6 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 flex items-start gap-4">
      <div class="h-10 w-10 shrink-0 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
        <ShieldCheck class="h-6 w-6" />
      </div>
      <div class="space-y-1">
        <h4 class="font-bold text-blue-900 dark:text-blue-100">Note de Sécurité</h4>
        <p class="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
          Mettre une passerelle en pause la retirera immédiatement de la liste des options disponibles pour les locataires. 
          Le mode Sandbox permet de tester les flux financiers sans argent réel.
        </p>
      </div>
    </div>
  </div>
</template>
