/**
 * Store Pinia des référentiels — chargement au démarrage (App.vue).
 * Alimente tous les selects des modals (property types, statuses, unit types, unit features).
 * Les composants utilisent les arrays brutes et appliquent la locale i18n pour les labels.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getRefAll, type RefDto, type UnitTypeDto } from '../services/references.service'

export const useReferenceStore = defineStore('references', () => {
  const propertyTypes = ref<RefDto[]>([])
  const propertyStatuses = ref<RefDto[]>([])
  const unitTypes = ref<UnitTypeDto[]>([])
  const unitFeatures = ref<RefDto[]>([])

  const loaded = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Charge tous les référentiels. À appeler au démarrage de l'app (App.vue).
   */
  async function fetch() {
    if (loaded.value) return
    loading.value = true
    error.value = null
    try {
      const data = await getRefAll()
      propertyTypes.value = data.propertyTypes
      propertyStatuses.value = data.propertyStatuses
      unitTypes.value = data.unitTypes
      unitFeatures.value = data.unitFeatures
      loaded.value = true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur chargement référentiels'
    } finally {
      loading.value = false
    }
  }

  return {
    propertyTypes,
    propertyStatuses,
    unitTypes,
    unitFeatures,
    loaded,
    loading,
    error,
    fetch,
  }
})
