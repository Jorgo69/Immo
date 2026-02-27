import { http } from './http'

export interface SystemConfigDto {
  key: string
  value: string
  type: string
  description: string
  is_public: boolean
  updated_at: string
}

export async function getAllConfigs(): Promise<SystemConfigDto[]> {
  const { data } = await http.get('/settings/admin/configs')
  return data
}

export async function getPublicConfigs(): Promise<SystemConfigDto[]> {
  const { data } = await http.get('/settings/public')
  return data
}

export async function updateConfig(key: string, value: string): Promise<SystemConfigDto> {
  const { data } = await http.patch(`/settings/admin/configs/${key}`, { value })
  return data
}

export async function getMyNotificationPreferences(): Promise<Record<string, boolean>> {
  const { data } = await http.get('/settings/me/notifications')
  return data
}

export async function updateMyNotificationPreference(channel: string, isEnabled: boolean): Promise<void> {
  await http.patch(`/settings/me/notifications/${channel}`, { is_enabled: isEnabled })
}
