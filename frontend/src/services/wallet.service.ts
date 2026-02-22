import { http } from './http'

export interface WalletDto {
  balance_total: string
  balance_savings: string
}

export interface WalletTransactionDto {
  id: string
  amount: string
  type: string
  status: string
  created_at: string
  wallet_id?: string
  gateway_ref?: string | null
  wallet?: { id: string; user_id: string }
}

export interface PaginatedResultDto<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getMyWallet() {
  const { data } = await http.get<WalletDto>('/wallet/me')
  return data
}

export async function getMyTransactions(
  page = 1,
  limit = 20,
): Promise<PaginatedResultDto<WalletTransactionDto>> {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))
  const { data } = await http.get<PaginatedResultDto<WalletTransactionDto>>(
    `/wallet/transactions?${params.toString()}`,
  )
  return data
}

export async function recordSaving(amount: number) {
  return http.post('/wallet/transaction', { amount, type: 'saving' })
}

/** Audit admin : toutes les transactions (lecture seule). */
export async function getAuditTransactions(
  page = 1,
  limit = 20,
): Promise<PaginatedResultDto<WalletTransactionDto>> {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))
  const { data } = await http.get<PaginatedResultDto<WalletTransactionDto>>(
    `/wallet/audit/transactions?${params.toString()}`,
  )
  return data
}

