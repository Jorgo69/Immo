# 🏛️ STANDARD D'ARCHITECTURE - 41DEVS (IMMO BÉNIN)

Ce document définit les règles strictes de développement pour garantir la scalabilité, la sécurité et la maintenabilité du projet. **Toute modification de code doit s'y conformer.**

---

## 🏗️ 1. BACK-END (NestJS & CQRS)

### Principes Fondamentaux
- **CQRS Pur :** Les `CommandHandlers` orchestrent, ils n'exécutent pas la logique métier complexe.
- **Services de Domaine (Laravel Style) :** Toute logique métier répétable doit être extraite dans un `DomainService` ou un `Helper`.
- **Transactions :** Toute opération impliquant plusieurs entités (ex: User + Profile) DOIT être enveloppée dans une transaction TypeORM.
- **Sécurité & Chiffrement :**
    - Les données sensibles (KYC, Identité) sont stockées dans `ProfileEntity` avec le suffixe `_enc`.
    - Utilisation obligatoire du `EncryptionService` combinant la `MASTER_KEY` et le `user.encryption_salt`.
    - Ne jamais logger de données sensibles.

### Structure des Dossiers
Chaque module doit suivre cette hiérarchie :
- `commands/` : Actions modifiant l'état.
- `queries/` : Actions de lecture.
- `services/` : Logique métier partagée (Domain Services).
- `entities/` : Modèles de données.
- `_docs/` : Documentation technique du module (README.md).

---

## 🎨 2. FRONT-END (Vue 3, Tailwind & Design System)

### Atomic Design & Réutilisabilité
- **Composants UI :** Interdiction de coder des styles complexes en dur. Utiliser ou créer des composants dans `@/components/ui`.
- **Tokens Tailwind :** Utiliser EXCLUSIVEMENT les classes définies dans `tailwind.config.js` (ex: `text-primary`, `bg-secondary`). Pas de valeurs HEX arbitraires.
- **Composables :** La logique d'API, le state management et les calculs complexes doivent résider dans `@/composables`.
- **Responsive "Desktop-First Optimization" :** Bien que Mobile-First, chaque page doit exploiter l'espace horizontal sur Desktop via des Grids (`grid-cols-12`) et des Sidebars.

---

## 📝 3. DOCUMENTATION & CLEAN CODE

### JSDoc Obligatoire
Chaque méthode, interface ou classe doit être documentée :
```typescript
/**
 * Calcule la progression de la tirelire loyer.
 * @param currentAmount - Le solde actuel
 * @param targetAmount - L'objectif à atteindre
 * @returns Le pourcentage de progression (0-100)
 */



## 📂 5. RESPECT DE LA STRUCTURE EXISTANTE (STRICT)

### BACK-END (NestJS / CQRS)
- **Logique métier :** Interdiction de sortir du cadre `src/[Module]/commands`, `src/[Module]/queries`, etc.
- **Entités :** Toujours dans `src/[Module]/entities`.
- **Nomenclature :** Suit le format `nom-du-fichier.model.ts` ou `nom-du-fichier.handler.ts` selon l'existant.
- **Zéro déviation :** Si un dossier existe déjà pour une fonctionnalité, utilise-le. Ne crée pas de dossiers "temp" ou "misc".

### FRONT-END (Vue 3 / Vite)
- **Composants :** - `src/components/ui/` pour les atomes (boutons, inputs).
  - `src/components/layout/` pour la structure.
  - `src/components/composites/` (ou ton dossier équivalent) pour les blocs complexes.
- **Pages :** Toujours dans `src/views/` ou `src/pages/`.
- **Services/API :** Utilise tes dossiers `src/services/` ou `src/api/` sans en créer de nouveaux.
- **Prise en compte** du mode dark et light, de monnaie qui devra refleter exemple 100 XOF peut pas etre egale a $100 tu comprend?
peut etre au niveau du back tu devra le faire ou front pour pouvoir facilement manipuler

## 📊 6. PATTERN DE VISUALISATION (MULTI-VIEW)

### Règle de Densité d'Information
Pour tout module de gestion (Dashboard, Listes de biens, Users, Transactions), le système doit impérativement supporter trois modes d'affichage switchables :

1. **Vue Grille (Grid) :** - Priorité au visuel.
   - Desktop : Minimum 4 colonnes (`lg:grid-cols-4`), idéalement 6 (`xl:grid-cols-6`).
   - Cartes compactes avec image principale (`is_primary`), titre et indicateurs clés (badges).

2. **Vue Liste (Tableau) :**
   - Priorité à la gestion de masse.
   - Utilisation d'un composant de table avec tri, recherche et pagination.
   - Colonnes denses avec actions rapides (Quick Edit, Delete).

3. **Vue Compacte :**
   - Liste ultra-serrée sans images pour une vision d'ensemble rapide.

### Implémentation Technique
- **Persistance :** Le mode sélectionné doit être stocké en `localStorage` pour chaque vue.
- **Toggle UI :** Utiliser un groupe de boutons d'icônes standardisé en haut à droite de la section contenu.
- **Condition :** Si la liste contient moins de 3 éléments, la vue 'Grille' peut être imposée par défaut, mais le switch doit rester accessible.

7. ROLES & PERMISSIONS" :

NOMENCLATURE DES RÔLES (STRICT) :

Landlord : Le propriétaire bailleur (celui qui possède les Properties et Units).

Tenant : Le locataire (celui qui loue les Units).

Agent : Le gestionnaire ou démarcheur (intermédiaire).

Admin : Le gestionnaire de la plateforme (gestion des pays, villes, types).

RÈGLE : Interdiction d'utiliser le terme 'Owner'. Dans le code (URLs, variables, dossiers), utilise systématiquement ces termes. Ex: /admin/landlord/properties au lieu de /admin/owner/properties

## 🔌 8. DATA FETCHING & API CALLS (STRICT)

### Isolation des Appels API
- **Interdiction Formelle :** Aucun appel API (axios, fetch, etc.) ne doit être écrit directement dans un composant `.vue` ou une page.
- **Services API :** Tous les appels doivent résider dans `@/services/api/`. Chaque domaine (Landlord, Tenant, Location) a son propre fichier de service (ex: `landlord.service.ts`).
- **Composables (Logic Layer) :** Les composants utilisent des **Composables** (`@/composables/`) qui consomment ces services. 
    - *Exemple :* `EditPropertyModal.vue` appelle `useProperty.update()`, qui lui-même appelle `LandlordService.updateProperty()`.

### Gestion des États (State Management)
- Utilise **Pinia** pour les états globaux (User, Auth, Config).
- Utilise des états locaux réactifs (`ref`, `reactive`) dans les composables pour les formulaires éphémères.

### Centralisation des Endpoints
- Ne tape jamais d'URL en dur. Utilise une configuration centrale ou des constantes.

## 🌐 9. ROUTING & ENVIRONNEMENT (VITE PROXY)

### Gestion de l'API (Front-end)
- **Préfixe Obligatoire :** Tous les appels API doivent utiliser la variable `import.meta.env.VITE_API_BASE_URL`.
- **Proxy Dev :** En développement, l'API est préfixée par `/api`. Ne jamais coder d'URL absolue (ex: http://localhost:3000) dans les services.
- **Séparation API vs SPA :** - Les routes définies dans `vue-router` (Front) ne doivent JAMAIS entrer en conflit avec les routes du contrôleur NestJS (Back).
    - Toujours privilégier des routes Back-end claires (ex: `/api/landlord/properties`) pour éviter que le proxy ne tente d'intercepter les routes Front (ex: `/landlord/properties`).

### Configuration du Backend
- **Static Files :** Les fichiers uploadés (images) doivent être servis via un préfixe distinct (ex: `/uploads`) géré par le middleware de fichiers statiques de NestJS.
- **Base URL :** Le backend doit utiliser une variable d'environnement `BACKEND_URL` pour générer les liens absolus des images (utilisée dans les services d'upload).


## 🧱 11. DESIGN SYSTEM & COMPOSANTS ATOMIQUES

- **Principe :** Aucun élément HTML de base (`<button>`, `<input>`, `<select>`) ne doit être utilisé directement dans les vues métiers.
- **Composants Requis :**
  - `AppButton` : Gère nativement les états `:loading`, `:disabled`, les variantes (primary, danger) et prévient les doubles clics.
  - `AppInput` / `AppSelect` : Gère les labels, les messages d'erreur de validation et le style consistant.
  - `AppCard` : Structure standard pour les annonces (maison/chambre) avec ombre et arrondis uniformes.
  - `AppUpload` : Composant unique pour le drop de fichiers (images/docs) avec prévisualisation immédiate.
- **Typographie :** Utilisation systématique de `AppTitle` et `AppText` pour contrôler les tailles et couleurs de police partout.

## 📌 Unités indépendantes (sans bien)

- Les unités avec `property_id = null` (unités autonomes) sont créées via l’API (POST /property/units avec `property_id` null).
- **Listes actuelles :** Les endpoints de liste (GET /property, GET /property/owner/me, search) ne retournent que des **biens** (PropertyEntity). Les unités indépendantes n’apparaissent donc pas dans la liste globale ni dans « Mes biens ».
- **Évolution possible :** Pour les afficher comme annonces à part entière, étendre le handler « propriétés par owner » (ou un endpoint dédié) pour inclure les unités dont `property_id IS NULL` et `owner_id = owner`, en les mappant en entrées de type « bien virtuel » (même forme que PropertyListItemDto) côté backend, et adapter le front (lien détail unité vs bien).