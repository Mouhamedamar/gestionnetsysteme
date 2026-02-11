# 📡 Exemples d'utilisation de l'API avec React

Ce document contient des exemples pratiques pour intégrer l'API avec votre frontend React.

## 🔐 Configuration de base

### Setup Axios avec intercepteur JWT

```javascript
// api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer le refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('http://localhost:8000/api/auth/token/refresh/', {
          refresh: refreshToken,
        });
        
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (err) {
        // Rediriger vers la page de login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

## 🔑 Authentification

### Connexion

```javascript
// services/authService.js
import api from '../api/axios';

export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login/', {
      username,
      password,
    });
    
    const { access, refresh, user } = response.data;
    
    // Stocker les tokens
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { access, refresh, user };
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const logout = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await api.post('/auth/logout/', { refresh: refreshToken });
    }
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
};
```

### Utilisation dans un composant React

```javascript
// components/Login.jsx
import { useState } from 'react';
import { login } from '../services/authService';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.error || 'Erreur de connexion');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Se connecter</button>
    </form>
  );
};
```

## 📦 Produits

### Lister les produits

```javascript
// services/productService.js
import api from '../api/axios';

export const getProducts = async (params = {}) => {
  try {
    const response = await api.get('/products/', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Utilisation
const products = await getProducts({
  page: 1,
  category: 'Informatique',
  search: 'laptop',
  ordering: '-created_at',
});
```

### Créer un produit

```javascript
export const createProduct = async (productData) => {
  try {
    const formData = new FormData();
    formData.append('name', productData.name);
    formData.append('description', productData.description);
    formData.append('category', productData.category);
    formData.append('quantity', productData.quantity);
    formData.append('purchase_price', productData.purchase_price);
    formData.append('sale_price', productData.sale_price);
    formData.append('alert_threshold', productData.alert_threshold);
    
    if (productData.photo) {
      formData.append('photo', productData.photo);
    }
    
    const response = await api.post('/products/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### Mettre à jour un produit

```javascript
export const updateProduct = async (id, productData) => {
  try {
    const formData = new FormData();
    Object.keys(productData).forEach((key) => {
      if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });
    
    const response = await api.patch(`/products/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### Supprimer un produit (soft delete)

```javascript
export const deleteProduct = async (id) => {
  try {
    await api.post(`/products/${id}/soft_delete/`);
    return true;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### Produits en rupture de stock

```javascript
export const getLowStockProducts = async () => {
  try {
    const response = await api.get('/products/low_stock/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

## 📊 Mouvements de Stock

### Créer une entrée de stock

```javascript
// services/stockService.js
import api from '../api/axios';

export const createStockMovement = async (movementData) => {
  try {
    const response = await api.post('/stock-movements/', {
      product: movementData.productId,
      movement_type: 'ENTREE',
      quantity: movementData.quantity,
      comment: movementData.comment || '',
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### Créer une sortie de stock

```javascript
export const createStockExit = async (movementData) => {
  try {
    const response = await api.post('/stock-movements/', {
      product: movementData.productId,
      movement_type: 'SORTIE',
      quantity: movementData.quantity,
      comment: movementData.comment || '',
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error('Stock insuffisant');
    }
    throw error.response?.data || error;
  }
};
```

### Lister les mouvements

```javascript
export const getStockMovements = async (productId = null) => {
  try {
    const params = productId ? { product: productId } : {};
    const response = await api.get('/stock-movements/', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

## 🧾 Factures

### Créer une facture

```javascript
// services/invoiceService.js
import api from '../api/axios';

export const createInvoice = async (invoiceData) => {
  try {
    const response = await api.post('/invoices/', {
      client_name: invoiceData.clientName,
      status: invoiceData.status || 'NON_PAYE',
      items: invoiceData.items.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error('Stock insuffisant pour un ou plusieurs produits');
    }
    throw error.response?.data || error;
  }
};
```

### Exemple d'utilisation

```javascript
const invoice = await createInvoice({
  clientName: 'Jean Dupont',
  status: 'NON_PAYE',
  items: [
    { productId: 1, quantity: 2, unitPrice: 1200.00 },
    { productId: 2, quantity: 1, unitPrice: 500.00 },
  ],
});
```

### Lister les factures

```javascript
export const getInvoices = async (params = {}) => {
  try {
    const response = await api.get('/invoices/', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### Annuler une facture

```javascript
export const cancelInvoice = async (invoiceId) => {
  try {
    const response = await api.post(`/invoices/${invoiceId}/cancel/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### Ajouter un item à une facture

```javascript
export const addInvoiceItem = async (invoiceId, itemData) => {
  try {
    const response = await api.post(`/invoices/${invoiceId}/items/`, {
      product: itemData.productId,
      quantity: itemData.quantity,
      unit_price: itemData.unitPrice,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

## 📈 Tableau de Bord

### Récupérer les statistiques

```javascript
// services/dashboardService.js
import api from '../api/axios';

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### Utilisation dans un composant

```javascript
// components/Dashboard.jsx
import { useEffect, useState } from 'react';
import { getDashboardStats } from '../services/dashboardService';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (!stats) return <div>Erreur de chargement</div>;

  return (
    <div>
      <h1>Tableau de Bord</h1>
      <div>
        <p>Total produits: {stats.total_products}</p>
        <p>Produits en rupture: {stats.low_stock_products}</p>
        <p>Valeur du stock: {stats.stock_value} €</p>
        <p>Chiffre d'affaires: {stats.revenue} €</p>
      </div>
    </div>
  );
};
```

## 🎣 Hook React personnalisé

```javascript
// hooks/useApi.js
import { useState, useEffect } from 'react';

export const useApi = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error };
};

// Utilisation
const { data: products, loading, error } = useApi(() => getProducts());
```

## 🔄 Gestion des erreurs

```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Erreur de réponse du serveur
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return data.error || data.detail || 'Données invalides';
      case 401:
        return 'Non authentifié. Veuillez vous reconnecter.';
      case 403:
        return 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
      case 404:
        return 'Ressource non trouvée';
      case 500:
        return 'Erreur serveur. Veuillez réessayer plus tard.';
      default:
        return data.detail || 'Une erreur est survenue';
    }
  } else if (error.request) {
    // Pas de réponse du serveur
    return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
  } else {
    // Erreur de configuration
    return error.message || 'Une erreur est survenue';
  }
};
```

## 📝 Notes importantes

1. **Pagination** : Toutes les listes utilisent la pagination. La réponse contient `results` (tableau) et des métadonnées (`count`, `next`, `previous`).

2. **Upload d'images** : Utilisez `FormData` pour les requêtes avec fichiers.

3. **Gestion des tokens** : Implémentez un système de refresh automatique pour éviter les déconnexions.

4. **CORS** : Assurez-vous que votre frontend React tourne sur `http://localhost:3000` ou mettez à jour `CORS_ALLOWED_ORIGINS` dans `.env`.

5. **Validation** : Toutes les validations sont faites côté serveur. Affichez les erreurs renvoyées par l'API.

