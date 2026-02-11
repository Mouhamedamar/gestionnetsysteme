# ✅ Guide - Système de Facturation

## 🎯 État Actuel du Système

Votre système de facturation est maintenant **opérationnel** avec des données de test !

### 📊 Statistiques

- **Total de factures** : 20
- **Factures payées** : 13 (65%)
- **Factures non payées** : 7 (35%)
- **Chiffre d'affaires** : 31,211.93 FCFA
- **Items de facture** : Nombreux produits vendus

## 🖼️ Accès au Module Factures

### Via le Frontend

1. **Démarrez les serveurs** :
   ```bash
   # Backend
   cd gestion_stock
   python manage.py runserver
   
   # Frontend (nouveau terminal)
   cd frontend
   npm run dev
   ```

2. **Ouvrez l'application** :
   ```
   http://localhost:3000/invoices
   ```

3. **Vous devriez voir** :
   - Liste des 20 factures de test
   - Numéros de facture (format: INV-YYYYMMDD-XXXXX)
   - Noms des clients
   - Montants HT et TTC
   - Statuts (Payé/Non payé)
   - Date de création

## 📋 Fonctionnalités Disponibles

### 1. Créer une Nouvelle Facture

**Via l'interface web** :
1. Cliquez sur **"Nouvelle Facture"**
2. Remplissez le formulaire :
   - Nom du client
   - Statut (Payé/Non payé)
3. Ajoutez des produits :
   - Sélectionnez un produit
   - Indiquez la quantité
   - Le prix est automatiquement rempli
4. Cliquez sur **"Ajouter"** pour chaque produit
5. Cliquez sur **"Créer la Facture"**

**Via l'API** :
```bash
POST http://localhost:8000/api/invoices/
Content-Type: application/json
Authorization: Bearer <token>

{
  "client_name": "Jean Dupont",
  "status": "NON_PAYE",
  "items": [
    {
      "product": 1,
      "quantity": 2,
      "unit_price": 1200.00
    }
  ]
}
```

### 2. Consulter une Facture

- Cliquez sur **"Voir"** pour afficher les détails
- Voir tous les items (produits vendus)
- Consulter les totaux HT et TTC
- Vérifier le statut de paiement

### 3. Télécharger en PDF

- Cliquez sur l'icône **"Télécharger"** 
- La facture sera générée en PDF avec :
  - En-tête professionnel
  - Logo de l'entreprise
  - Détails du client
  - Liste des produits
  - Totaux HT et TTC
  - Conditions de paiement

### 4. Annuler une Facture

- Cliquez sur **"Annuler"**
- Le stock des produits sera automatiquement restauré
- Le statut passera à "Annulée"
- Le chiffre d'affaires sera recalculé

### 5. Filtrer et Rechercher

**Filtres disponibles** :
- Par statut (Payé/Non payé)
- Par client (recherche)
- Par numéro de facture

**Tri** :
- Par date (plus récentes en premier)
- Par montant
- Par client

## 💡 Caractéristiques Importantes

### Gestion Automatique du Stock

✅ **À la création d'une facture** :
- Le stock est automatiquement déduit pour chaque produit
- Validation : impossible de vendre plus que le stock disponible

✅ **À l'annulation d'une facture** :
- Le stock est automatiquement restauré
- Les quantités sont remises à leur état initial

### Calculs Automatiques

✅ **Totaux** :
- **HT** (Hors Taxe) : Calculé automatiquement
- **TTC** (Toutes Taxes Comprises) : HT + 20% de TVA
- **Sous-totaux** : Quantité × Prix unitaire

### Numérotation Automatique

Chaque facture reçoit un numéro unique au format :
```
INV-YYYYMMDD-XXXXXXXX
```

Exemple : `INV-20260120-97E99C24`

## 📊 Tableau de Bord

Accédez aux statistiques globales sur :
```
http://localhost:3000/dashboard
```

Vous verrez :
- Nombre total de factures
- Chiffre d'affaires
- Factures récentes
- Graphiques de ventes

## 🔧 Scripts Utiles Créés

### 1. `create_sample_invoices.py`
Crée des factures de test avec des données réalistes.

```bash
python create_sample_invoices.py
```

**Ce qu'il fait** :
- Crée 10 factures aléatoires
- Avec des clients fictifs
- Des dates variées (sur 30 derniers jours)
- Des statuts mixtes (70% payé, 30% non payé)
- 1 à 5 produits par facture

### 2. `update_product_stock.py`
Met à jour le stock de tous les produits.

```bash
python update_product_stock.py
```

**Ce qu'il fait** :
- Ajoute entre 50 et 200 unités à chaque produit
- Permet de créer plus de factures
- Évite les erreurs de stock insuffisant

## ⚠️ Points d'Attention

### Produits avec Prix à 0 FCFA

Certains produits ont un prix de vente de 0 FCFA. Pour les corriger :

1. **Via l'interface web** :
   - Allez sur `/products`
   - Cliquez sur "Modifier" pour chaque produit
   - Définissez un prix de vente valide
   - Enregistrez

2. **Via l'admin Django** :
   - `http://localhost:8000/admin/`
   - Products → Modifier
   - Définir `sale_price` > 0

### Stock Insuffisant

Si vous essayez de créer une facture et recevez une erreur "Stock insuffisant" :

1. Vérifiez le stock du produit sur `/products`
2. Utilisez le script `update_product_stock.py` pour ajouter du stock
3. Ou créez une entrée de stock manuelle via `/stock-movements`

## 🚀 Fonctionnalités Avancées

### 1. Mouvements de Stock

Accédez à :
```
http://localhost:3000/stock-movements
```

Vous pouvez :
- Voir tous les mouvements (entrées et sorties)
- Les sorties de stock liées aux factures
- Créer des entrées de stock manuelles

### 2. Gestion des Clients

Le système supporte deux modes :
- **Client simple** : Nom uniquement (client_name)
- **Client enregistré** : ForeignKey vers le modèle Client

Actuellement, les factures de test utilisent le mode simple.

### 3. API REST Complète

Consultez la documentation Swagger :
```
http://localhost:8000/swagger/
```

**Endpoints disponibles** :
- `GET /api/invoices/` - Liste des factures
- `POST /api/invoices/` - Créer une facture
- `GET /api/invoices/{id}/` - Détails d'une facture
- `POST /api/invoices/{id}/cancel/` - Annuler une facture
- `DELETE /api/invoices/{id}/` - Supprimer (soft delete)

## 📱 Export et Impression

### Générer un PDF

Depuis la page de détails d'une facture :
1. Cliquez sur **"Télécharger PDF"**
2. Le PDF inclut :
   - Logo et informations entreprise
   - Informations client
   - Liste détaillée des produits
   - Totaux HT et TTC
   - Conditions de paiement

### Imprimer

Utilisez le bouton **"Imprimer"** pour une impression directe.

## 🎨 Personnalisation

### Logo de l'Entreprise

Modifiez dans [`frontend/src/components/InvoicePDF.jsx`](./frontend/src/components/InvoicePDF.jsx) :

```jsx
<div className="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center">
  <Package className="w-10 h-10 text-white" />
</div>
```

Remplacez par votre logo :
```jsx
<img src="/logo.png" alt="Logo" className="w-16 h-16" />
```

### Informations Entreprise

Dans le même fichier, modifiez :

```jsx
<p className="font-bold text-lg">Gestion de Stock SARL</p>
<p className="mt-2">123 Rue de la Technologie</p>
<p>Dakar, Sénégal</p>
<p>Tél: +221 XX XXX XX XX</p>
```

## 🔍 Dépannage

### Les factures ne s'affichent pas ?

1. **Vérifiez que les serveurs tournent** :
   ```bash
   # Terminal 1
   cd gestion_stock
   python manage.py runserver
   
   # Terminal 2
   cd frontend
   npm run dev
   ```

2. **Vérifiez la console du navigateur** (F12)
   - Recherchez les erreurs 404 ou 500
   - Vérifiez les requêtes vers `/api/invoices/`

3. **Testez l'API directement** :
   ```
   http://localhost:8000/api/invoices/
   ```

### Erreur lors de la création de facture ?

1. **Stock insuffisant** : Vérifiez le stock du produit
2. **Produit introuvable** : Assurez-vous que le produit existe et est actif
3. **Prix invalide** : Le prix doit être > 0

### PDF ne se génère pas ?

1. Vérifiez que `jspdf` et `html2canvas` sont installés :
   ```bash
   cd frontend
   npm install jspdf html2canvas
   ```

2. Rechargez la page et réessayez

## 📈 Prochaines Étapes

1. ✅ **Ajoutez de vraies données** :
   - Créez vos propres produits avec les bons prix
   - Créez de vraies factures clients
   - Supprimez les données de test si nécessaire

2. ✅ **Personnalisez le système** :
   - Ajoutez votre logo
   - Modifiez les informations entreprise
   - Adaptez les couleurs à votre charte

3. ✅ **Explorez les fonctionnalités** :
   - Testez l'annulation de factures
   - Générez des PDFs
   - Consultez les statistiques

---

**✅ Votre système de facturation est prêt à l'emploi !** 🎉

Pour toute question ou problème, consultez :
- Documentation API : `http://localhost:8000/swagger/`
- Guide des images : [`GUIDE_IMAGES_CORRIGEES.md`](./GUIDE_IMAGES_CORRIGEES.md)
