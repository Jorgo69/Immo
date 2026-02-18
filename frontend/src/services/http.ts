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

/** Extraire un message lisible depuis une réponse d'erreur API (ex. 400 validation NestJS). */
export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as { response?: { data?: unknown } }).response
    const data = res?.data
    if (data && typeof data === 'object') {
      if (Array.isArray((data as { message?: unknown }).message)) {
        return ((data as { message: string[] }).message).join(', ')
      }
      if (typeof (data as { message?: string }).message === 'string') {
        return (data as { message: string }).message
      }
      if (typeof (data as { error?: string }).error === 'string') {
        return (data as { error: string }).error
      }
    }
  }
  return error instanceof Error ? error.message : 'Erreur'
}

