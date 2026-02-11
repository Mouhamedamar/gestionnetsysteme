import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { FileText, Plus, ArrowLeft, Save, X, UserPlus } from 'lucide-react';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';
import SearchableSelect from '../components/SearchableSelect';
import { formatCurrency } from '../utils/formatCurrency';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clients, products, addInvoice, showNotification, fetchClients, addClient } = useApp();
  
  // Détecter si c'est une facture pro forma depuis l'URL
  const isProforma = searchParams.get('proforma') === 'true';
  
  const [invoiceData, setInvoiceData] = useState({
    client_name: '',
    status: 'NON_PAYE',
    is_proforma: isProforma,
    items: []
  });

  const [newItem, setNewItem] = useState({
    product: '',
    quantity: 1,
    unit_price: 0,
    total: 0
  });

  const [showClientModal, setShowClientModal] = useState(false);

  // Charger les clients au montage
  useEffect(() => {
    fetchClients().catch(err => {
      console.error('Erreur lors du chargement des clients:', err);
    });
  }, [fetchClients]);

  const clientOptions = useMemo(
    () => (clients || []).map((c) => ({ value: c.name, label: c.name })),
    [clients]
  );

  const productOptions = useMemo(
    () => (products || []).map((p) => ({ value: p.id, label: p.name })),
    [products]
  );

  // Gérer la création d'un nouveau client
  const handleSaveClient = async (id, clientData) => {
    try {
      if (!id) {
        // Création d'un nouveau client
        const newClient = await addClient(clientData);
        // Recharger la liste des clients
        await fetchClients();
        // Sélectionner automatiquement le nouveau client
        setInvoiceData(prev => ({
          ...prev,
          client_name: newClient.name
        }));
        setShowClientModal(false);
        showNotification('Client créé avec succès', 'success');
      }
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
    }
  };

  const handleAddItem = () => {
    if (!newItem.product || newItem.quantity <= 0 || newItem.unit_price <= 0) {
      showNotification('Veuillez remplir tous les champs correctement', 'error');
      return;
    }

    const product = products.find(p => p.id === parseInt(newItem.product));
    const newInvoiceItem = {
      product: parseInt(newItem.product),
      quantity: parseInt(newItem.quantity),
      unit_price: parseFloat(newItem.unit_price),
      product_name: product?.name || ''
    };

    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, newInvoiceItem]
    }));

    setNewItem({ product: '', quantity: 1, unit_price: 0, total: 0 });
  };

  const handleRemoveItem = (index) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!invoiceData.client_name || invoiceData.items.length === 0) {
      showNotification('Veuillez sélectionner un client et ajouter au moins un article', 'error');
      return;
    }

    try {
      await addInvoice(invoiceData);
      showNotification(isProforma ? 'Facture pro forma créée avec succès' : 'Facture créée avec succès', 'success');
      navigate(isProforma ? '/proforma-invoices' : '/invoices');
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
      showNotification('Erreur lors de la création de la facture', 'error');
    }
  };

  return (
    <>
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
                  Nouvelle Facture
                </h1>
                <p className="text-slate-700 text-lg font-semibold">Créer une nouvelle facture client</p>
                <p className="text-slate-500 text-sm mt-1">Remplissez les informations ci-dessous pour créer une nouvelle facture</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Form */}
        <div className="glass-card p-6 border-white/40">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Informations de la facture</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Client *</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <SearchableSelect
                    options={clientOptions}
                    value={invoiceData.client_name}
                    onChange={(val) => setInvoiceData((prev) => ({ ...prev, client_name: val || '' }))}
                    placeholder="Rechercher ou sélectionner un client…"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowClientModal(true)}
                  className="btn-primary px-6 py-3 font-bold shadow-lg shadow-primary-500/30 transition-all hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px]"
                  title="Créer un nouveau client"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Nouveau client</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Statut</label>
              <select
                value={invoiceData.status}
                onChange={(e) => setInvoiceData({...invoiceData, status: e.target.value})}
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
              >
                <option value="NON_PAYE">Non payé</option>
                <option value="PAYE">Payé</option>
              </select>
            </div>
          </div>

          {/* Add Item Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Ajouter des articles</h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Produit *</label>
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
                      setNewItem((prev) => ({
                        ...prev,
                        product: '',
                        unit_price: 0,
                      }));
                    }
                  }}
                  placeholder="Rechercher ou sélectionner un produit…"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Quantité *</label>
                <input
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    const quantity = value === '' ? 1 : parseInt(value) || 1;
                    setNewItem(prev => ({
                      ...prev,
                      quantity: quantity
                    }));
                  }}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Prix unitaire (FCFA) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.unit_price || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const price = value === '' ? 0 : parseFloat(value) || 0;
                    setNewItem(prev => ({
                      ...prev,
                      unit_price: price
                    }));
                  }}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Total (FCFA)</label>
                <div className="w-full px-4 py-3 rounded-lg bg-primary-50 border-2 border-primary-400 text-primary-700 font-bold text-lg text-center">
                  {(() => {
                    const qty = Number(newItem.quantity) || 0;
                    const price = Number(newItem.unit_price) || 0;
                    const total = qty * price;
                    return total > 0 ? formatCurrency(total) : '0';
                  })()} Fcfa
                </div>
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
          <div className="overflow-x-auto mb-8 border border-slate-200 rounded-lg">
            <table className="w-full text-left bg-white">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Produit</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Quantité</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Prix unitaire</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoiceData.items.length > 0 ? (
                  invoiceData.items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                        {item.product_name || 'Produit non spécifié'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-700 font-medium">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-700 font-medium">
                        {(() => {
                          const price = Number(item.unit_price) || 0;
                          return formatCurrency(price);
                        })()} Fcfa
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-900">
                        {(() => {
                          const qty = Number(item.quantity) || 0;
                          const price = Number(item.unit_price) || 0;
                          const total = qty * price;
                          return formatCurrency(total);
                        })()} Fcfa
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Supprimer cet article"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <FileText className="w-16 h-16 text-slate-300" />
                        <p className="text-slate-700 text-lg font-bold">Aucun article ajouté</p>
                        <p className="text-slate-600 text-sm max-w-md font-medium">
                          Commencez par ajouter des articles à cette facture en utilisant le formulaire ci-dessus.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {invoiceData.items.length > 0 && (
            <div className="glass-card p-6 border-white/40 mb-6 bg-primary-50/50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-600 text-sm font-semibold mb-1">Total des articles</p>
                  <p className="text-2xl font-black text-primary-600">
                    {(() => {
                      const total = invoiceData.items.reduce((sum, item) => {
                        const qty = Number(item.quantity) || 0;
                        const price = Number(item.unit_price) || 0;
                        return sum + (qty * price);
                      }, 0);
                      return formatCurrency(total);
                    })()} Fcfa
                  </p>
                  <p className="text-slate-500 text-xs mt-1">{invoiceData.items.length} article(s) ajouté(s)</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => navigate(isProforma ? '/proforma-invoices' : '/invoices')}
              className="btn-secondary py-3 px-6 font-bold shadow-lg shadow-slate-500/20 transition-all hover:shadow-xl flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={invoiceData.items.length === 0 || !invoiceData.client_name}
              className={`py-3 px-6 font-bold shadow-lg transition-all hover:shadow-xl flex items-center gap-2 ${
                invoiceData.items.length === 0 || !invoiceData.client_name
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'btn-primary shadow-primary-500/20'
              }`}
            >
              <Save className="w-5 h-5" />
              {isProforma ? 'Enregistrer la facture pro forma' : 'Enregistrer la facture'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal pour créer un nouveau client */}
      <Modal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        title="Nouveau client"
        size="md"
      >
        <ClientForm
          client={null}
          onClose={() => setShowClientModal(false)}
          onSave={handleSaveClient}
        />
      </Modal>
    </>
  );
};

export default CreateInvoice;