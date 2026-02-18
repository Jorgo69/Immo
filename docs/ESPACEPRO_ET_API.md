# Espace Pro + API — tout reprendre du début

Ce fichier décrit : où tournent l’API et Swagger, comment le front les appelle, puis la logique de l’Espace Pro et du formulaire en 2 étapes.

---

## 1. Où est l’API ? Est-ce vraiment `api/` ?

### Backend (NestJS)

- **URL** : le serveur Nest tourne sur un port (souvent **3000**), ex. `http://localhost:3000`.
- **Routes métier** : il n’y a **pas** de préfixe global `api` sur les routes. Les routes sont à la racine :
  - `POST /auth/request-otp`
  - `POST /auth/verify-otp`
  - `GET /auth/me`
  - `GET /property`, `POST /property`, `GET /property/:id`, etc.
  - `GET /wallet/me`, etc.
- Donc l’API « réelle » est : **`http://localhost:3000/property`**, **`http://localhost:3000/auth/me`**, etc. (pas `http://localhost:3000/api/property`).

### Swagger

- Swagger est monté **uniquement** pour la doc, sous le chemin **`/api`** dans `main.ts` :
  - `SwaggerModule.setup('api', app, document)`
- Donc la doc Swagger est ici :
  - **`http://localhost:3000/api`**  
  (avec le backend qui tourne sur 3000).
- En résumé : **les routes métier ne sont pas sous `/api`**, seul **Swagger** est sous **`/api`**.

### Frontend en dev (Vite, port 5173)

- Le front tourne sur **`http://127.0.0.1:5173`** (ou localhost:5173).
- Dans `.env.development` on a **`VITE_API_BASE_URL=/api`**.
- Axios est configuré avec **`baseURL: '/api'`** :
  - le front envoie donc des requêtes vers **`http://127.0.0.1:5173/api/property`**, **`http://127.0.0.1:5173/api/auth/me`**, etc.
- Le **proxy Vite** (dans `vite.config.ts`) fait :
  - toute requête vers **`/api/*`** est envoyée au backend **`http://localhost:3000`** ;
  - et le préfixe **`/api`** est **supprimé** par `rewrite: (path) => path.replace(/^\/api/, '')`.
- Donc :
  - **Ce que tu vois dans l’onglet Réseau** : `127.0.0.1:5173/api/property` → normal, c’est l’URL côté navigateur.
  - **Ce que reçoit le backend** : `http://localhost:3000/property` (sans `/api`).

En résumé :  
- **API réelle** : `http://localhost:3000/property`, `/auth/me`, etc. (pas sous `api/`).  
- **Swagger** : `http://localhost:3000/api`.  
- **Front en dev** : appelle `127.0.0.1:5173/api/...` ; le proxy enlève `/api` et envoie au backend sur le port 3000.

---

## 2. Logique de l’Espace Pro (résumé)

- **Qui** : utilisateurs avec un rôle **pro** (propriétaire, agent, admin) : `landlord`, `agent`, `admin`.
- **Où** : sous la route **`/admin`** (layout avec sidebar + barre du haut + zone de contenu).
- **But** :  
  - voir les biens dont je suis **propriétaire** ou **agent** ;  
  - **créer** un nouveau bien (et ses chambres) ;  
  - plus tard : détail d’un bien, modals (rejet, suppression, etc.).

Pour l’instant, l’Espace Pro fait surtout :

1. **Tableau de bord** (`/admin`) : stats (nombre de biens, biens gérés, chambres), listes « Biens dont je suis propriétaire » et « Biens que je gère comme agent », et un **bouton « Ajouter un bien »** qui ouvre le formulaire de création.
2. **Création d’un bien** : un seul formulaire, découpé en **2 étapes** (voir section 3).

La logique métier côté API :

- **Créer un bien** : `POST /property` avec notamment **`owner_id`** (UUID de l’utilisateur connecté).
- **Créer des chambres** : après création du bien, pour chaque chambre on appelle **`POST /property/:id/rooms`** avec `name`, optionnellement `type`, `price_monthly`, `surface_m2`, `floor`.

L’**owner_id** doit être un **UUID** valide (celui de l’utilisateur connecté). Le front le prend normalement du store (mis à jour après login ou après appel à **GET /auth/me**). Si l’erreur « owner_id must be a UUID » apparaît, c’est que la valeur envoyée dans le body de **POST /property** n’est pas un UUID (store pas à jour, ancien format, ou mauvais champ).

---

## 3. Création en 2 étapes : à quoi ça sert ?

C’est **un seul** formulaire « Créer un bien », mais affiché en **2 écrans** pour rendre la saisie plus claire.

- **Étape 1 – Infos du bien**  
  On remplit tout ce qui décrit le **bien** lui-même :  
  titre, ville, quartier, adresse, prix indicatif (FCFA/mois), statut (disponible, occupé, etc.), latitude/longitude.  
  Bouton **« Suivant »** : on valide ces champs (titre, ville, prix obligatoires) et on passe à l’étape 2.

- **Étape 2 – Chambres**  
  On décrit les **chambres** (ou pièces) de ce bien : pour chaque ligne, nom, type (chambre, studio, etc.), prix, surface, étage. On peut ajouter plusieurs chambres.  
  Boutons **« Retour »** (revenir à l’étape 1), **« Créer le bien »** (envoi final).

**Pourquoi 2 étapes ?**

- Une fois le bien créé, l’API renvoie un **id**. Les chambres sont créées **après**, en appelant **`POST /property/:id/rooms`** pour chaque chambre. Donc on a besoin de toutes les infos du bien d’abord, puis de la liste des chambres.
- Mettre « bien » puis « chambres » en 2 écrans évite une seule longue page et permet de valider les infos du bien avant de saisir les chambres.

**En résumé** :  
- **Étape 1** = tout ce qui va dans **POST /property** (owner_id, title, city, price_monthly, status, etc.).  
- **Étape 2** = les lignes qui vont dans **POST /property/:id/rooms** (une requête par chambre).  
Un seul flux « Créer un bien », deux étapes d’affichage pour mieux structurer le formulaire.

---

## 4. Récap utile

| Question | Réponse |
|----------|---------|
| Swagger ? | **http://localhost:3000/api** (backend sur 3000). |
| Les routes API sont sous `/api` ? | **Non.** Elles sont à la racine : `/property`, `/auth/me`, etc. Seul Swagger est sous `/api`. |
| Pourquoi on voit `5173/api/property` ? | Le front (5173) appelle `/api/property` ; le proxy enlève `/api` et envoie au backend (3000) en `/property`. |
| Espace Pro, c’est quoi ? | Zone `/admin` pour les rôles pro : tableau de bord + création de biens (et plus tard détail, modals). |
| Pourquoi 2 étapes à la création ? | Étape 1 = infos du bien (POST /property). Étape 2 = chambres (POST /property/:id/rooms). Même flux, découpé en 2 écrans pour la lisibilité. |
| Erreur « owner_id must be a UUID » ? | Le body de POST /property envoie un `owner_id` qui n’est pas un UUID. Il doit être l’id (UUID) de l’utilisateur connecté, fourni par le backend (auth/verify-otp ou auth/me). |

Ce fichier sert de référence pour ne pas se mélanger : API, proxy, Swagger, logique Espace Pro et sens des 2 étapes.
