# Backend Immo Bénin — NestJS CQRS

API backend de la plateforme immobilière Immo Bénin (CQRS, TypeORM, PostgreSQL, Auth OTP).

## Quick Start

```bash
npm install
# Éditer src/config/default.yml (DB, JWT, encryption.key)
npm run db:setup   # Crée la base + extension pgvector
npm run start:dev
```

## Auth (OTP par téléphone)

- **POST /auth/request-otp** — Envoie un code OTP au numéro (body: `{ "phone_number": "+229..." }`). En dev, le code est loggé en console.
- **POST /auth/verify-otp** — Vérifie le code et retourne `{ token, user }` (création automatique du user si premier passage). Body: `{ "phone_number", "code", "preferred_lang?" }`.
- **GET /auth/me** — Infos de l’utilisateur connecté (header `Authorization: Bearer <token>`).

L’identifiant principal est le **numéro de téléphone** ; pas de mot de passe (OTP uniquement).

## Ordre de développement et tests REST

- **Ordre des modules** : décrit dans **`ORDRE_DEVELOPPEMENT.md`** (Auth → User → Wallet → Property → Profile).
- **Tests API** : dossiers **`http/<module>/`** avec un fichier **`<module>.http`** pour l’extension [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) (VS Code). Lancer le backend puis exécuter les requêtes depuis ces fichiers.

## Structure

```
http/                  # Requêtes REST Client (.http) par module
├── auth/auth.http
├── user/user.http
├── wallet/wallet.http
├── property/property.http
├── profile/profile.http
└── health/health.http

src/
├── config/             # Configuration YAML (DB, JWT, encryption)
├── common/
│   └── encryption/     # Service AES-256-GCM (données sensibles)
├── auth/               # OTP + JWT (request-otp, verify-otp, me)
│   ├── commands/       # RequestOtp, VerifyOtp
│   ├── queries/        # AuthMe
│   ├── models/         # UserModel (phone_number, role, preferred_lang)
│   ├── services/       # OtpStoreService (stockage OTP)
│   └── strategy/       # JWT Strategy + Guard
├── user/               # CRUD utilisateur (get-all, by-id, update, delete)
├── wallet/             # Tirelire Loyer (wallet + transactions ACID)
├── property/           # Biens immobiliers + médias + recherche
├── profile/            # Données KYC chiffrées (profil 1–1 avec user)
├── health/             # Health check
└── main.ts
```

## Base de données

- **Premier démarrage :** `npm run db:setup` puis `npm run start:dev`. Le script crée la base et l’extension **pgvector**.
- **Schéma User :** après passage à l’auth OTP, la table `users` a été alignée sur le schéma (phone_number, role, preferred_lang, is_active). Si une ancienne base existait, faire `npm run db:reset` puis redémarrer.

### Recherche sémantique (pgvector)

- L’extension **pgvector** est installée via `database/setup-database.sql`.
- La colonne `description_vector` pour les biens est ajoutée par la migration SQL :

```bash
psql -U root -d back_end_api_immo_app -f database/migrations/add-description-vector.sql
```

- La génération des embeddings et la requête de similarité sont décrites dans `A_VENIR.md` (colonne `description_vector`, opérateurs pgvector).

### Soft delete (données sensibles)

- Toutes les entités (users, properties, rooms, media, wallets, transactions, profiles) ont une colonne **`deleted_at`**.
- Une « suppression » est un **soft delete** : on met à jour `deleted_at` (via `repository.softRemove()`). Les données restent en base, masquées des requêtes courantes ; rien ne disparaît en un coup.
- Si `synchronize` est désactivé (prod), appliquer la migration :

```bash
psql -U root -d back_end_api_immo_app -f database/migrations/add-soft-delete-columns.sql
```

### Données de démo (seed)

- Pour avoir des **utilisateurs** (admin, landlords, agents, tenants), des **wallets** et plusieurs **biens** déjà créés :

```bash
# Après db:setup[:local] et un premier démarrage du backend
npm run db:seed:local  # ou npm run db:seed (utilisateur root)
```

- Le script `database/seed-dev.sql` crée :
  - 1 admin, plusieurs proprios, agents et locataires (rôles `admin`, `landlord`, `agent`, `tenant`).
  - 3 wallets avec des transactions (épargne + loyers).
  - 10 biens avec coordonnées, médias et chambres (Calavi, Fidjrossè, Akpakpa, Godomey, Porto-Novo, etc.).

- **~100 biens** : générer puis exécuter l’extension de seed (90 biens en plus) :

```bash
node database/scripts/generate-seed-100.js   # génère database/seed-dev-100.sql
psql -U root -d back_end_api_immo_app -f database/seed-dev.sql
psql -U root -d back_end_api_immo_app -f database/seed-dev-100.sql
# ou en une commande : npm run db:seed:100  (root) / npm run db:seed:100:local (postgres)
```

## Configuration

Dans `src/config/default.yml` :

- `database.*` — PostgreSQL
- `jwt.secret` / `jwt.expireIn` — JWT
- `encryption.key` — Clé AES-256 (32 octets) pour le chiffrement des données sensibles. En prod, utiliser une variable d’environnement.

## Scripts

| Commande           | Description                    |
|--------------------|--------------------------------|
| `npm run start:dev`| Dev avec hot-reload            |
| `npm run build`    | Build production               |
| `npm run db:setup` | Créer la base + pgvector       |
| `npm run db:reset` | Drop + recréer la base         |

## Pagination

Les listes (biens, users, transactions) sont paginées. Paramètres de query : `page` (défaut 1), `limit` (défaut 20, max 100). Réponse : `{ data: T[], total, page, limit, totalPages }`. DTO commun : `src/common/dto/pagination.dto.ts`.

## URLs

- **API :** http://localhost:3000  
- **Swagger :** http://localhost:3000/api  
- **Health :** http://localhost:3000/health  
