/**
 * Configuration centralisée pour les appels API côté frontend.
 *
 * - En dev, on peut laisser VITE_API_BASE_URL vide pour utiliser les proxys Vite (`/auth`, `/wallet`, etc.).
 * - En staging/prod, définir VITE_API_BASE_URL (ex: https://api.immo-benin.com/api/v1).
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const apiConfig = {
  baseUrl: BASE_URL,
};

export function apiUrl(path: string): string {
  // Autoriser path déjà absolu (http...) au cas où.
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path}`;
}

