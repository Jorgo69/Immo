/**
 * Configuration centralisée pour les appels API (ARCHITECTURE §8, §9).
 *
 * - Tous les appels doivent utiliser VITE_API_BASE_URL (ex: /api en dev pour le proxy Vite).
 * - En prod : VITE_API_BASE_URL = https://api.immo-benin.com (ou avec /api si besoin).
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export const apiConfig = {
  /** Base URL pour axios (baseURL) ; utilisé par tous les services dans src/services/. */
  baseUrl: BASE_URL,
};

/**
 * Construit l'URL complète d'un chemin API (pour appels manuels si besoin).
 */
export function apiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return BASE_URL ? `${BASE_URL}${p}` : p;
}

/**
 * URL affichable pour un fichier uploadé (image bien, unité, avatar).
 * En dev : préfixe avec VITE_API_BASE_URL pour passer par le proxy (/api/uploads/... → backend /uploads/...).
 * En prod : si l'API renvoie déjà une URL absolue, on la retourne telle quelle.
 */
export function getUploadUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return apiUrl(url);
}

