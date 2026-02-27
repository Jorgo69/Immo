import { http } from './http'

export interface ActivityLogDto {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  old_values: any
  new_values: any
  description: string
  ip_address: string
  user_agent: string
  created_at: string
}

export async function getActivityLogs(
  page = 1,
  limit = 20,
  filters?: { action?: string; entityType?: string; userId?: string }
) {
  const params: Record<string, any> = { offset: (page - 1) * limit, limit }
  if (filters?.action) params.action = filters.action
  if (filters?.entityType) params.entityType = filters.entityType
  if (filters?.userId) params.userId = filters.userId

  const { data } = await http.get('/audit', { params })
  return {
    data: data.data as ActivityLogDto[],
    total: data.meta.total,
    page,
    limit,
    totalPages: Math.ceil(data.meta.total / limit),
  }
}
