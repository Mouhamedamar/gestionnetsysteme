import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, ArrowDown, ArrowUp, Trash2, TrendingUp, Calendar, Package, Filter, MessageSquare, Hash } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Loader from '../components/Loader';
import { useDebounce } from '../hooks/useDebounce';

const StockMovements = () => {
  const { stockMovements, products, loading, addStockMovement, deleteStockMovement } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    product: '',
    movement_type: 'ENTREE',
    quantity: 1,
    comment: '',
    date: new Date().toISOString().split('T')[0]
  });
  const itemsPerPage = 10;

  // Debounce de la recherche
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredMovements = stockMovements
    .filter(m => {
      const matchesSearch = m.product_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        m.comment?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesProduct = !productFilter || m.product === parseInt(productFilter);
      const matchesType = !typeFilter || m.movement_type === typeFilter;
      return matchesSearch && matchesProduct && matchesType;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addStockMovement({
        ...formData,
        product: parseInt(formData.product, 10),
        quantity: parseInt(formData.quantity, 10)
      });
      setIsModalOpen(false);
      setFormData({
        product: '',
        movement_type: 'ENTREE',
        quantity: 1,
        comment: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch {
      // Erreur déjà affichée par addStockMovement, on garde le modal ouvert
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="glass-card p-8 border-white/40 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <TrendingUp className="w-32 h-32 text-primary-600" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-12 bg-primary-600 rounded-full"></div>
              <span className="text-primary-600 font-bold uppercase tracking-widest text-xs">Logistique</span>
            </div>
            <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Mouvements de Stock</h1>
            <p className="text-slate-500 font-medium">Suivez l'historique des entrées et sorties de vos produits.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary shadow-xl shadow-primary-500/30 px-8 py-4 text-lg">
            <Plus className="w-6 h-6" />
            Nouveau Mouvement
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="card p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher un mouvement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          <div className="relative">
            <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="input-field pl-12 appearance-none"
            >
              <option value="">Tous les produits</option>
              {products.filter(p => !p.deleted_at).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field pl-12 appearance-none"
            >
              <option value="">Tous les types</option>
              <option value="ENTREE">Entrées uniquement</option>
              <option value="SORTIE">Sorties uniquement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="card p-0 overflow-hidden border-none shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Date</th>
                <th className="table-header">Produit</th>
                <th className="table-header text-center">Type</th>
                <th className="table-header text-center">Quantité</th>
                <th className="table-header">Commentaire</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedMovements.map(movement => (
                <tr key={movement.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="table-cell">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(movement.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="table-cell font-bold text-slate-700">{movement.product_name}</td>
                  <td className="table-cell text-center">
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase ${movement.movement_type === 'ENTREE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                      }`}>
                      {movement.movement_type === 'ENTREE' ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )}
                      {movement.movement_type === 'ENTREE' ? 'Entrée' : 'Sortie'}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <span className="font-black text-slate-800 text-lg">{movement.quantity}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2 text-slate-500 italic text-sm">
                      {movement.comment ? (
                        <>
                          <MessageSquare className="w-4 h-4 text-slate-300" />
                          {movement.comment}
                        </>
                      ) : (
                        <span className="text-slate-300">Aucun commentaire</span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setMovementToDelete(movement)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {paginatedMovements.length === 0 && (
        <div className="card p-20 text-center">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Aucun mouvement trouvé</h3>
          <p className="text-slate-500 font-medium">Essayez de modifier vos critères de recherche ou de filtres.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-12">
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
                className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === i + 1
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

      {/* Create Movement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouveau Mouvement de Stock"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-primary-500" /> Produit <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              className="input-field appearance-none"
              required
            >
              <option value="">Sélectionner un produit</option>
              {products.filter(p => !p.deleted_at && p.is_active).map(p => (
                <option key={p.id} value={p.id}>{p.name} (Stock actuel: {p.quantity})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary-500" /> Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.movement_type}
                onChange={(e) => setFormData({ ...formData, movement_type: e.target.value })}
                className="input-field appearance-none"
                required
              >
                <option value="ENTREE">Entrée</option>
                <option value="SORTIE">Sortie</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary-500" /> Quantité <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="input-field"
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-500" /> Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-500" /> Commentaire
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="input-field min-h-[100px]"
              placeholder="Détails du mouvement..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="flex-1 btn-primary py-4 text-lg shadow-xl shadow-primary-500/20">
              Enregistrer le Mouvement
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-8 py-4 rounded-2xl font-black text-slate-500 hover:bg-slate-100 transition-all"
            >
              Annuler
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={!!movementToDelete}
        onClose={() => setMovementToDelete(null)}
        onConfirm={async () => {
          if (!movementToDelete) return;
          try {
            setDeleting(true);
            await deleteStockMovement(movementToDelete.id);
            setMovementToDelete(null);
          } catch (error) {
            console.error('Erreur lors de la suppression:', error);
          } finally {
            setDeleting(false);
          }
        }}
        title="Supprimer le mouvement"
        message={`Êtes-vous sûr de vouloir supprimer ce mouvement de stock ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        loading={deleting}
      />
    </div>
  );
};

export default StockMovements;

