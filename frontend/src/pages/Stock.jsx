import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter, 
  Eye,
  BarChart3,
  CheckCircle2,
  XCircle,
  Info,
  Calendar,
  ArrowRight,
  X
} from 'lucide-react';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';

const Stock = () => {
  const { products, stockMovements, loading } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, in_stock, low_stock, out_of_stock
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingProduct, setViewingProduct] = useState(null);
  const itemsPerPage = 12;

  useEffect(() => {
    const q = searchParams.get('search');
    setSearchTerm(q ?? '');
  }, [searchParams]);

  // Calculer les statistiques de stock
  const stockStats = useMemo(() => {
    const activeProducts = products.filter(p => !p.deleted_at && p.is_active);
    const totalProducts = activeProducts.length;
    const inStock = activeProducts.filter(p => p.quantity > p.alert_threshold).length;
    const lowStock = activeProducts.filter(p => p.quantity > 0 && p.quantity <= p.alert_threshold).length;
    const outOfStock = activeProducts.filter(p => p.quantity === 0).length;
    const totalQuantity = activeProducts.reduce((sum, p) => sum + p.quantity, 0);
    const totalValue = activeProducts.reduce((sum, p) => sum + (p.quantity * (p.purchase_price || 0)), 0);

    return {
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
      totalQuantity,
      totalValue
    };
  }, [products]);

  // Filtrer et trier les produits
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => !p.deleted_at && p.is_active);

    // Filtre par recherche (null-safe)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.category || '').toLowerCase().includes(term)
      );
    }

    // Filtre par statut
    if (statusFilter === 'in_stock') {
      filtered = filtered.filter(p => p.quantity > p.alert_threshold);
    } else if (statusFilter === 'low_stock') {
      filtered = filtered.filter(p => p.quantity > 0 && p.quantity <= p.alert_threshold);
    } else if (statusFilter === 'out_of_stock') {
      filtered = filtered.filter(p => p.quantity === 0);
    }

    // Filtre par catégorie
    if (categoryFilter) {
      filtered = filtered.filter(p => p.category && p.category === categoryFilter);
    }

    // Trier par quantité (les plus faibles en premier)
    return filtered.sort((a, b) => a.quantity - b.quantity);
  }, [products, searchTerm, statusFilter, categoryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Obtenir les catégories uniques
  const categories = useMemo(() => {
    const cats = [...new Set(products.filter(p => !p.deleted_at && p.category && p.category.trim()).map(p => p.category))];
    return cats.filter(cat => cat).sort();
  }, [products]);

  // Obtenir le statut d'un produit
  const getProductStatus = (product) => {
    if (product.quantity === 0) return { label: 'Rupture', color: 'rose', icon: XCircle };
    if (product.quantity <= product.alert_threshold) return { label: 'Alerte', color: 'amber', icon: AlertTriangle };
    return { label: 'En stock', color: 'emerald', icon: CheckCircle2 };
  };

  // Obtenir les mouvements récents pour un produit
  const getRecentMovements = (productId) => {
    return stockMovements
      .filter(m => m.product === productId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="glass-card p-8 border-white/40 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Package className="w-32 h-32 text-primary-600" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-12 bg-primary-600 rounded-full"></div>
              <span className="text-primary-600 font-bold uppercase tracking-widest text-xs">Inventaire</span>
            </div>
            <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Gestion de Stock</h1>
            <p className="text-slate-500 font-medium">Surveillez et gérez vos stocks en temps réel.</p>
          </div>
          <button 
            onClick={() => navigate('/stock-movements')}
            className="btn-primary shadow-xl shadow-primary-500/30 px-8 py-4 text-lg flex items-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            Voir les Mouvements
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 border-l-4 border-primary-600">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-primary-100 p-3 rounded-xl">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <span className="text-2xl font-black text-slate-800">{stockStats.totalProducts}</span>
          </div>
          <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Total Produits</h3>
          <p className="text-xs text-slate-400 mt-1">Produits actifs en catalogue</p>
        </div>

        <div className="card p-6 border-l-4 border-emerald-600">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-100 p-3 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-2xl font-black text-slate-800">{stockStats.inStock}</span>
          </div>
          <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">En Stock</h3>
          <p className="text-xs text-slate-400 mt-1">Stock suffisant</p>
        </div>

        <div className="card p-6 border-l-4 border-amber-600">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-100 p-3 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-2xl font-black text-slate-800">{stockStats.lowStock}</span>
          </div>
          <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">En Alerte</h3>
          <p className="text-xs text-slate-400 mt-1">Stock faible</p>
        </div>

        <div className="card p-6 border-l-4 border-rose-600">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-rose-100 p-3 rounded-xl">
              <XCircle className="w-6 h-6 text-rose-600" />
            </div>
            <span className="text-2xl font-black text-slate-800">{stockStats.outOfStock}</span>
          </div>
          <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Rupture</h3>
          <p className="text-xs text-slate-400 mt-1">Stock épuisé</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-slate-100 p-3 rounded-xl">
              <BarChart3 className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Quantité Totale</h3>
              <p className="text-2xl font-black text-primary-600">{stockStats.totalQuantity.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Unités en stock</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-slate-100 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Valeur Totale</h3>
              <p className="text-2xl font-black text-primary-600">
                {formatCurrency(stockStats.totalValue)} F CFA
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Valeur au prix d'achat</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="card p-6">
        <div className={`grid gap-4 ${categories.length > 0 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                const next = new URLSearchParams(searchParams);
                if (e.target.value.trim()) next.set('search', e.target.value); else next.delete('search');
                setSearchParams(next, { replace: true });
              }}
              className="input-field pl-12"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pl-12 appearance-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="in_stock">En stock</option>
              <option value="low_stock">En alerte</option>
              <option value="out_of_stock">Rupture</option>
            </select>
          </div>
          {categories.length > 0 && (
            <div className="relative">
              <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input-field pl-12 appearance-none"
              >
                <option value="">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProducts.map(product => {
          const status = getProductStatus(product);
          const recentMovements = getRecentMovements(product.id);
          const StatusIcon = status.icon;

          return (
            <div key={product.id} className="card p-6 hover:shadow-xl transition-all duration-300 group">
              {/* Product Header */}
              <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-black text-slate-800 mb-1">{product.name}</h3>
                {product.category && product.category.trim() && (
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{product.category}</p>
                )}
              </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black ${
                  status.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                  status.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </span>
              </div>

              {/* Stock Info */}
              <div className="mb-4 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-600">Stock actuel</span>
                  <span className="text-2xl font-black text-slate-800">{product.quantity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Seuil d'alerte</span>
                  <span className="text-sm font-bold text-slate-600">{product.alert_threshold}</span>
                </div>
                {/* Progress Bar */}
                <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      status.color === 'emerald' ? 'bg-emerald-500' :
                      status.color === 'amber' ? 'bg-amber-500' :
                      'bg-rose-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (product.quantity / Math.max(product.alert_threshold * 2, 1)) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Price Info */}
              <div className="mb-4 flex items-center justify-between text-sm">
                <div>
                  <span className="text-slate-400">Prix d'achat</span>
                  <p className="font-bold text-slate-700">
                    {product.purchase_price != null ? formatCurrency(product.purchase_price) + ' F CFA' : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Prix de vente</span>
                  <p className="font-bold text-primary-600">
                    {product.sale_price != null ? formatCurrency(product.sale_price) + ' F CFA' : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Recent Movements */}
              {recentMovements.length > 0 && (
                <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Mouvements récents</p>
                  <div className="space-y-1">
                    {recentMovements.map(movement => (
                      <div key={movement.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {movement.movement_type === 'ENTREE' ? (
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-rose-600" />
                          )}
                          <span className="text-slate-600">
                            {new Date(movement.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <span className={`font-bold ${
                          movement.movement_type === 'ENTREE' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {movement.movement_type === 'ENTREE' ? '+' : '-'}{movement.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setViewingProduct(product)}
                  className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Voir détails
                </button>
                <button
                  onClick={() => navigate('/stock-movements')}
                  className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Mouvement
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal détail produit */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{viewingProduct.name}</h2>
              <button
                onClick={() => setViewingProduct(null)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {(viewingProduct.photo || viewingProduct.photo_url) && (
                <div className="mb-6">
                  <img
                    src={
                      (() => {
                        const p = viewingProduct.photo_url || viewingProduct.photo;
                        if (!p) return '';
                        if (typeof p === 'string' && p.startsWith('http')) return p;
                        return `http://localhost:8000${typeof p === 'string' && p.startsWith('/') ? p : `/media/${p}`}`;
                      })()
                    }
                    alt={viewingProduct.name}
                    className="w-full max-h-72 object-cover rounded-xl border border-slate-200"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {viewingProduct.category && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Catégorie</p>
                    <p className="font-semibold text-slate-800">{viewingProduct.category}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Quantité en stock</p>
                  <p className={`font-semibold ${viewingProduct.is_low_stock ? 'text-amber-600' : 'text-slate-800'}`}>
                    {viewingProduct.quantity}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Prix d'achat</p>
                  <p className="font-semibold text-slate-800">
                    {viewingProduct.purchase_price != null ? formatCurrency(viewingProduct.purchase_price) + ' F CFA' : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Prix de vente</p>
                  <p className="font-semibold text-primary-600">
                    {viewingProduct.sale_price != null ? formatCurrency(viewingProduct.sale_price) + ' F CFA' : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Seuil d'alerte</p>
                  <p className="font-semibold text-slate-800">{viewingProduct.alert_threshold ?? 'N/A'}</p>
                </div>
              </div>
              {viewingProduct.description && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-slate-700 text-sm">{viewingProduct.description}</p>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setViewingProduct(null);
                    navigate('/products');
                  }}
                  className="flex-1 btn-primary py-2.5 text-sm font-medium"
                >
                  Aller à la page Produits
                </button>
                <button
                  onClick={() => setViewingProduct(null)}
                  className="flex-1 btn-secondary py-2.5 text-sm font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="card p-20 text-center">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Aucun produit trouvé</h3>
          <p className="text-slate-500 font-medium">Essayez de modifier vos critères de recherche ou de filtres.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary px-8 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl font-bold transition-all ${
                  currentPage === i + 1
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-secondary px-8 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default Stock;
