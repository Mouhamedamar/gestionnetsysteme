# Frontend React - Gestion de Stock

Application React complète pour la gestion de stock avec données statiques.

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour la production
npm run build
```

## 📁 Structure du Projet

```
frontend/
├── src/
│   ├── components/      # Composants réutilisables
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── Modal.jsx
│   │   ├── Loader.jsx
│   │   ├── Notification.jsx
│   │   ├── ProductCard.jsx
│   │   └── ProductForm.jsx
│   ├── pages/           # Pages de l'application
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Products.jsx
│   │   ├── StockMovements.jsx
│   │   ├── Invoices.jsx
│   │   ├── InvoiceItems.jsx
│   │   └── Profile.jsx
│   ├── context/         # Context API
│   │   └── AppContext.jsx
│   ├── data/            # Données fictives
│   │   └── mockData.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
└── vite.config.js
```

## 🎯 Fonctionnalités

### ✅ Pages
- **Login** : Connexion simulée
- **Dashboard** : Statistiques et graphiques
- **Produits** : CRUD complet avec filtres et recherche
- **Mouvements de Stock** : Gestion des entrées/sorties
- **Factures** : Création et gestion des factures
- **Items de Facture** : Gestion des lignes de facture
- **Profil** : Informations utilisateur

### ✅ Composants
- Layout avec Sidebar, Header, Footer
- Modals pour formulaires
- Cards pour produits
- Tables paginées
- Loader et notifications

### ✅ Features
- Recherche et filtres
- Pagination (10-20 éléments par page)
- Tri des données
- Upload d'images simulé
- Calculs automatiques (totaux factures)
- Design responsive avec TailwindCSS

## 🎨 Technologies

- **React 18**
- **React Router DOM** : Navigation
- **TailwindCSS** : Styling
- **Recharts** : Graphiques
- **Lucide React** : Icônes
- **Vite** : Build tool

## 📝 Notes

- **100% statique** : Toutes les données sont dans `mockData.js`
- **State local** : Gestion avec Context API
- **Prêt pour API** : Structure prête à intégrer le backend Django

## 🔗 Intégration Backend

Pour connecter au backend Django, modifiez `AppContext.jsx` pour remplacer les fonctions locales par des appels API.

