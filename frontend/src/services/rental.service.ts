/**
 * Service API — demandes de location (rental requests).
 * POST /rental/requests, GET ?for=landlord|tenant, PATCH accept/reject.
 */
import { http } from './http'
import type { UnitDto } from './property.service'

export type RentalRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface RentalRequestDto {
  id: string
  unit_id: string
  tenant_id: string
  status: RentalRequestStatus
  message: string | null
  desired_move_in_at: string | null
  created_at: string
  updated_at: string
  responded_at: string | null
  responded_by: string | null
  unit?: UnitDto & { property?: { id: string; name: string } | null }
  tenant?: { id: string; email?: string; avatar_url?: string | null }
}

export interface CreateRentalRequestPayload {
  unit_id: string
  message?: string
  desired_move_in_at?: string
}

export async function createRentalRequest(payload: CreateRentalRequestPayload): Promise<RentalRequestDto> {
  const { data } = await http.post<RentalRequestDto>('/rental/requests', payload)
  return data
}

export async function getRentalRequestsForLandlord(): Promise<RentalRequestDto[]> {
  const { data } = await http.get<RentalRequestDto[]>('/rental/requests', { params: { for: 'landlord' } })
  return data
}

export async function getRentalRequestsForTenant(): Promise<RentalRequestDto[]> {
  const { data } = await http.get<RentalRequestDto[]>('/rental/requests', { params: { for: 'tenant' } })
  return data
}

export async function acceptRentalRequest(requestId: string): Promise<RentalRequestDto> {
  const { data } = await http.patch<RentalRequestDto>(`/rental/requests/${requestId}/accept`)
  return data
}

export async function rejectRentalRequest(requestId: string): Promise<RentalRequestDto> {
  const { data } = await http.patch<RentalRequestDto>(`/rental/requests/${requestId}/reject`)
  return data
}
