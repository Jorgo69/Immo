# Tables et navigation admin — Immo Bénin

## 1. Nombre de tables et lecture admin

D’après le schéma et les entités backend, on a **9 tables** (certaines peuvent ne pas encore être exposées en API) :

| # | Table | Rôle | Admin : au minimum |
|---|--------|------|---------------------|
| 1 | **users** | Utilisateurs (auth, rôle) | Read (liste + détail) |
| 2 | **profiles** | Profils (KYC, nom, pièce) | Read |
| 3 | **properties** | Biens immobiliers | Read, Create, Update (soft delete plus tard) |
| 4 | **media** | Médias d’un bien (photos, vidéos) | Read (par bien), Create (upload) |
| 5 | **rooms** | Chambres / pièces d’un bien | Read (par bien ou liste globale), Create |
| 6 | **wallets** | Portefeuilles (tirelire) | Read (liste + détail) |
| 7 | **transactions** | Transactions (loyer, épargne, etc.) | Read (liste, filtres) |
| 8 | **notifications** | Notifications (canaux) | Read (optionnel) |
| 9 | **meter_readings** | Relevés compteurs (SBEE/SONEB) | Read (optionnel) |

Oui : l’admin doit pouvoir faire au moins du **Read sur tout**. Pour certaines tables (properties, rooms, media) il y a en plus Create/Update selon l’importance métier.

---

## 2. Sidebar : nav + subnav (comme la référence veep)

Dans la référence que tu as montrée :
- Les items sont **ligne par ligne**, bien espacés verticalement.
- Il y a une **hiérarchie** : des entrées principales et des **sous-entrées** (ex. « Cartes » avec « Stock » et « Activation » en dessous, indentées).
- Ce n’est **pas** l’ancienne barre du haut simplement déplacée à gauche : c’est une vraie arborescence (nav + subnav) basée sur les **tables / domaines**.

Structure proposée pour Immo, alignée sur les tables :

```
Accueil                    →  /  (retour site)
Tableau de bord            →  /admin
Utilisateurs               →  /admin/users
  (sous-item optionnel) Liste
Biens                      →  /admin/properties
  Liste                    →  /admin/properties
  (Créer = bouton dans la liste ou sur le tableau de bord)
Chambres                   →  /admin/rooms   (liste globale des chambres)
Finances                   (parent, peut être cliquable vers un récap ou premier sous-item)
  Portefeuilles            →  /admin/wallets
  Transactions             →  /admin/transactions
Profils                    →  /admin/profiles
```

On peut aussi regrouper « Biens » avec des sous-items :
- **Biens**
  - Liste des biens → `/admin/properties`
  - Chambres (liste globale) → `/admin/rooms`  
et garder **Finances** avec Portefeuilles et Transactions en subnav.

Les entrées sont affichées **une par ligne**, avec les sous-items **indentés** (et éventuellement repliables si on veut un menu « Cartes » style veep).

---

## 3. Récap

- **9 tables** : users, profiles, properties, media, rooms, wallets, transactions, notifications, meter_readings.
- **Admin** : au minimum **Read** sur toutes ; Create/Update (et plus tard soft delete) sur les plus importantes (ex. properties, rooms, media).
- **Sidebar** : **nav + subnav** basés sur ces tables / domaines, **ligne par ligne**, avec sous-menus indentés (et optionnellement repliables), pas une simple liste plate collée comme l’ancienne barre du haut.

Ce fichier sert de référence pour implémenter la sidebar et les écrans admin (liste par table, etc.).
