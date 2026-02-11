# ⚡ Solution Rapide - Afficher les Images

## 🎯 Le Problème
Le dossier `media/products/` est vide = aucune image n'a été téléchargée pour vos produits.

## ✅ Solution en 3 Minutes

### Étape 1 : Démarrer les Serveurs

#### Terminal 1 - Backend Django
```powershell
cd c:\Users\Mouha\OneDrive\Bureau\gestions\gestion_stock
python manage.py runserver
```

**Attendez de voir :**
```
Starting development server at http://127.0.0.1:8000/
```

#### Terminal 2 - Frontend React
Ouvrez un NOUVEAU terminal :
```powershell
cd c:\Users\Mouha\OneDrive\Bureau\gestions\frontend
npm run dev
```

**Attendez de voir :**
```
Local: http://localhost:3000/ (ou 5173)
```

### Étape 2 : Ajouter une Image à un Produit Existant

1. **Ouvrez votre navigateur** : http://localhost:3000 (ou le port affiché)

2. **Connectez-vous** avec vos identifiants

3. **Allez sur la page Produits**

4. **Pour "Mouhamadou Mbacké Amar" ou "wifi" :**
   - Cliquez sur le bouton **Modifier** (icône crayon)
   - Dans le formulaire, cliquez sur **"Parcourir"** pour la photo
   - Sélectionnez une image de votre ordinateur (JPG/PNG, max 5MB)
   - Cliquez sur **"Modifier"** pour sauvegarder

5. **L'image devrait maintenant s'afficher !** 🎉

### Étape 3 : Créer un Nouveau Produit avec Image

1. **Cliquez sur "Nouveau Produit"**

2. **Remplissez le formulaire :**
   - Nom : "Test Image"
   - Catégorie : "Test"
   - Prix d'achat : 1000
   - Prix de vente : 1500
   - Quantité : 10
   - **📸 Sélectionnez une image**

3. **Cliquez sur "Créer"**

4. **L'image devrait s'afficher immédiatement !** 🎉

## 🔍 Vérification

Après avoir ajouté une image, vérifiez que le fichier existe :

```powershell
# Dans un terminal PowerShell
Get-ChildItem "c:\Users\Mouha\OneDrive\Bureau\gestions\gestion_stock\media\products"
```

Vous devriez voir des fichiers .jpg ou .png !

## 🐛 Problèmes Courants

### L'image ne se télécharge pas

**Ouvrez la console du navigateur (F12)** et regardez les erreurs :

- ❌ **CORS error** → Vérifiez que Django tourne sur le port 8000
- ❌ **Network error** → Vérifiez que les deux serveurs sont démarrés
- ❌ **413 Request Entity Too Large** → Votre image est trop grande (max 5MB)

### L'image ne s'affiche pas après upload

1. **Actualisez la page** (F5)
2. **Vérifiez que le fichier existe** dans `media/products/`
3. **Testez l'URL directement** : http://localhost:8000/media/products/nom_image.jpg

### "Aucune photo" après avoir cliqué Modifier

C'est normal ! Ça veut dire que ce produit n'a pas d'image enregistrée.
→ **Solution** : Sélectionnez une nouvelle image et enregistrez.

## 📸 Où Trouver des Images de Test ?

Si vous n'avez pas d'images, vous pouvez :

1. **Télécharger des images gratuites** :
   - Unsplash : https://unsplash.com
   - Pexels : https://www.pexels.com
   - Pixabay : https://pixabay.com

2. **Créer une image simple** :
   - Ouvrez Paint
   - Créez un rectangle coloré
   - Écrivez du texte dessus
   - Enregistrez en JPG

## 🎬 Vidéo des Étapes

### Via l'Interface Web

```
1. Login → Produits → Modifier (bouton crayon)
   ↓
2. Cliquez "Parcourir" dans la section Photo
   ↓
3. Sélectionnez une image (JPG/PNG)
   ↓
4. Cliquez "Modifier" pour sauvegarder
   ↓
5. L'image s'affiche ! ✅
```

## 🔧 Alternative : Utiliser l'Admin Django

Si l'interface web ne fonctionne pas, utilisez l'admin Django :

1. **Allez sur** : http://localhost:8000/admin/

2. **Connectez-vous** avec votre compte admin

3. **Cliquez sur "Products"**

4. **Cliquez sur le produit à modifier**

5. **Dans la section "Photo"** :
   - Cliquez sur "Choisir un fichier"
   - Sélectionnez une image
   - Cliquez sur "Enregistrer"

6. **Retournez sur l'interface web** → L'image devrait s'afficher !

## ✅ Checklist

Avant de tester, assurez-vous que :

- [ ] Le serveur Django est démarré (terminal 1)
- [ ] Le serveur frontend est démarré (terminal 2)
- [ ] Vous êtes connecté à l'application
- [ ] Vous avez une image à uploader (< 5MB)
- [ ] La console du navigateur est ouverte (F12) pour voir les erreurs

## 📊 Résultat Final

Après avoir suivi ces étapes, vous devriez avoir :

1. ✅ Des fichiers dans `media/products/`
2. ✅ Les images qui s'affichent sur les cartes produits
3. ✅ Plus de message "Aucune image"

---

**Besoin d'aide ?** Partagez :
- Une capture d'écran de l'erreur dans la console
- Les logs du serveur Django
- Le résultat de `Get-ChildItem media\products`

*Dernière mise à jour : 2026-01-20*
