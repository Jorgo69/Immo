/**
 * Store notifications in-app.
 * Les canaux WhatsApp, SMS, Push seront branchés côté backend / workers plus tard.
 * Ce store gère l’affichage et le marquage lu des notifications reçues (API ou locales).
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AppNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  body?: string
  read: boolean
  createdAt: Date
  /** Lien action (ex: /property/123) */
  actionUrl?: string
}

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<AppNotification[]>([])

  const unreadCount = computed(() => items.value.filter((n) => !n.read).length)

  const list = computed(() => [...items.value].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))

  function add(notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) {
    const n: AppNotification = {
      ...notification,
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      read: false,
      createdAt: new Date(),
    }
    items.value = [n, ...items.value].slice(0, 100)
    return n.id
  }

  function markAsRead(id: string) {
    const n = items.value.find((i) => i.id === id)
    if (n) n.read = true
  }

  function markAllAsRead() {
    items.value.forEach((n) => (n.read = true))
  }

  function remove(id: string) {
    items.value = items.value.filter((i) => i.id !== id)
  }

  function clear() {
    items.value = []
  }

  return {
    items,
    list,
    unreadCount,
    add,
    markAsRead,
    markAllAsRead,
    remove,
    clear,
  }
})
