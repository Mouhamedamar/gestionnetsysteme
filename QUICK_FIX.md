# 🚨 Solution rapide pour l'erreur "No module named 'rest_framework'"

## Le problème
Les packages ne sont pas installés dans votre environnement virtuel (venv).

## Solution en 3 étapes

### Étape 1 : Ouvrir PowerShell dans le répertoire racine
```powershell
cd C:\Users\Mouha\OneDrive\Bureau\gestions
```

### Étape 2 : Activer le venv
```powershell
.\venv\Scripts\Activate.ps1
```

**Important** : Vous devriez voir `(venv)` apparaître dans votre prompt après cette commande.

### Étape 3 : Installer les dépendances
```powershell
pip install -r requirements.txt
```

## Alternative : Utiliser le fichier batch

Double-cliquez sur `install.bat` dans le répertoire racine, ou exécutez :
```cmd
install.bat
```

## Vérification

Après l'installation, vérifiez que les packages sont installés :
```powershell
python -c "import rest_framework; print('OK - rest_framework installé')"
python -c "import decouple; print('OK - decouple installé')"
```

## Si ça ne fonctionne toujours pas

1. **Vérifiez que le venv est bien activé** :
```powershell
python -c "import sys; print(sys.executable)"
```
Cela doit afficher un chemin contenant `venv\Scripts\python.exe`

2. **Si ce n'est pas le cas, réactivez le venv** :
```powershell
deactivate
.\venv\Scripts\Activate.ps1
```

3. **Réinstallez les packages** :
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

## Après l'installation réussie

```powershell
cd gestion_stock
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

