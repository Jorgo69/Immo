<script setup lang="ts">
/**
 * Cloche notifications — badge nombre non lus, dropdown liste.
 * À terme : synchronisation avec l’API (WhatsApp/SMS/Push restent côté backend).
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell } from 'lucide-vue-next'
import { useNotificationsStore } from '../stores/notifications'
import { AppButton } from './ui'

const router = useRouter()
const store = useNotificationsStore()
const open = ref(false)
const panel = ref<HTMLElement | null>(null)

const unreadCount = computed(() => store.unreadCount)
const list = computed(() => store.list)

function toggle() {
  open.value = !open.value
  if (open.value) store.markAllAsRead()
}

function go(url: string) {
  open.value = false
  if (url) router.push(url)
}

function closeOnClickOutside(e: MouseEvent) {
  if (panel.value && !panel.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', closeOnClickOutside))
onUnmounted(() => document.removeEventListener('click', closeOnClickOutside))
</script>

<template>
  <div ref="panel" class="relative">
    <button
      type="button"
      class="relative flex items-center justify-center w-9 h-9 rounded-lg text-[var(--color-muted)] hover:bg-gray-100 hover:text-[var(--color-text)]"
      aria-label="Notifications"
      @click="toggle"
    >
      <Bell class="w-5 h-5" />
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-medium text-white px-1"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <div
      v-show="open"
      class="absolute right-0 top-full mt-1 w-72 max-h-80 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg z-50 py-2"
    >
      <div class="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
        <span class="text-sm font-semibold text-[var(--color-text)]">
          {{ $t('notifications.title') }}
        </span>
        <AppButton v-if="list.length" variant="ghost" size="sm" @click="store.clear">
          {{ $t('notifications.clear') }}
        </AppButton>
      </div>
      <ul v-if="list.length" class="divide-y divide-gray-100">
        <li
          v-for="n in list.slice(0, 20)"
          :key="n.id"
          class="px-3 py-2 text-left hover:bg-gray-50 cursor-pointer"
          :class="!n.read && 'bg-emerald-50/50'"
          @click="go(n.actionUrl || '')"
        >
          <p class="text-sm font-medium text-[var(--color-text)]">{{ n.title }}</p>
          <p v-if="n.body" class="text-xs text-[var(--color-muted)] mt-0.5">{{ n.body }}</p>
        </li>
      </ul>
      <p v-else class="px-3 py-4 text-sm text-[var(--color-muted)] text-center">
        {{ $t('notifications.empty') }}
      </p>
    </div>
  </div>
</template>
