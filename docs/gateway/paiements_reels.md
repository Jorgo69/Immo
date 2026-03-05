# Documentation Intégration des Passerelles de Paiement (FedaPay & Kkiapay)

Ce document explique en détail le fonctionnement des paiements réels et des Webhooks intégrés à la plateforme Immo Bénin.

## Architecture

Le système utilise le pattern **Stratégie** (Strategy Pattern) via l'interface `PaymentStrategy` intégrée dans le `PaymentModule` du backend.

### 1. Entité de Base : `PaymentGatewayEntity`
Chaque passerelle est enregistrée en base de données (`payment_gateways`) avec les attributs suivants :
- `type` : L'identifiant unique (enum : `FEDAPAY`, `KKIAPYA`, `GSM_MTN`, etc.)
- `isActive` : Si false, la passerelle n'apparaît pas sur le frontend.
- `config` : (Optionnel) Quelques spécificités non sensibles.

### 2. Le fichier `.env` et `ConfigModule`
**Seuls les identifiants NON-SENSIBLES peuvent être en base.**
Toutes les vraies clés (privées, publiques, secrets) **sont strictement conservées dans le `.env`**.
Avant chaque paiement ou traitement de webhook, le `PaymentService` fusionne les paramètres de la base de données avec ceux de `ConfigService` (les variables d'environnement l'emportant sur la BD pour assurer la sécurité).

---

## Flux de Paiement Client (Frontend -> Backend -> Agrégateur -> Frontend)

1. **Initiation (`DepositModal.vue`)**
   L'utilisateur choisit le montant et la passerelle dans le modal de dépôt de sa Tirelire. 
   Un appel POST est fait à `/api/payment/checkout`.

2. **Création Checkout (`PaymentService.ts`)**
   - Le service récupère le profil de l'utilisateur (`name`, `email`, `phone`).
   - Il initialise le client SDK de l'agrégateur (ex: `fedapay.Transaction.create({ ... })`).
   - Il pré-remplit les coordonnées de l'utilisateur pour une meilleure UX.
   - Il inclut l'URL de **callback Frontend** (`APP_URL/wallet?payment_status=success`).

3. **Redirection vers l'Aggrégateur**
   Le Controller backend répond avec l'URL (_Checkout Link_) générée par l'API. Le Frontend redirige l'utilisateur vers cette URL (Widget Kkiapay ou FedaPay Checkout).

4. **Retour de l'utilisateur (Callback URL)**
   Une fois le paiement terminé ou annulé, l'agrégateur redirige l'utilisateur vers l'URL que nous lui avons fourni.
   Le composant VueJS écoute le paramètre URL `?payment_status=success|error`.
   Si `success`, une notification Toast ("Paiement réussi") est affichée.

---

## Webhooks (La vraie confirmation)

La simple redirection vers le Frontend de réussite (`payment_status=success`) **ne crédite jamais** le compte de l'utilisateur. C'est uniquement le rôle du **Webhook**.

1. **Réception**
   L'agrégateur envoie une requête POST automatique vers `/api/payment/webhook/:gatewayType`.
   Exemple : `https://api.immo-benin.com/api/payment/webhook/fedapay`

2. **Vérification d'authenticité (Crucial)**
   C'est la méthode `handleWebhook()` intégrée à chaque Stratégie qui vérifie ce payload.
   - **Kkiapay** : Le backend va utiliser l'ID de transaction envoyé dans le payload pour demander au serveur Kkiapay officiel (via `k.verify(id)`) : *"Cette transaction est-elle vraiment réussie ?"*.
   - **FedaPay** : Même principe, vérification du statut envoyé par rapport à l'API.

3. **Mise à jour (CQRS)**
   Si l'authenticité est confirmée, la stratégie retourne `success: true` et le montant validé.
   Le `PaymentService` lance la commande `RecordTransactionCommand` du module Wallet qui va immanquablement augmenter le solde de la Tirelire (`balance_savings`).

4. **Notification**
   En parallèle, une Notification In-App est générée et envoyée par WebSocket à l'utilisateur : "Votre dépôt de 5000 FCFA a été validé !".

---

## SDKs Utilisés

L'intégration a requis l'installation en backend des SDK Node.js officiels :
- FedaPay : `fedapay`
- Kkiapay : `@kkiapay-org/nodejs-sdk` (L'ancien paquet `kkiapay` étant déprécié ou exclusif au client-side).

---

## Erreurs et Debugging

> **Règle d'or** : Regardez toujours les retours réseaux sur la console du navigateur (Network Tab) si le Frontend indique "Erreur générique". Le Backend expose maintenant l'exception précise à travers `error.response.data.message` (ex. "Clés manquantes").

**Kkiapay affiche une page blanche ou erreur 401 ?**
- Vérifiez si `KKIAPAY_PUBLIC_KEY` correspond avec l'environnement `KKIAPAY_MODE` (test/live) dans votre `.env`.

**FedaPay affiche "Customer Email Invalid" ?**
- Par nature, ces solutions n'aiment pas les adresses email factices quand on n'est pas en sandbox. Assurez-vous d'avoir un email complet lors de l'onboarding pour que le pré-remplissage FedaPay fonctionne.
