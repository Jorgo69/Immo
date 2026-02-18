# Prochaine étape — Immo Bénin

Document de suivi pour garder tout aligné.

---

## Ce qui vient d’être fait

- **Soft delete** : colonne `deleted_at` sur users, properties, rooms, media, wallets, transactions, profiles. Suppression = `softRemove()` ; les données sensibles restent en base et ne disparaissent pas en un coup.
- **Seed ~100 biens** : script `database/scripts/generate-seed-100.js` qui génère 90 biens supplémentaires ; avec `seed-dev.sql` (10 biens) on arrive à **100 biens** et ~195 chambres. Villes variées (Cotonou, Abomey-Calavi, Porto-Novo, Sèmè-Kpodji, Parakou, Natitingou).
- **Migration** : `database/migrations/add-soft-delete-columns.sql` pour ajouter `deleted_at` quand TypeORM `synchronize` est désactivé (prod).

---

## Prochaine étape recommandée

1. ~~**Flow « Ajouter un bien + chambres »** (Espace pro)~~ **Fait**  
   - Formulaire en 2 étapes (wizard) : Étape 1 = infos du bien (titre, ville, quartier, adresse, prix, statut, lat/lng), Étape 2 = chambres (nom, type, prix, surface, étage).  
   - Statut bien en select (Disponible, Bientôt disponible, Occupé, En maintenance) et type de chambre en select (Chambre, Studio, Appartement, Autre).  
   - Validation (titre/ville requis, prix ≥ 0) et i18n (admin.formStep1, admin.formStep2, admin.status.*, admin.roomType.*, admin.validation.*).

2. **Alignement front**  
   - Vérifier que liste, carte, Reels et Espace pro excluent bien les biens soft-deleted (déjà le cas si l’API ne retourne que les actifs).  
   - Pagination ou virtualisation sur la liste si 100 biens rendent la page lourde.

3. **Optionnel**  
   - Endpoints « supprimer un bien » / « supprimer un user » côté API (soft delete) et boutons dans l’UI.  
   - Restauration (restore) pour admin si besoin.

---

## Commandes utiles

| Action | Commande |
|--------|----------|
| Seed de base (10 biens) | `npm run db:seed` / `db:seed:local` (dans `back-end-api-immo-app`) |
| Seed ~100 biens | `npm run db:seed:100` / `db:seed:100:local` |
| Migration soft delete | `psql ... -f database/migrations/add-soft-delete-columns.sql` |
