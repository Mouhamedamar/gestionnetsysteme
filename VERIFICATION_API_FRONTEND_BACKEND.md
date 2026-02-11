# 🔍 GUIDE COMPLET DE VÉRIFICATION API FRONTEND ↔ BACKEND

## 📋 Résumé

Vous avez trois façons de vérifier que l'API reçoit correctement les données du frontend :

---

## 1️⃣ **Vérifier les logs Django (Terminal)**

Django affiche maintenant un log détaillé chaque fois qu'un produit est créé.

### Où regarder?
- Ouvrez le terminal où Django tourne (`python.exe manage.py runserver`)
- Créez un produit via l'interface web
- Cherchez les logs qui ressemblent à:

```
================================================================================
CRÉATION PRODUIT - DONNÉES REÇUES
================================================================================
Method: POST
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
User: admin
Token: eyJ0eXAiOiJKV1QiLCJhbGc...

DATA KEYS: ['name', 'description', 'category', 'quantity', 'purchase_price', 'sale_price', 'alert_threshold', 'is_active']
  name: Mon Produit
  description: Une description
  category: Électronique
  quantity: 10
  purchase_price: 500.0
  sale_price: 750.0
  alert_threshold: 3
  is_active: true

FILES KEYS: ['photo']
  photo: produit_image.jpg (25432 bytes, type: image/jpeg)

✓ Photo trouvée dans FILES: produit_image.jpg, size: 25432

✓ Validation réussie
Données validées: {...}

✓ Produit créé avec succès!
  ID: 42
  Nom: Mon Produit
  Photo: products/produit_image_xyz.jpg
  Photo URL: http://localhost:8000/media/products/produit_image_xyz.jpg
================================================================================
```

### ✅ Checklist Django
- [ ] Logs montrent `Content-Type: multipart/form-data`
- [ ] Logs montrent la photo dans `FILES KEYS`
- [ ] Logs montrent `✓ Photo trouvée`
- [ ] Logs montrent `✓ Produit créé avec succès!`
- [ ] ID, Nom, Photo URL affichés correctement

---

## 2️⃣ **Vérifier la Console JavaScript (F12)**

### Comment faire?

1. Ouvrez votre app: **http://localhost:3000**
2. Appuyez sur **F12** pour ouvrir DevTools
3. Allez à l'onglet **Console**
4. Créez un nouveau produit avec une photo
5. Cherchez les logs `[ProductForm]`:

```javascript
[ProductForm] Données à envoyer: {
  name: "Mon Produit",
  description: "Une description",
  category: "Électronique",
  quantity: 10,
  purchase_price: 500,
  sale_price: 750,
  alert_threshold: 3,
  is_active: true,
  photo: "produit_image.jpg (25432 bytes)"
}
[ProductForm] Photo ajoutée: {
  name: "produit_image.jpg",
  size: 25432,
  type: "image/jpeg"
}
```

### ✅ Checklist Console
- [ ] Logs montrent tous les champs
- [ ] Logs montrent le nom et la taille de l'image
- [ ] Type MIME est correct (image/jpeg, image/png, etc.)

---

## 3️⃣ **Vérifier l'onglet Network (F12)**

### Comment faire?

1. F12 → onglet **Network**
2. Nettoyez les requêtes (icône 🚫)
3. Créez un nouveau produit
4. Cherchez une requête **POST** vers `/api/products/`
5. Cliquez dessus et vérifiez:

#### **Request Headers**
```
POST /api/products/ HTTP/1.1
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

✅ **Authorization** présent avec token
✅ **Content-Type** = multipart/form-data (pas application/json!)

#### **Form Data**
```
name: Mon Produit
description: Une description
category: Électronique
quantity: 10
purchase_price: 500
sale_price: 750
alert_threshold: 3
is_active: true
photo: (binary) produit_image.jpg (25432 bytes)
```

✅ Tous les champs présents
✅ Photo liste comme (binary) File

#### **Response**
```javascript
{
  "id": 42,
  "name": "Mon Produit",
  "photo": "products/produit_image_xyz.jpg",
  "photo_url": "http://localhost:8000/media/products/produit_image_xyz.jpg",
  ...
}
```

✅ Status: **201 Created** (ou 200 OK)
✅ `photo_url` présent dans la réponse
✅ URL correctement formée

---

## 🧪 **Test via Script Python**

Exécutez ce script pour tester l'API directement:

```bash
cd "C:\Users\Mouha\OneDrive\Bureau\gestions"
python.exe test_product_complete.py
```

**Résultat attendu:**
```
================================================================================
TEST COMPLET - ENVOI D'UN PRODUIT AVEC PHOTO
================================================================================

1. AUTHENTIFICATION
--------
✓ Authentification réussie
  Token: eyJ0eXAi...

2. CRÉATION D'UNE IMAGE DE TEST
--------
✓ Image créée: PNG 200x200 (12340 bytes)

3. PRÉPARATION DES DONNÉES
--------
Données:
  name: Produit Test API Python
  ...

4. ENVOI DE LA REQUÊTE
--------
Status: 201
Content-Type: application/json

5. RÉPONSE DU SERVEUR
--------
✓ Produit créé avec succès!
  ID: 43
  Nom: Produit Test API Python
  photo: products/test_api_python_xyz.png
  photo_url: http://localhost:8000/media/products/test_api_python_xyz.png

6. TEST D'ACCÈS À L'IMAGE
--------
  URL: http://localhost:8000/media/products/test_api_python_xyz.png
  Status: 200
  ✓ Image ACCESSIBLE
```

---

## 🚨 **Problèmes Courants**

| Problème | Cause | Solution |
|----------|-------|----------|
| Status 401 dans logs Django | Token manquant ou expiré | Vérifiez localStorage.accessToken |
| Status 400 | Données invalides | Vérifiez types (int, float, string) |
| Photo en `FILES` mais pas de photo_url | Photo pas sauvegardée | Vérifiez permissions disque |
| photo_url manquant de la réponse | Serializer pas appliqué | Redémarrez Django |
| Image 404 quand on teste URL | Chemin incorrect | Vérifiez MEDIA_ROOT et MEDIA_URL |

---

## 🎯 **Plan d'Action**

1. ✅ **Créer un produit avec photo** via l'interface
2. ✅ **Vérifier les logs Django** - vous devriez voir les logs détaillés
3. ✅ **Vérifier la Console JS** - vous devriez voir `[ProductForm]` logs
4. ✅ **Vérifier Network** - La requête POST doit être 201
5. ✅ **Tester l'URL photo** - Ouvrez l'URL dans le navigateur

Si tout est ✅, les images devraient s'afficher!

---

## 📞 **Si ça ne marche pas?**

Partagez-moi:
1. Les logs Django (collez-les ici)
2. Les erreurs de la Console JS (F12 > Console)
3. Le Status Code de la requête Network POST

