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
              <button 
                @click="handleToggleAutoDebit(lease)"
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none"
                :class="lease.auto_debit_enabled ? 'bg-primary-600' : 'bg-slate-200'"
              >
                <span
                  class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform"
                  :class="lease.auto_debit_enabled ? 'translate-x-5' : 'translate-x-1'"
                />
              </button>
              <span :class="lease.auto_debit_enabled ? 'text-primary-600 font-medium' : 'text-slate-400'">
                {{ lease.auto_debit_enabled ? $t('common.active') : $t('common.inactive') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-6 pt-6 border-t border-slate-100 space-y-4">
          <!-- Invoices Section if any -->
          <div v-if="lease.invoices && lease.invoices.length > 0" class="space-y-2">
            <h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ $t('leases.invoices_title') }}</h5>
            <div v-for="invoice in lease.invoices" :key="invoice.id" class="flex items-center justify-between p-3 bg-slate-50 rounded-xl group/inv hover:bg-white hover:shadow-md transition-all duration-300 border border-transparent hover:border-slate-100">
              <div class="flex flex-col">
                <div class="flex items-center gap-2">
                  <FileTextIcon :size="14" class="text-slate-400" />
                  <span class="text-xs font-bold text-slate-700">{{ formatDate(invoice.due_date) }}</span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase" :class="invoiceStatusClass(invoice.status)">
                    {{ invoice.status }}
                  </span>
                  <span class="text-[10px] font-bold text-slate-400">{{ formatPrice(invoice.amount) }}</span>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <button 
                  v-if="invoice.status === 'pending' || invoice.status === 'overdue'"
                  @click="handlePayInvoice(lease.id, invoice)"
                  class="px-3 py-1.5 bg-primary-600 text-white text-[10px] font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                >
                  💳 Payer
                </button>
                <button 
                  @click="handleDownloadInvoice(invoice.id)"
                  class="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  :title="$t('leases.actions.download_invoice')"
                >
                  <FileDownIcon :size="16" />
                </button>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMyLeases, signLease, downloadInvoicePdf, payInvoice, toggleAutoDebit, type LeaseDto } from '../services/lease.service'
import { useCurrency } from '../composables/useCurrency'
import { KeyIcon, HomeIcon, PenToolIcon, FileTextIcon, FileDownIcon } from 'lucide-vue-next'
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

async function handleDownloadInvoice(invoiceId: string) {
  try {
    const blob = await downloadInvoicePdf(invoiceId)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `quittance-${invoiceId.substring(0, 8)}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    toast.error('Erreur lors du téléchargement de la quittance')
  }
}

async function handlePayInvoice(leaseId: string, invoice: any) {
  if (!confirm(`Souhaitez-vous payer cette facture de ${formatPrice(invoice.amount)} depuis votre tirelire ?`)) {
    return
  }

  const toastId = toast.loading('Paiement en cours...')
  try {
    await payInvoice(invoice.id, leaseId)
    toast.success('Paiement réussi ! Votre loyer a été payé.', { id: toastId })
    await fetchLeases()
  } catch (error: any) {
    const msg = error.response?.data?.message || 'Erreur lors du paiement'
    toast.error(msg, { id: toastId })
  }
}

async function handleToggleAutoDebit(lease: LeaseDto) {
  const newState = !lease.auto_debit_enabled
  try {
    await toggleAutoDebit(lease.id, newState)
    lease.auto_debit_enabled = newState
    toast.success(newState ? 'Débit automatique activé' : 'Débit automatique désactivé')
  } catch (error) {
    toast.error("Erreur lors de la modification de l'auto-débit")
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

function invoiceStatusClass(status: string) {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-600'
    case 'pending': return 'bg-amber-100 text-amber-600'
    case 'overdue': return 'bg-red-100 text-red-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}
</script>
