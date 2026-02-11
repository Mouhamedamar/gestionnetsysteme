# 🔧 Installation des dépendances

## Problème : Modules non trouvés

Si vous obtenez des erreurs comme :
- `ModuleNotFoundError: No module named 'rest_framework'`
- `ModuleNotFoundError: No module named 'decouple'`

Cela signifie que les packages ne sont pas installés dans votre environnement virtuel.

## Solution rapide

### Option 1 : Script PowerShell (Recommandé)

Depuis le répertoire racine (`gestions/`), exécutez :

```powershell
.\install_dependencies.ps1
```

### Option 2 : Installation manuelle

1. **Activez le venv** (si pas déjà activé) :
```powershell
.\venv\Scripts\Activate.ps1
```

2. **Installez les dépendances** :
```powershell
pip install -r requirements.txt
```

Ou installez les packages essentiels un par un :
```powershell
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers
pip install django-filter
pip install drf-yasg
pip install pillow
pip install python-decouple
```

### Option 3 : Vérifier l'activation du venv

Assurez-vous que le venv est bien activé. Vous devriez voir `(venv)` dans votre prompt.

Vérifiez avec :
```powershell
python -c "import sys; print(sys.executable)"
```

Cela devrait afficher un chemin vers `venv\Scripts\python.exe`.

Si ce n'est pas le cas, activez le venv :
```powershell
cd C:\Users\Mouha\OneDrive\Bureau\gestions
.\venv\Scripts\Activate.ps1
```

## Après l'installation

Une fois les dépendances installées, vous pouvez :

1. **Appliquer les migrations** :
```powershell
cd gestion_stock
python manage.py migrate
```

2. **Créer un superutilisateur** :
```powershell
python manage.py createsuperuser
```

3. **Lancer le serveur** :
```powershell
python manage.py runserver
```

## Vérification

Pour vérifier que tout est installé correctement :
```powershell
python -c "import rest_framework; print('OK')"
python -c "import decouple; print('OK')"
```

Si ces commandes fonctionnent sans erreur, tout est prêt !

