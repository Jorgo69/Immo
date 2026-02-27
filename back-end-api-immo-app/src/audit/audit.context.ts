import { AsyncLocalStorage } from 'async_hooks';

export interface AuditContextInfo {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * AsyncLocalStorage permet de stocker un contexte (User, IP, Agent) accessible globalement
 * tout au long du cycle de vie d'une requête HTTP, sans avoir à le passer manuellement en argument.
 * C'est le secret pour qu'un TypeORM Subscriber au fond de l'application sache "Qui" a fait l'action.
 */
export const AuditContext = new AsyncLocalStorage<AuditContextInfo>();
