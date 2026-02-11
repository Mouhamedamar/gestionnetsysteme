# 🚀 Commandes pour lancer le projet

## Installation initiale

```bash
# 1. Activer l'environnement virtuel
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Créer le fichier .env (copier depuis .env.example)
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env

# 4. Éditer .env et configurer les variables

# 5. Créer les migrations
python manage.py makemigrations

# 6. Appliquer les migrations
python manage.py migrate

# 7. Créer un superutilisateur
python manage.py createsuperuser
# Suivre les instructions pour créer un admin

# 8. Lancer le serveur
python manage.py runserver
```

## Commandes quotidiennes

```bash
# Lancer le serveur de développement
python manage.py runserver

# Lancer sur un port spécifique
python manage.py runserver 8001

# Créer de nouvelles migrations après modification des modèles
python manage.py makemigrations
python manage.py migrate

# Accéder au shell Django
python manage.py shell

# Créer un nouvel utilisateur admin
python manage.py createsuperuser
```

## Commandes de maintenance

```bash
# Nettoyer les migrations (ATTENTION: à utiliser avec précaution)
python manage.py migrate --fake products zero
python manage.py migrate --fake stock zero
python manage.py migrate --fake invoices zero

# Collecter les fichiers statiques (production)
python manage.py collectstatic

# Vérifier la configuration
python manage.py check
```

## URLs importantes

- **API Swagger** : http://localhost:8000/swagger/
- **API ReDoc** : http://localhost:8000/redoc/
- **Admin Django** : http://localhost:8000/admin/
- **API Base** : http://localhost:8000/api/

