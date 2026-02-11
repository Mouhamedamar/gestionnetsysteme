# 🏪 Backend Gestion de Stock - Django REST Framework

Backend complet pour une application de gestion de stock, conçu pour être utilisé avec un frontend React.js.

## 📋 Fonctionnalités

### ✅ Authentification
- Authentification JWT sécurisée
- Connexion / Déconnexion
- Accès réservé aux administrateurs

### ✅ Produits
- CRUD complet (Create, Read, Update, Delete)
- Upload et affichage d'images
- Recherche par nom ou catégorie
- Tri et pagination
- Alerte automatique si stock ≤ seuil d'alerte
- Soft delete

### ✅ Mouvements de Stock
- Entrées et sorties de stock
- Mise à jour automatique des quantités
- Validation : interdiction de sortie si stock insuffisant
- Soft delete avec rollback automatique

### ✅ Facturation
- Création de factures avec numéro automatique
- Gestion des lignes de facture (InvoiceItem)
- Calcul automatique des totaux HT et TTC
- Génération automatique de sorties de stock
- Annulation de facture avec rollback du stock
- Statut : PAYÉ / NON PAYÉ

### ✅ Tableau de Bord
- Statistiques complètes :
  - Nombre total de produits
  - Produits en rupture de stock
  - Valeur totale du stock
  - Nombre de factures
  - Chiffre d'affaires
  - Dernières factures

### ✅ Sécurité
- Permissions personnalisées (Admin uniquement)
- Validation des données
- Soft delete sur tous les modèles
- CORS configuré pour React (http://localhost:3000)
- Gestion d'erreurs complète

## 🚀 Installation

### Prérequis
- Python 3.8+
- pip
- Virtualenv (recommandé)

### Étapes d'installation

1. **Cloner le projet** (si applicable) ou naviguer vers le dossier
```bash
cd gestion_stock
```

2. **Créer un environnement virtuel**
```bash
python -m venv venv
```

3. **Activer l'environnement virtuel**

Sur Windows:
```bash
venv\Scripts\activate
```

Sur Linux/Mac:
```bash
source venv/bin/activate
```

4. **Installer les dépendances**
```bash
pip install -r requirements.txt
```

5. **Configurer les variables d'environnement**

Créer un fichier `.env` à la racine du projet `gestion_stock/` :
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

LANGUAGE_CODE=fr-fr
TIME_ZONE=UTC

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

6. **Appliquer les migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

7. **Créer un superutilisateur (Admin)**
```bash
python manage.py createsuperuser
```

8. **Lancer le serveur de développement**
```bash
python manage.py runserver
```

Le serveur sera accessible sur `http://localhost:8000`

## 📚 Documentation API

### Swagger UI
Une fois le serveur lancé, accédez à la documentation interactive :
- **Swagger UI** : http://localhost:8000/swagger/
- **ReDoc** : http://localhost:8000/redoc/
- **JSON Schema** : http://localhost:8000/swagger.json

## 🔐 Authentification

### Connexion
```bash
POST /api/auth/login/
Content-Type: application/json

{
  "username": "admin",
  "password": "votre_mot_de_passe"
}
```

**Réponse :**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

### Utilisation du token
Ajoutez le header suivant à toutes vos requêtes :
```
Authorization: Bearer <access_token>
```

### Rafraîchir le token
```bash
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "votre_refresh_token"
}
```

### Déconnexion
```bash
POST /api/auth/logout/
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "refresh": "votre_refresh_token"
}
```

## 📡 Endpoints API

### Produits
- `GET /api/products/` - Liste des produits (avec pagination, recherche, tri)
- `GET /api/products/{id}/` - Détails d'un produit
- `POST /api/products/` - Créer un produit
- `PUT /api/products/{id}/` - Mettre à jour un produit
- `PATCH /api/products/{id}/` - Mettre à jour partiellement
- `DELETE /api/products/{id}/` - Supprimer un produit
- `GET /api/products/low_stock/` - Produits en rupture de stock
- `POST /api/products/{id}/soft_delete/` - Soft delete
- `POST /api/products/{id}/restore/` - Restaurer un produit

**Filtres disponibles :**
- `?category=nom_categorie` - Filtrer par catégorie
- `?is_active=true` - Filtrer par statut actif
- `?low_stock=true` - Produits en rupture
- `?search=terme` - Recherche par nom/catégorie/description
- `?ordering=name` - Tri (name, category, quantity, sale_price, created_at)

### Mouvements de Stock
- `GET /api/stock-movements/` - Liste des mouvements
- `GET /api/stock-movements/{id}/` - Détails d'un mouvement
- `POST /api/stock-movements/` - Créer un mouvement
- `PUT /api/stock-movements/{id}/` - Mettre à jour
- `DELETE /api/stock-movements/{id}/` - Supprimer (soft delete avec rollback)
- `POST /api/stock-movements/{id}/restore/` - Restaurer un mouvement

**Filtres disponibles :**
- `?product=id` - Filtrer par produit
- `?movement_type=ENTREE` ou `SORTIE` - Filtrer par type

### Factures
- `GET /api/invoices/` - Liste des factures
- `GET /api/invoices/{id}/` - Détails d'une facture
- `POST /api/invoices/` - Créer une facture (avec items)
- `PUT /api/invoices/{id}/` - Mettre à jour
- `DELETE /api/invoices/{id}/` - Supprimer
- `POST /api/invoices/{id}/cancel/` - Annuler une facture (rollback stock)
- `POST /api/invoices/{id}/restore/` - Restaurer une facture annulée
- `GET /api/invoices/{id}/items/` - Liste des items d'une facture
- `POST /api/invoices/{id}/items/` - Ajouter un item à une facture
- `DELETE /api/invoices/{id}/items/` - Supprimer un item (avec rollback stock)

**Filtres disponibles :**
- `?status=PAYE` ou `NON_PAYE` - Filtrer par statut
- `?is_cancelled=true` - Filtrer les annulées
- `?search=numero` - Recherche par numéro ou nom client

### Tableau de Bord
- `GET /api/dashboard/stats/` - Statistiques complètes
- `GET /api/dashboard/charts/` - Données pour graphiques

**Réponse de `/api/dashboard/stats/` :**
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

## 📝 Exemples de requêtes

### Créer un produit
```bash
POST /api/products/
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "name": "Ordinateur Portable",
  "description": "Laptop haute performance",
  "category": "Informatique",
  "quantity": 50,
  "purchase_price": 800.00,
  "sale_price": 1200.00,
  "alert_threshold": 10,
  "photo": <file>,
  "is_active": true
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
    },
    {
      "product": 2,
      "quantity": 1,
      "unit_price": 500.00
    }
  ]
}
```

## 🗄️ Base de données

### SQLite (Développement)
Par défaut, le projet utilise SQLite. La base de données sera créée automatiquement dans `db.sqlite3`.

### PostgreSQL (Production)
Pour utiliser PostgreSQL, modifiez le fichier `.env` :
```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=gestion_stock
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_HOST=localhost
DB_PORT=5432
```

Puis installez le driver PostgreSQL :
```bash
pip install psycopg2-binary
```

## 🖼️ Gestion des images

Les images des produits sont stockées dans le dossier `media/products/`. 

En développement, les fichiers médias sont servis automatiquement. En production, configurez votre serveur web (Nginx, Apache) pour servir le dossier `media/`.

## 🔒 Sécurité

- Tous les endpoints (sauf login) nécessitent une authentification JWT
- Seuls les utilisateurs avec `is_staff=True` peuvent accéder à l'API
- Validation des données côté serveur
- Soft delete pour préserver l'intégrité des données
- CORS configuré pour autoriser uniquement les origines spécifiées

## 🧪 Tests

Pour lancer les tests (à créer) :
```bash
python manage.py test
```

## 📦 Structure du projet

```
gestion_stock/
├── accounts/          # Authentification
├── products/          # Gestion des produits
├── stock/            # Mouvements de stock
├── invoices/         # Facturation
├── dashboard/        # Tableau de bord
├── gestion_stock/    # Configuration du projet
│   ├── settings.py
│   ├── urls.py
│   └── ...
├── manage.py
├── requirements.txt
└── .env
```

## 🛠️ Commandes utiles

```bash
# Créer les migrations
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser

# Accéder à l'admin Django
# http://localhost:8000/admin/

# Collecter les fichiers statiques (production)
python manage.py collectstatic
```

## 📞 Support

Pour toute question ou problème, consultez la documentation Swagger à l'adresse :
http://localhost:8000/swagger/

## 📄 Licence

Ce projet est sous licence MIT.

---

**Développé avec ❤️ en Django REST Framework**

