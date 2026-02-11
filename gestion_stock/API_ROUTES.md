# 📡 Routes API - Gestion de Stock

Base URL : `http://localhost:8000`

## 🔐 Authentification

Toutes les routes (sauf login) nécessitent un token JWT dans le header :
```
Authorization: Bearer <access_token>
```

### Routes d'authentification

| Méthode | Route | Description | Auth Requise |
|---------|-------|-------------|--------------|
| `POST` | `/api/auth/login/` | Connexion (obtenir token) | ❌ Non |
| `POST` | `/api/auth/logout/` | Déconnexion (blacklist token) | ❌ Non |
| `POST` | `/api/auth/token/refresh/` | Rafraîchir le token d'accès | ❌ Non |

---

## 📦 Produits

Base : `/api/products/`

### Routes principales

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `GET` | `/api/products/` | Liste des produits (paginated) | ✅ Oui |
| `POST` | `/api/products/` | Créer un produit | ✅ Oui |
| `GET` | `/api/products/{id}/` | Détails d'un produit | ✅ Oui |
| `PUT` | `/api/products/{id}/` | Mettre à jour un produit (complet) | ✅ Oui |
| `PATCH` | `/api/products/{id}/` | Mettre à jour un produit (partiel) | ✅ Oui |
| `DELETE` | `/api/products/{id}/` | Supprimer un produit | ✅ Oui |

### Routes personnalisées

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `GET` | `/api/products/low_stock/` | Produits en rupture de stock | ✅ Oui |
| `POST` | `/api/products/{id}/soft_delete/` | Soft delete d'un produit | ✅ Oui |
| `POST` | `/api/products/{id}/restore/` | Restaurer un produit supprimé | ✅ Oui |

### Paramètres de requête (GET /api/products/)

- `?page=1` - Pagination
- `?category=nom_categorie` - Filtrer par catégorie
- `?is_active=true` - Filtrer par statut actif
- `?low_stock=true` - Produits en rupture
- `?search=terme` - Recherche (nom, catégorie, description)
- `?ordering=name` - Tri (name, category, quantity, sale_price, created_at)
- `?ordering=-created_at` - Tri décroissant

**Exemple :**
```
GET /api/products/?category=Informatique&search=laptop&ordering=-created_at&page=1
```

---

## 📊 Mouvements de Stock

Base : `/api/stock-movements/`

### Routes principales

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `GET` | `/api/stock-movements/` | Liste des mouvements | ✅ Oui |
| `POST` | `/api/stock-movements/` | Créer un mouvement | ✅ Oui |
| `GET` | `/api/stock-movements/{id}/` | Détails d'un mouvement | ✅ Oui |
| `PUT` | `/api/stock-movements/{id}/` | Mettre à jour un mouvement | ✅ Oui |
| `PATCH` | `/api/stock-movements/{id}/` | Mettre à jour partiellement | ✅ Oui |
| `DELETE` | `/api/stock-movements/{id}/` | Supprimer (soft delete + rollback) | ✅ Oui |

### Routes personnalisées

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `POST` | `/api/stock-movements/{id}/soft_delete/` | Soft delete avec rollback | ✅ Oui |
| `POST` | `/api/stock-movements/{id}/restore/` | Restaurer un mouvement | ✅ Oui |

### Paramètres de requête (GET /api/stock-movements/)

- `?page=1` - Pagination
- `?product=id` - Filtrer par produit
- `?movement_type=ENTREE` ou `SORTIE` - Filtrer par type
- `?search=terme` - Recherche (nom produit, commentaire)
- `?ordering=date` - Tri (date, created_at)

**Exemple :**
```
GET /api/stock-movements/?product=1&movement_type=SORTIE&ordering=-date
```

---

## 🧾 Factures

Base : `/api/invoices/`

### Routes principales

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `GET` | `/api/invoices/` | Liste des factures | ✅ Oui |
| `POST` | `/api/invoices/` | Créer une facture (avec items) | ✅ Oui |
| `GET` | `/api/invoices/{id}/` | Détails d'une facture | ✅ Oui |
| `PUT` | `/api/invoices/{id}/` | Mettre à jour une facture | ✅ Oui |
| `PATCH` | `/api/invoices/{id}/` | Mettre à jour partiellement | ✅ Oui |
| `DELETE` | `/api/invoices/{id}/` | Supprimer une facture | ✅ Oui |

### Routes personnalisées

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `POST` | `/api/invoices/{id}/cancel/` | Annuler une facture (rollback stock) | ✅ Oui |
| `POST` | `/api/invoices/{id}/restore/` | Restaurer une facture annulée | ✅ Oui |
| `POST` | `/api/invoices/{id}/soft_delete/` | Soft delete d'une facture | ✅ Oui |
| `GET` | `/api/invoices/{id}/items/` | Liste des items d'une facture | ✅ Oui |
| `POST` | `/api/invoices/{id}/items/` | Ajouter un item à une facture | ✅ Oui |
| `DELETE` | `/api/invoices/{id}/items/` | Supprimer un item (avec rollback) | ✅ Oui |

### Paramètres de requête (GET /api/invoices/)

- `?page=1` - Pagination
- `?status=PAYE` ou `NON_PAYE` - Filtrer par statut
- `?is_cancelled=true` - Filtrer les annulées
- `?search=numero` - Recherche (numéro, nom client)
- `?ordering=date` - Tri (date, total_ttc, created_at)

**Exemple :**
```
GET /api/invoices/?status=PAYE&ordering=-date&page=1
```

---

## 📋 Items de Facture

Base : `/api/invoice-items/`

### Routes principales

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `GET` | `/api/invoice-items/` | Liste des items | ✅ Oui |
| `POST` | `/api/invoice-items/` | Créer un item | ✅ Oui |
| `GET` | `/api/invoice-items/{id}/` | Détails d'un item | ✅ Oui |
| `PUT` | `/api/invoice-items/{id}/` | Mettre à jour un item | ✅ Oui |
| `PATCH` | `/api/invoice-items/{id}/` | Mettre à jour partiellement | ✅ Oui |
| `DELETE` | `/api/invoice-items/{id}/` | Supprimer un item | ✅ Oui |

### Paramètres de requête (GET /api/invoice-items/)

- `?invoice=id` - Filtrer par facture
- `?page=1` - Pagination

---

## 📈 Tableau de Bord

### Routes

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `GET` | `/api/dashboard/stats/` | Statistiques complètes | ✅ Oui |
| `GET` | `/api/dashboard/charts/` | Données pour graphiques | ✅ Oui |

### Réponse de `/api/dashboard/stats/`

```json
{
  "total_products": 150,
  "low_stock_products": 12,
  "stock_value": 45000.50,
  "total_invoices": 234,
  "revenue": 125000.75,
  "recent_invoices": [...]
}
```

### Réponse de `/api/dashboard/charts/`

```json
{
  "monthly_revenue": [
    {"month": "2024-01", "total": 15000.00},
    {"month": "2024-02", "total": 18000.00}
  ],
  "top_products": [...]
}
```

---

## 📚 Documentation API

| Route | Description |
|-------|-------------|
| `/swagger/` | Documentation Swagger UI (interactive) |
| `/redoc/` | Documentation ReDoc |
| `/swagger.json` | Schéma OpenAPI en JSON |

---

## 🔧 Admin Django

| Route | Description |
|-------|-------------|
| `/admin/` | Interface d'administration Django |

---

## 📝 Exemples de requêtes

### Connexion
```bash
POST /api/auth/login/
Content-Type: application/json

{
  "username": "admin",
  "password": "votre_mot_de_passe"
}
```

### Créer un produit
```bash
POST /api/products/
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "name": "Ordinateur Portable",
  "category": "Informatique",
  "quantity": 50,
  "purchase_price": 800.00,
  "sale_price": 1200.00,
  "alert_threshold": 10,
  "photo": <file>
}
```

### Créer une entrée de stock
```bash
POST /api/stock-movements/
Authorization: Bearer <token>
Content-Type: application/json

{
  "product": 1,
  "movement_type": "ENTREE",
  "quantity": 20,
  "comment": "Réapprovisionnement"
}
```

### Créer une facture
```bash
POST /api/invoices/
Authorization: Bearer <token>
Content-Type: application/json

{
  "client_name": "Jean Dupont",
  "status": "NON_PAYE",
  "items": [
    {
      "product": 1,
      "quantity": 2,
      "unit_price": 1200.00
    }
  ]
}
```

---

## ⚠️ Notes importantes

1. **Pagination** : Toutes les listes utilisent la pagination (20 éléments par page par défaut)
2. **Soft Delete** : Les suppressions sont "soft" (pas de suppression définitive)
3. **Validation** : Le stock est vérifié avant chaque sortie/facture
4. **Calculs automatiques** : Les totaux des factures sont calculés automatiquement
5. **Images** : Les images produits sont servies via `/media/products/`

---

**Base URL complète** : `http://localhost:8000`

