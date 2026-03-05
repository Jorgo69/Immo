import { http } from './http'

export type LeaseStatus = 'draft' | 'pending_signature' | 'active' | 'terminated'
export type ContractType = 'standard' | 'custom'
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export interface InvoiceDto {
  id: string
  title: string
  amount: number
  status: InvoiceStatus
  due_date: string
}

export interface LeaseDto {
  id: string
  tenant_id: string
  landlord_id: string
  property_id: string
  unit_id: string | null
  monthly_rent: number
  deposit_amount: number
  contract_type: ContractType
  contract_content: string | null
  status: LeaseStatus
  signed_at_tenant: string | null
  signed_at_landlord: string | null
  auto_debit_enabled: boolean
  next_billing_date: string | null
  start_date: string
  end_date: string | null
  property?: { name: string; main_image?: string }
  invoices?: InvoiceDto[]
}

export interface CreateLeasePayload {
  tenantId: string
  propertyId: string
  unitId?: string
  monthlyRent: number
  depositAmount: number
  startDate: string
  endDate?: string
  contractType?: ContractType
  contractContent?: string
}

export async function createLease(payload: CreateLeasePayload): Promise<LeaseDto> {
  const { data } = await http.post<LeaseDto>('/leases', payload)
  return data
}

export async function signLease(leaseId: string): Promise<LeaseDto> {
  const { data } = await http.put<LeaseDto>(`/leases/${leaseId}/sign`)
  return data
}

export async function getMyLeases(): Promise<LeaseDto[]> {
  const { data } = await http.get<LeaseDto[]>('/leases/my')
  return data
}

export async function downloadInvoicePdf(invoiceId: string): Promise<Blob> {
  const { data } = await http.get(`/leases/invoice/${invoiceId}/pdf`, {
    responseType: 'blob'
  })
  return data
}

export async function payInvoice(invoiceId: string, leaseId: string): Promise<{ success: boolean; transactionId: string }> {
  const { data } = await http.post<{ success: boolean; transactionId: string }>('/wallet/pay-rent', { invoiceId, leaseId })
  return data
}

export async function toggleAutoDebit(leaseId: string, enabled: boolean): Promise<LeaseDto> {
  const { data } = await http.put<LeaseDto>(`/leases/${leaseId}/auto-debit`, { enabled })
  return data
}
