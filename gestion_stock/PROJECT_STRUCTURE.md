# 📁 Structure du Projet

## Architecture

```
gestion_stock/
│
├── accounts/                    # Application d'authentification
│   ├── __init__.py
│   ├── apps.py
│   ├── views.py                 # Login, Logout
│   └── urls.py                  # Routes d'authentification
│
├── products/                    # Application de gestion des produits
│   ├── __init__.py
│   ├── admin.py                 # Configuration admin Django
│   ├── apps.py
│   ├── models.py                # Modèle Product
│   ├── serializers.py           # ProductSerializer, ProductListSerializer
│   ├── views.py                 # ProductViewSet
│   ├── urls.py                  # Routes API produits
│   ├── permissions.py           # IsAdminUser permission
│   └── migrations/              # Migrations de base de données
│
├── stock/                       # Application de gestion des mouvements
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py                # Modèle StockMovement
│   ├── serializers.py           # StockMovementSerializer
│   ├── views.py                 # StockMovementViewSet
│   ├── urls.py                  # Routes API mouvements
│   └── migrations/
│
├── invoices/                    # Application de facturation
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py                # Modèles Invoice, InvoiceItem
│   ├── serializers.py           # InvoiceSerializer, InvoiceItemSerializer
│   ├── views.py                 # InvoiceViewSet, InvoiceItemViewSet
│   ├── urls.py                  # Routes API factures
│   └── migrations/
│
├── dashboard/                   # Application tableau de bord
│   ├── __init__.py
│   ├── apps.py
│   ├── views.py                 # dashboard_stats, dashboard_charts
│   ├── urls.py                  # Routes API dashboard
│   └── migrations/
│
├── gestion_stock/               # Configuration du projet Django
│   ├── __init__.py
│   ├── settings.py              # Configuration complète (JWT, CORS, etc.)
│   ├── urls.py                  # URLs principales + Swagger
│   ├── wsgi.py
│   └── asgi.py
│
├── media/                       # Fichiers uploadés (images produits)
│   └── products/
│
├── staticfiles/                 # Fichiers statiques collectés
│
├── manage.py                    # Script de gestion Django
├── requirements.txt             # Dépendances Python
├── .env                         # Variables d'environnement (à créer)
├── .env.example                 # Exemple de configuration
│
├── README.md                    # Documentation principale
├── COMMANDS.md                  # Commandes utiles
├── API_EXAMPLES.md              # Exemples d'utilisation avec React
└── PROJECT_STRUCTURE.md         # Ce fichier
```

## Modèles de données

### Product
- `id` : Identifiant unique
- `name` : Nom du produit
- `description` : Description
- `category` : Catégorie
- `quantity` : Quantité en stock
- `purchase_price` : Prix d'achat
- `sale_price` : Prix de vente
- `alert_threshold` : Seuil d'alerte
- `photo` : Image du produit
- `is_active` : Statut actif/inactif
- `created_at` : Date de création
- `updated_at` : Date de modification
- `deleted_at` : Date de suppression (soft delete)

### StockMovement
- `id` : Identifiant unique
- `product` : ForeignKey vers Product
- `movement_type` : ENTREE ou SORTIE
- `quantity` : Quantité
- `date` : Date du mouvement
- `comment` : Commentaire
- `created_at` : Date de création
- `deleted_at` : Date de suppression (soft delete)

### Invoice
- `id` : Identifiant unique
- `invoice_number` : Numéro de facture (auto-généré)
- `date` : Date de la facture
- `client_name` : Nom du client (optionnel)
- `total_ht` : Total HT (calculé)
- `total_ttc` : Total TTC (calculé)
- `status` : PAYE ou NON_PAYE
- `is_cancelled` : Facture annulée
- `created_at` : Date de création
- `updated_at` : Date de modification
- `deleted_at` : Date de suppression (soft delete)

### InvoiceItem
- `id` : Identifiant unique
- `invoice` : ForeignKey vers Invoice
- `product` : ForeignKey vers Product
- `quantity` : Quantité
- `unit_price` : Prix unitaire
- `subtotal` : Sous-total (calculé)
- `created_at` : Date de création
- `deleted_at` : Date de suppression (soft delete)

## Endpoints API

### Base URL
```
http://localhost:8000/api/
```

### Authentification
- `POST /api/auth/login/` - Connexion
- `POST /api/auth/logout/` - Déconnexion
- `POST /api/auth/token/refresh/` - Rafraîchir le token

### Produits
- `GET /api/products/` - Liste
- `GET /api/products/{id}/` - Détails
- `POST /api/products/` - Créer
- `PUT /api/products/{id}/` - Mettre à jour
- `PATCH /api/products/{id}/` - Mettre à jour partiellement
- `DELETE /api/products/{id}/` - Supprimer
- `GET /api/products/low_stock/` - Produits en rupture
- `POST /api/products/{id}/soft_delete/` - Soft delete
- `POST /api/products/{id}/restore/` - Restaurer

### Mouvements de Stock
- `GET /api/stock-movements/` - Liste
- `GET /api/stock-movements/{id}/` - Détails
- `POST /api/stock-movements/` - Créer
- `PUT /api/stock-movements/{id}/` - Mettre à jour
- `DELETE /api/stock-movements/{id}/` - Supprimer (soft delete)
- `POST /api/stock-movements/{id}/restore/` - Restaurer

### Factures
- `GET /api/invoices/` - Liste
- `GET /api/invoices/{id}/` - Détails
- `POST /api/invoices/` - Créer
- `PUT /api/invoices/{id}/` - Mettre à jour
- `DELETE /api/invoices/{id}/` - Supprimer
- `POST /api/invoices/{id}/cancel/` - Annuler
- `POST /api/invoices/{id}/restore/` - Restaurer
- `GET /api/invoices/{id}/items/` - Liste des items
- `POST /api/invoices/{id}/items/` - Ajouter un item
- `DELETE /api/invoices/{id}/items/` - Supprimer un item

### Tableau de Bord
- `GET /api/dashboard/stats/` - Statistiques
- `GET /api/dashboard/charts/` - Données pour graphiques

## Documentation

- **Swagger UI** : http://localhost:8000/swagger/
- **ReDoc** : http://localhost:8000/redoc/
- **JSON Schema** : http://localhost:8000/swagger.json

## Sécurité

- Authentification JWT obligatoire pour tous les endpoints (sauf login)
- Permission `IsAdminUser` : seuls les utilisateurs avec `is_staff=True` peuvent accéder
- CORS configuré pour `http://localhost:3000` (React)
- Validation des données côté serveur
- Soft delete pour préserver l'intégrité des données

## Logique métier

### Produits
- Alerte automatique si `quantity <= alert_threshold`
- Soft delete : `deleted_at` est défini, `is_active = False`

### Mouvements de Stock
- **ENTREE** : `product.quantity += quantity`
- **SORTIE** : `product.quantity -= quantity` (vérification stock suffisant)
- Soft delete : rollback automatique de la quantité

### Factures
- Numéro auto-généré : `INV-YYYYMMDD-UUID`
- Calcul automatique : `total_ht = sum(items.subtotal)`, `total_ttc = total_ht * 1.20`
- Création : génère automatiquement des SORTIES de stock pour chaque item
- Annulation : rollback du stock pour tous les items
- Validation : stock suffisant requis avant création

