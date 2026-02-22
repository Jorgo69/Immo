# Module Rental — Demandes de location

## Objectif

Gérer les **demandes de location** en interne : le locataire clique → une **RentalRequest** est créée en base → le propriétaire consulte l’historique (KYC) → le propriétaire valide → le statut de l’unité passe automatiquement à **OCCUPIED**.  
**WhatsApp** ne sert que de **canal de notification final**, pas de lieu de gestion.

## Table rental_requests

| Colonne     | Type        | Description                          |
|-------------|-------------|--------------------------------------|
| id          | uuid PK     |                                      |
| unit_id     | uuid FK     | units(id) ON DELETE CASCADE           |
| tenant_id   | uuid FK     | users(id) ON DELETE CASCADE           |
| status      | enum        | pending, accepted, rejected           |
| message     | text        | Optionnel (message du locataire)      |
| created_at  | timestamptz |                                      |
| updated_at  | timestamptz |                                      |
| responded_at| timestamptz | Date de réponse par le propriétaire  |
| responded_by| uuid FK     | users(id) — utilisateur ayant répondu|

## Flux métier

1. **Locataire** : « Je suis intéressé » sur une unité → `POST /rental/requests` (unit_id, message optionnel) → création d’une RentalRequest en statut `pending`.
2. **Propriétaire** : consulte les demandes (historique, KYC du locataire).
3. **Propriétaire** : accepte ou refuse → mise à jour `status`, `responded_at`, `responded_by`. Si **accepted** : le statut de l’unité (`units.unit_status`) passe à `OCCUPIED` (logique dans le handler de validation).
4. **Notification** : WhatsApp (ou autre canal) utilisé uniquement pour notifier le locataire du résultat.

## Isolation

- Ce module est dédié au **flux Location**. Un futur module **Vente** pourra avoir sa propre entité (ex: SaleRequest) sans dépendance à `rental_requests`.
