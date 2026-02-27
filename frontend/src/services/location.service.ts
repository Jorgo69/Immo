import { http } from './http'

export interface CountryDto {
  id: string
  name: string
  iso_code: string
}

export interface CityDto {
  id: string
  country_id: string
  name: string
}

export interface NeighborhoodDto {
  id: string
  city_id: string
  name: string
}

/**
 * Liste des pays (référentiel — pour select propriétaire).
 */
export async function getCountries(): Promise<CountryDto[]> {
  const { data } = await http.get<CountryDto[]>('/location/countries')
  return data
}

/**
 * Liste des villes (optionnellement par pays). Propriétaire DOIT choisir dans cette liste.
 */
export async function getCities(countryId?: string): Promise<CityDto[]> {
  const params = new URLSearchParams()
  if (countryId) params.set('country_id', countryId)
  const { data } = await http.get<CityDto[]>(`/location/cities?${params.toString()}`)
  return data
}

/** Créer un pays (Admin uniquement). */
export async function createCountry(payload: { name: string; iso_code: string }): Promise<CountryDto> {
  const { data } = await http.post<CountryDto>('/location/countries', payload)
  return data
}

/** Créer une ville (Admin uniquement). */
export async function createCity(payload: { country_id: string; name: string }): Promise<CityDto> {
  const { data } = await http.post<CityDto>('/location/cities', payload)
  return data
}

/** Liste des quartiers (optionnellement filtrés par ville). */
export async function getNeighborhoods(cityId?: string): Promise<NeighborhoodDto[]> {
  const params = new URLSearchParams()
  if (cityId) params.set('city_id', cityId)
  const { data } = await http.get<NeighborhoodDto[]>(`/location/neighborhoods?${params.toString()}`)
  return data
}

/** Créer un quartier (Admin uniquement). */
export async function createNeighborhood(payload: { city_id: string; name: string }): Promise<NeighborhoodDto> {
  const { data } = await http.post<NeighborhoodDto>('/location/neighborhoods', payload)
  return data
}

/** Supprimer un quartier (Admin uniquement). */
export async function deleteNeighborhood(id: string): Promise<void> {
  await http.delete(`/location/neighborhoods/${id}`)
}
