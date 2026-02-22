/**
 * Composable PATTERN DE VISUALISATION (ARCHITECTURE §6).
 * Persiste le mode d'affichage (grid | table | compact) en localStorage.
 * Réutilisable pour tout module : Landlord (biens), Locataires, Transactions, etc.
 *
 * @param storageKey - Clé localStorage (ex: 'immo_landlord_assets_view')
 * @param defaultMode - Mode par défaut si aucune valeur stockée
 * @returns viewMode (ref) et setViewMode (fn)
 */
import { ref, watch } from 'vue'

export type ViewMode = 'grid' | 'table' | 'compact'

const VALID_MODES: ViewMode[] = ['grid', 'table', 'compact']

function readStored(key: string): ViewMode | null {
  try {
    const v = localStorage.getItem(key)
    if (v && VALID_MODES.includes(v as ViewMode)) return v as ViewMode
  } catch {
    /* ignore */
  }
  return null
}

function writeStored(key: string, value: ViewMode): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

export function useViewMode(storageKey: string, defaultMode: ViewMode = 'grid') {
  const stored = readStored(storageKey)
  const viewMode = ref<ViewMode>(stored ?? defaultMode)

  watch(viewMode, (value) => {
    writeStored(storageKey, value)
  }, { immediate: false })

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
  }

  return { viewMode, setViewMode }
}
