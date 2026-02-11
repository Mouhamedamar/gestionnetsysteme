# 🚀 Guide de démarrage rapide

## Installation en 5 minutes

### 1. Activer l'environnement virtuel
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Installer les dépendances
```bash
pip install -r requirements.txt
```

### 3. Configurer l'environnement
Créez un fichier `.env` dans `gestion_stock/` :
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

### 4. Initialiser la base de données
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Créer un utilisateur admin
```bash
python manage.py createsuperuser
# Suivez les instructions pour créer un admin
```

### 6. Lancer le serveur
```bash
python manage.py runserver
```

## 🎯 Accès rapide

- **API Swagger** : http://localhost:8000/swagger/
- **Admin Django** : http://localhost:8000/admin/
- **API Base** : http://localhost:8000/api/

## 🔑 Première connexion

### Test avec cURL

```bash
# Connexion
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "votre_mot_de_passe"}'

# Utiliser le token reçu
curl -X GET http://localhost:8000/api/products/ \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"
```

### Test avec Postman

1. Créer une requête POST vers `http://localhost:8000/api/auth/login/`
2. Body (raw JSON) :
```json
{
  "username": "admin",
  "password": "votre_mot_de_passe"
}
```
3. Copier le `access` token de la réponse
4. Pour les autres requêtes, ajouter le header :
   - Key: `Authorization`
   - Value: `Bearer VOTRE_ACCESS_TOKEN`

## 📝 Créer votre premier produit

```bash
curl -X POST http://localhost:8000/api/products/ \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ordinateur Portable",
    "description": "Laptop haute performance",
    "category": "Informatique",
    "quantity": 50,
    "purchase_price": 800.00,
    "sale_price": 1200.00,
    "alert_threshold": 10,
    "is_active": true
  }'
```

## ✅ Vérification

1. ✅ Serveur lancé sur http://localhost:8000
2. ✅ Swagger accessible sur http://localhost:8000/swagger/
3. ✅ Connexion réussie avec votre compte admin
4. ✅ Token JWT reçu et fonctionnel
5. ✅ Premier produit créé

## 📚 Documentation complète

- **README.md** : Documentation complète
- **API_EXAMPLES.md** : Exemples d'intégration React
- **COMMANDS.md** : Toutes les commandes utiles
- **PROJECT_STRUCTURE.md** : Structure du projet

## 🆘 Problèmes courants

### Erreur : "Module not found"
```bash
pip install -r requirements.txt
```

### Erreur : "No such table"
```bash
python manage.py migrate
```

### Erreur : "Permission denied"
Vérifiez que votre utilisateur a `is_staff=True` :
```bash
python manage.py shell
>>> from django.contrib.auth.models import User
>>> user = User.objects.get(username='admin')
>>> user.is_staff = True
>>> user.save()
```

### Erreur CORS
Vérifiez que `CORS_ALLOWED_ORIGINS` dans `.env` contient l'URL de votre frontend React.

---

**Prêt à démarrer ! 🎉**

