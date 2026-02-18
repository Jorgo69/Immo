# Immo Bénin

Plateforme immobilière pour le Bénin (Tirelire Loyer, recherche IA, visites immersives).  
Voir **PROJECT_BRAIN.md** pour la vision et **TODO.md** pour la roadmap.

## Lancer l’application

## Après un `git clone`

Pour que tout revienne à l’identique (dépendances, version Node) :

1. **Node.js** — Le projet cible **Node 20** (LTS). Si tu utilises [nvm](https://github.com/nvm-sh/nvm) :
   ```bash
   nvm use
   ```
   (Un fichier `.nvmrc` est présent à la racine et dans `frontend/` et `back-end-api-immo-app/`.)

2. **Installer les dépendances** dans chaque dossier :
   ```bash
   cd back-end-api-immo-app
   npm install

   cd ../frontend
   npm install
   ```
   En cas d’erreurs de peer dependencies, tu peux forcer avec :
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Variables d’environnement** — Copier les exemples (ne jamais commiter les vrais `.env`) :
   - Backend : `back-end-api-immo-app/.env.example` → `.env`
   - Frontend : `frontend/.env.example` → `.env` ou `.env.development`

Ensuite, suivre la section *Lancer l’application* ci-dessous.

## Lancer l'application

### 1. Base de données (PostgreSQL)

```bash
cd back-end-api-immo-app
npm run db:setup        # avec sudo (Linux) : crée la base + pgvector
# ou
npm run db:setup:local # sans sudo (utilisateur postgres)
```

En cas de schéma déjà existant à réinitialiser :

```bash
npm run db:reset       # ou db:reset:local
```

### 2. Backend (NestJS)

```bash
cd back-end-api-immo-app
npm install
npm run start:dev
```

- API : http://localhost:3000  
- Swagger : http://localhost:3000/api  

### 3. Frontend (Vue 3)

Dans un autre terminal :

```bash
cd frontend
npm install
npm run dev
```

- App : http://localhost:5173  
- Les appels vers `/auth`, `/user`, `/api`, `/health` sont proxifiés vers le backend (port 3000).

## Dépendances clés

- **Backend (`back-end-api-immo-app`)**
  - NestJS + CQRS + TypeORM + PostgreSQL (+ extension `pgvector`).
  - Module **Profile** (KYC chiffré) + modules **Wallet**, **Property**, **Auth**, **User**.
  - Script DB : `database/setup-database.sql`, migration sémantique : `database/migrations/add-description-vector.sql`.
- **Frontend (`frontend`)**
  - Vue 3 + Vite + Tailwind + Pinia + vue-router + vue-i18n.
  - **Leaflet** pour la carte des biens (`PropertyMap.vue` + vue Liste/Carte).
  - **vite-plugin-pwa** pour le Service Worker + mode hors‑ligne (bandeau « offline » dans `App.vue`).

## Documentation

- Vue d’ensemble métier : `PROJECT_BRAIN.md`.
- Roadmap détaillée : `TODO.md` (toutes les phases).
- Architecture + ordre des modules backend : `back-end-api-immo-app/ORDRE_DEVELOPPEMENT.md`.
- Détails backend : `back-end-api-immo-app/README.md`.
- Détails frontend : `frontend/README.md`.

## Génération de modules backend (CQRS)

Depuis la racine du backend :

```bash
cd back-end-api-immo-app
./generate-module.sh <nom_module>
```

Exemple : `./generate-module.sh wallet` crée le module `wallet` avec la structure CQRS (commands, queries, handlers, controller). Penser à enregistrer le module dans `app.module.ts`.
