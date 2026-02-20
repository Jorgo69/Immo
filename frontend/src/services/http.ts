import axios from 'axios'
import { apiConfig } from '../config/api'
import { useAppStore } from '../stores/app'

/**
 * Instance Axios centralisée.
 *
 * - baseURL vient de VITE_API_BASE_URL (sinon proxys Vite en dev).
 * - Timeout raisonnable pour éviter les requêtes qui pendouillent.
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

/** Extraire un message lisible depuis une réponse d'erreur API (ex. 400 validation NestJS). Toujours retourne une chaîne non vide. */
export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as { response?: { data?: unknown; status?: number } }).response
    const data = res?.data
    const status = res?.status
    if (data && typeof data === 'object') {
      if (Array.isArray((data as { message?: unknown }).message)) {
        const msg = ((data as { message: string[] }).message).join(', ')
        if (msg) return msg
      }
      if (typeof (data as { message?: string }).message === 'string') {
        const msg = (data as { message: string }).message
        if (msg) return msg
      }
      if (typeof (data as { error?: string }).error === 'string') {
        const msg = (data as { error: string }).error
        if (msg) return msg
      }
    }
    if (status === 400) return 'Requête invalide. Vérifiez les champs.'
    if (status === 401) return 'Session expirée. Reconnectez-vous.'
    if (status === 403) return 'Accès refusé.'
    if (status && status >= 500) return 'Erreur serveur. Réessayez plus tard.'
    if (status) return `Erreur (${status})`
  }
  if (error instanceof Error && error.message) return error.message
  return 'Une erreur est survenue'
}

