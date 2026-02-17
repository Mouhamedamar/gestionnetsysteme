import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft,
  Plus,
  User,
  Package,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Upload,
  Trash2,
  Search,
  Check,
  Eye,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SearchableSelect from '../components/SearchableSelect';
import InvoicePDF from '../components/InvoicePDF';
import { formatCurrency } from '../utils/formatCurrency';

const PAYMENT_METHODS = [
  { value: '', label: '-- Sélectionner --' },
  { value: 'ESPECE', label: 'Espèce (Comptant)' },
  { value: '1_TRANCHE', label: '1 tranche' },
  { value: '2_TRANCHES', label: '2 tranches' },
  { value: '3_TRANCHES', label: '3 tranches' },
  { value: '4_TRANCHES', label: '4 tranches' },
];

/** Répartition des tranches : 50 % à la 1ère échéance, 25 % à la 2e, le reste sur les suivantes. */
function getTranchePercentages(numTranches) {
  if (!numTranches || numTranches < 1) return [];
  if (numTranches === 1) return [100];
  if (numTranches === 2) return [50, 50];
  if (numTranches === 3) return [50, 25, 25];
  if (numTranches === 4) return [50, 25, 12.5, 12.5];
  const rest = 25 / (numTranches - 2);
  return [50, 25, ...Array(numTranches - 2).fill(rest)];
}

function getNumTranchesFromMethod(method) {
  if (!method || method === 'ESPECE') return 0;
  const m = { '1_TRANCHE': 1, '2_TRANCHES': 2, '3_TRANCHES': 3, '4_TRANCHES': 4 };
  return m[method] || 0;
}

const CreateInstallation = () => {
  const navigate = useNavigate();
  const { clients = [], users = [], products = [], invoices = [], apiCall, showNotification, fetchClients, fetchUsers, fetchProducts, fetchInvoices } = useApp();
  const [previewInvoice, setPreviewInvoice] = useState(null);

  const [formData, setFormData] = useState({
    // Informations client (peut être nouveau ou client existant)
    client_id: '',
    first_name: '',
    last_name: '',
    client_phone: '',
    client_address: '',
    rccm_number: '',
    registration_number: '',
    ninea_number: '',
    // Détails installation
    installation_date: '',
    payment_method: '',
    first_installment_due_date: '',
    // Montants (total calculé depuis les produits)
    total_amount: 0,
    advance_amount: 0,
    remaining_amount: 0,
    // Personnel
    commercial_agent: '',
    technicians: [],
    // Facture optionnelle
    invoice_id: '',
    no_invoice: true,
    // Titre pour compatibilité API
    title: '',
  });

  const [productsRows, setProductsRows] = useState([]);
  const [contractFile, setContractFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [filterInvoiceCompany, setFilterInvoiceCompany] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [addQtyPerProduct, setAddQtyPerProduct] = useState({});
  const [commercialSearch, setCommercialSearch] = useState('');
  const [technicianSearch, setTechnicianSearch] = useState('');

  const technicians = useMemo(() => {
    return (users || []).filter(u => (u.role || u.profile?.role) === 'technicien');
  }, [users]);
  const commercialAgents = useMemo(() => {
    return (users || []).filter(u => (u.role || u.profile?.role) === 'commercial');
  }, [users]);

  const productOptions = useMemo(
    () => (products || [])
      .filter(p => !p.deleted_at && p.is_active)
      .map(p => ({
        value: p.id,
        label: p.name,
        price: p.sale_price ?? 0,
      })),
    [products]
  );
  const commercialOptions = useMemo(
    () => commercialAgents.map(u => ({
      value: u.id,
      label: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username,
      email: u.email || '',
      username: u.username || '',
    })),
    [commercialAgents]
  );
  const filteredCommercials = useMemo(() => {
    const q = commercialSearch.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!q) return commercialOptions;
    return commercialOptions.filter(o =>
      (o.label || '').toLowerCase().includes(q) ||
      (o.email || '').toLowerCase().includes(q) ||
      (o.username || '').toLowerCase().includes(q)
    );
  }, [commercialOptions, commercialSearch]);
  const technicianOptions = useMemo(
    () => technicians.map(u => ({
      value: u.id,
      label: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username,
      email: u.email || '',
      username: u.username || '',
    })),
    [technicians]
  );
  const filteredTechnicians = useMemo(() => {
    const q = technicianSearch.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!q) return technicianOptions;
    return technicianOptions.filter(o =>
      (o.label || '').toLowerCase().includes(q) ||
      (o.email || '').toLowerCase().includes(q) ||
      (o.username || '').toLowerCase().includes(q)
    );
  }, [technicianOptions, technicianSearch]);

  const toggleTechnician = (techId) => {
    const ids = Array.isArray(formData.technicians) ? formData.technicians : [];
    const strId = String(techId);
    const isSelected = ids.some(id => String(id) === strId);
    if (isSelected) {
      setFormData(f => ({ ...f, technicians: ids.filter(id => String(id) !== strId) }));
    } else {
      setFormData(f => ({ ...f, technicians: [...ids, techId] }));
    }
  };
  // Factures (hors pro forma) pour liaison optionnelle
  const invoiceOptions = useMemo(
    () => (invoices || [])
      .filter(inv => !inv.is_proforma)
      .map(inv => ({
        value: inv.id,
        label: `${inv.invoice_number || inv.number || 'N/A'} — ${inv.client_name || inv.client?.name || 'Sans client'}`,
        company: (inv.company && String(inv.company).toUpperCase()) === 'SSE' ? 'SSE' : 'NETSYSTEME',
      })),
    [invoices]
  );
  const filteredInvoices = useMemo(() => {
    let list = invoiceOptions;
    if (filterInvoiceCompany) {
      list = list.filter(o => (o.company || 'NETSYSTEME') === filterInvoiceCompany);
    }
    if (invoiceSearch.trim()) {
      const q = invoiceSearch.trim().toLowerCase().replace(/\s+/g, ' ');
      list = list.filter(o => (o.label || '').toLowerCase().includes(q));
    }
    return list;
  }, [invoiceOptions, invoiceSearch, filterInvoiceCompany]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!q) return productOptions;
    return productOptions.filter(o =>
      (o.label || '').toLowerCase().includes(q) ||
      String(o.price || '').includes(q)
    );
  }, [productOptions, productSearch]);

  const [lastAddedIndex, setLastAddedIndex] = useState(null);
  useEffect(() => {
    if (lastAddedIndex == null) return;
    const t = setTimeout(() => setLastAddedIndex(null), 1500);
    return () => clearTimeout(t);
  }, [lastAddedIndex]);

  const addProductFromList = (productId, qty = 1) => {
    const p = products?.find(prod => String(prod.id) === String(productId));
    if (!p) return;
    const q = Math.max(1, parseInt(qty, 10) || 1);
    const price = p.sale_price ?? 0;
    const existingIdx = productsRows.findIndex(r => String(r.product) === String(productId));
    if (existingIdx >= 0) {
      const row = productsRows[existingIdx];
      const newQty = (Number(row.quantity) || 1) + q;
      updateProductRow(existingIdx, 'quantity', newQty);
      setLastAddedIndex(existingIdx);
    } else {
      setProductsRows(prev => {
        const next = [...prev, {
          product: String(productId),
          quantity: q,
          unit_price: price,
          total: q * price,
        }];
        setLastAddedIndex(next.length - 1);
        return next;
      });
    }
    showNotification(`${p.name} ajouté (${q} × ${formatCurrency(price)} F)`, 'success');
  };

  useEffect(() => {
    fetchClients?.();
    fetchUsers?.();
    fetchProducts?.();
    fetchInvoices?.();
  }, [fetchClients, fetchUsers, fetchProducts, fetchInvoices]);

  // Calcul du montant total depuis les produits
  const calculatedTotal = useMemo(() => {
    return productsRows.reduce((sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.unit_price) || 0), 0);
  }, [productsRows]);

  // 1ère tranche selon la règle : 50 % à la 1ère échéance, 25 % à la 2e, reste sur les suivantes (100 % si 1 tranche)
  const numTranches = getNumTranchesFromMethod(formData.payment_method);
  const tranchePercentages = getTranchePercentages(numTranches);
  const firstTranchePercent = tranchePercentages[0] ?? 50;
  useEffect(() => {
    const n = getNumTranchesFromMethod(formData.payment_method);
    if (n === 0) return;
    const pcts = getTranchePercentages(n);
    const pctFirst = pcts[0] ?? 50;
    const firstAmount = Math.round(calculatedTotal * (pctFirst / 100) * 100) / 100;
    setFormData(f => ({ ...f, advance_amount: firstAmount }));
  }, [calculatedTotal, formData.payment_method]);

  const removeProductRow = (index) => {
    setProductsRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateProductRow = (index, field, value) => {
    setProductsRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'product') {
        const product = products?.find(p => p.id === parseInt(value));
        if (product) next[index].unit_price = product.sale_price || 0;
      }
      const qty = Number(next[index].quantity) || 0;
      const price = Number(next[index].unit_price) || 0;
      next[index].total = qty * price;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientName = formData.client_id
      ? (clients?.find(c => String(c.id) === String(formData.client_id))?.name)
      : [formData.first_name, formData.last_name].filter(Boolean).join(' ') || formData.first_name || formData.last_name;
    if (!clientName) {
      showNotification('Veuillez renseigner le client (nom ou prénom + nom)', 'error');
      return;
    }
    if (!formData.installation_date) {
      showNotification('La date d\'installation est requise', 'error');
      return;
    }
    if (!formData.payment_method) {
      showNotification('La méthode de paiement est requise', 'error');
      return;
    }
    if (!formData.commercial_agent) {
      showNotification('L\'agent commercial est requis', 'error');
      return;
    }
    const validProducts = productsRows.filter(r => r.product && (Number(r.quantity) || 0) > 0);
    if (validProducts.length === 0) {
      showNotification('Ajoutez au moins un produit', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: formData.title || `Installation ${clientName} - ${formData.installation_date || ''}`,
        client: formData.client_id || null,
        client_name: clientName,
        client_phone: formData.client_phone || null,
        client_address: formData.client_address || null,
        installation_date: formData.installation_date || null,
        payment_method: formData.payment_method || null,
        first_installment_due_date: formData.first_installment_due_date || null,
        total_amount: calculatedTotal,
        advance_amount: Number(formData.advance_amount) || 0,
        remaining_amount: Number(formData.remaining_amount) || calculatedTotal - (Number(formData.advance_amount) || 0),
        commercial_agent: formData.commercial_agent || null,
        technicians: Array.isArray(formData.technicians) ? formData.technicians : [],
        invoice: formData.no_invoice || !formData.invoice_id ? null : formData.invoice_id,
        status: 'PLANIFIEE',
        products: validProducts.map(r => ({
          product: parseInt(r.product),
          quantity: parseInt(r.quantity) || 1,
          unit_price: parseFloat(r.unit_price) || 0,
        })),
      };

      const response = await apiCall('/api/installations/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || err.error || 'Erreur lors de la création');
      }

      const created = await response.json().catch(() => null);

      // Si un contrat a été sélectionné, l'uploader dans un second temps
      if (contractFile && created && created.id) {
        const formDataUpload = new FormData();
        formDataUpload.append('contract_file', contractFile);

        const uploadResponse = await apiCall(`/api/installations/${created.id}/upload-contract/`, {
          method: 'POST',
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          const uploadErr = await uploadResponse.json().catch(() => ({}));
          throw new Error(uploadErr.detail || uploadErr.error || 'Installation créée, mais erreur lors de l’enregistrement du contrat');
        }
      }

      showNotification('Installation créée avec succès', 'success');
      navigate('/installations');
    } catch (err) {
      showNotification(err.message || 'Erreur lors de la création', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Nouvelle installation"
        subtitle="Renseignez les informations client, produits et montants"
        badge="Services"
        icon={Package}
      >
        <button
          type="button"
          onClick={() => navigate('/installations')}
          className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold flex items-center gap-2 backdrop-blur-sm border border-white/20 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux installations
        </button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Informations client */}
        <div className="glass-card p-5 border-l-4 border-l-primary-500">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </span>
            Informations client
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">Prénom *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={e => setFormData(f => ({ ...f, first_name: e.target.value }))}
                className="input-field"
                placeholder="Prénom"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">Nom *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={e => setFormData(f => ({ ...f, last_name: e.target.value }))}
                className="input-field"
                placeholder="Nom"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">Téléphone *</label>
              <input
                type="text"
                value={formData.client_phone}
                onChange={e => setFormData(f => ({ ...f, client_phone: e.target.value }))}
                className="input-field"
                placeholder="Téléphone"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-bold text-slate-800 mb-1">Adresse (facultatif)</label>
              <input
                type="text"
                value={formData.client_address}
                onChange={e => setFormData(f => ({ ...f, client_address: e.target.value }))}
                className="input-field"
                placeholder="Ex: Rue 10, Dakar, Sénégal"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">Numéro RCCM (facultatif)</label>
              <input
                type="text"
                value={formData.rccm_number}
                onChange={e => setFormData(f => ({ ...f, rccm_number: e.target.value }))}
                className="input-field"
                placeholder="Ex: SN-DKR-2023-A-12345"
              />
              <p className="text-xs text-slate-500 mt-1">Registre du Commerce</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">N° Immatriculation (facultatif)</label>
              <input
                type="text"
                value={formData.registration_number}
                onChange={e => setFormData(f => ({ ...f, registration_number: e.target.value }))}
                className="input-field"
                placeholder="Ex: 2023-A-12345"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">Numéro NINEA (facultatif)</label>
              <input
                type="text"
                value={formData.ninea_number}
                onChange={e => setFormData(f => ({ ...f, ninea_number: e.target.value }))}
                className="input-field"
                placeholder="Ex: 123456789"
              />
              <p className="text-xs text-slate-500 mt-1">Identification fiscale</p>
            </div>
          </div>
        </div>

        {/* Produits / Services SSE */}
        <div className="glass-card p-6 sm:p-8 border-l-4 border-l-blue-500">
          <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </span>
            Produits / Services SSE
          </h2>

          {/* Ajouter depuis la liste */}
          <div className="mb-6">
            <label className="block text-base font-bold text-slate-800 mb-3">Cliquez sur un produit pour l&apos;ajouter</label>
            <div className="relative mb-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Rechercher par nom ou prix..."
                className="input-field pl-12 py-4 text-base"
              />
            </div>
            <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
              <div className="max-h-56 overflow-y-auto py-2">
                {productOptions.length === 0 ? (
                  <p className="px-5 py-6 text-center text-slate-500 font-medium">Aucun produit disponible.</p>
                ) : filteredProducts.length === 0 ? (
                  <p className="px-5 py-6 text-center text-slate-500 font-medium">Aucun résultat pour « {productSearch} »</p>
                ) : (
                  filteredProducts.map((prod) => {
                    const qty = Math.max(1, parseInt(addQtyPerProduct[prod.value], 10) || 1);
                    const inCart = productsRows.some(r => String(r.product) === String(prod.value));
                    return (
                      <div
                        key={prod.value}
                        className={`px-5 py-4 flex items-center gap-4 transition-colors border-b border-slate-100 last:border-b-0 hover:bg-blue-50/80 ${inCart ? 'bg-emerald-50/50' : ''}`}
                      >
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-bold text-base truncate text-slate-800">{prod.label}</p>
                          <p className="text-sm truncate text-slate-600">{formatCurrency(prod.price || 0)} F / unité</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <label className="text-xs font-semibold text-slate-500">Qté</label>
                          <input
                            type="number"
                            min={1}
                            max={999}
                            value={addQtyPerProduct[prod.value] ?? 1}
                            onChange={e => setAddQtyPerProduct(prev => ({ ...prev, [prod.value]: e.target.value }))}
                            onClick={e => e.stopPropagation()}
                            className="w-16 input-field py-2 text-center text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => addProductFromList(prod.value, qty)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-95 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            {inCart ? 'Ajouter encore' : 'Ajouter'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Produits ajoutés */}
          <div className="pt-6 border-t-2 border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-600" />
              Produits ajoutés ({productsRows.length})
            </h3>
            {productsRows.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium mb-1">Aucun produit ajouté</p>
                <p className="text-sm text-slate-500">Choisissez un produit ci-dessus et cliquez sur &laquo;&nbsp;Ajouter&nbsp;&raquo;</p>
              </div>
            ) : (
              <div className="space-y-3">
                {productsRows.map((row, index) => {
                  const selectedProduct = products?.find(p => String(p.id) === String(row.product));
                  const isNewlyAdded = lastAddedIndex === index;
                  return (
                    <div
                      key={index}
                      className={`rounded-xl border-2 p-4 flex flex-wrap items-center gap-4 transition-all duration-300 ${
                        isNewlyAdded
                          ? 'border-emerald-400 bg-emerald-50/80 shadow-md shadow-emerald-100'
                          : 'border-slate-200 bg-slate-50/80'
                      }`}
                    >
                      <div className="flex-1 min-w-[180px]">
                        <p className="font-bold text-slate-800">{selectedProduct?.name || 'Produit'}</p>
                        <p className="text-sm text-slate-600">{formatCurrency(row.unit_price || 0)} F / unité</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-0.5">Quantité</label>
                          <input
                            type="number"
                            min={1}
                            value={row.quantity}
                            onChange={e => updateProductRow(index, 'quantity', e.target.value)}
                            className="input-field w-24"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-0.5">Prix unit. (F)</label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={row.unit_price || ''}
                            onChange={e => updateProductRow(index, 'unit_price', e.target.value)}
                            className="input-field w-28"
                          />
                        </div>
                        <div className="min-w-[100px] text-right">
                          <p className="text-xs font-semibold text-slate-500">Total</p>
                          <p className="font-bold text-slate-900">{formatCurrency(row.total || 0)} F</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProductRow(index)}
                          className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors self-end"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-6 pt-4 border-t-2 border-slate-200 flex justify-end items-center gap-4">
              <span className="font-bold text-slate-700">Total général</span>
              <span className="font-black text-slate-900 text-xl">{formatCurrency(calculatedTotal)} F</span>
            </div>
          </div>
        </div>

        {/* Détails installation */}
        <div className="glass-card p-5 border-l-4 border-l-emerald-500">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </span>
            Détails installation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">Date installation *</label>
              <input
                type="date"
                value={formData.installation_date}
                onChange={e => setFormData(f => ({ ...f, installation_date: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">Méthode de paiement *</label>
              <select
                value={formData.payment_method}
                onChange={e => setFormData(f => ({ ...f, payment_method: e.target.value }))}
                className="input-field"
                required
              >
                {PAYMENT_METHODS.map(opt => (
                  <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">Date d'échéance (1ère tranche)</label>
              <input
                type="date"
                value={formData.first_installment_due_date}
                onChange={e => setFormData(f => ({ ...f, first_installment_due_date: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Montants */}
        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </span>
            Montants
          </h2>
          <p className="text-sm text-slate-500 mb-2">Calculé automatiquement depuis les produits.</p>
          {numTranches >= 2 && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              <strong>Répartition des tranches :</strong> 50 % à la première échéance, 25 % à la deuxième, et le reste réparti sur les tranches suivantes.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">Montant total (F) *</label>
              <input
                type="number"
                readOnly
                value={calculatedTotal}
                className="input-field bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                1ère tranche – {firstTranchePercent} % (F)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={formData.advance_amount}
                onChange={e => setFormData(f => ({ ...f, advance_amount: e.target.value }))}
                className="input-field"
              />
              <p className="text-xs text-slate-500 mt-1">
                {numTranches === 1 ? 'Paiement unique.' : `${firstTranchePercent} % du total (1ère échéance).`}
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">Restant à payer (F)</label>
              <input
                type="number"
                readOnly
                value={Math.max(0, calculatedTotal - (Number(formData.advance_amount) || 0))}
                className="input-field bg-slate-100"
              />
            </div>
          </div>
          {numTranches >= 2 && tranchePercentages.length > 0 && (
            <div className="mt-4 pt-4 border-t border-amber-200">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Détail des tranches</p>
              <ul className="space-y-1 text-sm text-slate-700">
                {tranchePercentages.map((pct, i) => {
                  const amount = Math.round(calculatedTotal * (pct / 100) * 100) / 100;
                  return (
                    <li key={i} className="flex justify-between">
                      <span>{i + 1}{i === 0 ? 'ère' : 'e'} tranche : {pct} %</span>
                      <span className="font-semibold">{formatCurrency(amount)} F</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Personnel */}
        <div className="glass-card p-6 sm:p-8 border-l-4 border-l-violet-500">
          <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600" />
            </span>
            Personnel
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <label className="block text-base font-bold text-slate-800 mb-3">Agent commercial *</label>
              <div className="relative mb-3">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={commercialSearch}
                  onChange={e => setCommercialSearch(e.target.value)}
                  placeholder="Rechercher par nom ou email..."
                  className="input-field pl-12 py-4 text-base"
                />
              </div>
              <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
                <div className="max-h-56 overflow-y-auto py-2">
                  {commercialOptions.length === 0 ? (
                    <p className="px-5 py-6 text-center text-slate-500 font-medium">Aucun agent commercial disponible.</p>
                  ) : filteredCommercials.length === 0 ? (
                    <p className="px-5 py-6 text-center text-slate-500 font-medium">Aucun résultat pour « {commercialSearch} »</p>
                  ) : (
                    filteredCommercials.map((agent) => {
                      const isSelected = String(formData.commercial_agent) === String(agent.value);
                      return (
                        <button
                          key={agent.value}
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, commercial_agent: agent.value }))}
                          className={`w-full text-left px-5 py-4 flex items-center gap-4 transition-colors border-b border-slate-100 last:border-b-0 ${
                            isSelected
                              ? 'bg-violet-600 text-white border-l-4 border-l-violet-700'
                              : 'hover:bg-violet-50 text-slate-800'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-white/20' : 'bg-violet-100'
                          }`}>
                            {isSelected ? <Check className="w-5 h-5" /> : <Users className="w-5 h-5 text-violet-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-base truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>{agent.label}</p>
                            {agent.email && (
                              <p className={`text-sm truncate ${isSelected ? 'text-white/90' : 'text-slate-600'}`}>{agent.email}</p>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              {formData.commercial_agent && (
                <p className="mt-3 text-sm text-violet-600 font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" /> Agent sélectionné
                </p>
              )}
            </div>
            <div>
              <label className="block text-base font-bold text-slate-800 mb-3">Techniciens (optionnel)</label>
              <p className="text-sm text-slate-600 mb-3">Cliquez sur un technicien pour l&apos;ajouter ou le retirer de la sélection</p>
              <div className="relative mb-3">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={technicianSearch}
                  onChange={e => setTechnicianSearch(e.target.value)}
                  placeholder="Rechercher par nom ou email..."
                  className="input-field pl-12 py-4 text-base"
                />
              </div>
              <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
                <div className="max-h-56 overflow-y-auto py-2">
                  {technicianOptions.length === 0 ? (
                    <p className="px-5 py-6 text-center text-slate-500 font-medium">Aucun technicien disponible.</p>
                  ) : filteredTechnicians.length === 0 ? (
                    <p className="px-5 py-6 text-center text-slate-500 font-medium">Aucun résultat pour « {technicianSearch} »</p>
                  ) : (
                    filteredTechnicians.map((tech) => {
                      const isSelected = Array.isArray(formData.technicians) && formData.technicians.some(id => String(id) === String(tech.value));
                      return (
                        <button
                          key={tech.value}
                          type="button"
                          onClick={() => toggleTechnician(tech.value)}
                          className={`w-full text-left px-5 py-4 flex items-center gap-4 transition-colors border-b border-slate-100 last:border-b-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-l-4 border-l-emerald-700'
                              : 'hover:bg-emerald-50 text-slate-800'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-white/20' : 'bg-emerald-100'
                          }`}>
                            {isSelected ? <Check className="w-5 h-5" /> : (
                              <Users className="w-5 h-5 text-emerald-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-base truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>{tech.label}</p>
                            {tech.email && (
                              <p className={`text-sm truncate ${isSelected ? 'text-white/90' : 'text-slate-600'}`}>{tech.email}</p>
                            )}
                          </div>
                          <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                            isSelected ? 'bg-white/20' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isSelected ? 'Sélectionné' : 'Cliquer pour ajouter'}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              {Array.isArray(formData.technicians) && formData.technicians.length > 0 && (
                <p className="mt-3 text-sm text-emerald-600 font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" /> {formData.technicians.length} technicien{formData.technicians.length > 1 ? 's' : ''} sélectionné{formData.technicians.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Facture optionnelle */}
        <div className="glass-card p-6 sm:p-8 border-l-4 border-l-slate-400">
          <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-600" />
            </span>
            Facture (optionnel)
          </h2>
          <div className="space-y-5">
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <label className="flex items-center gap-3 cursor-pointer py-2 px-4 rounded-xl hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="invoice_choice"
                  checked={formData.no_invoice}
                  onChange={() => setFormData(f => ({ ...f, no_invoice: true, invoice_id: '' }))}
                  className="w-5 h-5 text-primary-600"
                />
                <span className="font-medium text-slate-700">Aucune facture</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer py-2 px-4 rounded-xl hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="invoice_choice"
                  checked={!formData.no_invoice}
                  onChange={() => setFormData(f => ({ ...f, no_invoice: false }))}
                  className="w-5 h-5 text-primary-600"
                />
                <span className="font-medium text-slate-700">Lier une facture</span>
              </label>
            </div>
            {!formData.no_invoice && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <label className="block text-base font-bold text-slate-800 mb-3">Sélectionner une facture</label>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={invoiceSearch}
                      onChange={e => setInvoiceSearch(e.target.value)}
                      placeholder="Rechercher par n° facture ou client..."
                      className="input-field pl-12 py-4 text-base"
                    />
                  </div>
                  <div className="min-w-[160px]">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Filtrer par société</label>
                    <select
                      value={filterInvoiceCompany}
                      onChange={e => setFilterInvoiceCompany(e.target.value)}
                      className="input-field py-4"
                    >
                      <option value="">Toutes les sociétés</option>
                      <option value="NETSYSTEME">NETSYSTEME</option>
                      <option value="SSE">SSE</option>
                    </select>
                  </div>
                </div>
                <div className="rounded-xl border-2 border-slate-200 bg-slate-50/50 overflow-hidden">
                  <div className="max-h-72 overflow-y-auto py-2">
                    {invoiceOptions.length === 0 ? (
                      <p className="px-5 py-8 text-center text-slate-500 font-medium">Aucune facture disponible. Créez d&apos;abord une facture dans la section Factures.</p>
                    ) : filteredInvoices.length === 0 ? (
                      <p className="px-5 py-8 text-center text-slate-500 font-medium">
                        {invoiceSearch || filterInvoiceCompany
                          ? `Aucun résultat${filterInvoiceCompany ? ` pour ${filterInvoiceCompany}` : ''}${invoiceSearch ? ` « ${invoiceSearch} »` : ''}`
                          : 'Aucune facture disponible'}
                      </p>
                    ) : (
                      filteredInvoices.map((inv) => {
                        const [numPart, clientPart] = (inv.label || '').split(' — ');
                        const isSelected = String(formData.invoice_id) === String(inv.value);
                        const fullInvoice = (invoices || []).find(i => String(i.id) === String(inv.value));
                        return (
                          <div
                            key={inv.value}
                            role="button"
                            tabIndex={0}
                            onClick={() => setFormData(f => ({ ...f, invoice_id: inv.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && setFormData(f => ({ ...f, invoice_id: inv.value }))}
                            className={`w-full text-left px-5 py-4 flex items-center gap-4 transition-colors border-b border-slate-100 last:border-b-0 cursor-pointer ${
                              isSelected
                                ? 'bg-primary-600 text-white border-l-4 border-l-primary-700'
                                : 'hover:bg-primary-50 text-slate-800'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-white/20' : 'bg-slate-200'
                            }`}>
                              {isSelected ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4 text-slate-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-base truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>{numPart || inv.label}</p>
                              <p className={`text-sm truncate ${isSelected ? 'text-white/90' : 'text-slate-600'}`}>{clientPart || '—'}</p>
                            </div>
                            <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
                              isSelected ? 'bg-white/20' : inv.company === 'SSE' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {inv.company || 'NETSYSTEME'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (fullInvoice) setPreviewInvoice(fullInvoice);
                              }}
                              className={`flex-shrink-0 p-2.5 rounded-xl transition-colors ${
                                isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-primary-100 text-primary-600'
                              }`}
                              title="Visualiser la facture"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                {formData.invoice_id && (
                  <p className="mt-3 text-sm text-primary-600 font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4" /> Facture sélectionnée
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Aperçu facture (modal) */}
        {previewInvoice && (
          <InvoicePDF
            invoice={previewInvoice}
            onClose={() => setPreviewInvoice(null)}
          />
        )}

        {/* Contrat */}
        <div className="glass-card p-6 sm:p-8 border-l-4 border-l-rose-500 mt-10">
          <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <Upload className="w-5 h-5 text-rose-600" />
            </span>
            Contrat
          </h2>
          <p className="text-sm text-slate-600 mb-4">Uploader un contrat (PDF ou image)</p>
          <label className="block border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-primary-300 hover:bg-primary-50/30 transition-colors cursor-pointer">
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={e => setContractFile(e.target.files?.[0] || null)}
              className="sr-only"
            />
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <span className="text-slate-600 font-medium">{contractFile ? contractFile.name : 'Choisir un fichier'}</span>
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-4 pt-4">
          <button type="button" onClick={() => navigate('/installations')} className="btn-secondary">
            Annuler
          </button>
          <button type="submit" disabled={submitting} className="btn-primary min-w-[200px]">
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Enregistrer l'installation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateInstallation;
