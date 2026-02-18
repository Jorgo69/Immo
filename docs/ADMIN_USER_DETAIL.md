# Détail utilisateur (admin) – Page dédiée

## Route et vue

- **Route** : `/admin/users/:id` (nom : `admin-user-detail`).
- **Vue** : `AdminUserDetailView.vue`.
- Depuis la liste des utilisateurs (`/admin/users`), un clic sur une ligne ou sur « Voir » ouvre cette page (navigation, pas de panneau coulissant).

## Ce qui est affiché aujourd’hui

### Commun à tous les rôles

- Fil d’Ariane : Utilisateurs / Détail.
- Carte utilisateur : téléphone, rôle, langue, statut (actif/inactif), date d’inscription.
- Bloc **Connexion et sécurité** : texte placeholder (voir ci‑dessous « À prévoir »).

### Selon le rôle

- **Propriétaire (landlord)**  
  - Nombre de **biens** dont il est propriétaire (`owner_id`).  
  - Nombre total de **chambres** de ces biens.

- **Agent**  
  - Nombre de **biens** qu’il gère (`agent_id`).  
  - Nombre total de **chambres** de ces biens.

- **Locataire (tenant)**  
  - **Tirelire** : solde total, solde épargne (wallet).  
  - Nombre de transactions, date de la dernière transaction.  
  - **Historique** : tableau des dernières transactions (paginé côté API, 10 par page).

- **Admin**  
  - Affichage des mêmes blocs « En tant que propriétaire » et « En tant qu’agent » (stats agrégées si l’admin a des biens/agent_id en base).

## API utilisées

- `GET /user/detail?id=<uuid>`  
  Retourne `{ user, stats }` avec notamment :  
  `propertiesAsOwnerCount`, `roomsAsOwnerCount`, `propertiesAsAgentCount`, `roomsAsAgentCount`,  
  `walletBalanceTotal`, `walletBalanceSavings`, `transactionsCount`, `lastTransactionAt`.

- `GET /user/detail/transactions?id=<uuid>&page=1&limit=10`  
  Retourne la liste paginée des transactions du wallet de cet utilisateur (pour l’historique locataire).

## À prévoir (non implémenté)

### Connexion / sécurité

- **Dernière connexion** : nécessite une table ou un champ (ex. `last_login_at` sur `users` ou table `sessions` / `login_logs`).
- **Tentatives OTP** : nombre d’échecs / succès pour le code OTP → table ou logs dédiés (ex. `auth_attempts` ou `otp_attempts`).
- **Provenance des connexions** : IP, user-agent, appareil → à enregistrer dans une table type `sessions` ou `login_logs` et à afficher sur la page détail.

La section « Connexion et sécurité » sur la page détail affiche pour l’instant un texte explicatif (placeholder) indiquant que ces infos viendront après mise en place des tables/système dédiés.

### Locataire : chambre louée, contrat, « paie bien »

- **Quelle chambre il loue** et **depuis quand** : nécessite une table de type **contrat de location** / **lease** (lien locataire ↔ chambre, dates début/fin, statut).
- **Paie bien / à jour** : dérivé des transactions et/ou des échéances (à définir avec les règles métier et éventuellement une table d’échéances).

Aucune table « contrat » ou « location active » n’existe encore ; ces éléments sont à concevoir et implémenter ensuite.

## Sécurité

- Les routes `GET /user/detail` et `GET /user/detail/transactions` ne sont pas encore protégées par un garde « admin uniquement ». À ajouter côté backend (ex. `RolesGuard` ou vérification du rôle sur l’utilisateur connecté) pour restreindre l’accès aux admins.
