import { http } from './http'

export interface Notification {
  id: string
  userId: string
  title_fr: string
  title_en: string
  message_fr: string
  message_en: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL'
  isRead: boolean
  createdAt: string
  metadata?: any
}

export async function getNotifications(): Promise<Notification[]> {
  const response = await http.get<Notification[]>('/notifications')
  return (response as any).data || []
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await http.patch(`/notifications/${id}/read`)
}

export async function clearAllNotifications(): Promise<void> {
  await http.delete('/notifications')
}
