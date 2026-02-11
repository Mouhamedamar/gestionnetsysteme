# 🔧 GUIDE DE DÉPANNAGE - UPLOAD D'IMAGES FRONTEND

## ✅ ÉTAT ACTUEL

- **Backend Django** : ✅ Fonctionne parfaitement
- **Upload direct** : ✅ Testé et validé
- **Serializer** : ✅ Génère correctement les photo_url
- **Permissions** : ✅ Toutes vérifiées

## 🔍 DIAGNOSTIC DU PROBLÈME FRONTEND

### 1. Ouvrir les outils de développement

1. **Ouvrez votre navigateur** sur http://localhost:3000
2. **Appuyez sur F12** pour ouvrir les outils de développement
3. **Allez dans l'onglet Console** pour voir les erreurs JavaScript
4. **Allez dans l'onglet Network** pour voir les requêtes HTTP

### 2. Tester l'upload d'image

1. **Connectez-vous** avec `admin` / `admin123`
2. **Allez dans Produits** → **Ajouter un produit**
3. **Remplissez le formulaire** et **sélectionnez une image**
4. **Observez la console** pour les messages de debug

### 3. Messages à rechercher dans la console

**Messages normaux (OK) :**
```
🔵 handleFileChange appelé
🔵 Fichier détecté: [object File]
✅ Fichier sélectionné: image.jpg image/jpeg 12345
✅ Preview généré, taille: 16384
🔵 handleSubmit appelé, mode: create
✅ Ajout de la photo au FormData: image.jpg taille: 12345 type: image/jpeg
🔵 Envoi de la requête...
✅ Requête terminée avec succès
```

**Messages d'erreur possibles :**
```
❌ Type de fichier invalide: text/plain
❌ Fichier trop grand: 6000000
❌ Erreur lors de la lecture du fichier
⚠️  Aucun fichier photo à envoyer
```

### 4. Vérifier les requêtes réseau

Dans l'onglet **Network** :

1. **Filtrez par "XHR"** ou "Fetch"
2. **Cherchez la requête** vers `/api/products/`
3. **Vérifiez le statut** : doit être `201 Created`
4. **Vérifiez les headers** : `Content-Type: multipart/form-data`
5. **Vérifiez la réponse** : doit contenir `photo_url`

## 🚀 SOLUTIONS SELON LE PROBLÈME

### Problème 1 : "Aucun fichier sélectionné"

**Cause :** L'input file ne fonctionne pas
**Solution :**
```html
<!-- Vérifiez que l'input a bien ces attributs -->
<input
  type="file"
  accept="image/*"
  onChange={handleFileChange}
  className="input-field"
/>
```

### Problème 2 : "Type de fichier invalide"

**Cause :** Le fichier n'est pas reconnu comme image
**Solution :** Utilisez uniquement des fichiers `.jpg`, `.png`, `.gif`

### Problème 3 : "Erreur 401 Unauthorized"

**Cause :** Token d'authentification expiré
**Solution :**
1. Déconnectez-vous et reconnectez-vous
2. Ou rafraîchissez la page (F5)

### Problème 4 : "Erreur 413 Request Entity Too Large"

**Cause :** Fichier trop volumineux
**Solution :** Utilisez une image < 5MB

### Problème 5 : "Erreur 500 Internal Server Error"

**Cause :** Problème serveur Django
**Solution :**
1. Vérifiez les logs Django dans le terminal
2. Redémarrez le serveur Django

## 🧪 TESTS MANUELS

### Test 1 : Upload simple

1. **Créez un nouveau produit** avec ces données :
   - Nom : "Test Upload Web"
   - Prix achat : 10
   - Prix vente : 15
   - Quantité : 5
   - **Sélectionnez une image**

2. **Cliquez sur "Créer"**

3. **Vérifiez** que le produit apparaît avec son image

### Test 2 : Modification d'image

1. **Éditez un produit existant**
2. **Changez l'image**
3. **Sauvegardez**
4. **Vérifiez** que la nouvelle image s'affiche

### Test 3 : Suppression d'image

1. **Éditez un produit avec image**
2. **Sélectionnez "Aucun fichier"** dans l'input
3. **Sauvegardez**
4. **Vérifiez** que l'image disparaît

## 🔧 CORRECTIONS POSSIBLES

### Si le problème persiste, modifiez le code :

**1. Forcer le rechargement après upload :**

Dans `ProductForm.jsx`, après la ligne `onClose();` :
```javascript
// Forcer le rechargement de la page
window.location.reload();
```

**2. Ajouter plus de logs :**

Dans `handleFileChange`, ajoutez :
```javascript
console.log('📁 Input files:', e.target.files);
console.log('📁 File details:', {
  name: file?.name,
  size: file?.size,
  type: file?.type,
  lastModified: file?.lastModified
});
```

**3. Vérifier FormData :**

Dans `handleSubmit`, ajoutez :
```javascript
// Afficher le contenu du FormData
for (let [key, value] of formDataToSend.entries()) {
  console.log(`📤 FormData: ${key} =`, value);
}
```

## 📞 SUPPORT AVANCÉ

Si aucune solution ne fonctionne :

1. **Copiez les messages d'erreur** de la console
2. **Copiez la requête réseau** qui échoue
3. **Vérifiez les logs Django** dans le terminal
4. **Testez avec un autre navigateur**
5. **Testez avec une autre image**

## 🎯 CHECKLIST FINALE

- [ ] Serveur Django démarré sur port 8000
- [ ] Serveur React démarré sur port 3000
- [ ] Utilisateur connecté avec admin/admin123
- [ ] Console du navigateur ouverte (F12)
- [ ] Image de test < 5MB au format JPG/PNG
- [ ] Cache navigateur vidé (Ctrl+Shift+R)

---

**💡 Dans 99% des cas, le problème vient d'un token expiré ou d'un serveur non démarré. Vérifiez d'abord ces points !**