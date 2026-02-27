# Onboarding — Processus d'Inscription Complète

> L'onboarding guide l'utilisateur étape par étape pour compléter son profil après son premier login.

---

## Vue d'ensemble

L'onboarding se déclenche automatiquement quand :
```
users.is_profile_complete = false
```

Tant que ce flag est `false`, l'application affiche la page d'onboarding avant de permettre l'accès à l'espace personnel.

---

## Flux général

```
1. L'utilisateur crée un compte (téléphone + OTP)
   → users.is_profile_complete = false

2. Premier login → redirection vers /onboarding

3. Sélection du rôle (Locataire, Propriétaire, Agent)

4. Étapes adaptées au rôle choisi

5. À chaque étape → sauvegarde dans Redis (brouillon)
   Clé Redis : onboarding:{userId}
   TTL        : 24 heures

6. Si l'utilisateur quitte et revient → reprend où il s'était arrêté

7. À la dernière étape → commit en PostgreSQL
   → is_profile_complete = true
   → Suppression de la clé Redis
   → Redirection vers le dashboard
```

---

## Étapes par rôle

### Locataire (Tenant)

```
Étape 1 : Informations personnelles
  - Prénom (obligatoire)
  - Nom (obligatoire)
  - Email (optionnel)

Étape 2 : Préférences de recherche
  - Zone(s) géographique(s) recherchée(s)
  - Budget minimum (chiffré)
  - Budget maximum (chiffré)

Étape 3 : Vérification d'identité (KYC)
  - Upload pièce d'identité (JPEG/PNG/PDF, max 5MB)
  - ⚠️ Obligatoire pour faire une demande de location

✅ Fin → is_profile_complete = true
```

### Propriétaire (Landlord)

```
Étape 1 : Informations personnelles
  - Prénom, Nom
  - Email (optionnel)

Étape 2 : Vérification d'identité (KYC)
  - Upload pièce d'identité
  - IFU (optionnel si particulier, obligatoire si professionnel)

Étape 3 : Confirmation
  - Résumé du profil
  - Validation

✅ Fin → is_profile_complete = true
```

### Agent

```
Étape 1 : Informations personnelles + société
  - Prénom, Nom
  - Nom de la société (ou agence)

Étape 2 : Documents légaux (KYC renforcé)
  - Upload pièce d'identité
  - Numéro IFU (obligatoire)
  - Numéro RCCM (obligatoire)

Étape 3 : Confirmation
  - Résumé + acceptation des CGU

✅ Fin → is_profile_complete = true
```

---

## Formats des champs de référence béninois

### Format IFU (Identifiant Fiscal Unique)
```
Exemple : RB/XXXXX/AAAA

Règles :
  - Commence par "RB/"
  - Suivi de lettres majuscules et/ou chiffres
  - Puis "/"
  - Puis des chiffres

Validation :
  - Si le format n'est pas respecté → erreur immédiate
  - Si lettre attendue et chiffre tapé → refus
  - Si chiffre attendu et lettre tapée → refus
  - Si limite de caractères atteinte → refus de saisie supplémentaire
  - L'unicité est vérifiée via ifu_hash en BDD
```

### Format RCCM (Registre du Commerce)
```
Exemple : RB/COT/24 A XXXXX

Validation similaire — format structuré strict
```

---

## Sauvegarde Redis des étapes

```typescript
// Structure du brouillon en Redis
{
  role: 'agent',
  step: 2,
  data: {
    first_name: 'Jean',
    last_name: 'Martin',
    company: 'AgenceXYZ',
    ifu: 'RB/XXXXX/2024'
  }
}

// Clé : onboarding:{userId}
// TTL : 86400 secondes (24h)
```

> **Avantage** : Si l'utilisateur ferme son navigateur au milieu du formulaire, ses données sont conservées 24h. Il peut reprendre au même point.

---

## Endpoint de finalisation

```
POST /user/profile
Authorization: Bearer {token}

Body:
  {
    first_name: "Jean",
    last_name: "Martin",
    preferred_zone: "Cotonou",
    ...
  }

Action backend :
  1. Valide les données
  2. Chiffre les données sensibles avec la clé dérivée du salt utilisateur
  3. Sauvegarde dans la table profiles
  4. Met users.is_profile_complete = true
  5. Supprime la clé Redis onboarding:{userId}
  6. Retourne le profil mis à jour
```

---

## Vue Frontend (`/onboarding`)

### Composant principal : `OnboardingView.vue`

```
┌──────────────────────────────────────────┐
│           BIENVENUE sur Immo BJ          │
│                                          │
│  ░░░░░░░░░░░░░░░░░░░░ ⬤⬤○○             │
│         Étape 2 sur 3                    │
│                                          │
│  [Champ 1]                              │
│  [Champ 2]                              │
│                                          │
│  [← Retour]    [Continuer →]            │
└──────────────────────────────────────────┘
```

### Caractéristiques UI
- Barre de progression visuelle
- Validation en temps réel (format IFU, budget...)
- Bouton "Continuer" désactivé tant que les champs obligatoires ne sont pas remplis
- Sauvegarde automatique à chaque passage d'étape
- Tooltips explicatifs pour les champs techniques (IFU, RCCM)

---

## Blocage d'accès si profil incomplet

Le router Vue intercepte automatiquement :
```typescript
// router/index.ts
if (user.is_profile_complete === false) {
  return next('/onboarding')
}
```

→ L'utilisateur **ne peut pas accéder** à l'espace personnel tant que l'onboarding n'est pas terminé.
