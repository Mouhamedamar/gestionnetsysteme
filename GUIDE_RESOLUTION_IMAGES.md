# 🔧 Guide Complet de Résolution des Images

## 📋 Problème Identifié

Les images des produits ne s'affichent pas car :
1. ✅ Le dossier `media/products/` existe mais est **vide**
2. ✅ La configuration Django est correcte
3. ✅ Le code frontend gère correctement les URLs
4. ❌ **Les images n'ont jamais été téléchargées ou ont été supprimées**

## 🔍 Diagnostic Étape par Étape

### Étape 1 : Vérifier l'état actuel des produits dans la base de données

Ouvrez un terminal PowerShell dans le dossier `gestion_stock` et exécutez :

```powershell
python manage.py shell
```

Puis dans le shell Python :

```python
from products.models import Product

# Lister tous les produits avec leurs photos
products = Product.objects.all()
for p in products:
    print(f"ID: {p.id}, Nom: {p.name}, Photo: {p.photo}, Photo existe: {bool(p.photo)}")
```

**Résultat attendu :**
- Si `Photo: ` est vide ou `Photo existe: False` → Les produits n'ont pas de photo enregistrée
- Si `Photo: products/nom_image.jpg` mais fichier inexistant → Les fichiers ont été supprimés

### Étape 2 : Vérifier que les serveurs sont en cours d'exécution

#### Backend Django :
```powershell
cd gestion_stock
python manage.py runserver
```

Le serveur doit démarrer sur `http://127.0.0.1:8000/`

#### Frontend Vite :
Ouvrez un **nouveau terminal** :
```powershell
cd frontend
npm run dev
```

Le serveur doit démarrer sur `http://localhost:3000/` ou `http://localhost:5173/`

### Étape 3 : Tester l'upload d'une image

#### Option A : Via l'interface web (Méthode recommandée)

1. **Ouvrez la console du navigateur** (F12 → Console)
2. **Connectez-vous** à l'application
3. **Allez sur la page Produits**
4. **Cliquez sur "Nouveau Produit"**
5. **Remplissez le formulaire :**
   - Nom : "Test Image"
   - Catégorie : "Test"
   - Prix d'achat : 1000
   - Prix de vente : 1500
   - Quantité : 10
   - **Sélectionnez une image** (JPG, PNG, max 5MB)
6. **Surveillez la console** pendant la soumission

**Logs attendus dans la console :**
```
Fichier sélectionné: test.jpg image/jpeg 123456
Preview généré, taille: 123456
Ajout de la photo au FormData: test.jpg
Produit créé: { ..., photo_url: "http://localhost:8000/media/products/test.jpg" }
```

**Si vous voyez une erreur :**
- Copiez l'erreur complète
- Regardez les logs du serveur Django dans le terminal

#### Option B : Test via script Python (Test backend uniquement)

Créez un fichier `test_upload_image.py` dans le dossier `gestion_stock` :

```python
import os
import django
import sys
from pathlib import Path

# Configuration Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io

# Créer une image de test
def create_test_image():
    """Crée une image de test en mémoire"""
    img = Image.new('RGB', (100, 100), color='red')
    img_io = io.BytesIO()
    img.save(img_io, format='JPEG')
    img_io.seek(0)
    return SimpleUploadedFile("test_image.jpg", img_io.read(), content_type="image/jpeg")

# Test de création d'un produit avec image
print("🔄 Création d'un produit de test avec image...")
try:
    test_image = create_test_image()
    product = Product.objects.create(
        name="Produit Test Image",
        description="Test d'upload d'image",
        category="Test",
        quantity=10,
        purchase_price=1000,
        sale_price=1500,
        alert_threshold=5,
        photo=test_image,
        is_active=True
    )
    print(f"✅ Produit créé avec succès !")
    print(f"   ID: {product.id}")
    print(f"   Nom: {product.name}")
    print(f"   Photo path: {product.photo}")
    print(f"   Photo URL: {product.photo.url if product.photo else 'None'}")
    
    # Vérifier que le fichier existe
    if product.photo:
        full_path = product.photo.path
        if os.path.exists(full_path):
            print(f"✅ Fichier image créé : {full_path}")
            print(f"   Taille : {os.path.getsize(full_path)} bytes")
        else:
            print(f"❌ Fichier image non trouvé : {full_path}")
    
except Exception as e:
    print(f"❌ Erreur : {str(e)}")
    import traceback
    traceback.print_exc()
```

Exécutez le script :
```powershell
cd gestion_stock
python test_upload_image.py
```

**Résultat attendu :**
```
🔄 Création d'un produit de test avec image...
✅ Produit créé avec succès !
   ID: 1
   Nom: Produit Test Image
   Photo path: products/test_image.jpg
   Photo URL: /media/products/test_image.jpg
✅ Fichier image créé : C:\...\media\products\test_image.jpg
   Taille : 123 bytes
```

### Étape 4 : Vérifier que Django sert les fichiers media

1. **Vérifiez que le serveur Django tourne**
2. **Ouvrez votre navigateur** et allez sur :
   ```
   http://localhost:8000/media/products/
   ```

**Résultat attendu :**
- Soit vous voyez une erreur 404 avec la liste des URLs disponibles (normal si aucune image)
- Soit vous voyez une page de listage de fichiers (dépend de la configuration)

3. **Si vous avez créé une image de test**, essayez d'y accéder directement :
   ```
   http://localhost:8000/media/products/test_image.jpg
   ```
   
   Vous devriez voir l'image s'afficher.

## 🛠️ Solutions aux Problèmes Courants

### Problème 1 : L'image ne se télécharge pas (FormData vide)

**Symptômes :**
- La console montre "Aucun fichier photo à envoyer"
- Le backend reçoit la requête sans fichier

**Solution :**
Vérifiez dans `ProductForm.jsx` que :
1. L'input file a l'attribut `accept="image/*"`
2. Le `handleFileChange` est bien appelé
3. `photoFile` est bien défini dans le state

### Problème 2 : Erreur 413 (Request Entity Too Large)

**Symptômes :**
- L'upload échoue avec une erreur 413
- L'image est très grande

**Solution :**
L'application limite la taille à 5MB. Utilisez une image plus petite ou modifiez la limite dans `ProductForm.jsx` ligne 58.

### Problème 3 : Erreur de permissions sur le dossier media

**Symptômes :**
- Erreur "Permission denied" dans les logs Django
- Le fichier n'est pas créé

**Solution Windows :**
```powershell
# Donner les permissions d'écriture au dossier media
icacls "c:\Users\Mouha\OneDrive\Bureau\gestions\gestion_stock\media" /grant Everyone:(OI)(CI)F /T
```

### Problème 4 : CORS ou URL invalide

**Symptômes :**
- Erreur CORS dans la console
- Les images ne chargent pas depuis le frontend

**Solution :**
Vérifiez dans `gestion_stock/settings.py` que CORS est bien configuré :

```python
CORS_ALLOW_ALL_ORIGINS = True  # En développement
# ou
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
]
```

### Problème 5 : Les anciennes images ne s'affichent pas

**Symptômes :**
- Les nouveaux produits ont des images qui s'affichent
- Les anciens produits affichent "Aucune image"

**Cause :**
Les produits créés avant n'ont pas de fichier image associé dans la base de données.

**Solution :**
1. **Option 1 : Supprimer et recréer les produits**
2. **Option 2 : Ajouter des images aux produits existants** via l'interface de modification

## 📝 Checklist de Vérification

Avant de tester, assurez-vous que :

- [ ] Le serveur Django est démarré (`python manage.py runserver`)
- [ ] Le serveur Vite est démarré (`npm run dev`)
- [ ] Le dossier `media/products/` existe
- [ ] Les permissions d'écriture sont correctes sur le dossier `media/`
- [ ] Vous êtes connecté à l'application
- [ ] La console du navigateur est ouverte (F12)
- [ ] Vous avez une image de test (JPG/PNG, < 5MB)

## 🎯 Test Final

Une fois que tout est configuré :

1. **Créez un nouveau produit avec une image**
2. **Vérifiez dans le dossier `media/products/`** que le fichier image est créé
3. **Actualisez la page Produits**
4. **L'image doit s'afficher** dans la carte du produit

Si l'image s'affiche correctement, le problème est résolu ! 🎉

## 📞 Si le problème persiste

Partagez les informations suivantes :

1. **Logs de la console navigateur** (lors de l'ajout d'un produit)
2. **Logs du serveur Django** (dans le terminal)
3. **Résultat de la commande :**
   ```powershell
   Get-ChildItem "c:\Users\Mouha\OneDrive\Bureau\gestions\gestion_stock\media\products"
   ```
4. **Capture d'écran de l'erreur**

---

*Dernière mise à jour : 2026-01-20*
