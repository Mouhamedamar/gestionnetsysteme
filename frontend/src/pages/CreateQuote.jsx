import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { FileText, Plus, ArrowLeft, Save, X, UserPlus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';
import SearchableSelect from '../components/SearchableSelect';
import QuotePDF from '../components/QuotePDF';
import { formatCurrency } from '../utils/formatCurrency';

const CreateQuote = () => {
  const navigate = useNavigate();
  const { clients, products, addQuote, showNotification, fetchClients, addClient } = useApp();
  
  const [quoteData, setQuoteData] = useState({
    client_id: null,
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    expiration_date: '',
    company: 'NETSYSTEME',
    items: []
  });

  const [newItem, setNewItem] = useState({
    product: '',
    quantity: 1,
    unit_price: 0,
    total: 0
  });

  const [showClientModal, setShowClientModal] = useState(false);
  const [createdQuote, setCreatedQuote] = useState(null);

  // Charger les clients au montage
  useEffect(() => {
    fetchClients().catch(err => {
      console.error('Erreur lors du chargement des clients:', err);
    });
  }, [fetchClients]);

  // Gérer la création d'un nouveau client
  const handleSaveClient = async (id, clientData) => {
    try {
      if (!id) {
        // Création d'un nouveau client
        const newClient = await addClient(clientData);
        // Recharger la liste des clients
        await fetchClients();
        // Sélectionner automatiquement le nouveau client
        setQuoteData(prev => ({
          ...prev,
          client_id: newClient.id,
          client_name: newClient.name,
          client_email: newClient.email || '',
          client_phone: newClient.phone || '',
          client_address: newClient.address || ''
        }));
        setShowClientModal(false);
        showNotification('Client créé avec succès', 'success');
      }
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
    }
  };

  // Options pour la sélection client (recherche sur le même champ)
  const clientOptions = useMemo(
    () => (clients || []).map((c) => ({ value: c.id, label: String(c.name ?? '') })),
    [clients]
  );

  const handleClientSelect = (clientId, _option) => {
    if (clientId) {
      const selectedClient = clients.find((c) => c.id === parseInt(clientId));
      if (selectedClient) {
        setQuoteData((prev) => ({
          ...prev,
          client_id: selectedClient.id,
          client_name: selectedClient.name,
          client_email: selectedClient.email || '',
          client_phone: selectedClient.phone || '',
          client_address: selectedClient.address || '',
        }));
      }
    } else {
      setQuoteData((prev) => ({
        ...prev,
        client_id: null,
        client_name: '',
        client_email: '',
        client_phone: '',
        client_address: '',
      }));
    }
  };

  // Options pour la sélection produit (recherche sur le même champ)
  const productOptions = useMemo(
    () => (products || []).map((p) => ({ value: p.id, label: String(p.name ?? '') })),
    [products]
  );

  const handleAddItem = () => {
    if (!newItem.product || newItem.quantity <= 0 || newItem.unit_price <= 0) {
      showNotification('Veuillez remplir tous les champs correctement', 'error');
      return;
    }

    const product = products.find(p => p.id === parseInt(newItem.product));
    const newQuoteItem = {
      product: parseInt(newItem.product),
      quantity: parseInt(newItem.quantity),
      unit_price: parseFloat(newItem.unit_price)
    };

    setQuoteData(prev => ({
      ...prev,
      items: [...prev.items, newQuoteItem]
    }));

    setNewItem({ product: '', quantity: 1, unit_price: 0, total: 0 });
  };

  const handleRemoveItem = (index) => {
    setQuoteData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if ((!quoteData.client_id && !quoteData.client_name) || quoteData.items.length === 0) {
      showNotification('Veuillez sélectionner un client et ajouter au moins un article', 'error');
      return;
    }

    try {
      // Préparer les données à envoyer
      let expirationDate = null;
      if (quoteData.expiration_date) {
        // Convertir le format datetime-local en format ISO pour Django
        const date = new Date(quoteData.expiration_date);
        expirationDate = date.toISOString();
      }

      const dataToSend = {
        client_name: quoteData.client_name || '',
        client_email: quoteData.client_email || '',
        client_phone: quoteData.client_phone || '',
        client_address: quoteData.client_address || '',
        expiration_date: expirationDate,
        company: quoteData.company || 'NETSYSTEME',
        items: quoteData.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      // Ajouter client_id seulement s'il est défini
      if (quoteData.client_id) {
        dataToSend.client_id = quoteData.client_id;
      }

      console.log('Données envoyées au backend:', dataToSend);
      const created = await addQuote(dataToSend);
      showNotification('Devis créé avec succès', 'success');
      setCreatedQuote({
        ...created,
        quote_items: created.quote_items ?? created.items ?? [],
        client_name: created.client_name ?? quoteData.client_name,
      });
    } catch (error) {
      console.error('Erreur lors de la création du devis:', error);
      // L'erreur est déjà gérée dans addQuote
    }
  };

  return (
    <>
      <div className="space-y-8 animate-fade-in pb-12">
        <PageHeader
          title="Nouveau Devis"
          subtitle="Créer un nouveau devis client — Remplissez les informations ci-dessous"
          badge="Ventes"
          icon={FileText}
        >
          <button
            onClick={() => navigate('/quotes')}
            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold flex items-center gap-2 backdrop-blur-sm border border-white/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux devis
          </button>
        </PageHeader>

        {/* Quote Form */}
        <div className="glass-card p-6 border-white/40">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Informations du devis</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Client *</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <SearchableSelect
                    options={clientOptions}
                    value={quoteData.client_id ?? ''}
                    onChange={handleClientSelect}
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
              <label className="block text-sm font-bold text-slate-800 mb-2">Date d'expiration</label>
              <input
                type="datetime-local"
                value={quoteData.expiration_date}
                onChange={(e) => setQuoteData({...quoteData, expiration_date: e.target.value})}
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Société</label>
              <select
                value={quoteData.company}
                onChange={(e) => setQuoteData({...quoteData, company: e.target.value})}
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
              >
                <option value="NETSYSTEME">NETSYSTEME</option>
                <option value="SSE">SSE</option>
              </select>
            </div>

          </div>

          {/* Client details (si client sélectionné) */}
          {quoteData.client_id && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Email du client</label>
                <input
                  type="email"
                  value={quoteData.client_email}
                  onChange={(e) => setQuoteData({...quoteData, client_email: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Téléphone du client</label>
                <input
                  type="text"
                  value={quoteData.client_phone}
                  onChange={(e) => setQuoteData({...quoteData, client_phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
                  placeholder="+225 XX XX XX XX XX"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Adresse du client</label>
                <input
                  type="text"
                  value={quoteData.client_address}
                  onChange={(e) => setQuoteData({...quoteData, client_address: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
                  placeholder="Adresse complète"
                />
              </div>
            </div>
          )}

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
                  })} Fcfa
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
                {quoteData.items.length > 0 ? (
                  quoteData.items.map((item, index) => {
                    const product = products.find(p => p.id === item.product);
                    return (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                          {product?.name || 'Produit non spécifié'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-700 font-medium">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-700 font-medium">
                          {formatCurrency(item.unit_price)} Fcfa
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-900">
                          {formatCurrency(item.quantity * item.unit_price)} Fcfa
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <FileText className="w-16 h-16 text-slate-300" />
                        <p className="text-slate-700 text-lg font-bold">Aucun article ajouté</p>
                        <p className="text-slate-600 text-sm max-w-md font-medium">
                          Commencez par ajouter des articles à ce devis en utilisant le formulaire ci-dessus.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {quoteData.items.length > 0 && (
            <div className="glass-card p-6 border-white/40 mb-6 bg-primary-50/50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-600 text-sm font-semibold mb-1">Total des articles</p>
                  <p className="text-2xl font-black text-primary-600">
                    {(() => {
                      const total = quoteData.items.reduce((sum, item) => {
                        return sum + (item.quantity * item.unit_price);
                      }, 0);
                      return formatCurrency(total);
                    })} Fcfa
                  </p>
                  <p className="text-slate-500 text-xs mt-1">{quoteData.items.length} article(s) ajouté(s)</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => navigate('/quotes')}
              className="btn-secondary py-3 px-6 font-bold shadow-lg shadow-slate-500/20 transition-all hover:shadow-xl flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={quoteData.items.length === 0 || (!quoteData.client_id && !quoteData.client_name)}
              className={`py-3 px-6 font-bold shadow-lg transition-all hover:shadow-xl flex items-center gap-2 ${
                quoteData.items.length === 0 || (!quoteData.client_id && !quoteData.client_name)
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'btn-primary shadow-primary-500/20'
              }`}
            >
              <Save className="w-5 h-5" />
              Enregistrer le devis
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

      {createdQuote && (
        <QuotePDF
          quote={createdQuote}
          onClose={() => {
            setCreatedQuote(null);
            navigate('/quotes');
          }}
        />
      )}
    </>
  );
};

export default CreateQuote;
