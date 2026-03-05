# 🇧🇯 Cadre Légal et Réglementation Immobilière - Bénin

**Date de dernière révision :** Février 2026
**Lois de référence principales :** 
- Loi N° 2022-30 du 30 décembre 2022 (Régime juridique du bail à usage d'habitation)
- Loi N° 2018-12 modifiée (Agent immobilier)
- Code Général des Impôts du Bénin en vigueur (Fiscalité, IFU, IRF)

> **Objectif de ce document :** 
> Fournir une base de connaissances claire à tout développeur, IA ou administrateur travaillant sur la plateforme afin de s'assurer que les flux métiers (KYC, contrats, facturation) respectent scrupuleusement le cadre légal béninois. Ce fichier doit évoluer au fil des nouvelles lois (ajoutez les modifications avec leurs dates pour ne pas perdre l'historique).

---

## 1. Obligations du Propriétaire (Bailleur privé)

Le Propriétaire est défini comme la personne physique ou morale qui possède le bien et le met en location (Bailleur).

### A. L'Identifiant Fiscal Unique (IFU) : OBLIGATOIRE
Tout propriétaire percevant des loyers au Bénin a pour obligation d'avoir un IFU.
- **Raison fiscale :** Déclaration de l'Impôt sur les Revenus Fonciers (IRF).
- **Taux de l'IRF :** Fixé à un taux unique de **12 %** sur le montant brut des loyers perçus (depuis janvier 2022, réforme pour harmonisation UEMOA).
- **Impact Plateforme :** Récupérer l'IFU du propriétaire (même optionnel à l'inscription) est stratégique pour lui permettre de générer via l'application des quittances de loyer formelles et conformes, exigées par les services fiscaux ou les locataires "entreprises".

### B. Le Registre du Commerce et du Crédit Mobilier (RCCM) : NON REQUIS (Sauf SCI)
- **Principe :** Louer son propre bien à usage d'habitation est un acte *civil*, non commercial. Un propriétaire particulier n'est pas un commerçant.
- **Impact Plateforme :** Ne pas exiger ni afficher le champ "RCCM" pour un compte de rôle "Propriétaire", pour ne pas créer de confusion. Ce champ ne s'applique que s'il déclare explicitement agir en tant que "Société Immobilière" commerciale.

---

## 2. Obligations de l'Agent Immobilier / Agence (Profession Réglementée)

L'Agent immobilier joue l'intermédiaire ou le gestionnaire pour le compte du propriétaire. Au Bénin, c'est une activité strictement encadrée pour protéger les populations.

### A. KYC & Immatriculations : STRICTEMENT OBLIGATOIRES
- **RCCM :** Obligatoire (l'agent fait des actes de commerce).
- **IFU :** Obligatoire (pour sa propre fiscalité d'entreprise).
- **Carte Professionnelle :** Délivrée par l'ACSIM / Ministère en charge de l'Habitat, soumise à assurance professionnelle.
- **Impact Plateforme :** Le formulaire d'Onboarding de l'Agent doit proposer/exiger : Nom de l'Agence, IFU, et RCCM. À terme, une vérification de la carte professionnelle devra être implémentée pour attribuer un badge "Agent Certifié".

### B. Plafonds des Commissions (Règles Métier)
Ta plateforme doit veiller à empêcher (ou alerter) les abus de facturation via le système :
- **Frais d'agence (mise en relation / recherche locataire) :** La loi plafonne la commission de l'agent à **50 % maximum d'un (1) mois de loyer**.
- **Frais de gestion locative :** L'agent qui encaisse les loyers mensuels pour le bailleur ne peut pas prélever une commission supérieure à **10 % du loyer mensuel**.

---

## 3. Le Contrat de Bail et la Relation Locataire (Loi de 2022)

La Loi N° 2022-30 sécurise fortement le locataire (Preneur) :

- **Écrit Obligatoire :** Le bail verbal est proscrit. 
  - *Dev Plateforme :* Prévoir un générateur de contrat PDF basé sur le modèle officiel de l'État.
- **Dépôt de Garantie (Caution) :** Plafonné légalement à **trois (03) mois de loyer maximum**.
  - *Dev Plateforme :* Bloquer le champ "Caution demandée" si la saisie dépasse 3 fois le prix du loyer mensuel renseigné pour le bien, ou avertir le propriétaire qu'il viole la loi en vigueur.
- **État des lieux :** Acte contradictoire obligatoire à l'entrée et à la sortie.
  - *Dev Plateforme :* Module pour remplir l'état des lieux en ligne avec prise de photos géolocalisées et signées électroniquement.
- **Interdiction de Discrimination :** Sexe, ethnie, religion.
- **Avis de Congé (Expulsion) :** Très encadré. Un locataire payant son loyer ne peut être mis dehors sur simple décision arbitraire du jour au lendemain. Droit quasi absolu à la jouissance paisible.

## 4. Gestion des Impayés et Expulsion (Loi 2022-30)

En cas de défaut de paiement, la procédure doit suivre des étapes strictes sous peine de nullité :

### A. La Résiliation de Plein Droit
- **Clause Contractuelle** : Les contrats générés par la plateforme doivent inclure une "clause de résiliation de plein droit" pour inexécution des obligations financières.
- **Délai d'Impayé** : La loi ne fixe pas un nombre strict de mois, mais dès le premier terme échu et non payé, le bailleur peut agir. Cependant, l'usage veut qu'on attende la fin de la période couverte par la caution (3 mois) si on souhaite être conciliant.

### B. Procédure d'Expulsion
1. **Mise en Demeure** : Envoi d'une mise en demeure par lettre recommandée avec AR ou par exploit d'Huissier de Justice.
2. **Constat par Huissier** : Si le locataire ne régularise pas, un Huissier doit constater le manquement.
3. **Saisine du Juge** : Le Président du tribunal compétent (référé) peut alors ordonner l'expulsion. 
4. **Délai d'Ordonnance** : La loi prévoit que le juge statue dans les **30 jours** suivant la saisine.
5. **Execution** : Seul l'Huissier de Justice peut procéder à l'expulsion physique, assisté le cas échéant par la force publique.

> **Impact Plateforme** : 
> L'application doit permettre au bailleur d'exporter un "Historique certifié des paiements" (Logs de la Tirelire) pour servir de preuve matérielle devant l'huissier et le juge.

### C. L'Huissier de Justice et la Plateforme (Vision Digitale)
Un Huissier de Justice au Bénin est un **Officier Ministériel** exerçant une profession libérale. Il peut travailler seul ou au sein d'une **SCP (Société Civile Professionnelle)**, qui s'apparente à une entreprise d'experts juridiques.

**Vision pour Immo Bénin :**
1. **Rôle "Partenaire Juridique"** : À maturité, la plateforme pourra accueillir des comptes de type `HUISSIER` (vérifiés par l'Ordre des Huissiers).
2. **Transmission Digitale du Dossier** : En un clic, le bailleur peut transmettre son dossier (Bail signé via OTP + Historique des impayés certifié) au partenaire pour lancer la mise en demeure.
3. **Bras de Fer Légal** : La plateforme ne fait pas de justice privée, elle **facilite et accélère** l'action de l'Huissier en lui fournissant des preuves numériques irréfutables (Blockchain/Audit Logs).

## 5. Validation Technique des Identifiants (IFU / RCCM)

Pour éviter que les utilisateurs saisissent de fausses informations sur la plateforme, il est possible et tout à fait **légal** d'implémenter des vérifications automatiques.

### A. Format et Algorithme (Validation Regex Front/Back)
- **L'IFU (Identifiant Fiscal Unique)** :
  - **Structure :** Il est composé **strictement de treize (13) chiffres** au Bénin.
  - **Regex d'implémentation :** `^\d{13}$`
- **Le RCCM (Registre du Commerce)** :
  - **Structure :** Il suit un format précis : `Code Pays / Ville / Année / Forme Juridique / Numéro`.
    - Exemple : `RB/COT/25 A 111231` (Bénin / Cotonou / 2025 / Type A / Numéro)
    - Exemple : `RB/ABOMEY/05 B 0036`
  - **Regex d'implémentation :** `^RB\/[A-Z]{3,}\/\d{2}\s*[A-Z]\s*\d+$` (version tolérante à ajuster).

### B. Vérification Externe (API Gouvernementales)
Peut-on vérifier si l'IFU appartient bien à la bonne personne en temps réel ?
- **IFU :** **OUI.** La Direction Générale des Impôts (DGI) dispose d'une API Rest (`backend.impots.bj:8443`). Cependant, elle est protégée. Il faut faire une demande officielle auprès de la DGI ou de l'ASSI pour obtenir les accès (Bearer JWT + API Key). Le grand public peut vérifier manuellement sur `ifu.impots.bj`.
- **RCCM :** **OUI.** L'existence de la société peut être vérifiée manuellement via la plateforme nationale "AHILIDO" (`ahilido.bj`) ou `service-public.bj`.

> **Bonne pratique pour la phase de lancement :**
> Mettre en place la vérification **Regex stricte** (Format 13 chiffres et masque RCCM) lors de l'onboarding. Créer un statut "KYC_PENDING" côté backend. L'Administrateur effectuera ensuite la vérification finale (manuelle) sur les portails de l'État avant de passer le compte en "KYC_VERIFIED".

---

## Historique des révisions du document
- **27 Février 2026 :** Création du document initial suite à l'analyse de la législation en vigueur relative aux rôles "Locataire", "Propriétaire", et "Agent", et à la fiscalité des baux (IRF 12%, IFU/RCCM).
