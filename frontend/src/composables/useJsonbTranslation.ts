/**
 * Affichage des champs traduisibles en base (format JSONB).
 * Le backend renvoie l'objet complet (ex: { "fr": "...", "en": "..." }).
 * Le frontend affiche la clé correspondant à la locale courante, avec fallback vers 'fr'.
 * @see schema_database.dbml — title_translations, description_translations, etc.
 */
import { computed } from 'vue'
import { useAppStore } from '../stores/app'

export type JsonbTranslations = Record<string, string> | null | undefined

/**
 * Retourne la chaîne pour la locale courante, sinon fallback 'fr', sinon ''.
 */
export function getTranslation(
  record: JsonbTranslations,
  locale: string
): string {
  if (!record || typeof record !== 'object') return ''
  const fallback = 'fr'
  return record[locale] ?? record[fallback] ?? ''
}

/**
 * Composable : utilise la locale du store Pinia pour afficher un champ JSONB.
 * Usage: const { translated } = useJsonbTranslation(); const title = translated(property.title_translations);
 */
export function useJsonbTranslation() {
  const appStore = useAppStore()
  const locale = computed(() => appStore.locale)

  function translated(record: JsonbTranslations): string {
    return getTranslation(record, locale.value)
  }

  return { locale, translated, getTranslation }
}
