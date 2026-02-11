# 🔍 INSTRUCTIONS POUR DÉBUGGER LES IMAGES

## 📋 ÉTAPES À SUIVRE MAINTENANT

### 1. Ouvrir votre navigateur

**Allez sur** : http://localhost:3002

### 2. Ouvrir les outils de développement

**Appuyez sur F12** et positionnez les outils en bas ou sur le côté

### 3. Aller dans l'onglet Console

Cliquez sur **"Console"** dans les outils de développement

### 4. Vider la console

Cliquez sur l'icône 🚫 ou faites un clic droit → "Clear console"

### 5. Tenter d'ajouter une image

1. **Allez dans "Produits"**
2. **Cliquez "Ajouter un produit"**
3. **Remplissez** :
   - Nom : "Test Debug"
   - Prix achat : 10
   - Prix vente : 15
   - Quantité : 5
4. **Cliquez sur le bouton "Parcourir" pour sélectionner une image**
5. **Sélectionnez une image JPG ou PNG**

### 6. Observer la console

**COPIEZ TOUS LES MESSAGES** qui apparaissent dans la console

Cherchez particulièrement :
- Messages commençant par 🔵, ✅, ❌
- Messages d'erreur en rouge
- Warnings en jaune

### 7. Cliquer sur "Créer"

Après avoir sélectionné l'image, cliquez sur "Créer"

### 8. Observer l'onglet Network

1. **Cliquez sur l'onglet "Network"** (à côté de Console)
2. **Filtrez par "Fetch/XHR"**
3. **Cherchez la requête** vers `/api/products/`
4. **Cliquez dessus** et notez :
   - **Status** : (200, 201, 401, 500, etc.)
   - **Headers** → Request Headers → Authorization
   - **Payload** → Form Data
   - **Response**

## 🎯 INFORMATIONS À ME DONNER

Copiez et envoyez-moi :

1. **Tous les messages de la Console** (étape 6)
2. **Le Status de la requête** (étape 8)
3. **Les erreurs** s'il y en a
4. **Ce qui se passe** : 
   - L'image se sélectionne-t-elle ?
   - Voyez-vous un aperçu ?
   - Le bouton "Créer" fonctionne-t-il ?
   - Y a-t-il un message d'erreur ?

## 🔍 PROBLÈMES COURANTS

### Problème A : Rien ne se passe quand je clique sur "Parcourir"
→ Problème JavaScript - videz le cache (Ctrl+Shift+R)

### Problème B : L'image se sélectionne mais pas d'aperçu
→ Regardez la console pour les erreurs

### Problème C : Erreur "Session expirée" ou "401"
→ Déconnectez-vous et reconnectez-vous

### Problème D : Erreur "500 Internal Server Error"
→ Problème serveur - vérifiez que Django tourne

### Problème E : Aucun message dans la console
→ JavaScript désactivé ou cache - Ctrl+Shift+R

---

**💡 Faites ces étapes et donnez-moi les messages exacts de la console !**