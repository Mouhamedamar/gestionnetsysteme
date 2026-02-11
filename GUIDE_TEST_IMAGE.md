# Guide de Test - Problème d'Affichage d'Image

## 📋 Étapes de Test

### 1. Ouvrir la Console du Navigateur
- Appuyez sur **F12** ou clic droit → **Inspecter**
- Allez dans l'onglet **Console**

### 2. Vider le Cache
- Appuyez sur **Ctrl + F5** pour recharger la page sans cache
- Ou clic droit sur le bouton refresh → "Vider le cache et recharger"

### 3. Ajouter un Nouveau Produit
1. Cliquez sur **"Nouveau Produit"**
2. Remplissez tous les champs requis :
   - Nom du produit
   - Catégorie
   - Quantité
   - Prix d'achat
   - Prix de vente
3. **Sélectionnez une image** en cliquant sur "Choisir un fichier"

### 4. Vérifiez dans la Console

#### Quand vous sélectionnez l'image, vous devriez voir :
```
Fichier sélectionné: nom_image.jpg image/jpeg 123456
Preview généré, taille: 123456
```

#### L'aperçu de l'image devrait apparaître sous le champ "Photo"

#### Cliquez sur "Créer"

#### Dans la console, vous devriez voir :
```
Ajout de la photo au FormData: nom_image.jpg
Produit créé: { id: X, name: "...", photo: "products/nom_image.jpg", photo_url: "http://localhost:8000/media/products/nom_image.jpg", ... }
Photo du nouveau produit: products/nom_image.jpg
Photo URL du nouveau produit: http://localhost:8000/media/products/nom_image.jpg
Produits chargés depuis l'API: 9
Produit Nom du Produit: photo=products/nom_image.jpg, photo_url=http://localhost:8000/media/products/nom_image.jpg
```

### 5. Vérifiez l'Affichage

Après la fermeture du modal, vous devriez voir :
- ✅ La carte du nouveau produit dans la liste
- ✅ L'image affichée dans la carte

## 🔍 Que Vérifier Si ça Ne Marche Pas

### Scénario A : Pas de preview dans le formulaire
**Symptômes** : L'image ne s'affiche pas sous le champ "Photo" après sélection

**Vérifiez** :
- Est-ce que vous voyez les messages "Fichier sélectionné" et "Preview généré" dans la console ?
- Y a-t-il des erreurs dans la console ?

### Scénario B : Le produit est créé mais sans photo
**Symptômes** : Le produit apparaît dans la liste mais sans image

**Vérifiez dans la console** :
- Est-ce que `photo_url` est `null` ou vide dans la réponse de création ?
- Est-ce que vous voyez "Aucun fichier photo à envoyer" au lieu de "Ajout de la photo au FormData" ?

### Scénario C : photo_url est présent mais l'image ne charge pas
**Symptômes** : La carte produit est là mais l'image ne charge pas (icône cassée)

**Vérifiez** :
- Ouvrez l'onglet **Network** (Réseau) dans les DevTools
- Filtrez par "Img"  
- Vérifiez si la requête pour l'image retourne une erreur 404 ou 500
- Vérifiez l'URL exacte qui est demandée

## 📸 Captures d'Écran à Partager

Si le problème persiste, partagez :
1. **Console** complète lors de l'ajout d'un produit
2. **Network Tab** montrant la requête POST /api/products/ et sa réponse
3. **Network Tab** montrant les requêtes GET pour les images

## 🛠️ Corrections Appliquées

### Backend (Django)
- ✅ Ajout de `get_serializer_context()` dans `ProductViewSet` pour générer `photo_url`
- ✅ Configuration media files déjà correcte dans `settings.py` et `urls.py`

### Frontend (React)
- ✅ Amélioration de la logique d'URL d'image dans `ProductCard.jsx`
- ✅ Ajout de logs détaillés dans `ProductForm.jsx`
- ✅ Ajout de logs détaillés dans `AppContext.jsx`
- ✅ Gestion correcte du FormData pour l'upload

## 📝 Notes

- Les images existantes s'affichent correctement ✅
- Le serveur Django sert les fichiers media correctement ✅
- Le dossier `media/products/` existe et contient déjà des images ✅
