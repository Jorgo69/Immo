# Ordre de développement backend — Immo Bénin

Logique à suivre pour ne pas s’y perdre. Chaque module s’appuie sur les précédents.

---

## Séquence Phase 1 (fondations)

| Étape | Module      | Statut   | Dépendances | Rôle |
|-------|-------------|----------|-------------|------|
| 1     | **Auth**    | ✅ Fait  | —           | Identité : OTP, JWT, User (phone, role, preferred_lang). |
| 2     | **User**    | ✅ Fait  | Auth        | CRUD utilisateur (get-all, by-id, update, delete). |
| 3     | **Wallet** | ✅ Fait  | Auth, User | Tirelire + transactions (wallets, transactions). |
| 4     | **Property**| ✅ Fait  | User        | Biens immobiliers + Media, CRUD + filtres (pgvector à venir). |
| 5     | **Profile** | ✅ Fait  | Auth, EncryptionService | Données KYC chiffrées (full_name_enc, id_card_enc). |

---

## Pourquoi cet ordre ?

1. **Auth + User** : déjà en place (identité et rôles).
2. **Wallet** : cœur métier “Tirelire Loyer” ; chaque user peut avoir un wallet et des transactions. Pas de Property sans user (owner/agent), mais on peut faire Wallet sans Property.
3. **Property** : annonces, recherche ; utile après qu’on ait des users (proprios/agents).
4. **Profile** : peut venir après Wallet/Property (KYC pour confiance).

---

## Progression frontend (Phase 2)

- [x] Setup Vue 3, Tailwind, Pinia, i18n, routes.
- [x] Auth (OTP), Dashboard Tirelire, liste et détail des biens, navigation conditionnelle.
- [x] Recherche texte (GET /property/search?q=…).
- [x] Carte (Leaflet), PWA/offline (vite-plugin-pwa, indication hors ligne).
- [ ] Recherche IA sémantique (embeddings + description_vector, migration SQL prête).

---

## Prochaine action

**Backend** : Recherche sémantique (embeddings à brancher ; migration `database/migrations/add-description-vector.sql` prête). Tests REST dans **`http/`** (fichier `.http` par module).

**À ne pas oublier** : recherche sémantique (embeddings + colonne `description_vector` + requête similarité) — détaillé dans **`A_VENIR.md`** à la racine du projet.

---

## Suite logique recommandée

1. ~~**Carte**~~ ✅ (frontend) : biens sur carte Leaflet (liste ↔ carte).
2. ~~**PWA / offline**~~ ✅ (frontend) : vite-plugin-pwa, indication hors ligne.
3. **Recherche sémantique** (backend + front) : embeddings + pgvector (migration SQL prête, voir `A_VENIR.md`).
4. ~~**Profile**~~ ✅ (backend + front) : module KYC, chiffrement, page Mon profil.
5. **Prod** : migrations TypeORM, désactiver `synchronize`, monitoring.
