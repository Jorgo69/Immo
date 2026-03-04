<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  getNotifications, 
  markNotificationAsRead, 
  clearAllNotifications,
  type Notification 
} from '../../services/notification.service'
import { getApiErrorMessage } from '../../services/http'
import { useCurrency } from '../../composables/useCurrency'
import { toast } from 'vue-sonner'
import { AppTitle, AppCard, AppParagraph, AppButton } from '../../components/ui'
import { Bell, Trash2, CheckCheck, Info, CheckCircle2, AlertTriangle, AlertOctagon, Clock } from 'lucide-vue-next'

const { t, locale } = useI18n()
const { formatPrice, loadRates } = useCurrency()
const loading = ref(true)
const notifications = ref<Notification[]>([])

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '--:--'
    return date.toLocaleString(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '--:--'
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'SUCCESS': return CheckCircle2
    case 'WARNING': return AlertTriangle
    case 'CRITICAL': return AlertOctagon
    default: return Info
  }
}

function getTypeClass(type: string) {
  switch (type) {
    case 'SUCCESS': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
    case 'WARNING': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10'
    case 'CRITICAL': return 'text-red-500 bg-red-50 dark:bg-red-500/10'
    default: return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10'
  }
}

async function load() {
  loading.value = true
  try {
    await loadRates()
    notifications.value = await getNotifications()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    loading.value = false
  }
}

function getNotificationMessage(notif: Notification) {
  if (notif.metadata?.amount && (notif.metadata?.msgKey === 'deposit_success' || notif.title_fr?.includes('Dépôt'))) {
    const formatted = formatPrice(Number(notif.metadata.amount))
    return t('notifications.deposit_success_msg', { amount: formatted })
  }
  return locale.value === 'en' ? notif.message_en : notif.message_fr
}

async function handleMarkRead(id: string) {
  try {
    await markNotificationAsRead(id)
    const notif = notifications.value.find(n => n.id === id)
    if (notif) notif.isRead = true
  } catch (e) {
    toast.error(t('notifications.mark_as_read_error'))
  }
}

async function handleMarkAllRead() {
  const unread = notifications.value.filter(n => !n.isRead)
  if (unread.length === 0) return

  try {
    for (const n of unread) {
      await markNotificationAsRead(n.id)
      n.isRead = true
    }
    toast.success(t('notifications.activation_success')) // On pourrait ajouter une clé dédiée
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  }
}

async function handleClearAll() {
  if (!confirm(t('notifications.confirm_clear'))) return

  try {
    await clearAllNotifications()
    notifications.value = []
    toast.success(t('notifications.clear_all_success'))
  } catch (e) {
    toast.error(t('notifications.clear_all_error'))
  }
}

onMounted(() => load())
</script>

<template>
  <div class="max-w-4xl mx-auto p-4 md:p-6">
    <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] shadow-sm">
          <Bell class="h-7 w-7" />
        </div>
        <div>
          <AppTitle :level="1" class="mb-1">{{ t('notifications.title') }}</AppTitle>
          <AppParagraph muted>{{ t('notifications.push_description') }}</AppParagraph>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <AppButton 
          variant="outline" 
          size="sm" 
          @click="handleMarkAllRead"
          :disabled="!notifications.some(n => !n.isRead)"
          class="rounded-xl"
        >
          <CheckCheck class="w-4 h-4 mr-2" />
          {{ t('notifications.mark_as_read') }}
        </AppButton>
        <AppButton 
          variant="outline" 
          size="sm" 
          @click="handleClearAll"
          :disabled="notifications.length === 0"
          class="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-100 dark:border-red-900/30"
        >
          <Trash2 class="w-4 h-4 mr-2" />
          {{ t('notifications.clear_all') }}
        </AppButton>
      </div>
    </div>

    <AppCard v-if="loading" class="p-12 text-center text-[var(--color-muted)]">
      <div class="flex flex-col items-center gap-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
        <p>Chargement de vos notifications...</p>
      </div>
    </AppCard>

    <div v-else-if="notifications.length === 0" class="py-20 text-center">
      <div class="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800/50 text-gray-400 mb-6">
        <Bell class="h-10 w-10 opacity-20" />
      </div>
      <AppTitle :level="3" class="mb-2 opacity-60">{{ t('notifications.no_notifications') }}</AppTitle>
      <AppParagraph muted>Vous n'avez aucun message pour le moment.</AppParagraph>
    </div>

    <div v-else class="space-y-4">
      <div 
        v-for="notif in notifications" 
        :key="notif.id"
        class="group relative bg-white dark:bg-gray-900 border rounded-2xl p-5 transition-all hover:shadow-md hover:border-[var(--color-accent)]/30"
        :class="[notif.isRead ? 'border-gray-100 dark:border-gray-800 opacity-80' : 'border-blue-100 dark:border-blue-900/30 shadow-sm']"
      >
        <!-- Indicateur non lu -->
        <div v-if="!notif.isRead" class="absolute top-5 right-5 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]"></div>

        <div class="flex gap-4">
          <div :class="['flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center', getTypeClass(notif.type)]">
            <component :is="getTypeIcon(notif.type)" class="w-6 h-6" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1 gap-4">
              <h3 class="font-bold text-lg text-[var(--color-text)] truncate">
                {{ locale === 'en' ? notif.title_en : notif.title_fr }}
              </h3>
              <span class="text-xs font-medium text-[var(--color-muted)] whitespace-nowrap flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
                <Clock class="w-3 h-3" />
                {{ formatDate(notif.createdAt) }}
              </span>
            </div>
            
            <p class="text-[var(--color-text)] opacity-80 leading-relaxed mb-4">
              {{ getNotificationMessage(notif) }}
            </p>

            <div v-if="!notif.isRead" class="flex justify-end">
              <AppButton 
                variant="ghost" 
                size="sm" 
                @click="handleMarkRead(notif.id)"
                class="text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 px-4 h-8 rounded-lg text-xs font-semibold"
              >
                {{ t('notifications.mark_as_read') }}
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
