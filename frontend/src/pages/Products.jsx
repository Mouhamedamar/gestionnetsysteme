import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, X, FileDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import ConfirmationModal from '../components/ConfirmationModal';
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

  // Synchroniser la recherche avec l'URL (arrivée sur la page ou navigation)
  useEffect(() => {
    const q = searchParams.get('search');
    setSearchTerm(q ?? '');
  }, [searchParams]);

  // Debounce de la recherche
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filtrer les produits (null-safe pour name/category)
  const filteredProducts = products.filter(product => {
    const term = (debouncedSearchTerm || '').toLowerCase();
    const nameMatch = (product.name || '').toLowerCase().includes(term);
    const categoryMatch = (product.category || '').toLowerCase().includes(term);
    const matchesSearch = !term || nameMatch || categoryMatch;
    const matchesCategory = !categoryFilter || (product.category && product.category === categoryFilter);
    return matchesSearch && matchesCategory;
  });

  // Récupérer les catégories uniques
  const categories = [...new Set(products.filter(p => p.category && p.category.trim()).map(p => p.category))].sort();

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
    <div className="space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Produits</h1>
          <p className="page-subtitle">Gestion des produits en stock</p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn-secondary"
            title="Exporter en CSV"
          >
            <FileDown className="w-5 h-5" />
            Exporter CSV
          </button>
          <button
            type="button"
            onClick={handleAddProduct}
            className="btn-primary"
          >
            <Plus className="w-5 h-5" />
            Nouveau produit
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-700' :
          notification.type === 'error' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        {/* Recherche */}
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Catégories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                !categoryFilter
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Toutes
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  categoryFilter === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Résultats */}
      <div>
        <p className="text-sm text-gray-600 mb-4">
          {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
            <p className="text-gray-400 text-sm mt-1">Créez un nouveau produit pour commencer</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => handleEditProduct(product)}
                onDelete={() => handleDeleteProduct(product)}
                onView={() => handleViewProduct(product)}
              />
            ))}
          </div>
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
