/**
 * Service des référentiels — GET /ref/all (ARCHITECTURE §8).
 * Appel unique pour charger tous les dictionnaires.
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
