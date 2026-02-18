import { http } from './http'

export interface PropertyListItemDto {
  id: string
  title: string
  city: string
  price_monthly: string
  status: string
  owner_id: string
  agent_id: string | null
  created_at?: string
  latitude?: string | null
  longitude?: string | null
  media?: Array<{ id: string; url: string; type: string }>
}

export interface PropertyDetailDto {
  id: string
  title: string
  city: string
  district: string | null
  address_details: string | null
  price_monthly: string
  status: string
  owner_id?: string
  agent_id?: string | null
  created_at?: string
  updated_at?: string
  title_translations: Record<string, string> | null
  description_translations: Record<string, string> | null
  media?: Array<{ id: string; url: string; type: string }>
  rooms?: RoomDto[]
}

export interface RoomDto {
  id: string
  name: string
  type: string | null
  price_monthly: string | null
  surface_m2: number | null
  floor: number | null
  is_available: boolean
  description_translations: Record<string, string> | null
}

export interface PropertySearchFilters {
  q?: string
  city?: string
  status?: string
  min_price?: string
  max_price?: string
  page?: number
  limit?: number
}

export interface PaginatedResultDto<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function searchProperties(
  filters: PropertySearchFilters = {},
): Promise<PaginatedResultDto<PropertyListItemDto>> {
  const params = new URLSearchParams()
  if (filters.q?.trim()) params.set('q', filters.q.trim())
  if (filters.city) params.set('city', filters.city)
  if (filters.status) params.set('status', filters.status)
  if (filters.min_price) params.set('min_price', filters.min_price)
  if (filters.max_price) params.set('max_price', filters.max_price)
  if (filters.page != null) params.set('page', String(filters.page))
  if (filters.limit != null) params.set('limit', String(filters.limit))

  const endpoint = filters.q?.trim() ? '/property/search' : '/property'
  const { data } = await http.get<PaginatedResultDto<PropertyListItemDto>>(`${endpoint}?${params.toString()}`)
  return data
}

export async function getPropertyById(id: string) {
  const { data } = await http.get<PropertyDetailDto>(`/property/${id}`)
  return data
}

export async function semanticSearchProperties(
  filters: PropertySearchFilters & { q: string },
): Promise<PaginatedResultDto<PropertyListItemDto>> {
  const params = new URLSearchParams()
  if (filters.q?.trim()) params.set('q', filters.q.trim())
  if (filters.city) params.set('city', filters.city)
  if (filters.min_price) params.set('min_price', filters.min_price)
  if (filters.max_price) params.set('max_price', filters.max_price)
  if (filters.page != null) params.set('page', String(filters.page))
  if (filters.limit != null) params.set('limit', String(filters.limit))

  const { data } = await http.get<PaginatedResultDto<PropertyListItemDto>>(
    `/property/semantic-search?${params.toString()}`,
  )
  return data
}

export interface CreatePropertyPayload {
  owner_id: string
  agent_id?: string
  title: string
  title_translations?: Record<string, string>
  description_translations?: Record<string, string>
  price_monthly: number
  city: string
  district?: string
  address_details?: string
  latitude?: number
  longitude?: number
  status?: string
  available_date?: string
}

export interface CreateRoomPayload {
  name: string
  type?: string
  price_monthly?: number
  surface_m2?: number
  floor?: number
  is_available?: boolean
  description_translations?: Record<string, string>
}

export async function createProperty(payload: CreatePropertyPayload) {
  const { data } = await http.post<PropertyDetailDto>('/property', payload)
  return data
}

export async function createRoom(propertyId: string, payload: CreateRoomPayload) {
  const { data } = await http.post<RoomDto>(`/property/${propertyId}/rooms`, payload)
  return data
}


