<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Bell, BellOff, ShieldCheck, Info, AlertTriangle } from 'lucide-vue-next'
import { AppButton } from '../ui'
import { toast } from 'vue-sonner'
import { http } from '../../services/http'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const isSupported = ref('serviceWorker' in navigator && 'PushManager' in window)
const isSecure = ref(window.isSecureContext)
const isSubscribed = ref(false)
const loading = ref(false)
const permission = ref(JSON.parse(JSON.stringify(Notification.permission)))

const VAPID_PUBLIC_KEY = 'BP0XZcMRUEpC4ACfsb14-zwICYGVCbb7WnB2QWrfEOITDqLGtQi364RhOxGRXlwDEoOzOzrXzmMiZoJ8D1JuAyU'

onMounted(async () => {
  if (isSupported.value && isSecure.value) {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      isSubscribed.value = !!subscription
    } catch (e) {
      console.error('Push check error:', e)
    }
  }
})

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

async function subscribe() {
  if (!isSecure.value) {
    toast.error(t('notifications.secure_context_required'))
    return
  }
  
  loading.value = true
  try {
    const registration = await navigator.serviceWorker.ready
    
    // Demander la permission
    const result = await Notification.requestPermission()
    permission.value = result

    if (result !== 'granted') {
      toast.error(t('notifications.permission_denied'))
      return
    }

    // S'abonner au service push du navigateur
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })

    // Envoyer au backend
    await http.post('/notifications/subscribe', subscription.toJSON())
    
    isSubscribed.value = true
    toast.success(t('notifications.activation_success'))
  } catch (error) {
    console.error('Subscription error:', error)
    toast.error(t('notifications.activation_error'))
  } finally {
    loading.value = false
  }
}

async function unsubscribe() {
  loading.value = true
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
    }
    isSubscribed.value = false
    toast.info('Notifications désactivées.')
  } catch (error) {
    toast.error('Erreur lors de la désactivation.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="isSupported" class="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
    <div class="flex items-start gap-4">
      <div class="p-3 rounded-2xl bg-primary/10 text-primary">
        <component :is="isSubscribed ? Bell : BellOff" class="h-6 w-6" />
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-black text-gray-900 dark:text-white">{{ t('notifications.push_title') }}</h3>
        <p class="text-sm text-gray-500 mt-1">
          {{ t('notifications.push_description') }}
        </p>
        
        <div class="mt-6 flex flex-wrap gap-3">
          <AppButton 
            v-if="!isSubscribed" 
            variant="primary" 
            :loading="loading"
            :disabled="!isSecure"
            @click="subscribe"
            class="!rounded-xl"
          >
            <Bell class="h-4 h-4 mr-2" />
            {{ t('notifications.enable_push') }}
          </AppButton>
          
          <AppButton 
            v-else 
            variant="outline" 
            :loading="loading"
            @click="unsubscribe"
            class="!rounded-xl"
          >
            <BellOff class="h-4 h-4 mr-2" />
            {{ t('notifications.disable_push') }}
          </AppButton>
        </div>

        <!-- Info Context Sécurisé -->
        <div v-if="!isSecure" class="mt-4 flex items-center gap-2 text-xs text-amber-600 font-bold p-3 bg-amber-50 rounded-xl">
          <AlertTriangle class="h-4 w-4" />
          <span>{{ t('notifications.secure_context_required') }}</span>
        </div>

        <!-- Info Permission -->
        <div v-if="permission === 'denied'" class="mt-4 flex items-center gap-2 text-xs text-red-500 font-bold p-3 bg-red-50 rounded-xl">
          <Info class="h-4 w-4" />
          <span>{{ t('notifications.permission_denied') }}</span>
        </div>

        <div v-if="isSubscribed" class="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-emerald-500">
          <ShieldCheck class="h-3 w-3" />
          <span>Service sécurisé et actif</span>
        </div>
      </div>
    </div>
  </div>
</template>
