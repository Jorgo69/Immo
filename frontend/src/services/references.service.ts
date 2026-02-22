/**
 * Service des référentiels — GET /ref/all + moteur (categories, types, features).
 * ARCHITECTURE §8 : appels API centralisés.
 */
import { http } from './http'

export interface RefDto {
  id: string
  code: string
  label_fr: string
  label_en: string
  sort_order?: number
  color?: string
}

export interface RefTypeDto extends RefDto {
  ref_category_id: string
}

export interface RefFeatureDto extends RefDto {
  ref_type_id: string
}

export interface RefAllResponse {
  propertyTypes: RefDto[]
  propertyStatuses: RefDto[]
  unitTypes: RefDto[]
  unitFeatures: RefDto[]
}

export async function getRefAll(): Promise<RefAllResponse> {
  const { data } = await http.get<RefAllResponse>('/ref/all')
  return data
}

export async function getRefCategories(): Promise<RefDto[]> {
  const { data } = await http.get<RefDto[]>('/ref/categories')
  return data
}

export async function getRefTypes(categoryId?: string): Promise<RefTypeDto[]> {
  const params = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : ''
  const { data } = await http.get<RefTypeDto[]>(`/ref/types${params}`)
  return data
}

export async function getRefFeaturesByTypeId(refTypeId: string): Promise<RefFeatureDto[]> {
  const { data } = await http.get<RefFeatureDto[]>(`/ref/types/${refTypeId}/features`)
  return data
}

// ——— Admin CRUD ———
export async function createRefCategory(payload: { code: string; label_fr: string; label_en?: string; sort_order?: number }) {
  const { data } = await http.post<RefDto>('/ref/admin/categories', payload)
  return data
}

export async function updateRefCategory(id: string, payload: { code?: string; label_fr?: string; label_en?: string; sort_order?: number }) {
  const { data } = await http.put<RefDto>(`/ref/admin/categories/${id}`, payload)
  return data
}

export async function deleteRefCategory(id: string): Promise<void> {
  await http.delete(`/ref/admin/categories/${id}`)
}

export async function createRefType(payload: { ref_category_id: string; code: string; label_fr: string; label_en?: string; sort_order?: number }) {
  const { data } = await http.post<RefTypeDto>('/ref/admin/types', payload)
  return data
}

export async function updateRefType(id: string, payload: { code?: string; label_fr?: string; label_en?: string; sort_order?: number }) {
  const { data } = await http.put<RefTypeDto>(`/ref/admin/types/${id}`, payload)
  return data
}

export async function deleteRefType(id: string): Promise<void> {
  await http.delete(`/ref/admin/types/${id}`)
}

export async function createRefFeature(payload: { ref_type_id: string; code: string; label_fr: string; label_en?: string; sort_order?: number }) {
  const { data } = await http.post<RefFeatureDto>('/ref/admin/features', payload)
  return data
}

export async function updateRefFeature(id: string, payload: { code?: string; label_fr?: string; label_en?: string; sort_order?: number }) {
  const { data } = await http.put<RefFeatureDto>(`/ref/admin/features/${id}`, payload)
  return data
}

export async function deleteRefFeature(id: string): Promise<void> {
  await http.delete(`/ref/admin/features/${id}`)
}
