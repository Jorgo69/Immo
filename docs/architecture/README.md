# Architecture Globale — Immo Bénin Platform

> Vue d'ensemble technique du projet pour les développeurs.

---

## Stack Technologique

| Couche | Technologie | Rôle |
|---|---|---|
| **Frontend** | Vue.js 3 + TypeScript + Vite | Interface utilisateur SPA/PWA |
| **State Management** | Pinia | Gestion de l'état global frontend |
| **Styling** | TailwindCSS v3 + CSS custom properties | Design system |
| **Backend** | NestJS + TypeScript | API REST |
| **ORM** | TypeORM | Mapping entités ↔ tables SQL |
| **Base de données** | PostgreSQL | Données persistantes |
| **Cache** | Redis (ioredis) | Cache et étapes temporaires |
| **Pattern** | CQRS (Commands + Queries) | Séparation écriture/lecture |
| **Auth** | JWT (passport-jwt) | Authentification sans état |
| **Chiffrement** | AES-256-GCM | Données sensibles (profil KYC) |
| **Docs API** | Swagger / OpenAPI | Documentation des endpoints |

---

## Structure des dossiers

```
Immo/
├── back-end-api-immo-app/       → Backend NestJS
│   └── src/
│       ├── auth/                → Login, JWT, stratégies
│       ├── user/                → CRUD utilisateurs + KYC + RBAC
│       ├── profile/             → Profils chiffrés + KYC
│       ├── rbac/                → Rôles & Permissions dynamiques
│       ├── audit/               → Trace d'activité (logs)
│       ├── settings/            → Configs système + Préférences notif
│       ├── property/            → Biens immobiliers + Unités
│       ├── rental/              → Demandes de location
│       ├── wallet/              → Wallets & Transactions
│       ├── references/          → Référentiels (types, features...)
│       ├── location/            → Pays, Villes, Quartiers
│       ├── currency/            → Taux de devises
│       ├── onboarding/          → Logique d'inscription guidée
│       ├── infrastructure/
│       │   └── redis/           → RedisModule + RedisService
│       └── common/
│           └── encryption/     → EncryptionService (AES-256)
│
├── frontend/                    → Frontend Vue.js
│   └── src/
│       ├── views/
│       │   ├── admin/          → Pages administration
│       │   ├── AdminDashboardView.vue
│       │   └── OnboardingView.vue
│       ├── layouts/
│       │   └── AdminLayout.vue  → Layout avec sidebar admin
│       ├── services/           → Clients API (http.ts, user.service.ts...)
│       ├── stores/             → Pinia stores
│       ├── router/             → Vue Router (routes + guards)
│       └── components/ui/      → Composants réutilisables
│
├── docs/                        → Documentation projet
│   ├── glossaire/GLOSSAIRE.md   → Définitions KYC, KPI, RBAC, Redis...
│   ├── redis/README.md          → Guide Redis complet
│   ├── rbac/README.md           → Guide RBAC
│   ├── kyc/README.md            → Guide KYC
│   ├── admin/README.md          → Guide Administration
│   ├── onboarding/README.md     → Guide Onboarding
│   └── architecture/README.md  → Ce fichier
│
├── schema_database.dbml         → Schéma complet base de données
└── semantic-embeddings/         → Dossier futur embeddings IA
```

---

## Modules Backend et leurs responsabilités

| Module | Endpoints principaux | Tables |
|---|---|---|
| `auth` | POST /auth/login, GET /auth/me | `users` |
| `user` | GET /user/all, PATCH /user/:id/status, GET /user/admin-stats | `users` |
| `profile` | POST /user/profile, GET /profile | `profiles`, `payment_methods` |
| `rbac` | GET /rbac/roles, POST /rbac/roles | `roles`, `permissions`, `role_permissions` |
| `audit` | GET /activity-logs | `activity_logs` |
| `settings` | GET/PATCH /settings | `system_configs`, `notification_preferences` |
| `property` | CRUD /property, /unit | `properties`, `units`, `media` |
| `rental` | POST /rental/request | `rental_requests` |
| `wallet` | GET /wallet, POST /wallet/transaction | `wallets`, `transactions` |
| `references` | GET /references | `ref_categories`, `ref_types`, `ref_features` |
| `location` | GET /location/countries, /cities | `countries`, `cities`, `neighborhoods` |
| `currency` | GET /currency/rates | `currency_rates` |
| `onboarding` | POST /onboarding/step | Redis + `profiles` |

---

## Pattern CQRS

```
HTTP Request
     │
     ▼
Controller (route)
     │
     ├── Command (écriture)
     │        │
     │        ▼
     │   CommandBus → CommandHandler → TypeORM → PostgreSQL
     │
     └── Query (lecture)
              │
              ▼
         QueryBus → QueryHandler → TypeORM → PostgreSQL
```

**Avantages** :
- Séparation claire lecture/écriture
- Testabilité unitaire facile
- Scalabilité (les queries peuvent être cachées dans Redis)

---

## Sécurité

### Authentification
```
1. Login → POST /auth/login { phone_number, password }
2. Backend vérifie : hash bcrypt du mot de passe
3. Vérifie le statut du compte (banned → 403)
4. Retourne un JWT signé (expire en 7 jours)
5. Toutes les routes protégées exigent : Authorization: Bearer {token}
```

### Chiffrement des données sensibles
```
Algorithme : AES-256-GCM
Clé        : Dérivée du PASSWORD_SECRET + salt unique par utilisateur
Salt       : 32 bytes aléatoires générés à la création du compte
Stockage   : Données chiffrées en texte (colonne _enc)
             Hash SHA-256 pour les champs nécessitant une recherche (_hash)
```

### Hiérarchie des Guards (ordre appliqué)
```
1. JwtAuthGuard     → Token valide?
2. RolesGuard       → Rôle global autorisé? (admin, tenant...)
3. PermissionsGuard → Permission RBAC fine? (manage:kyc, view:users...)
```

---

## Démarrage du projet

### Variables d'environnement requises (`.env`)
```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=immo_db
DB_USER=postgres
DB_PASSWORD=

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Auth
JWT_SECRET=votre_secret_jwt_32_caracteres_minimum
JWT_EXPIRES_IN=7d
PASSWORD_SECRET=votre_secret_chiffrement_32_caracteres

# Uploads
UPLOAD_PATH=./uploads
```

### Commandes de démarrage
```bash
# 1. Lancer Redis
docker start redis-immo

# 2. Lancer le backend
cd back-end-api-immo-app
npm run start:dev

# 3. Lancer le frontend
cd frontend
npm run dev
```

### Accès
| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Documentation Swagger | http://localhost:3000/api |
