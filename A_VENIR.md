# À ne pas oublier — Immo Bénin

Rappels des fonctionnalités prévues mais pas encore faites, pour ne pas les perdre de vue.

---

## Recherche sémantique (IA / pgvector)

- **À faire** : brancher la **recherche sémantique** sur les biens (embeddings + pgvector).
- **Contexte** : la recherche actuelle est en **texte** (ILIKE sur titre, ville, description). Pour une vraie « recherche en langage naturel » (ex. « studio calme à Calavi pas cher »), il faut :
  1. Colonne **`description_vector`** sur `properties` (type `vector`, extension pgvector déjà dans le script DB).
  2. Un **modèle d’embeddings** (sentence-transformers, API, etc.) pour transformer le texte en vecteur.
  3. À la création/mise à jour d’un bien : générer l’embedding de la description (ou titre+description) et le stocker dans `description_vector`.
  4. Endpoint de recherche (ou extension de `/property/search`) : transformer la requête `q` en vecteur, puis requête PostgreSQL avec opérateur de similarité pgvector (ex. `<=>`).
- **Référence** : schéma `schema_database.dbml` (champ `description_vector vector`), PROJECT_BRAIN (recherche IA multilingue), TODO.md Phase 1.4 et 3.3.

---

## Autres suites logiques (ordre indicatif)

- **Carte géographique** : afficher les biens sur une carte (lat/long déjà en base).
- **PWA / offline** : Service Workers, IndexedDB pour consulter sans réseau.
- **Module Profile** (optionnel) : KYC, champs chiffrés (EncryptionService prêt).
- **Migrations TypeORM** : désactiver `synchronize` en prod, migrations versionnées.
- **Intégrations** : FedaPay/KkiPay, WhatsApp/SMS pour OTP et reçus.
