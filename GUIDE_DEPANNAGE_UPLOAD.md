# 🔧 GUIDE DE DÉPANNAGE - UPLOAD D'IMAGES

## 🚨 PROBLÈME IDENTIFIÉ

Vous ne pouvez pas ajouter ou modifier les images des produits. Voici la solution étape par étape.

## ✅ ÉTAPE 1 : VÉRIFIER LES SERVEURS

### Démarrer le serveur Django

1. **Ouvrez un terminal** (CMD ou PowerShell)
2. **Naviguez vers le dossier** :
   ```bash
   cd gestion_stock
   ```
3. **Démarrez le serveur** :
   ```bash
   py manage.py runserver
   ```
4. **Vérifiez** que vous voyez :
   ```
   Starting development server at http://127.0.0.1:8000/
   ```

### Démarrer le serveur Frontend

1. **Ouvrez un NOUVEAU terminal**
2. **Naviguez vers le dossier** :
   ```bash
   cd frontend
   ```
3. **Démarrez le serveur** :
   ```bash
   npm run dev
   ```
4. **Vérifiez** que vous voyez :
   ```
   Local:   http://localhost:3000/
   ```

## ✅ ÉTAPE 2 : TESTER L'APPLICATION

### Se connecter

1. **Ouvrez votre navigateur** : http://localhost:3000
2. **Connectez-vous** :
   - Username : `admin`
   - Password : `admin123`

### Tester l'upload d'image

1. **Allez dans "Produits"**
2. **Cliquez "Ajouter un produit"**
3. **Remplissez le formulaire** :
   - Nom : "Test Upload"
   - Prix achat : 10
   - Prix vente : 15
   - Quantité : 5
4. **Sélectionnez une image** (JPG/PNG < 5MB)
5. **Cliquez "Créer"**

## 🔍 ÉTAPE 3 : DIAGNOSTIC EN CAS D'ÉCHEC

### Ouvrir les outils de développement

1. **Appuyez sur F12** dans votre navigateur
2. **Allez dans l'onglet "Console"**
3. **Tentez l'upload** et observez les messages

### Messages normaux (succès) :
```
🔵 handleFileChange appelé
✅ Fichier sélectionné: image.jpg image/jpeg 12345
✅ Preview généré
🔵 handleSubmit appelé, mode: create
✅ Ajout de la photo au FormData
🔵 Envoi de la requête...
✅ Requête terminée avec succès
```

### Messages d'erreur courants :

**❌ "Session expirée" ou "401 Unauthorized"**
- **Solution** : Déconnectez-vous et reconnectez-vous

**❌ "Type de fichier invalide"**
- **Solution** : Utilisez uniquement JPG, PNG, GIF

**❌ "Fichier trop grand"**
- **Solution** : Utilisez une image < 5MB

**❌ "Network Error" ou "Failed to fetch"**
- **Solution** : Vérifiez que le serveur Django tourne

**❌ Aucun message dans la console**
- **Solution** : Videz le cache (Ctrl+Shift+R)

## 🔧 ÉTAPE 4 : SOLUTIONS SPÉCIFIQUES

### Problème : L'image ne se sélectionne pas

**Vérifiez** :
- Le bouton "Parcourir" fonctionne
- Vous sélectionnez bien un fichier image
- Le nom du fichier apparaît après sélection

**Solution** :
- Essayez avec un autre navigateur
- Redémarrez le serveur frontend

### Problème : L'image se sélectionne mais ne s'upload pas

**Vérifiez dans F12 > Network** :
- Une requête vers `/api/products/` est envoyée
- Le statut de la requête (200, 401, 500, etc.)
- Le contenu de la requête (doit être multipart/form-data)

**Solutions** :
- Token expiré → Reconnectez-vous
- Serveur Django arrêté → Redémarrez-le
- CORS bloqué → Vérifiez les deux serveurs

### Problème : L'upload semble réussir mais l'image n'apparaît pas

**Vérifiez** :
- La réponse de l'API contient `photo_url`
- L'URL de l'image est accessible : http://localhost:8000/media/products/...
- Le produit se recharge après création

**Solutions** :
- Rafraîchissez la page (F5)
- Vérifiez les permissions du dossier media/
- Redémarrez le serveur Django

## 🧪 ÉTAPE 5 : TESTS MANUELS

### Test 1 : Accès direct à l'API

Ouvrez dans votre navigateur :
- http://localhost:8000/api/products/
- Vous devriez voir la liste des produits en JSON

### Test 2 : Accès aux images

Ouvrez dans votre navigateur :
- http://localhost:8000/media/products/product_1_wifi.jpg
- Vous devriez voir l'image

### Test 3 : Interface d'admin Django

Ouvrez dans votre navigateur :
- http://localhost:8000/admin/
- Connectez-vous avec admin/admin123
- Allez dans Products
- Essayez d'ajouter une image via l'admin

## 📋 CHECKLIST DE VÉRIFICATION

- [ ] Serveur Django démarré (port 8000)
- [ ] Serveur React démarré (port 3000)
- [ ] Connexion réussie avec admin/admin123
- [ ] Console du navigateur ouverte (F12)
- [ ] Image de test < 5MB au format JPG/PNG
- [ ] Cache navigateur vidé (Ctrl+Shift+R)

## 🆘 EN CAS D'ÉCHEC TOTAL

Si rien ne fonctionne :

1. **Redémarrez tout** :
   - Fermez tous les terminaux
   - Redémarrez les deux serveurs
   - Videz le cache du navigateur

2. **Utilisez l'admin Django** :
   - http://localhost:8000/admin/
   - Ajoutez des images via l'interface d'admin
   - Vérifiez qu'elles apparaissent dans l'interface React

3. **Vérifiez les permissions** :
   - Le dossier `gestion_stock/media/products/` doit être accessible en écriture
   - Sur Windows, exécutez en tant qu'administrateur si nécessaire

## 💡 CONSEILS FINAUX

- **Patience** : L'upload peut prendre quelques secondes
- **Taille** : Utilisez des images < 1MB pour des tests rapides
- **Format** : JPG fonctionne mieux que PNG
- **Navigateur** : Chrome/Edge fonctionnent mieux que Firefox pour les uploads

---

**🎯 Dans 90% des cas, le problème vient d'un serveur non démarré ou d'un token expiré. Vérifiez d'abord ces points !**