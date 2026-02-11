# 🔥 GUIDE DE TEST - Upload d'Images

## Problème à résoudre
Les images ne se créent pas ni ne se modifient lors de l'ajout/modification de produits.

## Corrections apportées

### 1. Frontend (React)
✅ **ProductForm.jsx** - Interface utilisateur améliorée
- Bouton visible et cliquable pour sélectionner les images
- Prévisualisation de l'image avant upload
- Possibilité de supprimer l'image sélectionnée
- Messages d'aide pour l'utilisateur

✅ **AppContext.jsx** - Gestion correcte du FormData
- Suppression explicite du Content-Type pour FormData
- Le navigateur gère automatiquement le boundary multipart/form-data

### 2. Backend (Django)
✅ **views.py** - Amélioration des logs et gestion des fichiers
- Logs détaillés pour déboguer l'upload
- Vérification dans request.FILES
- Gestion correcte des fichiers pour CREATE et UPDATE

✅ **serializers.py** - Logs de débogage ajoutés

## Comment tester

### Option 1: Avec le fichier HTML de test

1. **Assurez-vous que le serveur Django est lancé:**
   ```bash
   cd gestion_stock
   python manage.py runserver
   ```

2. **Ouvrez le fichier de test dans votre navigateur:**
   - Ouvrez `test_upload.html` dans Chrome/Firefox
   - Cliquez sur "Se connecter" (admin/admin)
   - Sélectionnez une image
   - Cliquez sur "Créer le produit avec photo"
   - Vérifiez que l'image s'affiche dans le résultat

### Option 2: Avec l'application React

1. **Lancez le backend:**
   ```powershell
   cd gestion_stock
   python manage.py runserver
   ```

2. **Lancez le frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Testez l'upload:**
   - Allez sur http://localhost:3000/products
   - Cliquez sur "Nouveau Produit"
   - Remplissez le formulaire
   - Cliquez sur le bouton violet "Choisir une image"
   - Sélectionnez une image
   - Vérifiez la prévisualisation
   - Cliquez sur "Créer"
   - L'image devrait s'afficher sur la carte du produit

4. **Testez la modification:**
   - Cliquez sur "Modifier" sur un produit
   - Cliquez sur "Changer l'image"
   - Sélectionnez une nouvelle image
   - Cliquez sur "Modifier"
   - La nouvelle image devrait s'afficher

## Vérifications importantes

### 1. Vérifier les dossiers media
```powershell
cd gestion_stock
python check_media_setup.py
```

Cela doit créer:
- `gestion_stock/media/`
- `gestion_stock/media/products/`

### 2. Vérifier les logs du serveur Django
Regardez dans le terminal où Django tourne pour voir:
```
=== CRÉATION PRODUIT ===
Content-Type: multipart/form-data
Photo trouvée dans FILES: image.jpg, size: 12345
```

### 3. Vérifier dans la console du navigateur (F12)
```javascript
🔵 handleFileChange appelé
✅ Fichier sélectionné: image.jpg
✅ Preview généré
🔵 handleSubmit appelé
✅ Ajout de la photo au FormData
```

## Problèmes potentiels et solutions

### ❌ "Photo non trouvée dans FILES"
**Solution:** Vérifiez que le Content-Type n'est pas défini manuellement dans la requête fetch

### ❌ "Permission denied" dans les logs
**Solution:** 
```powershell
cd gestion_stock
icacls media /grant Everyone:F /T
```

### ❌ L'image ne s'affiche pas après création
**Solution:** Vérifiez que:
1. Le fichier existe dans `gestion_stock/media/products/`
2. L'URL retournée par l'API est correcte (http://localhost:8000/media/products/...)
3. Le serveur Django sert bien les fichiers media (DEBUG=True dans settings.py)

## Fichiers modifiés

1. `frontend/src/components/ProductForm.jsx` - UI améliorée pour l'upload
2. `frontend/src/context/AppContext.jsx` - Correction gestion FormData
3. `gestion_stock/products/views.py` - Logs et gestion fichiers
4. `gestion_stock/products/serializers.py` - Logs de débogage

## Test de présentation

Pour votre présentation, suivez ces étapes:

1. **Démarrer les serveurs**
2. **Montrer la création d'un produit avec image**
   - Interface utilisateur claire avec bouton violet
   - Prévisualisation de l'image
   - Confirmation de succès
   - Image affichée sur la carte produit

3. **Montrer la modification d'un produit**
   - Changement de l'image
   - Nouvelle image affichée

4. **Montrer les logs (optionnel)**
   - Logs Django montrant l'upload
   - Console navigateur montrant le flux

Bonne présentation! 🚀
