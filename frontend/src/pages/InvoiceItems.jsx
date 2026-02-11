import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Package, ArrowLeft, Plus, Trash2, FileText, Printer, Download, Eye } from 'lucide-react';
import InvoicePDF from '../components/InvoicePDF';
import ConfirmationModal from '../components/ConfirmationModal';
import SearchableSelect from '../components/SearchableSelect';
import { formatCurrency } from '../utils/formatCurrency';

const InvoiceItems = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    invoices,
    loading,
    fetchInvoices,
    addInvoiceItem,
    deleteInvoiceItem,
    products,
    fetchProducts,
    showNotification
  } = useApp();

  const [invoice, setInvoice] = useState(null);
  const [newItem, setNewItem] = useState({
    product: '',
    quantity: 1,
    unit_price: 0
  });
  const [showInvoicePDF, setShowInvoicePDF] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await fetchInvoices();
      await fetchProducts();
    };
    loadData();
  }, []);

  useEffect(() => {
    if (invoices.length > 0) {
      const foundInvoice = invoices.find(inv => inv.id === parseInt(id));
      setInvoice(foundInvoice);
    }
  }, [invoices, id]);

  const productOptions = useMemo(
    () => (products || []).map((p) => ({ value: p.id, label: p.name })),
    [products]
  );

  const handleAddItem = async () => {
    if (!newItem.product || newItem.quantity <= 0 || newItem.unit_price <= 0) {
      showNotification('Veuillez remplir tous les champs correctement', 'error');
      return;
    }

    try {
      const product = products.find(p => p.id === parseInt(newItem.product));
      if (!product) {
        showNotification('Produit introuvable', 'error');
        return;
      }

      await addInvoiceItem(id, {
        product: parseInt(newItem.product),
        quantity: parseInt(newItem.quantity),
        unit_price: parseFloat(newItem.unit_price),
        product_name: product?.name || ''
      });

      // Recharger les données pour mettre à jour la facture
      await fetchInvoices();
      
      // Réinitialiser le formulaire
      setNewItem({ product: '', quantity: 1, unit_price: 0 });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'article:', error);
      showNotification(error.message || 'Erreur lors de l\'ajout de l\'article', 'error');
    }
  };

  const handleRemoveItem = (itemId) => {
    const item = invoice.items?.find(i => i.id === itemId);
    setItemToDelete({ id: itemId, name: item?.product_name || 'cet article' });
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
      setDeleting(true);
      await deleteInvoiceItem(id, itemToDelete.id);
      await fetchInvoices();
      showNotification('Article supprimé avec succès', 'success');
      setItemToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'article:', error);
      showNotification('Erreur lors de la suppression de l\'article', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !invoice) return (
    <div className="p-8">
      <div className="glass-card p-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded mb-4"></div>
        <div className="h-6 bg-slate-200 rounded mb-2 w-3/4"></div>
        <div className="h-6 bg-slate-200 rounded mb-2 w-1/2"></div>
      </div>
    </div>
  );

  return (
      <div className="space-y-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="glass-card p-8 border-white/40 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <FileText className="w-32 h-32 text-primary-600" />
          </div>
          <div className="relative z-10">
            <button
              onClick={() => navigate('/invoices')}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour aux factures
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black text-primary-600 mb-2">
                  Facture #{invoice.invoice_number}
                </h1>
                <p className="text-slate-800 text-lg font-bold mb-1">Client: <span className="text-slate-900 font-black">{invoice.client_name || 'Non spécifié'}</span></p>
                <p className="text-slate-700 text-base mt-2 font-semibold">
                  Statut: <span className={invoice.status === 'PAYE' ? 'text-green-700 font-black' : 'text-yellow-700 font-black'}>{invoice.status === 'PAYE' ? '✓ Payé' : 'Non payé'}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-primary-600">
                  {(() => {
                    const amount = typeof invoice.total_ttc === 'string' 
                      ? parseFloat(invoice.total_ttc) || 0 
                      : Number(invoice.total_ttc) || 0;
                    return formatCurrency(amount);
                  })()} Fcfa
                </p>
                <p className="text-slate-700 text-sm mt-1 font-semibold">
                  {invoice.date ? new Date(invoice.date).toLocaleDateString('fr-FR') : 'Date non spécifiée'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Item Section */}
        <div className="glass-card p-6 border-white/40">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Ajouter un article</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Produit *</label>
              <SearchableSelect
                options={productOptions}
                value={newItem.product}
                onChange={(productId) => {
                  if (productId) {
                    const selectedProduct = products.find((p) => p.id === parseInt(productId));
                    const price = selectedProduct?.sale_price || 0;
                    setNewItem((prev) => ({
                      ...prev,
                      product: String(productId),
                      unit_price: price,
                    }));
                  } else {
                    setNewItem((prev) => ({ ...prev, product: '', unit_price: 0 }));
                  }
                }}
                placeholder="Rechercher ou sélectionner un produit…"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Quantité *</label>
              <input
                type="number"
                min="1"
                value={newItem.quantity}
                onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Prix unitaire (FCFA) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newItem.unit_price || ''}
                onChange={(e) => setNewItem({...newItem, unit_price: parseFloat(e.target.value) || 0})}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn-primary w-full py-3 px-6 font-bold shadow-lg shadow-primary-500/20 transition-all hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Ajouter
              </button>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="glass-card p-0 border-white/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-primary-600/10 backdrop-blur-sm">
                <tr>
                  <th className="table-header">Produit</th>
                  <th className="table-header text-center">Quantité</th>
                  <th className="table-header text-right">Prix unitaire</th>
                  <th className="table-header text-right">Total</th>
                  <th className="table-header text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map(item => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="table-cell font-semibold text-slate-800">
                        {item.product_name || 'Produit non spécifié'}
                      </td>
                      <td className="table-cell text-center text-slate-700 font-medium">
                        {item.quantity}
                      </td>
                      <td className="table-cell text-right text-slate-700 font-medium">
                        {(() => {
                          const price = Number(item.unit_price) || 0;
                          return formatCurrency(price);
                        })()} Fcfa
                      </td>
                      <td className="table-cell text-right font-bold text-slate-900">
                        {(() => {
                          const qty = Number(item.quantity) || 0;
                          const price = Number(item.unit_price) || 0;
                          const total = qty * price;
                          return formatCurrency(total);
                        })()} Fcfa
                      </td>
                      <td className="table-cell text-center">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all"
                          title="Supprimer cet article"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="table-cell text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Package className="w-16 h-16 text-slate-400" />
                        <p className="text-slate-700 text-lg font-semibold">Aucun article trouvé</p>
                        <p className="text-slate-600 text-sm max-w-md">
                          Commencez par ajouter des articles à cette facture en utilisant le formulaire ci-dessus.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-primary-600/5">
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-right text-base font-black text-slate-900">
                    TOTAL:
                  </td>
                  <td className="px-6 py-4 text-right text-xl font-black text-primary-600">
                    {(() => {
                      const amount = typeof invoice.total_ttc === 'string' 
                        ? parseFloat(invoice.total_ttc) || 0 
                        : Number(invoice.total_ttc) || 0;
                      return formatCurrency(amount);
                    })()} Fcfa
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="glass-card p-6 border-white/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-slate-800 mb-2 font-bold">Actions disponibles pour cette facture</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowInvoicePDF(true)}
              className="btn-primary py-3 px-6 font-bold shadow-lg shadow-primary-500/20 transition-all hover:shadow-xl flex items-center gap-2"
            >
              <Eye className="w-5 h-5" />
              Voir la facture
            </button>
            <button
              onClick={() => window.print()}
              className="btn-secondary py-3 px-6 font-bold shadow-lg shadow-slate-500/20 transition-all hover:shadow-xl flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Imprimer
            </button>
          </div>
        </div>

        {/* Invoice PDF Modal */}
        {showInvoicePDF && (
          <InvoicePDF
            invoice={invoice}
            onClose={() => setShowInvoicePDF(false)}
          />
        )}

        {/* Modal de confirmation de suppression */}
        <ConfirmationModal
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={confirmDeleteItem}
          title="Supprimer l'article"
          message={`Êtes-vous sûr de vouloir supprimer "${itemToDelete?.name}" de cette facture ?`}
          confirmText="Supprimer"
          cancelText="Annuler"
          type="danger"
          loading={deleting}
        />
      </div>
  );
};

export default InvoiceItems;