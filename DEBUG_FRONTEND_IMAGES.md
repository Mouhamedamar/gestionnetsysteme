
# 🔍 GUIDE DEBUG FRONTEND - UPLOAD IMAGES

## 🚨 PROBLÈME IDENTIFIÉ

Les images ne s'affichent pas correctement dans l'interface (couleurs unies au lieu des vraies images).

## 🔧 ÉTAPES DE DEBUG

### 1. Ouvrir les outils de développement

1. **Appuyez sur F12** dans votre navigateur
2. **Allez dans l'onglet Console**
3. **Allez dans l'onglet Network**

### 2. Tenter un upload d'image

1. **Allez dans Produits > Ajouter**
2. **Remplissez le formulaire**
3. **Sélectionnez une image**
4. **Observez la console** pendant l'upload

### 3. Messages à chercher dans la Console

**Messages normaux (succès) :**
```
🔵 handleFileChange appelé
✅ Fichier sélectionné: image.jpg image/jpeg 12345
✅ Preview généré
🔵 handleSubmit appelé, mode: create
✅ Ajout de la photo au FormData
🔵 Envoi de la requête...
✅ Requête terminée avec succès
```

**Messages d'erreur :**
```
❌ Session expirée
❌ Type de fichier invalide
❌ Fichier trop grand
❌ Network Error
❌ 401 Unauthorized
❌ 500 Internal Server Error
```

### 4. Vérifier l'onglet Network

1. **Filtrez par "XHR" ou "Fetch"**
2. **Cherchez la requête** vers `/api/products/`
3. **Vérifiez le statut** : doit être `201 Created`
4. **Vérifiez la réponse** : doit contenir `photo_url`

### 5. Tester les URLs d'images directement

Ouvrez ces URLs dans votre navigateur :
- http://localhost:8000/media/products/product_1_wifi.jpg
- http://localhost:8000/media/products/product_8_Écran_24_.jpg

Si elles ne s'ouvrent pas, le problème est côté serveur.

## 🔧 SOLUTIONS RAPIDES

### Solution 1 : Vider le cache
- **Ctrl+Shift+R** (Windows) ou **Cmd+Shift+R** (Mac)

### Solution 2 : Reconnecter
- Déconnectez-vous et reconnectez-vous avec admin/admin123

### Solution 3 : Redémarrer les serveurs
- Fermez les terminaux et redémarrez Django et React

### Solution 4 : Tester avec l'admin Django
- Allez sur http://localhost:8000/admin/
- Connectez-vous avec admin/admin123
- Allez dans Products
- Essayez d'ajouter une image via l'interface admin

## 📋 CHECKLIST

- [ ] Serveur Django tourne sur port 8000
- [ ] Serveur React tourne sur port 3002
- [ ] Connexion admin/admin123 fonctionne
- [ ] Console F12 ouverte
- [ ] Image < 5MB au format JPG/PNG
- [ ] Cache navigateur vidé

## 🆘 SI RIEN NE MARCHE

1. **Copiez TOUS les messages** de la console (F12)
2. **Copiez les erreurs** de l'onglet Network
3. **Testez les URLs d'images** directement dans le navigateur
4. **Vérifiez les logs Django** dans le terminal

---

**💡 Le problème vient probablement d'un token expiré ou d'un problème de CORS. Reconnectez-vous d'abord !**
