<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, Check, Clock, Inbox, ChevronRight } from 'lucide-vue-next'
import { http } from '../../services/http'
import { toast } from 'vue-sonner'
import { useI18n } from 'vue-i18n'
import { useCurrency } from '../../composables/useCurrency'

interface Notification {
  id: string
  title_fr: string
  title_en: string
  message_fr: string
  message_en: string
  type: string
  isRead: boolean
  createdAt: string
  metadata?: any
}

const { t, locale } = useI18n()
const router = useRouter()
const { formatPrice, loadRates } = useCurrency()
const showDropdown = ref(false)
const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
const dropdownRef = ref<HTMLElement | null>(null)

const goToHistory = () => {
  showDropdown.value = false
  router.push('/admin/notifications')
}

const getNotificationMessage = (notif: Notification) => {
  // Détection robuste pour les dépôts (avec ou sans msgKey)
  if (notif.metadata?.amount && (notif.metadata?.msgKey === 'deposit_success' || notif.title_fr?.includes('Dépôt'))) {
    const formatted = formatPrice(Number(notif.metadata.amount))
    return t('notifications.deposit_success_msg', { amount: formatted })
  }
  return locale.value === 'en' ? notif.message_en : notif.message_fr
}

const fetchNotifications = async () => {
  try {
    const response = await http.get<Notification[]>('/notifications')
    // Axios renvoie les données dans la propriété .data
    notifications.value = (response as any).data || []
    unreadCount.value = notifications.value.filter(n => !n.isRead).length
  } catch (error) {
    console.error('Failed to fetch notifications')
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '--:--'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const markAsRead = async (id: string) => {
  try {
    await http.patch(`/notifications/${id}/read`)
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value[index].isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  } catch (error) {
    toast.error(t('notifications.mark_as_read_error'))
  }
}

const clearAll = async () => {
  if (!confirm(t('notifications.confirm_clear'))) return
  try {
    await http.delete('/notifications')
    notifications.value = []
    unreadCount.value = 0
    toast.success(t('notifications.clear_all_success'))
  } catch (error) {
    toast.error(t('notifications.clear_all_error'))
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  loadRates()
  fetchNotifications()
  document.addEventListener('mousedown', handleClickOutside)
  setInterval(fetchNotifications, 60000)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <button 
      @click="showDropdown = !showDropdown"
      class="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all dark:text-gray-400 dark:hover:bg-gray-800"
    >
      <Bell class="h-6 w-6" />
      <span 
        v-if="unreadCount > 0"
        class="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <div 
      v-if="showDropdown"
      class="absolute right-0 mt-3 w-80 sm:w-96 origin-top-right rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10 overflow-hidden z-[60] animate-in fade-in zoom-in duration-200"
    >
      <!-- Header -->
      <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
        <h3 class="font-black text-gray-900 dark:text-white">{{ t('notifications.title') }}</h3>
        <button 
          v-if="notifications.length > 0"
          @click="clearAll"
          class="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 px-2 py-1"
        >
          {{ t('notifications.clear_all') }}
        </button>
      </div>

      <!-- Content -->
      <div class="max-h-[70vh] overflow-y-auto custom-scrollbar">
        <div v-if="notifications.length === 0" class="p-12 text-center">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-300 dark:bg-gray-800">
            <Inbox class="h-8 w-8" />
          </div>
          <p class="mt-4 text-sm font-bold text-gray-500">{{ t('notifications.no_notifications') }}</p>
        </div>

        <div 
          v-for="notif in notifications" 
          :key="notif.id"
          class="p-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors relative group"
          :class="{ 'bg-blue-50/30 dark:bg-blue-900/5': !notif.isRead }"
        >
          <div class="flex gap-3">
            <div class="mt-1 h-2 w-2 shrink-0 rounded-full" :class="notif.isRead ? 'bg-transparent' : 'bg-primary'" />
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start gap-2">
                <p class="text-sm font-black text-gray-900 dark:text-white leading-tight">
                  {{ locale === 'en' ? notif.title_en : notif.title_fr }}
                </p>
                <span class="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1">
                  <Clock class="h-3 w-3" />
                  {{ formatDate(notif.createdAt) }}
                </span>
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {{ getNotificationMessage(notif) }}
              </p>
            </div>
          </div>
          
          <!-- Quick Read Button -->
          <button 
            v-if="!notif.isRead"
            @click="markAsRead(notif.id)"
            class="absolute right-4 bottom-4 p-1 rounded-lg bg-white shadow-sm border border-gray-100 text-primary opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 dark:bg-gray-800 dark:border-gray-700"
            :title="t('notifications.mark_as_read')"
          >
            <Check class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-center">
        <button 
          @click="goToHistory"
          class="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)] hover:text-black dark:hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          {{ t('notifications.view_history') }}
          <ChevronRight class="h-3 w-3" />
        </button>
      </div>
    </div>
  </div>
</template>
