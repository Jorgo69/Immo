import { http } from './http'

/** Image avec métadonnées (backend: rank, is_primary, description i18n). */
export interface PropertyImageItemDto {
  url: string
  rank?: number
  is_primary?: boolean
  description?: Record<string, string>
}

/** Aligné backend : Property (La Maison) avec name, city_id, units, media. */
export interface PropertyListItemDto {
  id: string
  name: string
  status: string
  owner_id: string
  agent_id: string | null
  created_at?: string
  address?: string
  city_id?: string
  city?: { id: string; name: string }
  gps_latitude?: string | null
  gps_longitude?: string | null
  main_image?: string | null
  gallery?: string[]
  media?: Array<{ id: string; url: string; type: string; rank?: number; is_primary?: boolean; description?: Record<string, string> }>
  units?: UnitDto[]
  /** @deprecated Utiliser name */
  title?: string
  /** @deprecated Utiliser units[0].price */
  price_monthly?: string
}

export interface PropertyDetailDto {
  id: string
  name: string
  building_type: string
  address: string
  city_id: string
  city?: { id: string; name: string; country_id?: string }
  gps_latitude?: string | null
  gps_longitude?: string | null
  main_image?: string | null
  gallery?: string[]
  description?: Record<string, string> | null
  status: string
  owner_id?: string
  agent_id?: string | null
  created_at?: string
  updated_at?: string
  media?: Array<{ id: string; url: string; type: string; rank?: number; is_primary?: boolean; description?: Record<string, string> }>
  units?: UnitDto[]
  /** @deprecated Utiliser name */
  title?: string
  /** @deprecated Utiliser units[0].price */
  price_monthly?: string
  /** @deprecated Utiliser units */
  rooms?: UnitDto[]
  district?: string | null
  address_details?: string | null
  description_translations?: Record<string, string> | null
}

/** Alias pour compatibilité (ancien Room = Unit). */
export type RoomDto = UnitDto

/** Image unité : url, rank, is_primary, description i18n. */
export type UnitImageItemDto = PropertyImageItemDto

export interface UnitDto {
  id: string
  property_id: string
  name: string
  type: string
  price: string
  description: string | Record<string, string> | null
  features: string[] | Record<string, string[]>
  images: string[] | Array<{ url: string; rank: number; is_primary: boolean; description?: Record<string, string> }>
  is_available: boolean
  surface_m2: number | null
  floor: number | null
  caution_months?: number | null
  avance_months?: number | null
  frais_dossier?: string | null
  prepaid_electricity?: boolean
  water_included?: boolean
  /** @deprecated Utiliser price */
  price_monthly?: string | null
  /** @deprecated */
  description_translations?: Record<string, string> | null
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

/** Payload aligné CreatePropertyCommand (backend). */
export interface CreatePropertyPayload {
  name: string
  building_type: string
  address: string
  city_id: string
  gps_latitude?: number
  gps_longitude?: number
  main_image?: string
  gallery?: string[]
  /** Description i18n : { fr, en } */
  description?: Record<string, string>
  /** Images : url, rank, is_primary, description i18n (URLs à fournir après upload). */
  images?: PropertyImageItemDto[]
  title_deed?: string
  status?: string
  /** Ignoré côté backend (remplacé par JWT). */
  owner_id?: string
}

/** Payload aligné CreateUnitCommand (backend). */
export interface CreateUnitPayload {
  name: string
  type?: string
  price?: number
  /** @deprecated Utiliser price */
  price_monthly?: number
  /** Description i18n : { fr, en } */
  description?: Record<string, string>
  /** Features i18n : { fr: string[], en: string[] } ou legacy string[] */
  features?: Record<string, string[]> | string[]
  /** Images : { url, rank, is_primary, description? } (URLs après upload). */
  images?: PropertyImageItemDto[]
  management_docs?: string
  is_available?: boolean
  surface_m2?: number
  floor?: number
  caution_months?: number
  avance_months?: number
  frais_dossier?: number
  prepaid_electricity?: boolean
  water_included?: boolean
}

/** @deprecated Utiliser createUnit (API units). */
export async function createRoom(propertyId: string, payload: CreateUnitPayload) {
  return createUnit(propertyId, payload)
}

/** @deprecated Alias pour CreateUnitPayload. */
export type CreateRoomPayload = CreateUnitPayload

export async function createProperty(payload: CreatePropertyPayload) {
  const { data } = await http.post<PropertyDetailDto>('/property', payload)
  return data
}

/**
 * Upload une image pour un bien (ARCHITECTURE §2 — appels API dans services/).
 * Appelle POST /property/upload-image ; l’URL retournée peut être utilisée dans CreatePropertyPayload.images.
 * @param file - Fichier image (JPEG, PNG, WebP, GIF ; max 5 Mo)
 * @returns URL publique de l’image
 */
export async function uploadPropertyImage(file: File): Promise<{ url: string }> {
  const form = new FormData()
  form.append('image', file)
  const { data } = await http.post<{ url: string }>('/property/upload-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 20000,
  })
  return data
}

export async function createUnit(propertyId: string, payload: CreateUnitPayload) {
  const body = {
    ...payload,
    name: payload.name,
    type: payload.type ?? 'studio',
    price: payload.price ?? payload.price_monthly ?? 0,
  }
  const { data } = await http.post<UnitDto>(`/property/${propertyId}/units`, body)
  return data
}

export interface GetMyPropertiesFilters {
  city?: string
  status?: string
  min_price?: number
  max_price?: number
  page?: number
  limit?: number
}

/** Liste des biens du propriétaire connecté (GET /property/owner/me). */
export async function getMyProperties(
  filters: GetMyPropertiesFilters = {},
): Promise<PaginatedResultDto<PropertyListItemDto>> {
  const params = new URLSearchParams()
  if (filters.city) params.set('city', filters.city)
  if (filters.status) params.set('status', filters.status)
  if (filters.min_price != null) params.set('min_price', String(filters.min_price))
  if (filters.max_price != null) params.set('max_price', String(filters.max_price))
  if (filters.page != null) params.set('page', String(filters.page))
  if (filters.limit != null) params.set('limit', String(filters.limit))
  const { data } = await http.get<PaginatedResultDto<PropertyListItemDto>>(
    `/property/owner/me?${params.toString()}`,
  )
  return data
}

/** Met à jour un bien (PUT /property/:id). */
export interface UpdatePropertyPayload {
  name?: string
  building_type?: string
  address?: string
  city_id?: string
  gps_latitude?: number
  gps_longitude?: number
  main_image?: string
  gallery?: string[]
  description?: Record<string, string>
  images?: PropertyImageItemDto[]
  status?: string
}

export async function updateProperty(id: string, payload: UpdatePropertyPayload) {
  const { data } = await http.put<PropertyDetailDto>(`/property/${id}`, payload)
  return data
}

/** Met à jour une unité (PUT /property/:propertyId/units/:unitId). */
export interface UpdateUnitPayload {
  name?: string
  type?: string
  price?: number
  description?: Record<string, string>
  features?: Record<string, string[]> | string[]
  images?: PropertyImageItemDto[]
  is_available?: boolean
  surface_m2?: number
  floor?: number
  caution_months?: number
  avance_months?: number
  frais_dossier?: number
  prepaid_electricity?: boolean
  water_included?: boolean
}

export async function updateUnit(propertyId: string, unitId: string, payload: UpdateUnitPayload) {
  const { data } = await http.put<UnitDto>(`/property/${propertyId}/units/${unitId}`, payload)
  return data
}

/** Supprime un bien (DELETE /property/:id). Cascade : unités et médias en soft delete. */
export async function deleteProperty(id: string): Promise<{ deleted: true }> {
  const { data } = await http.delete<{ deleted: true }>(`/property/${id}`)
  return data
}

/** Supprime une unité (DELETE /property/:propertyId/units/:unitId). */
export async function deleteUnit(propertyId: string, unitId: string): Promise<{ deleted: true }> {
  const { data } = await http.delete<{ deleted: true }>(`/property/${propertyId}/units/${unitId}`)
  return data
}
