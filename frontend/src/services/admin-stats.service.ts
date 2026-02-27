import { http } from './http'

export interface AdminDashboardStats {
  users: {
    total: number
    active: number
    restricted: number
    banned: number
    newLast30Days: number
  }
  kyc: {
    pending: number
    verified: number
    rejected: number
  }
  recentSignups: Array<{
    id: string
    phone_number: string
    role: string
    status: string
    created_at: string
  }>
  kycPendingList: Array<{
    userId: string
    phone_number: string
    role: string
    kycStatus: string
    submittedAt: string | null
  }>
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const { data } = await http.get<AdminDashboardStats>('/user/admin-stats')
  return data
}
