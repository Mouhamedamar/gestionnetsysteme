# 📦 Guide d'Installation - Frontend React

## Prérequis

- Node.js 18+ et npm (ou yarn/pnpm)
- Git (optionnel)

## Installation

### 1. Installer les dépendances

```bash
cd frontend
npm install
```

### 2. Lancer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

### 3. Build pour la production

```bash
npm run build
```

Les fichiers compilés seront dans le dossier `dist/`

## 🚀 Utilisation

### Connexion

1. Ouvrez `http://localhost:3000`
2. Sur la page de login, utilisez n'importe quels identifiants (mode démo)
3. Cliquez sur "Se connecter"

### Navigation

- **Tableau de Bord** : Vue d'ensemble avec statistiques
- **Produits** : Gestion du catalogue
- **Mouvements de Stock** : Entrées et sorties
- **Factures** : Création et gestion des factures
- **Profil** : Informations utilisateur

## 📝 Notes

- **Mode statique** : Toutes les données sont locales (pas d'API)
- **Données fictives** : Stockées dans `src/data/mockData.js`
- **State local** : Gestion avec React Context API
- **Prêt pour API** : Structure prête à connecter au backend Django

## 🔧 Configuration

### Modifier le port

Éditez `vite.config.js` :

```js
server: {
  port: 3000, // Changez le port ici
}
```

### Personnaliser les couleurs

Éditez `tailwind.config.js` pour modifier le thème.

## 🐛 Dépannage

### Erreur "Cannot find module"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Port déjà utilisé

Changez le port dans `vite.config.js` ou tuez le processus utilisant le port 3000.

