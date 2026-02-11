# DIAGNOSTIC - VÉRIFIER L'ENVOI API FRONTEND ↔ BACKEND

## Étape 1 : Vérifier les logs Django

Regardez le terminal où Django tourne. Vous devriez voir des logs comme ceci :

```
================================================================================
CRÉATION PRODUIT - DONNÉES REÇUES
================================================================================
Method: POST
Content-Type: multipart/form-data; boundary=...
User: admin
Token: eyJ0...

DATA KEYS: ['name', 'description', 'category', 'quantity', 'purchase_price', 'sale_price', 'alert_threshold', 'is_active']
  name: Test Product
  description: Description
  category: Test
  quantity: 5
  purchase_price: 100
  sale_price: 150
  alert_threshold: 2
  is_active: true

FILES KEYS: ['photo']
  photo: test_image.jpg (15234 bytes, type: image/jpeg)

✓ Photo trouvée dans FILES: test_image.jpg, size: 15234

✓ Validation réussie
Données validées: {...}

✓ Produit créé avec succès!
  ID: 35
  Nom: Test Product
  Photo: products/test_product.jpg
  Photo URL: http://localhost:8000/media/products/test_product.jpg
================================================================================
```

## Étape 2 : Vérifier la Console JavaScript (F12)

Ouvrez la console du navigateur et cherchez les logs de ProductForm :

```
[ProductForm] Données à envoyer: {
  name: "Test Product",
  photo: "test_image.jpg (15234 bytes)"
}
[ProductForm] Photo ajoutée: {
  name: "test_image.jpg",
  size: 15234,
  type: "image/jpeg"
}
```

## Étape 3 : Vérifier l'onglet Network (F12)

1. Ouvrez DevTools (F12)
2. Allez à l'onglet Network
3. Créez un nouveau produit
4. Cherchez la requête POST à `/api/products/`
5. Vérifiez:
   - **Request Headers**: Authorization avec Bearer token
   - **Form Data**: Tous les champs + photo
   - **Response Status**: 200 ou 201
   - **Response Body**: Produit créé avec photo_url

## Étape 4 : Tester l'API directement

Exécutez le script Python:

```bash
python test_product_complete.py
```

Cela créera un vrai produit avec une photo via l'API.

## Problèmes courants et solutions

### ❌ Status 401 (Non autorisé)
- Solution: Vérifiez que vous êtes connecté
- Vérifiez que le token est dans localStorage

### ❌ Status 400 (Données invalides)
- Vérifiez les types de données (quantity = int, prices = float)
- Vérifiez que tous les champs obligatoires sont présents

### ❌ Photo ne s'affiche pas dans le DOM
- Vérifiez que la réponse API contient photo_url
- Vérifiez que l'URL est correcte (http://localhost:8000/media/...)
- Testez l'URL directement dans le navigateur

### ❌ CORS bloque l'image
- Les logs CORS devraient apparaître dans la Console
- Le backend a CORS_ALLOW_ALL_ORIGINS = True en développement

## Checklist pour déboguer

- [ ] Django reçoit la requête POST
- [ ] Django voit le fichier photo dans request.FILES
- [ ] La photo est sauvegardée dans media/products/
- [ ] L'API retourne photo_url dans la réponse
- [ ] Le frontend reçoit la réponse 200/201
- [ ] Le frontend affiche photo_url dans le DOM
- [ ] L'image se charge depuis le navigateur
