<script setup lang="ts">
/**
 * Vue de simulation de paiement Mobile Money.
 * Utilisée pour simuler le flux réel des opérateurs (MTN, Moov, etc.) en développement.
 */
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Smartphone, CheckCircle2, XCircle, ShieldCheck, ArrowLeft } from 'lucide-vue-next'
import { AppButton, AppTitle, AppCard } from '../../components/ui'
import { toast } from 'vue-sonner'
import { http } from '../../services/http'
import { useAppStore } from '../../stores/app'

const appStore = useAppStore()

const route = useRoute()
const router = useRouter()

const id = ref(route.query.id as string)
const amount = ref(route.query.amount as string)
const gateway = ref(route.query.gateway as string || 'Mobile Money')
const status = ref<'pending' | 'success' | 'error'>('pending')
const loading = ref(false)

async function confirmPayment() {
  loading.value = true
  try {
    // Simulation de l'appel webhook backend
    await http.post(`/payment/webhook/${gateway.value.toUpperCase()}`, {
      id: id.value,
      amount: Number(amount.value),
      status: 'approved',
      reference: id.value,
      userId: appStore.userId,
      currency: route.query.currency || 'XOF'
    })
    
    status.value = 'success'
    toast.success('Paiement confirmé avec succès !')
    
    // Rediriger vers le profil après 2 secondes
    setTimeout(() => {
      router.push('/admin/profile')
    }, 2000)
  } catch (error) {
    toast.error('Erreur lors de la confirmation du paiement.')
  } finally {
    loading.value = false
  }
}

function cancelPayment() {
  status.value = 'error'
  toast.error('Paiement annulé.')
  setTimeout(() => {
    router.push('/admin/profile')
  }, 1500)
}
const sendTestNotification = async () => {
  try {
    await http.post('/notifications/test', {})
    toast.success('Notification de test envoyée !')
  } catch (error) {
    toast.error('Échec de l\'envoi de la notification de test.')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4 dark:bg-gray-900">
    <div class="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <!-- Simulation Card -->
      <AppCard class="overflow-hidden border-none shadow-2xl">
        <template #header>
          <div class="bg-[var(--color-accent)] p-8 text-white text-center">
            <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-md animate-pulse">
              <Smartphone class="h-10 w-10" />
            </div>
            <AppTitle :level="2" class="text-white text-2xl mb-1">Passerelle de Paiement</AppTitle>
            <p class="text-white/70 font-medium uppercase tracking-widest text-xs">Simulation {{ gateway }}</p>
          </div>
        </template>

        <div class="p-8 space-y-8">
          
          <!-- State: Pending -->
          <div v-if="status === 'pending'" class="space-y-6">
            <div class="text-center">
              <p class="text-gray-500 text-sm font-medium">Montant à régler</p>
              <p class="text-5xl font-black text-gray-900 dark:text-white mt-2">
                {{ Number(amount).toLocaleString() }} <span class="text-xl text-gray-400">XOF</span>
              </p>
            </div>

            <div class="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <div class="flex items-center justify-between text-sm mb-4">
                <span class="text-gray-500">Référence</span>
                <span class="font-mono font-bold text-gray-900 dark:text-white">{{ id }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">Marchand</span>
                <span class="font-bold text-gray-900 dark:text-white">Immo Bénin SARL</span>
              </div>
            </div>

            <div class="space-y-4 pt-4">
              <AppButton 
                class="w-full !rounded-2xl !py-4 h-auto text-lg shadow-lg shadow-[var(--color-accent)]/20" 
                variant="primary" 
                :loading="loading"
                @click="confirmPayment"
              >
                Confirmer le Paiement
              </AppButton>
              
              <button 
                @click="cancelPayment"
                class="w-full text-sm font-bold text-gray-400 hover:text-red-500 transition-colors py-2 flex items-center justify-center gap-2"
              >
                <ArrowLeft class="w-4 h-4" />
                Annnuler et retourner
              </button>
            </div>
          </div>

          <!-- State: Success -->
          <div v-if="status === 'success'" class="text-center py-8 space-y-6">
            <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-in zoom-in duration-500">
              <CheckCircle2 class="h-12 w-12" />
            </div>
            <div>
              <h3 class="text-2xl font-black text-gray-900 dark:text-white">Transaction Réussie</h3>
              <p class="text-gray-500 mt-2">Votre tirelire a été créditée avec succès.</p>
            </div>
            <p class="text-xs text-gray-400 animate-pulse">Redirection vers votre profil...</p>
          </div>

          <!-- State: Error -->
          <div v-if="status === 'error'" class="text-center py-8 space-y-6">
            <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-600 animate-in zoom-in duration-500">
              <XCircle class="h-12 w-12" />
            </div>
            <div>
              <h3 class="text-2xl font-black text-gray-900 dark:text-white">Transaction Annulée</h3>
              <p class="text-gray-500 mt-2">Le paiement n'a pas pu être finalisé.</p>
            </div>
            <p class="text-xs text-gray-400">Redirection vers votre profil...</p>
          </div>

        </div>

        <!-- Footer Info -->
        <div class="bg-gray-50 dark:bg-gray-800/50 p-4 flex items-center justify-center gap-2 border-t border-gray-100 dark:border-gray-800">
          <ShieldCheck class="w-4 h-4 text-emerald-500" />
          <span class="text-[10px] uppercase tracking-widest font-bold text-gray-400">Paiement Sécurisé SSL 256-bit</span>
        </div>
      </AppCard>
  
      <AppButton 
        variant="outline" 
        @click="sendTestNotification" 
        class="w-full mt-4 !rounded-2xl py-3 border-gray-200 dark:border-gray-700 font-bold hover:bg-gray-100 dark:hover:bg-gray-800"
        :disabled="loading"
      >
        Tester la notification push
      </AppButton>
    </div>
  </div>
</template>
