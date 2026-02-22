/**
 * Composable pour la gestion des biens (Property) et unités (Unit).
 * Centralise les appels API CRUD et l'état de chargement (aligné ARCHITECTURE.md).
 */
import { ref, computed } from 'vue'
import { getUploadUrl } from '../config/api'
import {
  getMyProperties,
  getPropertyById,
  createProperty,
  createUnit,
  type PropertyListItemDto,
  type PropertyDetailDto,
  type CreatePropertyPayload,
  type CreateUnitPayload,
} from '../services/property.service'
import type { PaginatedResultDto } from '../services/property.service'

export interface UsePropertyOptions {
  /** Charger la liste au montage (défaut: true) */
  fetchOnMount?: boolean
}

/**
 * @param options - fetchOnMount pour charger la liste des biens du propriétaire au montage
 * @returns État (properties, loading, error) et actions (fetchList, create, createUnit, getDetail)
 */
export function useProperty(options: UsePropertyOptions = {}) {
  const { fetchOnMount = true } = options

  const properties = ref<PropertyListItemDto[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const hasProperties = computed(() => properties.value.length > 0)

  /**
   * Charge la liste des biens du propriétaire connecté (GET /property/owner/me).
   */
  async function fetchList(filters?: { limit?: number; page?: number; city?: string; status?: string }) {
    loading.value = true
    error.value = null
    try {
      const result = await getMyProperties({ limit: 100, ...filters })
      properties.value = result.data
      total.value = result.total
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur'
      properties.value = []
      total.value = 0
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère le détail d'un bien (GET /property/:id) — utile pour afficher les unités.
   */
  async function getDetail(id: string): Promise<PropertyDetailDto> {
    return getPropertyById(id)
  }

  /**
   * Crée un bien (POST /property). owner_id est fixé côté backend (JWT).
   */
  async function create(payload: CreatePropertyPayload) {
    loading.value = true
    error.value = null
    try {
      const created = await createProperty(payload)
      return created
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur'
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Crée une unité sur un bien (POST /property/:propertyId/units).
   */
  async function createUnitOnProperty(propertyId: string, payload: CreateUnitPayload) {
    loading.value = true
    error.value = null
    try {
      const created = await createUnit(propertyId, payload)
      return created
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur'
      throw e
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  /**
   * URL de l'image principale : is_primary en priorité, sinon media avec le rank le plus bas (ARCHITECTURE §6).
   * Retourne une URL affichable (préfixée par VITE_API_BASE_URL si chemin relatif, §9).
   */
  function getPrimaryImageUrl(p: PropertyListItemDto): string | undefined {
    let raw: string | undefined
    if (p.main_image) raw = p.main_image
    else {
      const media = p.media ?? []
      const primary = media.find((m) => m.is_primary)
      if (primary?.url) raw = primary.url
      else {
        const byRank = [...media].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
        raw = byRank[0]?.url
      }
    }
    return raw ? getUploadUrl(raw) : undefined
  }

  return {
    properties,
    total,
    loading,
    error,
    hasProperties,
    fetchList,
    getDetail,
    create,
    createUnitOnProperty,
    clearError,
    getPrimaryImageUrl,
  }
}
