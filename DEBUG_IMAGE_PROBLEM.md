# Diagnostic du problème d'affichage d'image

## Problème rapporté
L'image ne s'affiche pas quand on ajoute un nouveau produit.

## Ce qui fonctionne déjà ✅
- Les images des produits existants s'affichent correctement
- Le serveur Django sert les fichiers media (logs montrent code 200)
- La configuration Django pour les fichiers media est correcte

## Scénarios possibles du problème

### Scénario 1: L'aperçu dans le formulaire ne s'affiche pas
**Symptôme**: Quand vous sélectionnez une image dans le formulaire d'ajout, l'aperçu ne s'affiche pas

**Solution**: Le code du ProductForm utilise déjà FileReader pour l'aperçu, donc ça devrait fonctionner.

### Scénario 2: L'image ne s'affiche pas après création dans la liste
**Symptôme**: Après avoir créé le produit et fermé le modal, la nouvelle carte produit n'affiche pas l'image

**Cause probable**: 
1. Le backend retourne le nouveau produit mais sans `photo_url` généré
2. Le frontend recharge la liste mais ne reconstruit pas correctement l'URL

## Tests à faire

1. **Ouvrez la console du navigateur** (F12)
2. **Ajoutez un nouveau produit avec une image**
3. **Regardez la console pour**:
   - Les messages "ProductCard - product:" et "ProductCard - imageUrl:"
   - Les erreurs de chargement d'image
   - La réponse de l'API POST /api/products/

4. **Vérifiez dans la réponse de l'API**:
   - Est-ce que `photo_url` est présent ?
   - Est-ce que `photo` contient le bon chemin ?

## Solution appliquée

J'ai déjà ajouté `get_serializer_context()` dans ProductViewSet pour s'assurer que le serializer a accès à `request` et peut générer `photo_url` correctement.

## Prochaines étapes recommandées

Si le problème persiste, vérifiez:
1. Que le dossier `gestion_stock/media/products/` existe et est accessible en écriture
2. Les permissions du dossier media
3. Les logs Django au moment de la création du produit
