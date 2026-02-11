import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockProducts, mockStockMovements, mockDashboardStats } from '../data/mockData';

import { API_BASE_URL } from '../config';
const BASE_URL = API_BASE_URL;

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState({
    username: 'admin',
    email: 'admin@gestion-stock.com',
    role: 'Administrateur',
    created_at: '2024-01-01'
  });
  const [products, setProducts] = useState(mockProducts);
  const [stockMovements, setStockMovements] = useState(mockStockMovements);
  const [invoices, setInvoices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(mockDashboardStats);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Simuler le chargement
  const simulateLoading = (callback, delay = 500) => {
    setLoading(true);
    setTimeout(() => {
      callback();
      setLoading(false);
    }, delay);
  };

  // Notification
  const showNotification = (message, type = 'success') => {
    if (message) {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification(null);
    }
  };

  // Authentification avec le backend
  const login = async (username, password) => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errorMessage = data.error || 'Identifiants invalides';
        throw new Error(errorMessage);
      }

      const data = await response.json();

      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      setUser(prev => ({
        ...prev,
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role || 'admin',
        page_permissions: data.user.page_permissions || data.user.profile?.page_permissions || null,
        profile: {
          role: data.user.role || 'admin',
          phone: data.user.profile?.phone || null,
          page_permissions: data.user.page_permissions || data.user.profile?.page_permissions || null
        }
      }));
      setLoggedIn(true);

      // Persister la session
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('user', JSON.stringify({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role || 'admin',
        page_permissions: data.user.page_permissions || data.user.profile?.page_permissions || null,
        profile: {
          role: data.user.role || 'admin',
          phone: data.user.profile?.phone || null,
          page_permissions: data.user.page_permissions || data.user.profile?.page_permissions || null
        }
      }));

      showNotification('Connexion réussie');
      return true;
    } catch (error) {
      showNotification(error.message || 'Erreur de connexion', 'error');
      throw error;
    }
  };

  const logout = async () => {
    const refresh = refreshToken || localStorage.getItem('refreshToken');

    if (refresh) {
      try {
        await fetch(`${BASE_URL}/api/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refresh })
        });
      } catch (e) {
        // On ignore les erreurs de logout côté serveur en mode dév
      }
    }

    setAccessToken(null);
    setRefreshToken(null);
    setLoggedIn(false);
    setUser(prev => ({
      ...prev,
      id: null
    }));

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    showNotification('Déconnexion réussie');
  };

  // Helper pour les appels API avec authentification
  const apiCall = useCallback(
    async (url, options = {}) => {
      const token = accessToken || localStorage.getItem('accessToken');
      const isFormData = options.body instanceof FormData;
      const headers = {
        ...(options.headers || {})
      };

      // Ajouter l'authentification
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Déterminer le Content-Type en fonction du type de données
      if (isFormData) {
        // Pour FormData, supprimer Content-Type (le navigateur le fera automatiquement avec boundary)
        delete headers['Content-Type'];
      } else {
        // Pour JSON, définir le Content-Type explicitement
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }

      console.log('[apiCall]', {
        url,
        method: options.method || 'GET',
        isFormData,
        hasContentType: !!headers['Content-Type'],
        headers: { ...headers, Authorization: headers['Authorization'] ? '***' : 'none' }
      });

      try {
        const response = await fetch(`${BASE_URL}${url}`, {
          ...options,
          headers
        });

        if (response.status === 401) {
          // Token expiré, essayer de refresh
          const refresh = refreshToken || localStorage.getItem('refreshToken');
          if (refresh) {
            try {
              const refreshResponse = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh })
              });

              if (refreshResponse.ok) {
                const { access } = await refreshResponse.json();
                setAccessToken(access);
                localStorage.setItem('accessToken', access);
                headers['Authorization'] = `Bearer ${access}`;

                // Réessayer la requête originale
                return await fetch(`${BASE_URL}${url}`, {
                  ...options,
                  headers
                });
              }
            } catch (e) {
              // Refresh échoué, nettoyer la session
              setAccessToken(null);
              setRefreshToken(null);
              setLoggedIn(false);
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              throw new Error('Session expirée. Veuillez vous reconnecter.');
            }
          }
        }

        return response;
      } catch (error) {
        console.error('[apiCall] Fetch error:', error);
        throw error;
      }
    },
    [accessToken, refreshToken]
  );

  // Restaurer la session au chargement
  useEffect(() => {
    const storedAccess = localStorage.getItem('accessToken');
    const storedRefresh = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');

    if (storedAccess && storedRefresh && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setAccessToken(storedAccess);
        setRefreshToken(storedRefresh);
        setUser(prev => ({
          ...prev,
          ...parsedUser
        }));
        setLoggedIn(true);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Charger les produits depuis l'API
  const fetchProducts = useCallback(async () => {
    if (!loggedIn) return;
    
    try {
      setLoading(true);
      const token = accessToken || localStorage.getItem('accessToken');
      if (!token) return;

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${BASE_URL}/api/products/`, { headers });
      
      if (!response.ok) {
        if (response.status === 403) {
          setProducts([]);
          return;
        }
        if (response.status === 401) {
          // Token expiré, essayer refresh
          const refresh = refreshToken || localStorage.getItem('refreshToken');
          if (refresh) {
            const refreshResponse = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh })
            });

            if (refreshResponse.ok) {
              const { access } = await refreshResponse.json();
              setAccessToken(access);
              localStorage.setItem('accessToken', access);
              headers['Authorization'] = `Bearer ${access}`;
              
              const retryResponse = await fetch(`${BASE_URL}/api/products/`, { headers });
              if (retryResponse.ok) {
                const data = await retryResponse.json();
                const mappedProducts = data.results ? data.results : data;
                setProducts(mappedProducts.map(p => ({
                  ...p,
                  photo_url: p.photo_url,
                  photo: p.photo,
                  deleted_at: null
                })));
                return;
              }
            }
          }
          throw new Error('Session expirée');
        }
        throw new Error('Erreur lors du chargement des produits');
      }

      const data = await response.json();
      // Mapper les produits de l'API vers le format frontend
      const mappedProducts = data.results ? data.results : data;
      const productsWithPhotos = mappedProducts.map(p => ({
        ...p,
        photo_url: p.photo
          ? `${BASE_URL}${p.photo}`
          : null,
        deleted_at: null // Les produits supprimés sont déjà filtrés côté API
      }));

      setProducts(productsWithPhotos);

      // Vérifier les produits en rupture de stock
      const lowStockProducts = productsWithPhotos.filter(p => p.quantity <= p.alert_threshold);
      if (lowStockProducts.length > 0) {
        showNotification(
          `${lowStockProducts.length} produit(s) en rupture de stock ou seuil d'alerte atteint.`,
          'warning'
        );
      }
    } catch (error) {
      console.error('Erreur fetchProducts:', error);
      if (error.message === 'Session expirée') {
        // Déconnexion manuelle
        setAccessToken(null);
        setRefreshToken(null);
        setLoggedIn(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } else {
        showNotification('Erreur lors du chargement des produits', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [loggedIn, accessToken, refreshToken]);

  // Charger les mouvements de stock depuis l'API
  const fetchStockMovements = useCallback(async () => {
    if (!loggedIn) return;

    try {
      setLoading(true);
      const token = accessToken || localStorage.getItem('accessToken');
      if (!token) return;

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${BASE_URL}/api/stock-movements/`, { headers });

      if (!response.ok) {
        // Si l'utilisateur n'a pas les permissions (403), ne pas charger les données
        if (response.status === 403) {
          console.log('Accès refusé aux mouvements de stock - permissions insuffisantes');
          setStockMovements([]);
          return;
        }
        
        if (response.status === 401) {
          // Token expiré, essayer refresh
          const refresh = refreshToken || localStorage.getItem('refreshToken');
          if (refresh) {
            const refreshResponse = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh })
            });

            if (refreshResponse.ok) {
              const { access } = await refreshResponse.json();
              setAccessToken(access);
              localStorage.setItem('accessToken', access);
              headers['Authorization'] = `Bearer ${access}`;

              const retryResponse = await fetch(`${BASE_URL}/api/stock-movements/`, { headers });
              if (retryResponse.ok) {
                const data = await retryResponse.json();
                const mappedMovements = data.results ? data.results : data;
                setStockMovements(mappedMovements);
                return;
              }
              // Si toujours 403 après refresh, l'utilisateur n'a pas les permissions
              if (retryResponse.status === 403) {
                console.log('Accès refusé aux mouvements de stock - permissions insuffisantes');
                setStockMovements([]);
                return;
              }
            }
          }
          throw new Error('Session expirée');
        }
        throw new Error('Erreur lors du chargement des mouvements de stock');
      }

      const data = await response.json();
      const mappedMovements = data.results ? data.results : data;
      setStockMovements(mappedMovements);
    } catch (error) {
      console.error('Erreur fetchStockMovements:', error);
      if (error.message === 'Session expirée') {
        setAccessToken(null);
        setRefreshToken(null);
        setLoggedIn(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } else {
        showNotification('Erreur lors du chargement des mouvements de stock', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [loggedIn, accessToken, refreshToken]);

  // Charger les statistiques du dashboard depuis l'API
  const fetchDashboardStats = useCallback(async () => {
    if (!loggedIn) return;

    try {
      setLoading(true);
      const token = accessToken || localStorage.getItem('accessToken');
      if (!token) return;

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${BASE_URL}/api/dashboard/stats/`, { headers });

      if (!response.ok) {
        // Si l'utilisateur n'a pas les permissions (403), ne pas charger les données
        if (response.status === 403) {
          console.log('Accès refusé aux statistiques du dashboard - permissions insuffisantes');
          setDashboardStats({
            total_products: 0,
            low_stock_products: 0,
            stock_value: 0,
            total_invoices: 0,
            revenue: 0,
            recent_invoices: [],
            monthly_revenue: [],
            top_products: []
          });
          return;
        }
        
        if (response.status === 401) {
          const refresh = refreshToken || localStorage.getItem('refreshToken');
          if (refresh) {
            const refreshResponse = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh })
            });

            if (refreshResponse.ok) {
              const { access } = await refreshResponse.json();
              setAccessToken(access);
              localStorage.setItem('accessToken', access);
              headers['Authorization'] = `Bearer ${access}`;

              const retryResponse = await fetch(`${BASE_URL}/api/dashboard/stats/`, { headers });
              if (retryResponse.ok) {
                const data = await retryResponse.json();
                setDashboardStats(data);
                return;
              }
              // Si toujours 403 après refresh, l'utilisateur n'a pas les permissions
              if (retryResponse.status === 403) {
                console.log('Accès refusé aux statistiques du dashboard - permissions insuffisantes');
                setDashboardStats({
                  total_products: 0,
                  low_stock_products: 0,
                  stock_value: 0,
                  total_invoices: 0,
                  revenue: 0,
                  recent_invoices: [],
                  monthly_revenue: [],
                  top_products: []
                });
                return;
              }
            }
          }
          throw new Error('Session expirée');
        }
        throw new Error('Erreur lors du chargement des statistiques du dashboard');
      }

      const data = await response.json();
      setDashboardStats(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Erreur fetchDashboardStats:', error);
      if (error.message === 'Session expirée') {
        setAccessToken(null);
        setRefreshToken(null);
        setLoggedIn(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } else {
        showNotification('Erreur lors du chargement des statistiques du dashboard', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [loggedIn, accessToken, refreshToken]);

  // Charger les factures depuis l'API
  const fetchInvoices = useCallback(async () => {
    if (!loggedIn) return;

    try {
      setLoading(true);
      const response = await apiCall('/api/invoices/', {
        method: 'GET'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée');
        }
        if (response.status === 403) {
          setInvoices([]);
          return;
        }
        throw new Error('Erreur lors du chargement des factures');
      }

      const data = await response.json();
      const apiInvoices = data.results ? data.results : data;

      // Mapper le format API vers le format utilisé dans le frontend
      const mappedInvoices = Array.isArray(apiInvoices) ? apiInvoices.map(inv => ({
        ...inv,
        items: (inv.invoice_items || []).map(item => ({
          ...item,
          product_name:
            item.product_name ||
            item.product_detail?.name ||
            ''
        }))
      })) : [];

      setInvoices(mappedInvoices);
    } catch (error) {
      console.error('Erreur fetchInvoices:', error);
      if (error.message === 'Session expirée') {
        setAccessToken(null);
        setRefreshToken(null);
        setLoggedIn(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } else {
        showNotification('Erreur lors du chargement des factures', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [loggedIn, apiCall]);

  // Charger les devis depuis l'API
  const fetchQuotes = useCallback(async () => {
    if (!loggedIn) return;

    try {
      setLoading(true);
      const response = await apiCall('/api/quotes/', {
        method: 'GET'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée');
        }
        if (response.status === 403) {
          setQuotes([]);
          return;
        }
        throw new Error('Erreur lors du chargement des devis');
      }

      const data = await response.json();
      const apiQuotes = data.results ? data.results : data;
      setQuotes(Array.isArray(apiQuotes) ? apiQuotes : []);
    } catch (error) {
      console.error('Erreur fetchQuotes:', error);
      // Ne pas afficher de notification si c'est une erreur réseau (serveur non disponible)
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        console.warn('Serveur non disponible ou erreur réseau pour fetchQuotes');
        setQuotes([]);
        return;
      }
      if (error.message === 'Session expirée') {
        setAccessToken(null);
        setRefreshToken(null);
        setLoggedIn(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } else {
        showNotification('Erreur lors du chargement des devis', 'error');
      }
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [loggedIn, apiCall, showNotification]);

  // Charger les données des graphiques du dashboard depuis l'API
  const fetchDashboardCharts = useCallback(async () => {
    if (!loggedIn) return;

    try {
      const token = accessToken || localStorage.getItem('accessToken');
      if (!token) return;

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${BASE_URL}/api/dashboard/charts/`, { headers });

      if (!response.ok) {
        // Si l'utilisateur n'a pas les permissions (403), ne pas charger les données
        if (response.status === 403) {
          console.log('Accès refusé aux graphiques du dashboard - permissions insuffisantes');
          setDashboardStats(prev => ({
            ...prev,
            monthly_revenue: [],
            top_products: []
          }));
          return;
        }
        
        if (response.status === 401) {
          const refresh = refreshToken || localStorage.getItem('refreshToken');
          if (refresh) {
            const refreshResponse = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh })
            });

            if (refreshResponse.ok) {
              const { access } = await refreshResponse.json();
              setAccessToken(access);
              localStorage.setItem('accessToken', access);
              headers['Authorization'] = `Bearer ${access}`;

              const retryResponse = await fetch(`${BASE_URL}/api/dashboard/charts/`, { headers });
              if (retryResponse.ok) {
                const data = await retryResponse.json();
                // Stocker les données des graphiques dans l'état
                setDashboardStats(prev => ({
                  ...prev,
                  monthly_revenue: data.monthly_revenue,
                  top_products: data.top_products
                }));
                return;
              }
              // Si toujours 403 après refresh, l'utilisateur n'a pas les permissions
              if (retryResponse.status === 403) {
                console.log('Accès refusé aux graphiques du dashboard - permissions insuffisantes');
                setDashboardStats(prev => ({
                  ...prev,
                  monthly_revenue: [],
                  top_products: []
                }));
                return;
              }
            }
          }
          throw new Error('Session expirée');
        }
        throw new Error('Erreur lors du chargement des données des graphiques');
      }

      const data = await response.json();
      // Stocker les données des graphiques dans l'état dashboardStats
      setDashboardStats(prev => ({
        ...prev,
        monthly_revenue: data.monthly_revenue,
        top_products: data.top_products
      }));
    } catch (error) {
      console.error('Erreur fetchDashboardCharts:', error);
      if (error.message === 'Session expirée') {
        setAccessToken(null);
        setRefreshToken(null);
        setLoggedIn(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } else {
        showNotification('Erreur lors du chargement des données des graphiques', 'error');
      }
    }
  }, [loggedIn, accessToken, refreshToken]);

  // Charger les clients depuis l'API
  const fetchClients = useCallback(async () => {
    if (!loggedIn) return;

    try {
      setLoading(true);
      const response = await apiCall('/api/auth/clients/', {
        method: 'GET'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée');
        }
        if (response.status === 403) {
          setClients([]);
          return [];
        }
        throw new Error('Erreur lors du chargement des clients');
      }

      const data = await response.json();
      const apiClients = data.results ? data.results : data;
      const list = Array.isArray(apiClients) ? apiClients : [];
      setClients(list);
      return list;
    } catch (error) {
      console.error('Erreur fetchClients:', error);
      if (error.message === 'Session expirée') {
        setAccessToken(null);
        setRefreshToken(null);
        setLoggedIn(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } else {
        showNotification('Erreur lors du chargement des clients', 'error');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loggedIn, apiCall]);

  // Charger les utilisateurs depuis l'API
  const fetchUsers = useCallback(async () => {
    if (!loggedIn) return;

    try {
      setLoading(true);
      const response = await apiCall('/api/auth/users/', {
        method: 'GET'
      });

      if (!response.ok) {
        if (response.status === 403) {
          setUsers([]);
          return;
        }
        if (response.status === 401) {
          throw new Error('Session expirée');
        }
        throw new Error('Erreur lors du chargement des utilisateurs');
      }

      const data = await response.json();
      const apiUsers = data.results ? data.results : data;
      setUsers(apiUsers);
      return apiUsers;
    } catch (error) {
      console.error('Erreur fetchUsers:', error);
      if (error.message === 'Session expirée') {
        setAccessToken(null);
        setRefreshToken(null);
        setLoggedIn(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } else {
        showNotification('Erreur lors du chargement des utilisateurs', 'error');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loggedIn, apiCall]);

  // Charger les données après connexion (API admin uniquement pour les admins)
  const isAdmin = user?.role === 'admin';
  useEffect(() => {
    if (!loggedIn || !accessToken) return;
    const adminCalls = isAdmin
      ? [
          fetchProducts().catch(err => console.error('Erreur fetchProducts:', err)),
          fetchStockMovements().catch(err => console.error('Erreur fetchStockMovements:', err)),
          fetchDashboardStats().catch(err => console.error('Erreur fetchDashboardStats:', err)),
          fetchDashboardCharts().catch(err => console.error('Erreur fetchDashboardCharts:', err)),
          fetchExpenses().catch(err => console.error('Erreur fetchExpenses:', err)),
          fetchUsers().catch(err => console.error('Erreur fetchUsers:', err))
        ]
      : [];
    const commonCalls = [
      fetchInvoices().catch(err => console.error('Erreur fetchInvoices:', err)),
      fetchQuotes().catch(err => console.error('Erreur fetchQuotes:', err)),
      fetchClients().catch(err => console.error('Erreur fetchClients:', err))
    ];
    Promise.allSettled([...adminCalls, ...commonCalls]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, accessToken, isAdmin]);

  // Rafraîchissement automatique des données du dashboard toutes les 5 minutes (admin uniquement)
  useEffect(() => {
    if (!loggedIn || !accessToken || !isAdmin) return;

    const interval = setInterval(() => {
      fetchDashboardStats();
      fetchDashboardCharts();
      fetchStockMovements();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loggedIn, accessToken, isAdmin, fetchDashboardStats, fetchDashboardCharts, fetchStockMovements]);

  // Rafraîchissement quand la fenêtre retrouve le focus (admin uniquement)
  useEffect(() => {
    if (!loggedIn || !accessToken || !isAdmin) return;

    const handleFocus = () => {
      fetchDashboardStats();
      fetchDashboardCharts();
      fetchStockMovements();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loggedIn, accessToken, isAdmin, fetchDashboardStats, fetchDashboardCharts, fetchStockMovements]);

  // Profil utilisateur
  const updateUser = async (userData) => {
    try {
      setLoading(true);
      const response = await apiCall('/api/auth/profile/', {
        method: 'PATCH',
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la mise à jour du profil');
      }

      const updatedUser = await response.json();
      setUser(prev => ({
        ...prev,
        username: updatedUser.username,
        email: updatedUser.email
      }));
      showNotification('Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur updateUser:', error);
      showNotification(error.message || 'Erreur lors de la mise à jour du profil', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Changer le mot de passe
  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      const response = await apiCall('/api/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify(passwordData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors du changement de mot de passe');
      }

      showNotification('Mot de passe changé avec succès');
    } catch (error) {
      console.error('Erreur changePassword:', error);
      showNotification(error.message || 'Erreur lors du changement de mot de passe', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Produits - Connectés au backend
  const addProduct = async (productData) => {
    try {
      setLoading(true);
      const isFormData = productData instanceof FormData;
      const response = await apiCall('/api/products/', {
        method: 'POST',
        body: isFormData ? productData : JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('addProduct error data:', errorData);
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la création du produit');
      }

      const newProduct = await response.json();
      console.log('Produit créé:', newProduct);
      
      // Recharger tous les produits pour avoir les données à jour
      await fetchProducts();
      console.log('Produits après rechargement:', products);
      
      showNotification('Produit créé avec succès');
    } catch (error) {
      console.error('Erreur addProduct:', error);
      showNotification(error.message || 'Erreur lors de la création du produit', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      setLoading(true);
      const isFormData = productData instanceof FormData;
      const response = await apiCall(`/api/products/${id}/`, {
        method: 'PATCH',
        body: isFormData ? productData : JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('updateProduct error data:', errorData);
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la modification du produit');
      }

      const updatedProduct = await response.json();
      // Recharger tous les produits pour avoir les données à jour
      await fetchProducts();
      showNotification('Produit modifié avec succès');
    } catch (error) {
      console.error('Erreur updateProduct:', error);
      showNotification(error.message || 'Erreur lors de la modification du produit', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/products/${id}/soft_delete/`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          await fetchProducts();
          throw new Error('Produit introuvable ou déjà supprimé.');
        }
        throw new Error(errorData.detail || errorData.error || 'Erreur lors de la suppression du produit');
      }

      // Retirer le produit de la liste locale (même si le serveur a répondu "déjà supprimé")
      setProducts(products.filter(p => p.id !== id));
      showNotification('Produit supprimé avec succès');
    } catch (error) {
      console.error('Erreur deleteProduct:', error);
      showNotification(error.message || 'Erreur lors de la suppression du produit', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Mouvements de stock
  const addStockMovement = async (movementData) => {
    try {
      setLoading(true);
      const response = await apiCall('/api/stock-movements/', {
        method: 'POST',
        body: JSON.stringify(movementData)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('addStockMovement error data:', errorData);
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la création du mouvement de stock');
      }
      const newMovement = await response.json();
      const productId = newMovement.product ?? newMovement.product_id;
      const product = products.find(p => p.id === productId || p.id === parseInt(productId, 10));
      const movementToAdd = { ...newMovement, product_name: product?.name ?? newMovement.product_name ?? '' };
      setStockMovements(prev => [...prev, movementToAdd]);
      // Recharger les produits pour mettre à jour les quantités
      fetchProducts();
      showNotification('Mouvement de stock créé avec succès');
    } catch (error) {
      console.error('Erreur addStockMovement:', error);
      showNotification(error.message || 'Erreur lors de la création du mouvement de stock', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteStockMovement = (id) => {
    simulateLoading(() => {
      setStockMovements(prev => prev.filter(m => m.id !== id));
      showNotification('Mouvement supprimé avec succès');
    });
  };

  // Factures
  // Factures - connectées au backend
  const addInvoice = async (invoiceData) => {
    try {
      setLoading(true);

      // Préparer les données au format attendu par l'API
      const payload = {
        client_name: invoiceData.client_name,
        status: invoiceData.status,
        is_proforma: invoiceData.is_proforma || false,
        items: invoiceData.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      const response = await apiCall('/api/invoices/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorData = null;
        try {
          errorData = errorText ? JSON.parse(errorText) : null;
        } catch {
          errorData = null;
        }
        console.error('addInvoice error:', { status: response.status, errorData, errorText });
        const firstError =
          errorData?.detail ||
          errorData?.error ||
          (errorData && typeof errorData === 'object'
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(
          firstError ||
            `Erreur lors de la création de la facture (HTTP ${response.status})`
        );
      }

      const newInvoice = await response.json();
      console.log('Nouvelle facture créée:', newInvoice); // Log pour vérifier les données
      const rawItems = newInvoice.invoice_items ?? newInvoice.items ?? invoiceData.items ?? [];
      const mapItem = (item) => {
        const productId = item.product ?? item.product_id;
        const product = products.find(p => p.id === productId || p.id === parseInt(productId, 10));
        return {
          id: item.id,
          product: item.product ?? item.product_id,
          quantity: item.quantity ?? 0,
          unit_price: item.unit_price ?? 0,
          product_name: item.product_name ?? item.product_detail?.name ?? product?.name ?? 'Produit'
        };
      };
      const mappedInvoice = {
        ...newInvoice,
        invoice_number: newInvoice.invoice_number ?? newInvoice.number ?? (newInvoice.id ? `FACTURE-${newInvoice.id}` : 'FACTURE-NEW'),
        date: newInvoice.date ?? new Date().toISOString().slice(0, 10),
        client_name: newInvoice.client_name ?? invoiceData.client_name,
        items: Array.isArray(rawItems) ? rawItems.map(mapItem) : [],
        is_proforma: invoiceData.is_proforma || false,
        is_cancelled: false
      };

      // Utiliser la forme fonctionnelle pour garantir la mise à jour correcte du state
      setInvoices(prevInvoices => [...prevInvoices, mappedInvoice]);
      showNotification('Facture créée avec succès');
      // Recharger les produits pour mettre à jour les quantités de stock
      fetchProducts();
      
      return mappedInvoice; // Retourner la facture créée
    } catch (error) {
      console.error('Erreur addInvoice:', error);
      showNotification(error.message || 'Erreur lors de la création de la facture', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateInvoice = async (id, invoiceData) => {
    try {
      setLoading(true);

      const response = await apiCall(`/api/invoices/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('updateInvoice error data:', errorData);
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la modification de la facture');
      }

      const updatedInvoice = await response.json();
      const mappedInvoice = {
        ...updatedInvoice,
        items: (updatedInvoice.invoice_items || []).map(item => ({
          ...item,
          product_name:
            item.product_name ||
            item.product_detail?.name ||
            ''
        }))
      };

      setInvoices(prevInvoices => prevInvoices.map(inv =>
        inv.id === id ? mappedInvoice : inv
      ));
      showNotification('Facture modifiée avec succès');
    } catch (error) {
      console.error('Erreur updateInvoice:', error);
      showNotification(error.message || 'Erreur lors de la modification de la facture', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const cancelInvoice = async (id) => {
    try {
      setLoading(true);

      const response = await apiCall(`/api/invoices/${id}/cancel/`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('cancelInvoice error data:', errorData);
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de l\'annulation de la facture');
      }

      const cancelledInvoice = await response.json();
      const mappedInvoice = {
        ...cancelledInvoice,
        items: (cancelledInvoice.invoice_items || []).map(item => ({
          ...item,
          product_name:
            item.product_name ||
            item.product_detail?.name ||
            ''
        }))
      };

      setInvoices(prevInvoices => prevInvoices.map(inv =>
        inv.id === id ? mappedInvoice : inv
      ));
      // Recharger les produits pour mettre à jour les quantités de stock
      fetchProducts();
      showNotification('Facture annulée avec succès');
    } catch (error) {
      console.error('Erreur cancelInvoice:', error);
      showNotification(error.message || 'Erreur lors de l\'annulation de la facture', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (id) => {
    try {
      setLoading(true);

      const response = await apiCall(`/api/invoices/${id}/soft_delete/`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('deleteInvoice error data:', errorData);
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la suppression de la facture');
      }

      setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== id));
      showNotification('Facture supprimée avec succès');
    } catch (error) {
      console.error('Erreur deleteInvoice:', error);
      showNotification(error.message || 'Erreur lors de la suppression de la facture', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Items de facture - connectés au backend
  const addInvoiceItem = async (invoiceId, itemData) => {
    try {
      setLoading(true);

      const payload = {
        product: itemData.product,
        quantity: itemData.quantity,
        unit_price: itemData.unit_price
      };

      const response = await apiCall(`/api/invoices/${invoiceId}/items/`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('addInvoiceItem error data:', errorData);
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de l\'ajout de l\'item de facture');
      }

      // L'API retourne l'item créé ; on recharge la facture pour avoir les totaux à jour
      await fetchInvoices();
      // Recharger les produits pour mettre à jour le stock
      fetchProducts();
      showNotification('Item ajouté avec succès');
    } catch (error) {
      console.error('Erreur addInvoiceItem:', error);
      showNotification(error.message || 'Erreur lors de l\'ajout de l\'item de facture', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoiceItem = async (invoiceId, itemId) => {
    try {
      setLoading(true);

      const response = await apiCall(`/api/invoices/${invoiceId}/items/`, {
        method: 'DELETE',
        body: JSON.stringify({ item_id: itemId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('deleteInvoiceItem error data:', errorData);
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la suppression de l\'item de facture');
      }

      // Recharger les factures pour mettre à jour les totaux
      await fetchInvoices();
      // Recharger les produits pour mettre à jour le stock
      fetchProducts();
      showNotification('Item supprimé avec succès');
    } catch (error) {
      console.error('Erreur deleteInvoiceItem:', error);
      showNotification(error.message || 'Erreur lors de la suppression de l\'item de facture', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un devis
  const addQuote = async (quoteData) => {
    try {
      setLoading(true);
      const response = await apiCall('/api/quotes/', {
        method: 'POST',
        body: JSON.stringify(quoteData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la création du devis');
      }

      const newQuote = await response.json();
      setQuotes(prev => [newQuote, ...prev]);
      showNotification('Devis créé avec succès');
      return newQuote;
    } catch (error) {
      console.error('Erreur addQuote:', error);
      showNotification(error.message || 'Erreur lors de la création du devis', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Modifier un devis
  const updateQuote = async (id, quoteData) => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/quotes/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(quoteData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la modification du devis');
      }

      const updatedQuote = await response.json();
      setQuotes(prev => prev.map(q => q.id === id ? updatedQuote : q));
      showNotification('Devis modifié avec succès');
      return updatedQuote;
    } catch (error) {
      console.error('Erreur updateQuote:', error);
      showNotification(error.message || 'Erreur lors de la modification du devis', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un devis
  const deleteQuote = async (id) => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/quotes/${id}/soft_delete/`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'Erreur lors de la suppression du devis');
      }

      setQuotes(prev => prev.filter(q => q.id !== id));
      showNotification('Devis supprimé avec succès');
    } catch (error) {
      console.error('Erreur deleteQuote:', error);
      showNotification(error.message || 'Erreur lors de la suppression du devis', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un item à un devis
  const addQuoteItem = async (quoteId, itemData) => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/quotes/${quoteId}/items/`, {
        method: 'POST',
        body: JSON.stringify(itemData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de l\'ajout de l\'item de devis');
      }

      await fetchQuotes();
      showNotification('Item ajouté avec succès');
    } catch (error) {
      console.error('Erreur addQuoteItem:', error);
      showNotification(error.message || 'Erreur lors de l\'ajout de l\'item de devis', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un item d'un devis
  const deleteQuoteItem = async (quoteId, itemId) => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/quotes/${quoteId}/items/`, {
        method: 'DELETE',
        body: JSON.stringify({ item_id: itemId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la suppression de l\'item de devis');
      }

      await fetchQuotes();
      showNotification('Item supprimé avec succès');
    } catch (error) {
      console.error('Erreur deleteQuoteItem:', error);
      showNotification(error.message || 'Erreur lors de la suppression de l\'item de devis', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Charger les dépenses depuis l'API
  const fetchExpenses = useCallback(async () => {
    if (!loggedIn) return;

    try {
      setLoading(true);
      const response = await apiCall('/api/expenses/', {
        method: 'GET'
      });

      if (!response.ok) {
        if (response.status === 403) {
          setExpenses([]);
          return;
        }
        if (response.status === 401) {
          throw new Error('Session expirée');
        }
        throw new Error('Erreur lors du chargement des dépenses');
      }

      const data = await response.json();
      const apiExpenses = data.results ? data.results : data;
      setExpenses(Array.isArray(apiExpenses) ? apiExpenses : []);
    } catch (error) {
      console.error('Erreur fetchExpenses:', error);
      // Ne pas afficher de notification si c'est une erreur réseau
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        console.warn('Serveur non disponible ou erreur réseau pour fetchExpenses');
        setExpenses([]);
        return;
      }
      if (error.message === 'Session expirée') {
        setAccessToken(null);
        setRefreshToken(null);
        setLoggedIn(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } else {
        showNotification('Erreur lors du chargement des dépenses', 'error');
      }
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [loggedIn, apiCall, showNotification]);

  // Ajouter une dépense
  const addExpense = async (expenseData) => {
    try {
      setLoading(true);
      
      // Vérifier si c'est un FormData (pour l'upload d'image)
      const isFormData = expenseData instanceof FormData;
      
      const response = await apiCall('/api/expenses/', {
        method: 'POST',
        body: isFormData ? expenseData : JSON.stringify(expenseData)
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `Erreur ${response.status}: ${response.statusText}` };
        }
        
        console.error('Erreur addExpense - Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        const firstError =
          errorData.detail ||
          errorData.error ||
          errorData.details ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || `Erreur ${response.status} lors de la création de la dépense`);
      }

      const newExpense = await response.json();
      setExpenses(prev => [newExpense, ...prev]);
      showNotification('Dépense créée avec succès');
      return newExpense;
    } catch (error) {
      console.error('Erreur addExpense:', error);
      showNotification(error.message || 'Erreur lors de la création de la dépense', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Modifier une dépense
  const updateExpense = async (id, expenseData) => {
    try {
      setLoading(true);
      
      // Vérifier si c'est un FormData (pour l'upload d'image)
      const isFormData = expenseData instanceof FormData;
      
      const response = await apiCall(`/api/expenses/${id}/`, {
        method: 'PUT',
        body: isFormData ? expenseData : JSON.stringify(expenseData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la modification de la dépense');
      }

      const updatedExpense = await response.json();
      setExpenses(prev => prev.map(e => e.id === id ? updatedExpense : e));
      showNotification('Dépense modifiée avec succès');
      return updatedExpense;
    } catch (error) {
      console.error('Erreur updateExpense:', error);
      showNotification(error.message || 'Erreur lors de la modification de la dépense', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une dépense
  const deleteExpense = async (id) => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/expenses/${id}/soft_delete/`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la suppression de la dépense');
      }

      setExpenses(prev => prev.filter(e => e.id !== id));
      showNotification('Dépense supprimée avec succès');
    } catch (error) {
      console.error('Erreur deleteExpense:', error);
      showNotification(error.message || 'Erreur lors de la suppression de la dépense', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un client
  const addClient = async (clientData) => {
    try {
      setLoading(true);
      const response = await apiCall('/api/auth/clients/', {
        method: 'POST',
        body: JSON.stringify(clientData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la création du client');
      }

      const newClient = await response.json();
      setClients(prev => [newClient, ...prev]);
      showNotification('Client créé avec succès');
      return newClient;
    } catch (error) {
      console.error('Erreur addClient:', error);
      showNotification(error.message || 'Erreur lors de la création du client', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Modifier un client
  const updateClient = async (id, clientData) => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/auth/clients/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(clientData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la modification du client');
      }

      const updatedClient = await response.json();
      setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
      showNotification('Client modifié avec succès');
      return updatedClient;
    } catch (error) {
      console.error('Erreur updateClient:', error);
      showNotification(error.message || 'Erreur lors de la modification du client', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un client
  const deleteClient = async (id) => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/auth/clients/${id}/`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la suppression du client');
      }

      setClients(prev => prev.filter(c => c.id !== id));
      showNotification('Client supprimé avec succès');
    } catch (error) {
      console.error('Erreur deleteClient:', error);
      showNotification(error.message || 'Erreur lors de la suppression du client', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un utilisateur
  const addUser = async (userData) => {
    try {
      setLoading(true);
      const response = await apiCall('/api/auth/users/', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la création de l\'utilisateur');
      }

      const newUser = await response.json();
      setUsers(prev => [newUser, ...prev]);
      showNotification('Utilisateur créé avec succès');
      return newUser;
    } catch (error) {
      console.error('Erreur addUser:', error);
      showNotification(error.message || 'Erreur lors de la création de l\'utilisateur', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Modifier un utilisateur (gestion des utilisateurs)
  const updateUserById = async (id, userData) => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/auth/users/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la modification de l\'utilisateur');
      }

      const updatedUser = await response.json();
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      showNotification('Utilisateur modifié avec succès');
      return updatedUser;
    } catch (error) {
      console.error('Erreur updateUserById:', error);
      showNotification(error.message || 'Erreur lors de la modification de l\'utilisateur', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un utilisateur
  const deleteUser = async (id) => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/auth/users/${id}/`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const firstError =
          errorData.detail ||
          errorData.error ||
          (typeof errorData === 'object' && errorData !== null
            ? Object.values(errorData).flat()[0]
            : null);
        throw new Error(firstError || 'Erreur lors de la suppression de l\'utilisateur');
      }

      setUsers(prev => prev.filter(u => u.id !== id));
      showNotification('Utilisateur supprimé avec succès');
    } catch (error) {
      console.error('Erreur deleteUser:', error);
      showNotification(error.message || 'Erreur lors de la suppression de l\'utilisateur', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    loggedIn,
    setLoggedIn,
    accessToken,
    refreshToken,
    user,
    updateUser,
    changePassword,
    products,
    stockMovements,
    invoices,
    quotes,
    expenses,
    clients,
    users,
    dashboardStats,
    loading,
    notification,
    setNotification,
    showNotification,
    apiCall,
    fetchProducts,
    fetchInvoices,
    fetchQuotes,
    fetchExpenses,
    fetchClients,
    fetchUsers,
    addProduct,
    updateProduct,
    deleteProduct,
    addStockMovement,
    deleteStockMovement,
    addInvoice,
    updateInvoice,
    cancelInvoice,
    deleteInvoice,
    addInvoiceItem,
    deleteInvoiceItem,
    addQuote,
    updateQuote,
    deleteQuote,
    addQuoteItem,
    deleteQuoteItem,
    addExpense,
    updateExpense,
    deleteExpense,
    addClient,
    updateClient,
    deleteClient,
    addUser,
    updateUserById,
    deleteUser,
    login,
    logout
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

