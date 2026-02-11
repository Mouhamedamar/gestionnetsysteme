# 🎭 Système de Rôles Utilisateurs

Ce document explique comment utiliser le système de rôles dans l'application.

## 📋 Rôles Disponibles

L'application supporte 3 types de rôles :

1. **Admin** : Accès complet à toutes les fonctionnalités
2. **Technicien** : Accès uniquement au tableau de bord et aux interventions
3. **Commercial** : Accès uniquement aux clients et interventions

## 🔧 Configuration Initiale

### 1. Appliquer les Migrations

```bash
cd gestion_stock
python manage.py migrate accounts
```

### 2. Assigner les Rôles aux Utilisateurs

#### Option A : Mode Automatique (Recommandé)

Assigner automatiquement les rôles selon `is_staff` :
- `is_staff=True` → Rôle **admin**
- `is_staff=False` → Rôle **commercial**

```bash
python manage.py assign_roles --auto
```

#### Option B : Assigner un Rôle Spécifique

Assigner un rôle à un utilisateur spécifique :

```bash
# Assigner le rôle admin
python manage.py assign_roles --username admin --role admin

# Assigner le rôle technicien
python manage.py assign_roles --username technicien1 --role technicien

# Assigner le rôle commercial
python manage.py assign_roles --username commercial1 --role commercial
```

#### Option C : Via l'Interface Django Admin

1. Accéder à `/admin/`
2. Aller dans **Users** → Sélectionner un utilisateur
3. Dans la section **Profil**, choisir le rôle approprié
4. Sauvegarder

## 🎨 Dashboards par Rôle

### Dashboard Admin
- Statistiques complètes (produits, stock, factures, utilisateurs, clients)
- Accès à tous les modules

### Dashboard Technicien
- Statistiques des interventions
- Liste des prochaines interventions

### Dashboard Commercial
- Statistiques des clients, interventions, devis et factures
- Liste des devis récents
- Liste des factures récentes
- Liste des clients récents
- Liste des interventions récentes

## 📱 Menus par Rôle

### Menu Admin
- Tableau de Bord
- Produits
- Gestion Stock
- Mouvements Stock
- Interventions
- Installations
- Clients
- Devis
- Factures
- Pro Forma
- Dépenses
- Utilisateurs

### Menu Technicien
- Tableau de Bord
- Interventions

### Menu Commercial
- Clients
- Interventions

## 🔐 Authentification

Lors de la connexion, le système :
1. Vérifie les identifiants
2. Récupère ou crée le profil utilisateur
3. Retourne le rôle dans la réponse JSON
4. Redirige vers le dashboard approprié

## 📝 Notes Techniques

- Le modèle `UserProfile` est lié à `User` via une relation OneToOne
- Si un utilisateur n'a pas de profil, un profil avec le rôle `commercial` est créé automatiquement
- Les utilisateurs avec `is_staff=True` sont automatiquement promus `admin` lors de la connexion
- Le rôle est stocké dans `localStorage` côté frontend pour la persistance de session

## 🛠️ Dépannage

### Problème : L'utilisateur n'a pas de rôle

**Solution :**
```bash
python manage.py assign_roles --username <username> --role <role>
```

### Problème : Le dashboard ne correspond pas au rôle

**Vérifications :**
1. Vérifier que le profil existe : `User.objects.get(username='...').profile`
2. Vérifier le rôle : `User.objects.get(username='...').profile.role`
3. Vérifier le localStorage côté frontend : `localStorage.getItem('user')`

### Problème : Les menus ne s'affichent pas correctement

**Solution :**
1. Vérifier que `Sidebar.jsx` utilise bien `useApp()` pour récupérer `user`
2. Vérifier que le rôle est bien retourné par l'API de login
3. Redémarrer le serveur frontend si nécessaire

## 📚 Exemples d'Utilisation

### Créer un nouvel utilisateur avec un rôle

```python
from django.contrib.auth.models import User
from accounts.models import UserProfile

# Créer l'utilisateur
user = User.objects.create_user(
    username='nouveau_technicien',
    email='tech@example.com',
    password='motdepasse123'
)

# Créer le profil avec le rôle
UserProfile.objects.create(
    user=user,
    role='technicien',
    phone='+221 77 123 45 67'
)
```

### Modifier le rôle d'un utilisateur existant

```python
from django.contrib.auth.models import User

user = User.objects.get(username='commercial1')
user.profile.role = 'commercial'
user.profile.save()
```

### Lister tous les utilisateurs avec leurs rôles

```python
from django.contrib.auth.models import User

for user in User.objects.all():
    role = user.profile.role if hasattr(user, 'profile') else 'Aucun profil'
    print(f"{user.username}: {role}")
```
