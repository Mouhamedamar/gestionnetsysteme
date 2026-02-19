import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, X, FileDown, Package, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import ConfirmationModal from '../components/ConfirmationModal';
import PageHeader from '../components/PageHeader';
import { useDebounce } from '../hooks/useDebounce';
import { exportProductsToCSV } from '../utils/exportData';
import { formatCurrency } from '../utils/formatCurrency';
import { API_BASE_URL } from '../config';

const Products = () => {
  const { products, deleteProduct, loading, notification, showNotification } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewingProduct, setViewingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const PRODUCTS_PER_PAGE = 12;

  // Synchroniser la recherche avec l'URL (arrivée sur la page ou navigation)
  useEffect(() => {
    const q = searchParams.get('search');
    setSearchTerm(q ?? '');
  }, [searchParams]);

  // Debounce de la recherche
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Revenir à la page 1 quand les filtres ou le tri changent
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, categoryFilter, sortBy, sortOrder]);

  // Filtrer les produits (null-safe pour name/category)
  const filteredProducts = products.filter(product => {
    const term = (debouncedSearchTerm || '').toLowerCase();
    const nameMatch = (product.name || '').toLowerCase().includes(term);
    const categoryMatch = (product.category || '').toLowerCase().includes(term);
    const matchesSearch = !term || nameMatch || categoryMatch;
    const matchesCategory = !categoryFilter || (product.category && product.category === categoryFilter);
    return matchesSearch && matchesCategory;
  });

  // Trier les produits pour un affichage organisé
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    const isLowStock = (p) => (p.quantity ?? 0) <= (p.alert_threshold ?? 0);
    const cmp = (a, b) => {
      if (sortBy === 'stock_priority') {
        const aLow = isLowStock(a) ? 1 : 0;
        const bLow = isLowStock(b) ? 1 : 0;
        if (aLow !== bLow) return sortOrder === 'asc' ? bLow - aLow : aLow - bLow;
        return (a.quantity ?? 0) - (b.quantity ?? 0);
      }
      let va = a[sortBy];
      let vb = b[sortBy];
      if (sortBy === 'name' || sortBy === 'category') {
        va = (va ?? '').toString().toLowerCase();
        vb = (vb ?? '').toString().toLowerCase();
        const r = va.localeCompare(vb, 'fr');
        return sortOrder === 'asc' ? r : -r;
      }
      va = Number(va) ?? 0;
      vb = Number(vb) ?? 0;
      return sortOrder === 'asc' ? va - vb : vb - va;
    };
    list.sort(cmp);
    return list;
  }, [filteredProducts, sortBy, sortOrder]);

  // Récupérer les catégories uniques (tri alphabétique)
  const categories = useMemo(
    () => [...new Set(products.filter(p => p.category && p.category.trim()).map(p => p.category))].sort((a, b) => a.localeCompare(b, 'fr')),
    [products]
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE));
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      setDeleting(true);
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setProductToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleViewProduct = (product) => {
    setViewingProduct(product);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleExportCSV = () => {
    try {
      exportProductsToCSV(products, `produits_${new Date().toISOString().split('T')[0]}.csv`);
      // Utiliser showNotification si disponible dans le contexte
      if (window.showNotification) {
        window.showNotification('Export CSV réussi', 'success');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      if (window.showNotification) {
        window.showNotification('Erreur lors de l\'export CSV', 'error');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader
        title="Produits"
        subtitle="Gestion des produits et du catalogue"
        badge="Catalogue"
        icon={Package}
      >
        <button type="button" onClick={handleExportCSV} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold flex items-center gap-2 backdrop-blur-sm border border-white/20 transition-all" title="Exporter en CSV">
          <FileDown className="w-5 h-5" />
          Exporter CSV
        </button>
        <button type="button" onClick={handleAddProduct} className="px-6 py-2.5 rounded-xl bg-white text-primary-600 font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-5 h-5" />
          Nouveau produit
        </button>
      </PageHeader>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-xl ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
          notification.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
          'bg-amber-50 text-amber-700 border border-amber-100'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Filtres */}
      <div className="glass-card p-6 shadow-xl border-white/60">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom ou catégorie..."
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
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
              <button
                onClick={() => setCategoryFilter('')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  !categoryFilter ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Toutes
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    categoryFilter === category ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Résultats et tri */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <p className="text-sm font-semibold text-slate-600">
            {sortedProducts.length} produit{sortedProducts.length !== 1 ? 's' : ''} trouvé{sortedProducts.length !== 1 ? 's' : ''}
            {totalPages > 1 && (
              <span className="text-slate-500 font-medium ml-1">
                — Page {currentPage} sur {totalPages}
              </span>
            )}
          </p>
          {sortedProducts.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <ArrowUpDown className="w-4 h-4" />
                Trier par
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="name">Nom (A → Z)</option>
                <option value="category">Catégorie</option>
                <option value="quantity">Quantité en stock</option>
                <option value="sale_price">Prix de vente</option>
                <option value="stock_priority">Stock (faible d'abord)</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                title={sortOrder === 'asc' ? 'Croissant (cliquer pour décroissant)' : 'Décroissant (cliquer pour croissant)'}
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                {sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full" />
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-2xl border-2 border-dashed border-slate-200">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="font-bold text-slate-700 text-lg">Aucun produit trouvé</p>
            <p className="text-slate-500 text-sm mt-1">Créez un nouveau produit pour commencer</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={() => handleEditProduct(product)}
                  onDelete={() => handleDeleteProduct(product)}
                  onView={() => handleViewProduct(product)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <p className="text-sm text-slate-600">
                  {startIndex + 1}-{Math.min(startIndex + PRODUCTS_PER_PAGE, sortedProducts.length)} sur {sortedProducts.length}
                </p>
                <nav className="flex items-center gap-1" aria-label="Pagination">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Page précédente"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const showPage =
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2);
                      if (!showPage) {
                        if (page === currentPage - 3 || page === currentPage + 3) {
                          return <span key={page} className="px-2 text-slate-400">…</span>;
                        }
                        return null;
                      }
                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[2.25rem] py-2 px-2 rounded-lg text-sm font-semibold transition-colors ${
                            currentPage === page
                              ? 'bg-primary-600 text-white shadow-md'
                              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Page suivante"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleCloseForm}
          onSave={() => {
            handleCloseForm();
          }}
        />
      )}

      {/* Modal de détail du produit */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-90vh overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">{viewingProduct.name}</h2>
              <button
                onClick={() => setViewingProduct(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Image produit */}
              {viewingProduct.photo && (
                <div className="mb-6">
                  <img
                    src={
                      viewingProduct.photo.startsWith('http')
                        ? viewingProduct.photo
                        : viewingProduct.photo.startsWith('/media')
                        ? `${API_BASE_URL}${viewingProduct.photo}`
                        : `${API_BASE_URL}/media/products/${viewingProduct.photo}`
                    }
                    alt={viewingProduct.name}
                    className="w-full max-h-96 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Grille d'infos */}
              <div className="grid grid-cols-2 gap-6 mb-6">
              {viewingProduct.category && (
                <div>
                  <p className="text-sm text-gray-600">Catégorie</p>
                  <p className="font-semibold text-lg">{viewingProduct.category}</p>
                </div>
              )}
                <div>
                  <p className="text-sm text-gray-600">Quantité en stock</p>
                  <p className={`font-semibold text-lg ${viewingProduct.is_low_stock ? 'text-red-600' : 'text-green-600'}`}>
                    {viewingProduct.quantity}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prix d'achat</p>
                  <p className="font-semibold text-lg">{formatCurrency(viewingProduct.purchase_price ?? 0)} DZD</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prix de vente</p>
                  <p className="font-semibold text-lg">{formatCurrency(viewingProduct.sale_price ?? 0)} DZD</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Seuil d'alerte</p>
                  <p className="font-semibold text-lg">{viewingProduct.alert_threshold}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total vendu</p>
                  <p className="font-semibold text-lg">{viewingProduct.total_sold}</p>
                </div>
              </div>

              {/* Description */}
              {viewingProduct.description && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  <p className="text-gray-800">{viewingProduct.description}</p>
                </div>
              )}

              {/* Statut */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Produit actif</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    viewingProduct.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {viewingProduct.is_active ? 'Oui' : 'Non'}
                  </span>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleEditProduct(viewingProduct);
                    setViewingProduct(null);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Modifier
                </button>
                <button
                  onClick={() => setViewingProduct(null)}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDeleteProduct}
        title="Supprimer le produit"
        message={`Êtes-vous sûr de vouloir supprimer le produit "${productToDelete?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        loading={deleting}
      />
    </div>
  );
};

export default Products;
