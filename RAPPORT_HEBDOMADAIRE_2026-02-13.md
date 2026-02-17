# Rapport Hebdomadaire – Semaine du 10 au 13 février 2026

## Projet : Gestion Stock (NETSYSTÈME / Max-Immo)

---

## 1. Interventions

### 1.1 Formulaire « Nouvelle intervention »

- **Priorité** et **Type d'intervention** (requis) en tête de formulaire.
- **Type d'intervention** : liste complète (Installation, Maintenance, Installation Vidéo surveillance filaire/sans-fil, Installation Téléphonique, Sécurité Incendie, Réseau informatique, Entretien parc, Installation/MAJ/Dépannage logiciel, Centrale téléphonique, Formation initiale, Autres).
- Option **« Autres »** avec champ **Précisez**.
- **Client non enregistré** : case à cocher. Si cochée, affichage de Nom du client * et Téléphone.
- **Client existant** : liste déroulante si la case n’est pas cochée.
- **Technicien** : valeur par défaut « Assigner plus tard ».
- **Date prévue** : champ requis (datetime-local).
- **Durée estimée (minutes)** : champ numérique.
- **Adresse** : libellé simplifié.
- **Matériels requis** : remplacement de « Produits utilisés » par une liste avec :
  - case à cocher par produit,
  - affichage du stock « (X en stock) »,
  - champ Qté + unité « pcs ».

### 1.2 Autres modifications

- **Notes techniques** : champ supprimé.
- **Statut** : affiché uniquement en mode édition (pas en création).

---

## 2. Factures

- **Page détail facture (InvoiceItems)** : bouton **Imprimer** retiré.
- Conservation du bouton **Enregistrer** uniquement.

---

## 3. Notifications SMS – Mouvements de stock

### 3.1 Backend

- **Modèles** : `StockNotificationRecipient`, `StockAlertSettings`.
- **Service SMS** : `stock/notifications.py` avec messages pour entrées et sorties.
- **Signal** : envoi automatique d’un SMS à chaque création de mouvement de stock.
- **API** : gestion des responsables, paramètres d’alerte, envoi de SMS de test.
- Gestion des erreurs (ex. tables non créées).

### 3.2 Frontend

- **Page « Configuration SMS Stock »** (`/stock-notifications`) :
  - ajout / suppression des responsables (nom, téléphone),
  - test SMS,
  - seuil d’alerte.

### 3.3 Configuration

- Utilisation de **Twilio** (variables `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`).
- Sans Twilio : messages logués uniquement (aucun envoi réel).

---

## 4. Mouvements de stock

- Chargement des **produits réels** et des **mouvements** à l’affichage de la page.
- **Export** de `fetchStockMovements` dans le contexte d’application.
- Bouton **« Config SMS »** pour accéder à la configuration SMS.
- Correction de l’avertissement React sur la **prop key** des lignes du tableau.

---

## 5. Corrections diverses

| Problème | Solution |
|----------|----------|
| Erreur 500 (table `stock_stocknotificationrecipient` absente) | Gestion de l’exception dans le signal ; exécution des migrations recommandée |
| Produits non chargés dans Mouvements Stock | Chargement explicite via `fetchProducts` et `fetchStockMovements` à l’ouverture de la page |
| Warning « key » dans StockMovements | Utilisation de `key={movement.id ?? movement.pk ?? \`movement-${index}\`}` |

---

## 6. Fichiers principaux modifiés / créés

- `frontend/src/pages/Interventions.jsx`
- `frontend/src/pages/InvoiceItems.jsx`
- `frontend/src/pages/StockMovements.jsx`
- `frontend/src/pages/StockNotifications.jsx` (nouveau)
- `frontend/src/context/AppContext.jsx`
- `frontend/src/App.jsx`
- `frontend/src/components/Sidebar.jsx`
- `gestion_stock/stock/models.py`
- `gestion_stock/stock/notifications.py` (nouveau)
- `gestion_stock/stock/signals.py` (nouveau)
- `gestion_stock/stock/views.py`
- `gestion_stock/stock/admin.py`
- `gestion_stock/stock/migrations/0002_stock_notification_models.py` (nouveau)

---

## 7. À faire / À suivre

1. **Twilio** : configurer les variables d’environnement pour l’envoi réel des SMS.
2. **Migrations stock** : si la table manque encore, exécuter :
   ```bash
   python manage.py migrate stock 0001
   python manage.py migrate stock
   ```
3. **Tests** : vérifier le flux complet des interventions et des notifications SMS en conditions réelles.

---

*Rapport généré le 13 février 2026*
                                                                             