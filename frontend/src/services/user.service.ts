/**
 * Service admin : liste et détail des utilisateurs.
 */
import { http } from './http'

export type UserRole = 'tenant' | 'landlord' | 'agent' | 'admin'

export interface AdminUserDto {
  id: string
  phone_number: string
  preferred_lang: string
  id_card_url?: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
  profile?: {
    id: string
    kyc_status: string
    kyc_submitted_at: string | null
    kyc_reviewed_at: string | null
    kyc_rejection_reason: string | null
  } | null
}

export interface PaginatedUsersResult {
  data: AdminUserDto[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface GetUsersFilters {
  page?: number
  limit?: number
  role?: UserRole
  is_active?: boolean
  search?: string
}

export async function getUsers(filters: GetUsersFilters = {}): Promise<PaginatedUsersResult> {
  const params = new URLSearchParams()
  if (filters.page != null) params.set('page', String(filters.page))
  if (filters.limit != null) params.set('limit', String(filters.limit))
  if (filters.role) params.set('role', filters.role)
  if (filters.is_active !== undefined && filters.is_active !== null) params.set('is_active', String(filters.is_active))
  if (filters.search != null && filters.search.trim() !== '') params.set('search', filters.search.trim())
  const { data } = await http.get<PaginatedUsersResult>(`/user/all?${params.toString()}`)
  return data
}

export async function getUserById(id: string): Promise<AdminUserDto> {
  const { data } = await http.get<AdminUserDto>(`/user/by-id?id=${encodeURIComponent(id)}`)
  return data
}

export interface UserDetailStatsDto {
  propertiesAsOwnerCount: number
  roomsAsOwnerCount: number
  propertiesAsAgentCount: number
  roomsAsAgentCount: number
  walletBalanceTotal: string | null
  walletBalanceSavings: string | null
  transactionsCount: number
  lastTransactionAt: string | null
}

export interface UserDetailResultDto {
  user: AdminUserDto
  stats: UserDetailStatsDto
}

export async function getUserDetail(id: string): Promise<UserDetailResultDto> {
  const { data } = await http.get<UserDetailResultDto>(`/user/detail?id=${encodeURIComponent(id)}`)
  return data
}

export interface PaginatedTransactionsResult {
  data: Array<{
    id: string
    wallet_id: string
    amount: string
    type: string
    status: string
    gateway_ref: string | null
    created_at: string
  }>
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getUserDetailTransactions(
  userId: string,
  page = 1,
  limit = 10
): Promise<PaginatedTransactionsResult> {
  const params = new URLSearchParams({ id: userId, page: String(page), limit: String(limit) })
  const { data } = await http.get<PaginatedTransactionsResult>(`/user/detail/transactions?${params.toString()}`)
  return data
}

export async function reviewKyc(
  userId: string,
  action: 'approve' | 'reject',
  reason?: string
): Promise<{ success: boolean; status: string }> {
  const { data } = await http.post<{ success: boolean; status: string }>(`/user/${encodeURIComponent(userId)}/kyc`, {
    action,
    rejection_reason: reason,
  })
  return data
}
