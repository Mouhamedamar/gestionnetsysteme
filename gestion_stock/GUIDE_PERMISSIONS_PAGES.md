# 🔐 Guide - Système de Permissions par Page

Ce document explique comment utiliser le système de permissions granulaires par page pour les utilisateurs.

## 📋 Vue d'ensemble

Le système permet aux **administrateurs** de définir des permissions personnalisées pour chaque utilisateur, en sélectionnant les pages auxquelles ils peuvent accéder.

## 🚀 Installation

### 1. Appliquer la migration

```bash
cd gestion_stock
python manage.py migrate accounts
```

Cette migration ajoute le champ `page_permissions` au modèle `UserProfile`.

### 2. Redémarrer les serveurs

```bash
# Backend
python manage.py runserver

# Frontend (dans un autre terminal)
cd frontend
npm run dev
```

## 🎯 Utilisation

### Pour l'Administrateur

1. **Accéder à la gestion des utilisateurs** :
   - Aller dans le menu "Utilisateurs"
   - Cliquer sur "Nouvel utilisateur" ou modifier un utilisateur existant

2. **Définir les permissions** :
   - Dans le formulaire, une section **"Permissions d'accès aux pages"** apparaît
   - Cocher les pages auxquelles l'utilisateur doit avoir accès
   - Les 12 pages disponibles sont :
     - Tableau de Bord (/)
     - Produits (/products)
     - Gestion Stock (/stock)
     - Mouvements Stock (/stock-movements)
     - Interventions (/interventions)
     - Installations (/installations)
     - Clients (/clients)
     - Devis (/quotes)
     - Factures (/invoices)
     - Pro Forma (/proforma-invoices)
     - Dépenses (/expenses)
     - Utilisateurs (/users)

3. **Comportement** :
   - Les pages par défaut du rôle sont **pré-cochées** et **ne peuvent pas être décochées** (affichées en gris, désactivées)
   - Les pages cochées **s'ajoutent** aux permissions par défaut (pas de remplacement)
   - L'admin peut **ajouter** des pages supplémentaires en cochant des pages non par défaut
   - L'admin peut **retirer** des pages supplémentaires en les décochant (mais pas les pages par défaut)
   - Si l'admin **ne coche aucune page supplémentaire** → L'utilisateur aura uniquement les permissions par défaut
   - Si l'admin **coche des pages supplémentaires** → L'utilisateur aura les permissions par défaut + les pages supplémentaires
   - **Exemple 1** : Un technicien avec "Devis" coché en plus → aura Tableau de Bord + Interventions (par défaut) + Devis = 3 pages
   - **Exemple 2** : Un technicien sans pages supplémentaires cochées → aura uniquement Tableau de Bord + Interventions (permissions par défaut)
   - **Exemple 3** : Un commercial avec "Devis" et "Factures" cochés → aura Clients + Interventions (par défaut) + Devis + Factures = 4 pages
   - **Exemple 4** : Si l'admin retire "Devis" d'un technicien qui l'avait → le technicien revient à Tableau de Bord + Interventions uniquement

## 🔧 Permissions par Défaut

### Admin
- Accès à **toutes les pages** (même avec des permissions personnalisées)

### Technicien
- Tableau de Bord (/)
- Interventions (/interventions)

### Commercial
- Clients (/clients)
- Interventions (/interventions)

## ⚠️ Dépannage

### Problème : La migration ne s'applique pas

**Solution :**
```bash
cd gestion_stock
python manage.py makemigrations accounts
python manage.py migrate accounts
```

### Problème : Les permissions ne s'affichent pas dans le formulaire

**Vérifications :**
1. Vérifier que la migration a été appliquée : `python manage.py showmigrations accounts`
2. Vérifier que le serveur backend a été redémarré
3. Vérifier la console du navigateur pour les erreurs JavaScript

### Problème : Le menu ne filtre pas selon les permissions

**Vérifications :**
1. Vérifier que l'utilisateur s'est déconnecté et reconnecté après la modification des permissions
2. Vérifier que les permissions sont bien stockées dans la base de données :
   ```python
   from accounts.models import UserProfile
   user = User.objects.get(username='nom_utilisateur')
   print(user.profile.page_permissions)
   ```
3. Vérifier le localStorage : `localStorage.getItem('user')` dans la console du navigateur

### Problème : Erreur "JSONField not supported"

**Solution :**
- Vérifier la version de Django (doit être >= 3.1 pour SQLite)
- Si version antérieure, mettre à jour Django ou utiliser PostgreSQL

## 📝 Exemples

### Exemple 1 : Utilisateur avec accès supplémentaire

Un utilisateur avec le rôle "commercial" qui doit aussi accéder aux devis :
- Pages par défaut (pré-cochées, non modifiables) : Clients, Interventions
- Cocher en plus : Devis
- Résultat : Menu affiche **Clients + Interventions (par défaut) + Devis (ajouté)** = 3 pages au total

### Exemple 2 : Utilisateur avec permissions par défaut uniquement

Un utilisateur avec le rôle "technicien" sans pages supplémentaires :
- Pages par défaut (pré-cochées, non modifiables) : Tableau de Bord, Interventions
- Ne rien cocher de plus
- Résultat : Menu affiche **Tableau de Bord + Interventions** (permissions par défaut uniquement)

### Exemple 3 : Technicien avec plusieurs pages supplémentaires

Un technicien qui doit aussi accéder aux clients et aux devis :
- Pages par défaut (pré-cochées, non modifiables) : Tableau de Bord, Interventions
- Cocher en plus : Clients, Devis
- Résultat : Menu affiche **Tableau de Bord + Interventions (par défaut) + Clients + Devis (ajoutés)** = 4 pages au total

### Exemple 4 : Admin avec permissions personnalisées

Un admin avec des permissions personnalisées :
- Les admins ont toujours accès à **toutes les pages** (même avec des permissions personnalisées)
- Les permissions personnalisées n'ont pas d'effet pour les admins

## 🔍 Vérification dans la Base de Données

```python
from django.contrib.auth.models import User
from accounts.models import UserProfile

# Vérifier les permissions d'un utilisateur
user = User.objects.get(username='nom_utilisateur')
profile = user.profile
print(f"Rôle: {profile.role}")
print(f"Permissions: {profile.page_permissions}")

# Tester l'accès à une page
has_access = profile.has_page_permission('/clients')
print(f"Accès à /clients: {has_access}")
```

## 📚 Structure Technique

### Backend
- **Modèle** : `UserProfile.page_permissions` (JSONField)
- **Serializer** : `UserSerializer` gère `page_permissions`
- **Vue** : `login()` inclut les permissions dans la réponse

### Frontend
- **Formulaire** : `UserForm.jsx` avec checkboxes pour chaque page
- **Menu** : `Sidebar.jsx` filtre selon les permissions
- **Context** : `AppContext.jsx` stocke les permissions dans l'état utilisateur

---

**Dernière mise à jour :** Janvier 2026
