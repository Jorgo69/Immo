<template>
  <div class="p-4 max-w-7xl mx-auto space-y-6">
    <header class="flex flex-col gap-2">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
        {{ $t('leases.title') }}
      </h1>
      <p class="text-slate-500">{{ $t('leases.subtitle') }}</p>
    </header>

    <div v-if="loading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>

    <div v-else-if="leases.length === 0" class="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-slate-100 text-center space-y-4">
      <div class="p-4 bg-slate-50 rounded-full text-slate-400">
        <HomeIcon :size="48" />
      </div>
      <h3 class="text-xl font-semibold">{{ $t('leases.no_leases') }}</h3>
      <p class="text-slate-500 max-w-sm">{{ $t('leases.no_leases_hint') }}</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="lease in leases" :key="lease.id" class="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
        <!-- Status Badge -->
        <div class="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium" :class="statusClass(lease.status)">
          {{ $t(`leases.status.${lease.status}`) }}
        </div>

        <div class="flex items-start gap-4">
          <div class="p-3 bg-primary-50 rounded-2xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
            <KeyIcon :size="24" />
          </div>
          <div>
            <h4 class="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
              {{ lease.property?.name || 'Bien immobilier' }}
            </h4>
            <p class="text-sm text-slate-500">{{ formatDate(lease.start_date) }}</p>
          </div>
        </div>

        <div class="mt-6 space-y-3">
          <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
            <span class="text-sm text-slate-600">{{ $t('leases.monthly_rent') }}</span>
            <span class="font-bold text-slate-900">{{ formatPrice(lease.monthly_rent) }}</span>
          </div>

          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-500">{{ $t('leases.deposit') }}</span>
            <span class="font-medium text-slate-700">{{ formatPrice(lease.deposit_amount) }}</span>
          </div>

          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-500">{{ $t('leases.auto_debit') }}</span>
            <div class="flex items-center gap-2">
              <span :class="lease.auto_debit_enabled ? 'text-green-600' : 'text-slate-400'">
                {{ lease.auto_debit_enabled ? $t('common.active') : $t('common.inactive') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-6 pt-6 border-t border-slate-100 flex gap-2">
          <button 
            v-if="lease.status === 'pending_signature' || (lease.status === 'draft' && !lease.signed_at_tenant)"
            @click="handleSign(lease)"
            class="flex-1 bg-primary-600 text-white py-2.5 rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <PenToolIcon :size="18" />
            {{ $t('leases.actions.sign') }}
          </button>
          <button 
            class="flex-1 border border-slate-200 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors text-slate-600"
          >
            {{ $t('leases.actions.view_details') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMyLeases, signLease, type LeaseDto } from '../services/lease.service'
import { useCurrency } from '../composables/useCurrency'
import { KeyIcon, HomeIcon, PenToolIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { formatPrice, loadRates } = useCurrency()
const leases = ref<LeaseDto[]>([])
const loading = ref(true)

onMounted(async () => {
  await loadRates()
  await fetchLeases()
})

async function fetchLeases() {
  loading.value = true
  try {
    leases.value = await getMyLeases()
  } catch (error) {
    toast.error('Erreur lors du chargement des locations')
  } finally {
    loading.value = false
  }
}

async function handleSign(lease: LeaseDto) {
  try {
    await signLease(lease.id)
    toast.success('Contrat signé avec succès !')
    await fetchLeases()
  } catch (error) {
    toast.error('Erreur lors de la signature')
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function statusClass(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700'
    case 'pending_signature': return 'bg-amber-100 text-amber-700'
    case 'draft': return 'bg-slate-100 text-slate-700'
    case 'terminated': return 'bg-red-100 text-red-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}
</script>
