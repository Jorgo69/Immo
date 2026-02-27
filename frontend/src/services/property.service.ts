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
  /** Type de bâtiment (référentiel propertyTypes.code : villa, immeuble, bureau, etc.). */
  building_type?: string
  city_id?: string
  city?: { id: string; name: string }
  gps_latitude?: string | null
  gps_longitude?: string | null
  neighborhood_id?: string | null
  neighborhood?: { id: string; name: string } | null
  main_image?: string | null
  gallery?: string[]
  media?: Array<{ id: string; url: string; type: string; rank?: number; is_primary?: boolean; description?: Record<string, string> }>
  units?: UnitDto[]
  /** @deprecated Utiliser name */
  title?: string
  /** @deprecated Utiliser units[0].price */
  price_monthly?: string
  /** Date de disponibilité pour le statut 'coming_soon'. */
  available_from?: string | null
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
  neighborhood_id?: string | null
  neighborhood?: { id: string; name: string } | null
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
  /** Date de disponibilité pour le statut 'coming_soon'. */
  available_from?: string | null
}

/** Alias pour compatibilité (ancien Room = Unit). */
export type RoomDto = UnitDto

/** Image unité : url, rank, is_primary, description i18n. */
export type UnitImageItemDto = PropertyImageItemDto

/** Statut de disponibilité (backend UnitStatus). */
export type UnitStatusDto = 'available' | 'occupied' | 'notice_given'

export interface UnitDto {
  id: string
  property_id: string | null
  name: string
  /** @deprecated Utiliser ref_type_id / ref_type */
  type?: string
  ref_type_id?: string | null
  ref_type?: { id: string; code: string; label_fr: string; label_en: string }
  price: string
  description: string | Record<string, string> | null
  features: string[] | Record<string, string[]>
  images: string[] | Array<{ url: string; rank: number; is_primary: boolean; description?: Record<string, string> }>
  is_available?: boolean
  unit_status?: UnitStatusDto
  available_from?: string | null
  surface_m2: number | null
  floor: number | null
  address?: string | null
  neighborhood_id?: string | null
  neighborhood?: { id: string; name: string } | null
  city_id?: string | null
  gps_latitude?: string | null
  gps_longitude?: string | null
  caution_months?: number | null
  avance_months?: number | null
  frais_dossier?: string | null
  prepaid_electricity?: boolean
  water_included?: boolean
  price_monthly?: string | null
  description_translations?: Record<string, string> | null
}

export interface PropertySearchFilters {
  q?: string
  city?: string
  status?: string
  min_price?: string
  max_price?: string
  building_type?: string
  unit_type_id?: string
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
  const minPrice = filters.min_price != null && filters.min_price !== '' ? Number(filters.min_price) : NaN
  const maxPrice = filters.max_price != null && filters.max_price !== '' ? Number(filters.max_price) : NaN
  if (!Number.isNaN(minPrice) && minPrice >= 0) params.set('min_price', String(minPrice))
  if (!Number.isNaN(maxPrice) && maxPrice >= 0) params.set('max_price', String(maxPrice))
  if (filters.building_type) params.set('building_type', filters.building_type)
  if (filters.unit_type_id) params.set('unit_type_id', filters.unit_type_id)
  if (filters.page != null) params.set('page', String(filters.page))
  if (filters.limit != null) {
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10))
    params.set('limit', String(limit))
  }
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
  /** Quartier (facultatif) — ex: Cadjehoun, Gbegamey */
  neighborhood_id?: string | null
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
  ref_type_id: string
  /** Unité rattachée à un bien (optionnel) ; si absent, unité indépendante (owner_id, address, city_id, gps). */
  property_id?: string | null
  owner_id?: string | null
  price?: number
  description?: Record<string, string>
  features?: string[]
  images?: PropertyImageItemDto[]
  management_docs?: string
  unit_status?: UnitStatusDto
  available_from?: string | null
  address?: string | null
  /** Quartier (facultatif) */
  neighborhood_id?: string | null
  city_id?: string | null
  gps_latitude?: string | null
  gps_longitude?: string | null
  surface_m2?: number
  floor?: number
  caution_months?: number
  avance_months?: number
  frais_dossier?: number
  prepaid_electricity?: boolean
  water_included?: boolean
  /** @deprecated Utiliser ref_type_id */
  type?: string
  /** @deprecated Utiliser unit_status */
  is_available?: boolean
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

/**
 * Crée une unité. Si propertyId est fourni, l'unité est rattachée au bien ; sinon POST /property/units (unité indépendante).
 */
export async function createUnit(propertyId: string | null, payload: CreateUnitPayload): Promise<UnitDto> {
  const body = {
    ...payload,
    name: payload.name,
    ref_type_id: payload.ref_type_id,
    property_id: propertyId ?? payload.property_id ?? null,
    price: payload.price ?? 0,
    unit_status: payload.unit_status ?? 'available',
    available_from: payload.available_from ?? null,
    features: payload.features ?? [],
  }
  if (propertyId) {
    const { data } = await http.post<UnitDto>(`/property/${propertyId}/units`, body)
    return data
  }
  const { data } = await http.post<UnitDto>('/property/units', body)
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
  neighborhood_id?: string | null
  city_id?: string
  gps_latitude?: number
  gps_longitude?: number
  main_image?: string
  gallery?: string[]
  description?: Record<string, string>
  images?: PropertyImageItemDto[]
  status?: string
  available_from?: string | null
}

export async function updateProperty(id: string, payload: UpdatePropertyPayload) {
  const { data } = await http.put<PropertyDetailDto>(`/property/${id}`, payload)
  return data
}

/** Met à jour une unité (PUT /property/:propertyId/units/:unitId). */
export interface UpdateUnitPayload {
  name?: string
  ref_type_id?: string
  type?: string
  price?: number
  description?: Record<string, string>
  features?: string[]
  images?: PropertyImageItemDto[]
  unit_status?: UnitStatusDto
  available_from?: string | null
  address?: string | null
  neighborhood_id?: string | null
  city_id?: string | null
  gps_latitude?: string | null
  gps_longitude?: string | null
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
