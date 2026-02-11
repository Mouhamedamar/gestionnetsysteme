# 👔 Rôle Commercial - Guide des Fonctionnalités

Ce document détaille toutes les fonctionnalités et permissions du rôle **Commercial** dans l'application.

## 📋 Vue d'ensemble

Le rôle **Commercial** est conçu pour gérer les aspects commerciaux de l'entreprise :
- **Gestion des clients** (création, modification, consultation)
- **Gestion des interventions** (consultation et suivi)
- **Gestion des devis** (création, modification, conversion en facture)
- **Gestion des factures** (création, modification, suivi des paiements)
- **Gestion des pro forma** (factures pro forma)

---

## 🎯 Accès et Permissions

### ✅ Ce que le Commercial PEUT faire :

#### 1. **Clients** ✅
- ✅ **Créer** de nouveaux clients
- ✅ **Modifier** les informations des clients existants
- ✅ **Supprimer** des clients
- ✅ **Consulter** la liste complète des clients
- ✅ **Rechercher** des clients par nom, email, téléphone
- ✅ **Voir** les détails complets d'un client

**Permissions backend :** `IsAdminOrTechnicienOrCommercial` (accès complet lecture/écriture)

#### 2. **Interventions** ✅
- ✅ **Consulter** toutes les interventions (pas seulement les siennes)
- ✅ **Voir** les détails complets de chaque intervention
- ✅ **Filtrer** les interventions par statut, priorité, technicien, client
- ✅ **Rechercher** des interventions
- ✅ **Assigner** un technicien à une intervention (si nécessaire)
- ✅ **Modifier** le statut d'une intervention
- ✅ **Suivre** l'avancement des interventions

**Permissions backend :** `IsAdminOrTechnicien` (accès complet pour les commerciaux)

#### 3. **Devis** ✅
- ✅ **Créer** de nouveaux devis
- ✅ **Modifier** des devis existants
- ✅ **Supprimer** des devis (soft delete)
- ✅ **Consulter** tous les devis
- ✅ **Convertir** un devis en facture
- ✅ **Changer** le statut d'un devis (Brouillon, Envoyé, Accepté, Refusé, etc.)
- ✅ **Générer** un PDF de devis
- ✅ **Exporter** les devis en CSV

**Permissions backend :** `IsAdminOrCommercial` ✅

#### 4. **Factures** ✅
- ✅ **Créer** de nouvelles factures
- ✅ **Modifier** des factures existantes
- ✅ **Annuler** une facture (avec restauration du stock)
- ✅ **Supprimer** des factures (soft delete)
- ✅ **Consulter** toutes les factures
- ✅ **Marquer** une facture comme payée/non payée
- ✅ **Générer** un PDF de facture
- ✅ **Ajouter/Retirer** des produits d'une facture

**Permissions backend :** `IsAdminOrCommercial` ✅

#### 5. **Pro Forma** ✅
- ✅ **Créer** des factures pro forma (via le module Factures avec is_proforma=True)
- ✅ **Consulter** les factures pro forma
- ✅ **Convertir** une pro forma en facture définitive

**Permissions backend :** `IsAdminOrCommercial` ✅ (utilise les mêmes permissions que les factures)

---

## 🚫 Ce que le Commercial NE PEUT PAS faire :

- ❌ **Gérer les produits** (réservé aux admins)
- ❌ **Gérer le stock** (réservé aux admins)
- ❌ **Gérer les mouvements de stock** (réservé aux admins)
- ❌ **Gérer les installations** (réservé aux admins et techniciens)
- ❌ **Gérer les utilisateurs** (réservé aux admins)
- ❌ **Gérer les dépenses** (réservé aux admins)
- ❌ **Accéder au dashboard admin** (dashboard commercial uniquement)

---

## 📊 Dashboard Commercial

Le dashboard commercial affiche :

### Statistiques principales :
- 📈 **Nombre total de clients**
- 📄 **Nombre total de devis** (avec nombre en attente)
- 💰 **Nombre total de factures** (avec nombre payées)
- 💵 **Chiffre d'affaires** (somme des factures payées)
- 📊 **Taux de conversion** (devis acceptés / total devis)

### Listes récentes :
- 📋 **5 derniers devis** créés
- 🧾 **5 dernières factures** émises
- 👥 **5 derniers clients** ajoutés

---

## 🎨 Menu Commercial

Le menu latéral (Sidebar) affiche pour les commerciaux :

1. **Tableau de Bord** - Dashboard avec statistiques
2. **Clients** - Gestion de la base clients
3. **Interventions** - Suivi des interventions
4. **Devis** - Gestion des devis
5. **Factures** - Gestion des factures
6. **Pro Forma** - Factures pro forma

---

## 🔧 Actions Disponibles par Module

### Module Clients

| Action | Description | Permission |
|--------|-------------|------------|
| Créer | Ajouter un nouveau client | ✅ Oui |
| Modifier | Modifier les informations d'un client | ✅ Oui |
| Supprimer | Supprimer un client | ✅ Oui |
| Consulter | Voir la liste et les détails | ✅ Oui |
| Rechercher | Rechercher par nom/email/téléphone | ✅ Oui |

### Module Interventions

| Action | Description | Permission |
|--------|-------------|------------|
| Consulter | Voir toutes les interventions | ✅ Oui |
| Filtrer | Filtrer par statut/priorité/technicien | ✅ Oui |
| Assigner | Assigner un technicien | ✅ Oui |
| Modifier statut | Changer le statut d'une intervention | ✅ Oui |
| Voir détails | Consulter les détails complets | ✅ Oui |

### Module Devis

| Action | Description | Permission |
|--------|-------------|------------|
| Créer | Créer un nouveau devis | ✅ Oui |
| Modifier | Modifier un devis existant | ✅ Oui |
| Supprimer | Supprimer un devis | ✅ Oui |
| Convertir | Convertir en facture | ✅ Oui |
| Générer PDF | Télécharger le devis en PDF | ✅ Oui |
| Exporter CSV | Exporter la liste en CSV | ✅ Oui |

### Module Factures

| Action | Description | Permission |
|--------|-------------|------------|
| Créer | Créer une nouvelle facture | ✅ Oui |
| Modifier | Modifier une facture | ✅ Oui |
| Annuler | Annuler une facture | ✅ Oui |
| Marquer payée | Marquer comme payée | ✅ Oui |
| Générer PDF | Télécharger la facture en PDF | ✅ Oui |
| Ajouter produits | Ajouter des produits à une facture | ✅ Oui |

---

## ✅ Permissions Backend

Toutes les permissions ont été configurées correctement :

1. **Devis (quotes)** :
   - Permission : `IsAdminOrCommercial` ✅
   - Fichier : `quotes/permissions.py`

2. **Factures (invoices)** :
   - Permission : `IsAdminOrCommercial` ✅
   - Fichier : `invoices/permissions.py`

3. **Pro Forma** :
   - Permission : `IsAdminOrCommercial` ✅ (utilise les mêmes permissions que les factures)

4. **Clients** :
   - Permission : `IsAdminOrTechnicienOrCommercial` ✅
   - Fichier : `accounts/permissions.py`

5. **Interventions** :
   - Permission : `IsAdminOrTechnicien` (inclut les commerciaux) ✅
   - Fichier : `interventions/permissions.py`

---

## 📝 Workflow Typique d'un Commercial

### 1. Gestion d'un nouveau client
```
1. Créer le client dans "Clients"
2. Créer un devis dans "Devis"
3. Envoyer le devis au client
4. Suivre le statut du devis
5. Si accepté → Convertir en facture
6. Suivre le paiement de la facture
```

### 2. Suivi d'une intervention
```
1. Consulter les interventions dans "Interventions"
2. Filtrer par client pour voir les interventions d'un client
3. Vérifier le statut et l'avancement
4. Assigner un technicien si nécessaire
5. Suivre jusqu'à la finalisation
```

### 3. Création d'une facture directe
```
1. Aller dans "Factures"
2. Créer une nouvelle facture
3. Sélectionner le client
4. Ajouter les produits
5. Générer et envoyer le PDF
```

---

## 🔐 Sécurité et Restrictions

- Les commerciaux **ne peuvent pas** modifier les données système (produits, stock, utilisateurs)
- Les commerciaux **peuvent** voir toutes les interventions (pas seulement les leurs)
- Les commerciaux **peuvent** gérer complètement les clients (contrairement aux techniciens)
- Les commerciaux **ont accès** aux statistiques commerciales uniquement

---

## 📚 Ressources Complémentaires

- [SYSTEME_ROLES.md](./SYSTEME_ROLES.md) - Documentation complète du système de rôles
- [FONCTIONNALITES.md](./FONCTIONNALITES.md) - Liste complète des fonctionnalités

---

**Dernière mise à jour :** Janvier 2026
