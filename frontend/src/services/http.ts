import axios from 'axios'
import { apiConfig } from '../config/api'
import { useAppStore } from '../stores/app'

/**
 * Instance Axios centralisée (ARCHITECTURE §8, §9).
 *
 * - baseURL = VITE_API_BASE_URL (/api en dev) : tous les appels passent par ce préfixe.
 * - Évite tout conflit avec les routes SPA (ex: /property, /admin/landlord/properties) au rechargement (F5).
 * - Interceptor request : injecte le JWT s'il existe.
 */

export const http = axios.create({
  baseURL: apiConfig.baseUrl || undefined,
  timeout: 10000,
})

http.interceptors.request.use((config) => {
  try {
    const store = useAppStore()
    if (store.token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${store.token}`
    }
  } catch {
    // Si le store n'est pas encore initialisé, on ignore.
  }
  return config
})
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        const store = useAppStore()
        store.logout()
      } catch {
        // Ignorer si le store n'est pas accessible
      }
    }
    return Promise.reject(error)
  },
)

/** Extraire un message lisible depuis une réponse d'erreur API (ex. 400 validation NestJS). Toujours retourne une chaîne non vide. */
export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as { response?: { data?: unknown; status?: number } }).response
    const data = res?.data
    const status = res?.status

    if (data && typeof data === 'object') {
      // Cas NestJS ValidationPipe (Array de messages)
      if (Array.isArray((data as { message?: unknown }).message)) {
        const msg = ((data as { message: string[] }).message).join(', ')
        if (msg && !msg.startsWith('http')) return msg
      }
      // Cas erreur unique
      if (typeof (data as { message?: string }).message === 'string') {
        const msg = (data as { message: string }).message
        if (msg && !msg.startsWith('http')) return msg
      }
      // Cas champ error
      if (typeof (data as { error?: string }).error === 'string') {
        const msg = (data as { error: string }).error
        if (msg && !msg.startsWith('http')) return msg
      }
    }

    // Fallbacks par status HTTP
    if (status === 400) return 'Requête invalide. Vérifiez vos informations.'
    if (status === 401) return 'Session expirée. Veuillez vous reconnecter.'
    if (status === 403) return 'Accès refusé.'
    if (status === 404) return 'Ressource introuvable.'
    if (status && status >= 500) return 'Erreur serveur. Réessayez plus tard.'
    if (status) return `Une erreur est survenue (${status})`
  }

  if (error instanceof Error && error.message && !error.message.startsWith('http')) {
    return error.message
  }
  
  return 'Une erreur inattendue est survenue'
}

