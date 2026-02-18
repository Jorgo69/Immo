# Frontend Immo Bénin — Vue 3

Vue 3 (Composition API) + Vite + Tailwind CSS + Pinia + vue-router + vue-i18n + Lucide-Vue-Next.

## Commandes

```bash
npm install
npm run dev      # Dev : http://localhost:5173 (proxy API vers :3000)
npm run build
npm run preview  # Prévisualisation du build
```

> Remarque : certaines dépendances PWA (workbox) recommandent **Node 20+**.  
> Avec Node 18 tu peux avoir des `npm WARN EBADENGINE`, mais le dev fonctionne tant que l’installation va au bout.

## Dépendances front importantes

- **axios** : client HTTP centralisé (`src/services/http.ts`) avec interceptors (JWT, timeout).
- **leaflet** : carte des biens dans `PropertyMap.vue` (basculer Liste / Carte dans `PropertyListView.vue`).
- **vite-plugin-pwa** : Service Worker, manifest PWA, indication « hors‑ligne » dans le layout principal.
- **lucide-vue-next** : icônes (nav, cartes, formulaires).

## Design

- Palette : fond `#F9FAFB`, texte `#111827`, accent `#059669`.
- Pas de dégradés ; design minimaliste, Bento-friendly.
- i18n : `fr` par défaut, toutes les chaînes via `$t()`.

## API

En dev, le proxy Vite redirige `/auth`, `/user`, `/wallet`, `/property`, `/profile`, `/api`, `/health` vers `http://localhost:3000`.  
Lancer le backend avant d’utiliser la connexion OTP, le dashboard Tirelire, la carte des biens ou la page Profil.

En prod/staging, définir `VITE_API_BASE_URL` (voir `.env.example`) ; l’instance Axios utilise cette base URL.

## Fonctionnalités principales

- **Auth OTP** : écran de connexion par téléphone + code reçu.
- **Dashboard** : vue Tirelire Loyer (solde + dernières transactions).
- **Recherche de biens** :
  - Filtres (ville, prix) + recherche texte.
  - Vue **Liste** et vue **Carte** (Leaflet) sur la page `/property`.
- **Profil** : page `/profile` pour gérer le profil KYC (nom complet, pièce d’identité chiffrés côté backend).
- **PWA / hors‑ligne** : Service Worker via `vite-plugin-pwa` + bandeau « Vous êtes hors ligne ».

## Architecture front

- `src/layouts/MainLayout.vue` : layout principal (header, nav, NotificationBell, bandeau offline) qui englobe les vues.
- `src/services/` :
  - `http.ts` : instance Axios (baseURL, timeout, JWT).
  - `auth.service.ts`, `wallet.service.ts`, `property.service.ts`, `profile.service.ts` : services par domaine.
- `src/config/api.ts` : config de baseURL (versionning possible via `/api/v1` plus tard).
- `src/views/` : pages (Auth, Dashboard, Home, Property*, Profile, Admin, Reels). Toutes utilisent les composants UI pour rester maintenables et scalables.
- `src/components/` : composants réutilisables.
  - **`src/components/ui/`** : bibliothèque UI (boutons, liens, cartes, titres, paragraphes, champs, StatCard). Export centralisé dans `ui/index.ts`. À utiliser partout pour cohérence et évolution centralisée.
  - **`PropertyCard.vue`** : carte bien (image, titre, ville, prix) pour listes et home.
  - **`PropertyMap.vue`** : carte Leaflet des biens.
  - **`NotificationBell.vue`** : cloche notifications in-app (store Pinia `useNotificationsStore`). Prévu pour être branché plus tard sur une API notifications (WhatsApp/SMS/Push côté backend).
- `src/stores/` : Pinia (app, notifications).
