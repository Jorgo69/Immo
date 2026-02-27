# Redis — Guide Complet

> Documentation opérationnelle pour les développeurs du projet Immo Bénin.

---

## Qu'est-ce que Redis?

Redis (Remote Dictionary Server) est une base de données **clé-valeur en mémoire vive (RAM)**.
Contrairement à PostgreSQL qui écrit sur disque, Redis garde tout en RAM → lecture en **moins de 1 milliseconde**.

### Redis dans notre projet

```
┌──────────────┐     HTTP     ┌─────────────────┐     TCP      ┌─────────┐
│   Frontend   │ ──────────▶  │  NestJS Backend  │ ──────────▶ │  Redis  │
│  Vue.js      │             │   (NestJS API)   │  port 6379  │  :6379  │
└──────────────┘             └─────────────────┘             └─────────┘
                                       │                           │
                                       │ SQL                       │
                                       ▼                           │
                              ┌─────────────────┐                 │
                              │   PostgreSQL     │◀────────────────┘
                              │   (données       │  (validé → en BDD)
                              │    permanentes)  │
                              └─────────────────┘
```

### Ce que Redis gère actuellement
| Clé Redis | Usage | TTL |
|---|---|---|
| `onboarding:{userId}` | Brouillon des étapes d'inscription | 24h (86400s) |
| À venir : `session:{token}` | Sessions utilisateur rapides | 7j |
| À venir : BullMQ queues | Files d'attente emails/SMS | N/A |

---

## Installation

### Option 1 : Docker (recommandé en développement)

```bash
# Lancer Redis via Docker
docker run -d \
  --name redis-immo \
  -p 6379:6379 \
  redis:alpine

# Vérifier que Redis tourne
docker ps | grep redis-immo

# Arrêter
docker stop redis-immo

# Redémarrer
docker start redis-immo

# Supprimer le conteneur (données perdues!)
docker rm -f redis-immo
```

### Option 2 : Installation système (Linux/Ubuntu)

```bash
# Installation
sudo apt-get update && sudo apt-get install -y redis-server

# Démarrer le service
sudo systemctl start redis-server
sudo systemctl enable redis-server     # Lancer au démarrage

# Vérifier le statut
sudo systemctl status redis-server
```

### Option 3 : Redis Cloud (production)

Pour la production, utiliser **Redis Cloud** (https://redis.io/cloud) ou **Upstash** (serverless).
Mettre à jour `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` dans le `.env`.

---

## Configuration (.env)

```env
# Configuration Redis (back-end-api-immo-app/.env)
REDIS_HOST=127.0.0.1       # ou 'localhost'
REDIS_PORT=6379             # Port par défaut
REDIS_PASSWORD=             # Vide en local, obligatoire en prod
REDIS_TTL_DEFAULT=3600      # TTL par défaut (1 heure) si non spécifié
```

### En production (exemple avec mot de passe)
```env
REDIS_HOST=redis.mondomaine.com
REDIS_PORT=6380
REDIS_PASSWORD=mon_mot_de_passe_super_secret
```

---

## Architecture dans le code

### Module (`infrastructure/redis/redis.module.ts`)
```typescript
// Module global — disponible dans toute l'application
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

### Service (`infrastructure/redis/redis.service.ts`)
```typescript
// API simplifiée
class RedisService {
  async set(key: string, value: any, ttlSeconds?: number): Promise<void>
  async get<T>(key: string): Promise<T | null>
  async del(key: string): Promise<void>
  async exists(key: string): Promise<boolean>
}
```

### Utilisation dans un handler
```typescript
// Sauvegarder le brouillon d'onboarding
await this.redisService.set(
  `onboarding:${userId}`,
  { step: 2, name: 'Jean', budget_min: 50000 },
  86400 // 24 heures
)

// Récupérer le brouillon
const draft = await this.redisService.get<OnboardingDraft>(`onboarding:${userId}`)

// Supprimer après validation (données en BDD)
await this.redisService.del(`onboarding:${userId}`)
```

---

## Commandes CLI Redis

### Se connecter au CLI

```bash
# Via Docker
docker exec -it redis-immo redis-cli

# En local
redis-cli
```

### Commandes essentielles

```bash
# === TEST DE CONNEXION ===
PING                          # Réponse attendue : PONG

# === CLÉS (Keys) ===
KEYS *                        # Lister toutes les clés (⚠️ ne jamais utiliser en production!)
KEYS onboarding:*             # Lister les clés qui commencent par "onboarding:"
DEL ma_cle                    # Supprimer une clé
EXISTS ma_cle                 # 1 si existe, 0 sinon
TYPE ma_cle                   # Type de la valeur (string, hash, list, set...)
TTL ma_cle                    # Temps de vie restant en secondes (-1 = pas de TTL, -2 = n'existe pas)
EXPIRE ma_cle 3600            # Définir/changer le TTL (en secondes)

# === CHAÎNES (String) ===
SET ma_cle "valeur"           # Créer/remplacer une valeur
SET ma_cle "valeur" EX 3600   # Créer avec TTL de 1 heure
GET ma_cle                    # Lire la valeur
GETDEL ma_cle                 # Lire puis supprimer

# === VOIR LES DONNÉES DE L'APP ===
GET "onboarding:uuid-du-user" # Voir le brouillon d'un utilisateur spécifique
KEYS "onboarding:*"           # Voir tous les brouillons en cours

# === STATISTIQUES ===
INFO                          # Toutes les infos du serveur
INFO memory                   # Utilisation mémoire
INFO clients                  # Connexions actives
DBSIZE                        # Nombre total de clés

# === MAINTENANCE ===
FLUSHDB                       # ⚠️ Supprimer TOUTES les clés de la BDD courante
FLUSHALL                      # ⚠️⚠️ Supprimer TOUTES les clés de TOUTES les BDD
```

---

## Tester la connexion depuis le Backend

```bash
# Vérifier que Redis répond
docker exec -it redis-immo redis-cli PING

# Voir les logs Redis
docker logs redis-immo

# Voir les logs en temps réel
docker logs -f redis-immo
```

---

## Erreur courante : ECONNREFUSED

```
ERROR [RedisService] Erreur de connexion Redis : connect ECONNREFUSED 127.0.0.1:6379
```

### Causes et solutions

| Cause | Solution |
|---|---|
| Redis n'est pas lancé | `docker start redis-immo` ou `sudo systemctl start redis-server` |
| Mauvai port dans .env | Vérifier que `REDIS_PORT=6379` |
| Pare-feu bloque le port | `sudo ufw allow 6379` (⚠️ uniquement en dev) |
| Docker non démarré | Lancer Docker Desktop ou le daemon Docker |

> ℹ️ Notre `RedisService` est configuré pour **ne pas bloquer le démarrage** de NestJS si Redis est indisponible — l'app fonctionne, mais les fonctionnalités dépendantes du cache sont désactivées.

---

## Stratégie Cache vs Base de données

```
Règle : Redis = Temporaire | PostgreSQL = Permanent

✅ Mettre dans Redis :
  - Données d'étapes incomplètes (anbord-   ing, formulaires multi-étapes)
  - Résultats de requêtes fréquentes et coûteuses
  - Sessions et tokens temporaires
  - Compteurs en temps réel

❌ Ne PAS mettre dans Redis :
  - Données validées et définitives (→ PostgreSQL)
  - Données financières (transactions, solde)
  - Données KYC validées
  - Logs d'audit
```

---

## Feuille de route Redis

| Phase | Feature | Statut |
|---|---|---|
| ✅ Fait | `RedisModule` + `RedisService` global | Livré |
| ✅ Fait | Cache des brouillons Onboarding | Livré |
| 🔜 Planifié | BullMQ — File d'envoi email/SMS | Backlog |
| 🔜 Planifié | `semantic-embeddings` — Vecteurs IA | Backlog |
| 🔜 Planifié | Rate limiting par IP | Backlog |
