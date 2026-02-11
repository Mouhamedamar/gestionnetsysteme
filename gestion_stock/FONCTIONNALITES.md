# 📚 Guide Complet des Fonctionnalités - Backend Gestion de Stock

Ce document explique en détail toutes les fonctionnalités de votre backend Django REST Framework.

---

## 🏗️ Architecture Générale

Votre backend est structuré en **4 applications principales** :

1. **`accounts`** - Authentification et gestion des utilisateurs
2. **`products`** - Gestion des produits
3. **`stock`** - Mouvements de stock (entrées/sorties)
4. **`invoices`** - Facturation et gestion des ventes

Chaque application contient :
- **`models.py`** - Structure des données (base de données)
- **`serializers.py`** - Conversion données ↔ JSON
- **`views.py`** - Logique métier et endpoints API
- **`urls.py`** - Routes et URLs
- **`admin.py`** - Interface d'administration Django

---

## 1️⃣ AUTHENTIFICATION (accounts)

### 🎯 Objectif
Sécuriser l'accès à l'API avec des tokens JWT. Seuls les administrateurs peuvent accéder.

### 🔐 Fonctionnalités

#### **Connexion (`POST /api/auth/login/`)**

**Comment ça marche :**
1. L'utilisateur envoie son `username` et `password`
2. Le backend vérifie les identifiants
3. Si correct ET que l'utilisateur est admin (`is_staff=True`), un token JWT est généré
4. Le backend retourne :
   - `access_token` : valide 1 heure
   - `refresh_token` : valide 7 jours
   - Informations de l'utilisateur

**Exemple de requête :**
```json
POST /api/auth/login/
{
  "username": "admin",
  "password": "motdepasse123"
}
```

**Réponse :**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

#### **Utilisation du Token**

Pour toutes les autres requêtes, vous devez inclure le token dans le header :
```
Authorization: Bearer <access_token>
```

#### **Rafraîchir le Token (`POST /api/auth/token/refresh/`)**

Quand le `access_token` expire (après 1 heure), utilisez le `refresh_token` pour en obtenir un nouveau.

**Exemple :**
```json
POST /api/auth/token/refresh/
{
  "refresh": "votre_refresh_token"
}
```

#### **Déconnexion (`POST /api/auth/logout/`)**

Blackliste le `refresh_token` pour qu'il ne puisse plus être utilisé.

---

## 2️⃣ PRODUITS (products)

### 🎯 Objectif
Gérer le catalogue de produits : créer, modifier, supprimer, rechercher des produits avec leurs informations (prix, stock, photos, etc.).

### 📦 Modèle Product

Chaque produit contient :

| Champ | Type | Description |
|-------|------|-------------|
| `name` | String | Nom du produit |
| `description` | Text | Description détaillée |
| `category` | String | Catégorie (ex: "Informatique", "Mobilier") |
| `quantity` | Integer | Quantité en stock |
| `purchase_price` | Decimal | Prix d'achat (coût) |
| `sale_price` | Decimal | Prix de vente |
| `alert_threshold` | Integer | Seuil d'alerte (ex: si stock ≤ 10) |
| `photo` | Image | Photo du produit |
| `is_active` | Boolean | Produit actif/inactif |
| `created_at` | DateTime | Date de création |
| `updated_at` | DateTime | Dernière modification |
| `deleted_at` | DateTime | Date de suppression (soft delete) |

### 🔧 Fonctionnalités

#### **1. Lister les Produits (`GET /api/products/`)**

**Fonctionnalités incluses :**
- ✅ **Pagination** : 20 produits par page
- ✅ **Recherche** : Par nom, catégorie, description
- ✅ **Filtres** : Par catégorie, statut actif
- ✅ **Tri** : Par nom, prix, quantité, date
- ✅ **Filtre stock faible** : `?low_stock=true`

**Exemple :**
```
GET /api/products/?category=Informatique&search=laptop&ordering=-created_at&page=1
```

**Réponse :**
```json
{
  "count": 150,
  "next": "http://localhost:8000/api/products/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Ordinateur Portable",
      "category": "Informatique",
      "quantity": 50,
      "sale_price": "1200.00",
      "is_low_stock": false,
      "photo_url": "http://localhost:8000/media/products/laptop.jpg"
    }
  ]
}
```

#### **2. Créer un Produit (`POST /api/products/`)**

**Étapes :**
1. Envoyer les données (JSON ou FormData si avec image)
2. Le backend valide les données :
   - Prix de vente ≥ prix d'achat
   - Quantité ≥ 0
   - Tous les champs requis présents
3. Si valide, le produit est créé
4. Retourne le produit créé avec son ID

**Exemple :**
```json
POST /api/products/
Content-Type: multipart/form-data

{
  "name": "Ordinateur Portable",
  "description": "Laptop haute performance",
  "category": "Informatique",
  "quantity": 50,
  "purchase_price": 800.00,
  "sale_price": 1200.00,
  "alert_threshold": 10,
  "photo": <fichier_image>,
  "is_active": true
}
```

#### **3. Modifier un Produit (`PUT/PATCH /api/products/{id}/`)**

- `PUT` : Remplace toutes les données
- `PATCH` : Modifie seulement les champs fournis

**Validation automatique :**
- Vérifie que le prix de vente reste ≥ prix d'achat
- Met à jour `updated_at` automatiquement

#### **4. Produits en Rupture (`GET /api/products/low_stock/`)**

Retourne tous les produits où `quantity ≤ alert_threshold`.

**Utilité :** Alerte visuelle pour réapprovisionner.

#### **5. Soft Delete (`POST /api/products/{id}/soft_delete/`)**

**Comment ça marche :**
1. Ne supprime PAS vraiment le produit de la base
2. Met `deleted_at` = date actuelle
3. Met `is_active` = false
4. Le produit n'apparaît plus dans les listes normales

**Avantage :** 
- Conserve l'historique
- Peut être restauré plus tard
- Les factures existantes restent valides

#### **6. Restaurer un Produit (`POST /api/products/{id}/restore/`)**

Annule un soft delete :
- Remet `deleted_at` = null
- Remet `is_active` = true

---

## 3️⃣ MOUVEMENTS DE STOCK (stock)

### 🎯 Objectif
Gérer les entrées et sorties de stock. Chaque mouvement met automatiquement à jour la quantité du produit.

### 📊 Modèle StockMovement

| Champ | Type | Description |
|-------|------|-------------|
| `product` | ForeignKey | Produit concerné |
| `movement_type` | Choice | `ENTREE` ou `SORTIE` |
| `quantity` | Integer | Quantité (toujours > 0) |
| `date` | DateTime | Date du mouvement |
| `comment` | Text | Commentaire (ex: "Réapprovisionnement") |
| `created_at` | DateTime | Date de création |
| `deleted_at` | DateTime | Date de suppression (soft delete) |

### 🔧 Fonctionnalités

#### **1. Créer une Entrée de Stock (`POST /api/stock-movements/`)**

**Comment ça marche :**
1. Vous créez un mouvement avec `movement_type: "ENTREE"`
2. Le backend **augmente automatiquement** la quantité du produit
3. Le mouvement est enregistré

**Exemple :**
```json
POST /api/stock-movements/
{
  "product": 1,
  "movement_type": "ENTREE",
  "quantity": 20,
  "comment": "Réapprovisionnement fournisseur"
}
```

**Résultat :**
- Si le produit avait 50 unités → maintenant 70 unités
- Un mouvement est créé dans l'historique

#### **2. Créer une Sortie de Stock (`POST /api/stock-movements/`)**

**Comment ça marche :**
1. Vous créez un mouvement avec `movement_type: "SORTIE"`
2. Le backend **vérifie d'abord** si le stock est suffisant
3. Si oui : diminue la quantité et enregistre le mouvement
4. Si non : retourne une erreur

**Exemple :**
```json
POST /api/stock-movements/
{
  "product": 1,
  "movement_type": "SORTIE",
  "quantity": 5,
  "comment": "Vente directe"
}
```

**Validation :**
- ❌ Si stock disponible = 3 et vous demandez 5 → **Erreur**
- ✅ Si stock disponible = 10 et vous demandez 5 → **Succès** (stock devient 5)

#### **3. Supprimer un Mouvement (`DELETE /api/stock-movements/{id}/`)**

**Fonctionnalité spéciale : Rollback automatique**

Quand vous supprimez un mouvement :
1. Le mouvement est soft deleted
2. **Le stock est automatiquement restauré** :
   - Si c'était une ENTREE → la quantité diminue
   - Si c'était une SORTIE → la quantité augmente

**Exemple :**
- Produit a 50 unités
- Vous créez une SORTIE de 10 → stock devient 40
- Vous supprimez cette SORTIE → stock redevient 50 automatiquement

**Utilité :** Corriger des erreurs sans avoir à créer manuellement un mouvement inverse.

#### **4. Historique des Mouvements**

Vous pouvez voir tous les mouvements d'un produit :
```
GET /api/stock-movements/?product=1
```

---

## 4️⃣ FACTURATION (invoices)

### 🎯 Objectif
Créer des factures de vente avec plusieurs produits, calculer automatiquement les totaux, et gérer le stock automatiquement.

### 🧾 Modèle Invoice

| Champ | Type | Description |
|-------|------|-------------|
| `invoice_number` | String | Numéro unique (auto-généré) |
| `date` | DateTime | Date de la facture |
| `client_name` | String | Nom du client (optionnel) |
| `total_ht` | Decimal | Total Hors Taxes (calculé) |
| `total_ttc` | Decimal | Total TTC (calculé, TVA 20%) |
| `status` | Choice | `PAYE` ou `NON_PAYE` |
| `is_cancelled` | Boolean | Facture annulée |
| `created_at` | DateTime | Date de création |
| `deleted_at` | DateTime | Date de suppression |

### 📋 Modèle InvoiceItem

Chaque facture contient plusieurs items (lignes) :

| Champ | Type | Description |
|-------|------|-------------|
| `invoice` | ForeignKey | Facture parente |
| `product` | ForeignKey | Produit vendu |
| `quantity` | Integer | Quantité vendue |
| `unit_price` | Decimal | Prix unitaire |
| `subtotal` | Decimal | Calculé automatiquement (quantity × unit_price) |

### 🔧 Fonctionnalités

#### **1. Créer une Facture (`POST /api/invoices/`)**

**Processus complet :**

1. **Vous envoyez** :
   ```json
   {
     "client_name": "Jean Dupont",
     "status": "NON_PAYE",
     "items": [
       {
         "product": 1,
         "quantity": 2,
         "unit_price": 1200.00
       },
       {
         "product": 2,
         "quantity": 1,
         "unit_price": 500.00
       }
     ]
   }
   ```

2. **Le backend fait automatiquement :**
   - ✅ Génère un numéro unique : `INV-20241215-ABC12345`
   - ✅ Vérifie le stock pour chaque produit
   - ✅ Crée les items de facture
   - ✅ Calcule `subtotal` pour chaque item
   - ✅ Calcule `total_ht` = somme des subtotals
   - ✅ Calcule `total_ttc` = total_ht × 1.20 (TVA 20%)
   - ✅ Crée des SORTIES de stock automatiquement pour chaque item
   - ✅ Met à jour les quantités des produits

3. **Résultat :**
   - Facture créée avec numéro unique
   - Stock diminué automatiquement
   - Totaux calculés

**Validation importante :**
- ❌ Si un produit n'a pas assez de stock → **Erreur**, la facture n'est PAS créée
- ✅ Si tous les produits ont assez de stock → **Succès**

#### **2. Calculs Automatiques**

Les totaux sont **toujours calculés automatiquement** :

- `subtotal` (par item) = `quantity × unit_price`
- `total_ht` (facture) = somme de tous les subtotals
- `total_ttc` (facture) = `total_ht × 1.20`

**Mise à jour automatique :**
- Si vous ajoutez un item → totaux recalculés
- Si vous modifiez un item → totaux recalculés
- Si vous supprimez un item → totaux recalculés

#### **3. Ajouter un Item à une Facture (`POST /api/invoices/{id}/items/`)**

**Processus :**
1. Vérifie le stock disponible
2. Crée l'item
3. Recalcule les totaux
4. Crée automatiquement une SORTIE de stock

#### **4. Supprimer un Item (`DELETE /api/invoices/{id}/items/`)**

**Processus :**
1. Restaure le stock (ajoute la quantité au produit)
2. Supprime l'item (soft delete)
3. Recalcule les totaux

#### **5. Annuler une Facture (`POST /api/invoices/{id}/cancel/`)**

**Fonctionnalité importante : Rollback complet**

Quand vous annulez une facture :
1. Pour chaque item de la facture :
   - Restaure le stock (ajoute la quantité au produit)
2. Met `is_cancelled = true`
3. Met `status = NON_PAYE`

**Utilité :** Annuler une vente et remettre les produits en stock.

**Exemple :**
- Facture avec 2 produits (quantités : 5 et 3)
- Stock avant : Produit A = 10, Produit B = 8
- Après facture : Produit A = 5, Produit B = 5
- Après annulation : Produit A = 10, Produit B = 8 (restauré)

#### **6. Restaurer une Facture Annulée (`POST /api/invoices/{id}/restore/`)**

Annule l'annulation :
1. Vérifie que le stock est suffisant
2. Réapplique les sorties de stock
3. Met `is_cancelled = false`

**Validation :** Si le stock n'est plus suffisant, retourne une erreur.

#### **7. Numéro de Facture Auto-Généré**

Format : `INV-YYYYMMDD-UUID`

Exemple : `INV-20241215-A1B2C3D4`

- `INV` : Préfixe
- `20241215` : Date (année-mois-jour)
- `A1B2C3D4` : Identifiant unique (8 caractères)

**Garantie :** Chaque facture a un numéro unique.

---

## 5️⃣ TABLEAU DE BORD (dashboard)

### 🎯 Objectif
Fournir des statistiques et données pour afficher des graphiques et indicateurs.

### 📊 Endpoint : Statistiques (`GET /api/dashboard/stats/`)

**Retourne :**

```json
{
  "total_products": 150,           // Nombre total de produits actifs
  "low_stock_products": 12,        // Produits en rupture de stock
  "stock_value": 45000.50,         // Valeur totale du stock (quantité × prix d'achat)
  "total_invoices": 234,           // Nombre total de factures
  "revenue": 125000.75,            // Chiffre d'affaires (factures payées uniquement)
  "recent_invoices": [...]         // 5 dernières factures
}
```

**Calculs :**
- `stock_value` = Σ (quantité × prix d'achat) pour tous les produits actifs
- `revenue` = Σ (total_ttc) pour toutes les factures payées et non annulées
- `low_stock_products` = produits où quantité ≤ seuil d'alerte

### 📈 Endpoint : Graphiques (`GET /api/dashboard/charts/`)

**Retourne :**

```json
{
  "monthly_revenue": [              // Chiffre d'affaires par mois (6 derniers mois)
    {"month": "2024-01", "total": 15000.00},
    {"month": "2024-02", "total": 18000.00}
  ],
  "top_products": [...]             // Top 5 produits les plus vendus
}
```

---

## 6️⃣ SÉCURITÉ ET PERMISSIONS

### 🔒 Système de Permissions

**Règle principale :** Seuls les utilisateurs avec `is_staff=True` peuvent accéder à l'API.

**Implémentation :**
- Permission personnalisée : `IsAdminUser`
- Vérifie que l'utilisateur est authentifié ET est staff
- Appliquée à tous les endpoints (sauf login/logout)

### 🛡️ Validations

**Côté serveur :**
- ✅ Validation des données (types, formats)
- ✅ Vérification du stock avant sortie/facture
- ✅ Vérification prix de vente ≥ prix d'achat
- ✅ Gestion des erreurs avec messages clairs

### 🗑️ Soft Delete

**Principe :** Aucune suppression définitive.

**Avantages :**
- Conserve l'historique
- Permet de restaurer
- Intégrité des données (factures restent valides)

**Implémentation :**
- Champ `deleted_at` sur tous les modèles
- Filtrage automatique dans les requêtes
- Méthodes `soft_delete()` et `restore()`

---

## 7️⃣ GESTION DES IMAGES

### 📸 Upload d'Images Produits

**Comment ça marche :**
1. Utilisez `multipart/form-data` pour envoyer l'image
2. L'image est sauvegardée dans `media/products/`
3. L'URL complète est retournée dans `photo_url`

**Exemple :**
```
POST /api/products/
Content-Type: multipart/form-data

photo: <fichier_image.jpg>
name: "Produit avec photo"
...
```

**Réponse :**
```json
{
  "id": 1,
  "name": "Produit avec photo",
  "photo_url": "http://localhost:8000/media/products/image.jpg"
}
```

---

## 8️⃣ PAGINATION ET RECHERCHE

### 📄 Pagination

**Par défaut :** 20 éléments par page

**Réponse :**
```json
{
  "count": 150,                    // Total d'éléments
  "next": "http://...?page=2",    // URL page suivante
  "previous": null,                // URL page précédente
  "results": [...]                 // Données de la page
}
```

### 🔍 Recherche

**Disponible sur :**
- Produits : recherche par nom, catégorie, description
- Factures : recherche par numéro, nom client
- Mouvements : recherche par nom produit, commentaire

**Utilisation :**
```
GET /api/products/?search=laptop
```

### 🔽 Tri

**Disponible sur tous les endpoints de liste**

**Exemple :**
```
GET /api/products/?ordering=-created_at    // Plus récents en premier
GET /api/products/?ordering=name          // Par nom (A-Z)
GET /api/products/?ordering=-sale_price  // Plus chers en premier
```

---

## 9️⃣ FLUX COMPLET D'UTILISATION

### Scénario : Vendre des Produits

**Étape 1 : Créer des Produits**
```
POST /api/products/ → Créer "Ordinateur" (stock: 50)
POST /api/products/ → Créer "Souris" (stock: 100)
```

**Étape 2 : Réapprovisionner**
```
POST /api/stock-movements/ → ENTREE de 20 ordinateurs
→ Stock ordinateur devient 70
```

**Étape 3 : Créer une Facture**
```
POST /api/invoices/
{
  "items": [
    {"product": 1, "quantity": 2, "unit_price": 1200},
    {"product": 2, "quantity": 3, "unit_price": 25}
  ]
}
→ Stock ordinateur devient 68
→ Stock souris devient 97
→ Facture créée avec totaux calculés
```

**Étape 4 : Marquer comme Payé**
```
PATCH /api/invoices/1/
{"status": "PAYE"}
```

**Étape 5 : Voir les Statistiques**
```
GET /api/dashboard/stats/
→ Voir le chiffre d'affaires, stock, etc.
```

---

## 🎯 RÉSUMÉ DES FONCTIONNALITÉS CLÉS

✅ **Authentification JWT** - Sécurisé, tokens avec expiration
✅ **CRUD Complet** - Créer, lire, modifier, supprimer sur tous les modèles
✅ **Gestion Automatique du Stock** - Mise à jour automatique lors des mouvements/factures
✅ **Calculs Automatiques** - Totaux factures, sous-totaux
✅ **Validation du Stock** - Impossible de vendre plus que disponible
✅ **Soft Delete** - Aucune perte de données, restauration possible
✅ **Rollback Automatique** - Annulation facture/mouvement restaure le stock
✅ **Recherche et Filtres** - Trouver rapidement ce qu'on cherche
✅ **Pagination** - Gestion efficace des grandes listes
✅ **Upload d'Images** - Photos produits
✅ **Tableau de Bord** - Statistiques et graphiques
✅ **Documentation Swagger** - API auto-documentée

---

**Votre backend est complet, sécurisé et prêt pour la production ! 🚀**

