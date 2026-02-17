import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Package,
  Edit,
  Trash2,
  Download,
  DollarSign,
  Bell
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Loader from '../components/Loader';
import PageHeader from '../components/PageHeader';
import SearchableSelect from '../components/SearchableSelect';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/formatCurrency';
import { API_BASE_URL } from '../config';

const Installations = () => {
  const navigate = useNavigate();
  const { clients = [], users = [], products = [], invoices = [], loading, loggedIn, apiCall, showNotification, fetchClients, fetchUsers, fetchInvoices } = useApp();
  const [installations, setInstallations] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstallation, setEditingInstallation] = useState(null);
  const [viewingInstallation, setViewingInstallation] = useState(null);
  const [installationToDelete, setInstallationToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [paymentModalInstallation, setPaymentModalInstallation] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    installation_type: 'EQUIPEMENT',
    client: '',
    client_name: '',
    client_phone: '',
    client_address: '',
    technician: '',
    invoice: '',
    scheduled_date: '',
    warranty_period: '',
    products: []
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Produits filtrés pour la sélection (recherche dans le modal)
  const filteredProductsForSelection = useMemo(() => {
    const list = (products || []).filter(p => !p.deleted_at && p.is_active);
    if (!productSearchTerm.trim()) return list;
    const term = productSearchTerm.toLowerCase().trim();
    return list.filter(p =>
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.reference && p.reference.toLowerCase().includes(term)) ||
      (p.code && p.code.toLowerCase().includes(term))
    );
  }, [products, productSearchTerm]);

  // Filtrer les utilisateurs pour ne garder que les techniciens
  // Factures (hors pro forma) pour liaison optionnelle
  const invoiceOptions = useMemo(
    () => (invoices || [])
      .filter(inv => !inv.is_proforma)
      .map(inv => ({
        value: inv.id,
        label: `${inv.invoice_number || inv.number || 'N/A'} — ${inv.client_name || inv.client?.name || 'Sans client'}`,
      })),
    [invoices]
  );

  const technicians = useMemo(() => {
    if (!users || users.length === 0) return [];
    return users.filter(user => {
      // Vérifier si l'utilisateur a le rôle technicien
      const userRole = user.role || (user.profile && user.profile.role);
      return userRole === 'technicien';
    });
  }, [users]);

  // Charger les installations
  const fetchInstallations = useCallback(async (silent = false) => {
    if (!loggedIn) return;
    try {
      if (!silent) setFetching(true);
      const response = await apiCall('/api/installations/', {
        method: 'GET'
      });

      if (!response.ok) {
        let errorMessage = 'Erreur lors du chargement des installations';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text().catch(() => '');
          console.error('Erreur API installations (texte):', {
            status: response.status,
            statusText: response.statusText,
            errorText
          });
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const apiInstallations = data.results ? data.results : data;
      setInstallations(Array.isArray(apiInstallations) ? apiInstallations : []);
    } catch (error) {
      console.error('Erreur fetchInstallations:', error);
      if (!silent) showNotification(error.message || 'Erreur lors du chargement des installations', 'error');
      setInstallations([]);
    } finally {
      if (!silent) setFetching(false);
    }
  }, [loggedIn, apiCall, showNotification]);

  useEffect(() => {
    if (!loggedIn) return;
    fetchInstallations();
  }, [loggedIn, fetchInstallations]);

  // Charger les clients, utilisateurs et factures si pas déjà chargés
  useEffect(() => {
    if (!loggedIn) return;
    if ((!clients || clients.length === 0) && fetchClients) {
      fetchClients().catch(console.error);
    }
    if ((!users || users.length === 0) && fetchUsers) {
      fetchUsers().catch(console.error);
    }
    if ((!invoices || invoices.length === 0) && fetchInvoices) {
      fetchInvoices().catch(console.error);
    }
  }, [loggedIn, clients?.length, users?.length, invoices?.length, fetchClients, fetchUsers, fetchInvoices]);

  // Filtrer les installations
  const filteredInstallations = useMemo(() => {
    let filtered = Array.isArray(installations) ? installations : [];

    // Filtre par recherche
    if (debouncedSearchTerm) {
      filtered = filtered.filter(i =>
        i.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        i.installation_number?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        i.client_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filtre par date d'installation
    if (dateFrom) {
      filtered = filtered.filter(i => {
        const d = i.installation_date || i.scheduled_date || i.created_at;
        return d && new Date(d) >= new Date(dateFrom);
      });
    }
    if (dateTo) {
      filtered = filtered.filter(i => {
        const d = i.installation_date || i.scheduled_date || i.created_at;
        return d && new Date(d) <= new Date(dateTo + 'T23:59:59');
      });
    }

    // Filtre par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(i => i.installation_type === typeFilter);
    }

    // Filtre par technicien (technician peut être id ou object selon l'API)
    if (technicianFilter) {
      const techId = parseInt(technicianFilter, 10);
      if (!isNaN(techId)) {
        filtered = filtered.filter(i => {
          const instTech = i.technician;
          const id = typeof instTech === 'object' && instTech?.id != null ? instTech.id : instTech;
          return Number(id) === techId;
        });
      }
    }

    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [installations, debouncedSearchTerm, dateFrom, dateTo, typeFilter, technicianFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredInstallations.length / itemsPerPage);
  const paginatedInstallations = filteredInstallations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Obtenir le statut avec icône et couleur (pour export CSV et modal détail)
  const getStatusInfo = (status) => {
    switch (status) {
      case 'PLANIFIEE':
        return { label: 'Planifiée', color: 'amber', icon: Clock };
      case 'EN_COURS':
        return { label: 'En cours', color: 'blue', icon: TrendingUp };
      case 'TERMINEE':
        return { label: 'Terminée', color: 'emerald', icon: CheckCircle2 };
      case 'ANNULEE':
        return { label: 'Annulée', color: 'rose', icon: XCircle };
      default:
        return { label: status || '—', color: 'slate', icon: AlertCircle };
    }
  };

  // Libellé méthode de paiement
  const getPaymentMethodLabel = (method) => {
    if (!method) return '—';
    const labels = {
      ESPECE: 'Espèce (Comptant)',
      '1_TRANCHE': '1 tranche',
      '2_TRANCHES': '2 tranches',
      '3_TRANCHES': '3 tranches',
      '4_TRANCHES': '4 tranches',
    };
    return labels[method] || method;
  };

  // KPIs tableau de bord
  const totalInstallationsAmount = useMemo(() => {
    return (filteredInstallations || []).reduce((sum, i) => sum + (parseFloat(i.total_amount) || 0), 0);
  }, [filteredInstallations]);
  const totalReliquats = useMemo(() => {
    return (filteredInstallations || []).reduce((sum, i) => sum + (parseFloat(i.remaining_amount) || 0), 0);
  }, [filteredInstallations]);

  // Obtenir le type avec couleur
  const getTypeColor = (type) => {
    switch (type) {
      case 'EQUIPEMENT':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'SYSTEME':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'RESEAU':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'LOGICIEL':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  // Ouvrir le modal de création
  const handleAddInstallation = () => {
    setEditingInstallation(null);
    setProductSearchTerm('');
    setFormData({
      title: '',
      description: '',
      installation_type: 'EQUIPEMENT',
      client: '',
      client_name: '',
      client_phone: '',
      client_address: '',
      technician: '',
      invoice: '',
      scheduled_date: '',
      warranty_period: '',
      products: []
    });
    setIsModalOpen(true);
  };

  // Ouvrir le modal d'édition
  const handleEditInstallation = (installation) => {
    setEditingInstallation(installation);
    setProductSearchTerm('');
    setFormData({
      title: installation.title || '',
      description: installation.description || '',
      installation_type: installation.installation_type || 'EQUIPEMENT',
      client: installation.client || '',
      client_name: installation.client_name || '',
      client_phone: installation.client_phone || '',
      client_address: installation.client_address || '',
      technician: installation.technician || '',
      invoice: installation.invoice || '',
      scheduled_date: installation.scheduled_date ? installation.scheduled_date.split('T')[0] + 'T' + installation.scheduled_date.split('T')[1]?.slice(0, 5) : '',
      warranty_period: installation.warranty_period || '',
      products: (installation.products_used || []).map(p => ({
        product: p.product,
        quantity: p.quantity,
        serial_number: p.serial_number || '',
        notes: p.notes || ''
      }))
    });
    setIsModalOpen(true);
  };

  // Exporter la liste en CSV
  const handleDownloadCSV = () => {
    const headers = ['Numéro', 'Titre', 'Type', 'Client', 'Téléphone client', 'Technicien', 'Statut', 'Date prévue', 'Date création'];
    const rows = filteredInstallations.map(i => {
      const clientName = i.client_name || i.client_detail?.name || '';
      const techName = i.technician_detail
        ? (i.technician_detail.first_name || i.technician_detail.last_name
          ? `${i.technician_detail.first_name} ${i.technician_detail.last_name}`.trim()
          : i.technician_detail.username)
        : '';
      const statusLabel = getStatusInfo(i.status).label;
      const scheduled = i.scheduled_date
        ? new Date(i.scheduled_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '';
      const created = i.created_at
        ? new Date(i.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '';
      return [
        i.installation_number || '',
        (i.title || '').replace(/"/g, '""'),
        i.installation_type_display || i.installation_type || '',
        (clientName || '').replace(/"/g, '""'),
        (i.client_phone || '').replace(/"/g, '""'),
        (techName || '').replace(/"/g, '""'),
        statusLabel,
        scheduled,
        created
      ];
    });
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${String(cell)}"`).join(';'))
    ].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `installations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Liste des installations téléchargée');
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setFetching(true);
      const clientName = formData.client_name || (formData.client && clients?.find(c => String(c.id) === String(formData.client))?.name) || '';
      const payload = {
        ...formData,
        client_name: clientName || formData.client_name,
        client: formData.client || null,
        technician: formData.technician || null,
        invoice: formData.invoice || null,
        scheduled_date: formData.scheduled_date || null,
        warranty_period: formData.warranty_period ? parseInt(formData.warranty_period) : null,
        products: formData.products.filter(p => p.product)
      };

      let response;
      if (editingInstallation) {
        response = await apiCall(`/api/installations/${editingInstallation.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
      } else {
        response = await apiCall('/api/installations/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'Erreur lors de la sauvegarde');
      }

      showNotification(
        editingInstallation ? 'Installation modifiée avec succès' : 'Installation créée avec succès'
      );
      setIsModalOpen(false);
      fetchInstallations();
    } catch (error) {
      console.error('Erreur handleSubmit:', error);
      showNotification(error.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setFetching(false);
    }
  };

  // Supprimer une installation
  const handleDeleteInstallation = async () => {
    if (!installationToDelete) return;
    
    try {
      setDeleting(true);
      const response = await apiCall(`/api/installations/${installationToDelete.id}/soft_delete/`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      showNotification('Installation supprimée avec succès');
      setInstallationToDelete(null);
      fetchInstallations();
    } catch (error) {
      console.error('Erreur handleDeleteInstallation:', error);
      showNotification('Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!paymentModalInstallation) return;
    const amount = parseFloat(String(paymentAmount).replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      showNotification('Montant invalide', 'error');
      return;
    }
    const total = parseFloat(paymentModalInstallation.total_amount) || 0;
    const advance = parseFloat(paymentModalInstallation.advance_amount) || 0;
    const remaining = (paymentModalInstallation.remaining_amount != null && paymentModalInstallation.remaining_amount !== '')
      ? parseFloat(paymentModalInstallation.remaining_amount)
      : Math.max(0, total - advance);
    const tolerance = 1;
    if (amount > remaining + tolerance) {
      showNotification(`Le montant ne peut pas dépasser le restant (${formatCurrency(remaining)} F)`, 'error');
      return;
    }
    const targetId = paymentModalInstallation.id;
    const newAdvance = advance + amount;
    const newRemaining = Math.max(0, remaining - amount);
    try {
      setSubmittingPayment(true);
      const response = await apiCall(`/api/installations/${targetId}/record-payment/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          payment_date: paymentDate || new Date().toISOString().slice(0, 10)
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.detail || 'Erreur lors du versement');
      }
      const updatedData = await response.json().catch(() => null);
      setInstallations(prev => prev.map(inst => {
        if (String(inst.id) !== String(targetId)) return inst;
        const merged = (updatedData && updatedData.id != null)
          ? { ...inst, ...updatedData }
          : { ...inst, advance_amount: newAdvance, remaining_amount: newRemaining };
        return merged;
      }));
      showNotification('Versement enregistré avec succès');
      setPaymentModalInstallation(null);
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      fetchInstallations(true);
    } catch (err) {
      showNotification(err.message || 'Erreur lors du versement', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const openPaymentModal = (installation) => {
    setPaymentModalInstallation(installation);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().slice(0, 10));
  };

  const getContractUrl = (contractFile, contractFileUrl) => {
    if (contractFileUrl) return contractFileUrl;
    if (!contractFile) return null;
    if (contractFile.startsWith('http')) return contractFile;
    if (contractFile.startsWith('/')) return `${API_BASE_URL}${contractFile}`;
    return `${API_BASE_URL}/media/${contractFile}`;
  };

  const handleDownloadContract = async (installation) => {
    const url = getContractUrl(installation?.contract_file, installation?.contract_file_url);
    if (!url) return;
    const path = installation.contract_file || '';
    const suggestedName = path.split('/').pop() || `contrat_${installation.installation_number || installation.id}.pdf`;
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Téléchargement impossible');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = suggestedName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showNotification('Contrat téléchargé');
    } catch (err) {
      showNotification(err.message || 'Erreur lors du téléchargement', 'error');
    }
  };

  // Changer le statut
  const handleChangeStatus = async (installationId, newStatus) => {
    try {
      const response = await apiCall(`/api/installations/${installationId}/change_status/`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du changement de statut');
      }

      showNotification('Statut modifié avec succès');
      fetchInstallations();
    } catch (error) {
      console.error('Erreur handleChangeStatus:', error);
      showNotification('Erreur lors du changement de statut', 'error');
    }
  };

  // Ajouter un produit au formulaire
  const addProductToForm = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { product: '', quantity: 1, serial_number: '', notes: '' }]
    });
  };

  // Retirer un produit du formulaire
  const removeProductFromForm = (index) => {
    setFormData({
      ...formData,
      products: formData.products.filter((_, i) => i !== index)
    });
  };

  // Mettre à jour un produit dans le formulaire
  const updateProductInForm = (index, field, value) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    setFormData({ ...formData, products: updatedProducts });
  };

  if (loading || fetching) return <Loader />;

  return (
    <div className="space-y-8 animate-fade-in pb-16 px-2 sm:px-0">
      <PageHeader title="Gestion des installations" subtitle="Suivi des installations et des paiements" badge="Services" icon={Package}>
        <button type="button" onClick={() => navigate('/installations/rappels-paiement')} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold flex items-center gap-2 backdrop-blur-sm border border-white/20 transition-all">
          <Bell className="w-4 h-4" />
          Rappels SMS
        </button>
        <button type="button" onClick={handleDownloadCSV} disabled={filteredInstallations.length === 0} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold flex items-center gap-2 backdrop-blur-sm border border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <Download className="w-4 h-4" />
          CSV
        </button>
        <button type="button" onClick={() => navigate('/installations/add')} className="px-6 py-2.5 rounded-xl bg-white text-primary-600 font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-4 h-4" />
          Nouvelle installation
        </button>
      </PageHeader>

      {/* Filtres date + KPIs */}
      <div className="glass-card p-6 sm:p-8 shadow-xl border-white/60">
        <div className="flex flex-wrap items-end gap-5 mb-8">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Date du</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input-field w-40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Au</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input-field w-40"
                />
              </div>
              <button
                type="button"
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="btn-secondary px-4 py-2.5 mt-5"
              >
                Réinitialiser
              </button>
            </div>
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100/80 p-6 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <p className="text-sm font-semibold text-blue-600 mb-1">Total Installations</p>
            <p className="text-2xl font-black text-blue-900">{formatCurrency(totalInstallationsAmount)} <span className="text-blue-600 font-bold text-lg">F</span></p>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-amber-50/50 border border-red-100/80 p-6 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">Total Reliquats</p>
              <p className="text-2xl font-black text-red-900">{formatCurrency(totalReliquats)} <span className="text-red-600 font-bold text-lg">F</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres supplémentaires */}
      <div className="glass-card p-6 shadow-xl border-white/60">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="relative group md:col-span-2 md:max-w-sm">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher client, numéro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          <div className="relative">
            <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field pl-12 appearance-none"
            >
              <option value="all">Tous les types</option>
              <option value="EQUIPEMENT">Équipement</option>
              <option value="SYSTEME">Système</option>
              <option value="RESEAU">Réseau</option>
              <option value="LOGICIEL">Logiciel</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select
              value={technicianFilter}
              onChange={(e) => setTechnicianFilter(e.target.value)}
              className="input-field pl-12 appearance-none"
            >
              <option value="">Tous les techniciens</option>
              {technicians && technicians.length > 0 ? (
                technicians.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.username}
                  </option>
                ))
              ) : null}
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des installations */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 sm:px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-medium text-slate-600">Afficher <strong className="text-slate-800">{itemsPerPage}</strong> entrées</span>
        </div>
        <div className="overflow-x-auto rounded-b-2xl">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr>
                <th className="table-header">Date installation</th>
                <th className="table-header">Client</th>
                <th className="table-header">Agent commercial</th>
                <th className="table-header">Techniciens</th>
                <th className="table-header text-right">Montant total</th>
                <th className="table-header text-right">Avance</th>
                <th className="table-header text-right">Restant</th>
                <th className="table-header text-center">Statut paiement</th>
                <th className="table-header">Méthode</th>
                <th className="table-header">Contrat</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedInstallations.map(installation => {
                const installDate = installation.installation_date || installation.scheduled_date || installation.created_at;
                const techniciansNames = (installation.technicians_list || []).map(t =>
                  (t.first_name || t.last_name) ? `${t.first_name || ''} ${t.last_name || ''}`.trim() : (t.username || '')
                ).filter(Boolean);
                const detail = installation.commercial_agent_detail;
                const agentName = installation.commercial_agent_name ||
                  (detail ? ((detail.first_name || detail.last_name) ? `${detail.first_name || ''} ${detail.last_name || ''}`.trim() : detail.username) : null) || '—';
                const singleTechnician = installation.technician_detail
                  ? (installation.technician_detail.first_name || installation.technician_detail.last_name
                      ? `${installation.technician_detail.first_name} ${installation.technician_detail.last_name}`.trim()
                      : installation.technician_detail.username)
                  : null;
                const techDisplay = techniciansNames.length > 0 ? techniciansNames.join(', ') : (singleTechnician || '—');
                const totalAmt = Number(installation.total_amount) || 0;
                const advanceAmt = Number(installation.advance_amount) || 0;
                const remainingAmt = (installation.remaining_amount != null && String(installation.remaining_amount).trim() !== '')
                  ? (Number(installation.remaining_amount) || 0)
                  : Math.max(0, totalAmt - advanceAmt);
                const isPaid = totalAmt <= 0 || remainingAmt <= 0 || (totalAmt > 0 && advanceAmt >= totalAmt);
                const paymentStatusLabel = isPaid ? 'Payé' : 'Restant';
                const paymentStatusClass = isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';

                return (
                  <tr key={installation.id} className="hover:bg-primary-50/40 transition-colors duration-150 group border-b border-slate-100/80 last:border-0">
                    <td className="table-cell text-slate-600 whitespace-nowrap">
                      {installDate ? new Date(installDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                    </td>
                    <td className="table-cell font-semibold text-slate-700">
                      {installation.client_name || installation.client_detail?.name || 'N/A'}
                    </td>
                    <td className="table-cell text-slate-600">
                      {agentName || '—'}
                    </td>
                    <td className="table-cell text-slate-600 text-sm">
                      {techDisplay}
                    </td>
                    <td className="table-cell text-right font-semibold text-slate-800">
                      {formatCurrency(installation.total_amount)}
                    </td>
                    <td className="table-cell text-right text-slate-600">
                      {formatCurrency(installation.advance_amount)}
                    </td>
                    <td className="table-cell text-right font-medium text-slate-700">
                      {formatCurrency(remainingAmt)}
                    </td>
                    <td className="table-cell text-center">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${paymentStatusClass}`}>
                        {paymentStatusLabel}
                      </span>
                    </td>
                    <td className="table-cell text-slate-600">
                      {getPaymentMethodLabel(installation.payment_method) || installation.payment_method_display || '—'}
                    </td>
                    <td className="table-cell">
                      {(installation.contract_file || installation.contract_file_url) ? (
                        <div className="flex items-center gap-3">
                          <a
                            href={getContractUrl(installation.contract_file, installation.contract_file_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline font-medium"
                          >
                            Voir
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDownloadContract(installation)}
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-primary-600 font-medium text-sm"
                            title="Télécharger le contrat (PDF)"
                          >
                            <Download className="w-4 h-4" />
                            Télécharger
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openPaymentModal(installation)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Nouveau versement"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditInstallation(installation)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setInstallationToDelete(installation)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {paginatedInstallations.length === 0 && (
        <div className="card p-16 text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mx-auto mb-6 border border-slate-100">
            <Search className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Aucune installation trouvée</h3>
          <p className="text-slate-500 font-medium max-w-md mx-auto mb-6">Modifiez les filtres ou créez une nouvelle installation pour commencer.</p>
          <button
            type="button"
            onClick={() => navigate('/installations/add')}
            className="btn-primary inline-flex"
          >
            <Plus className="w-4 h-4" />
            Nouvelle installation
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary px-5 py-2 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed text-sm"
          >
            Précédent
          </button>
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`min-w-[2.5rem] h-10 px-3 rounded-xl font-semibold text-sm transition-all ${
                  currentPage === i + 1
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-secondary px-5 py-2 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed text-sm"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInstallation ? 'Modifier l\'installation' : 'Nouvelle Installation'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                Titre <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                Type d'installation
              </label>
              <select
                value={formData.installation_type}
                onChange={(e) => setFormData({ ...formData, installation_type: e.target.value })}
                className="input-field appearance-none"
              >
                <option value="EQUIPEMENT">Équipement</option>
                <option value="SYSTEME">Système</option>
                <option value="RESEAU">Réseau</option>
                <option value="LOGICIEL">Logiciel</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
              Description <span className="text-slate-400 font-normal text-xs">(optionnel)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field min-h-[100px]"
              placeholder="Description de l'installation..."
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                Client
              </label>
              <select
                value={formData.client}
                onChange={(e) => {
                  const clientId = e.target.value;
                  const selected = clients?.find(c => String(c.id) === String(clientId));
                  setFormData({
                    ...formData,
                    client: clientId,
                    client_name: selected ? (selected.name || formData.client_name) : formData.client_name,
                    client_phone: selected ? (selected.phone || formData.client_phone) : formData.client_phone,
                    client_address: selected ? (selected.address || formData.client_address) : formData.client_address
                  });
                }}
                className="input-field appearance-none"
              >
                <option value="">Sélectionner un client</option>
                {clients && clients.length > 0 ? (
                  clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                ) : (
                  <option value="" disabled>Chargement des clients...</option>
                )}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                Technicien
              </label>
              <select
                value={formData.technician}
                onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                className="input-field appearance-none"
              >
                <option value="">Non assigné</option>
                {technicians && technicians.length > 0 ? (
                  technicians.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.username}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Chargement des techniciens...</option>
                )}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
              Nom du client
            </label>
            <input
              type="text"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                Date prévue
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
              Adresse d'installation
            </label>
            <textarea
              value={formData.client_address}
              onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
              className="input-field min-h-[80px]"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
              Garantie (mois)
            </label>
            <input
              type="number"
              min="0"
              value={formData.warranty_period}
              onChange={(e) => setFormData({ ...formData, warranty_period: e.target.value })}
              className="input-field"
              placeholder="Ex: 12"
            />
          </div>

          {/* Facture (optionnel) */}
          <div className="space-y-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
            <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
              Facture (optionnel)
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="invoice_choice"
                  checked={!formData.invoice}
                  onChange={() => setFormData({ ...formData, invoice: '' })}
                />
                <span>Aucune facture</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="invoice_choice"
                  checked={!!formData.invoice}
                  onChange={() => setFormData({ ...formData, invoice: formData.invoice || (invoiceOptions[0]?.value ?? '') })}
                />
                <span>Lier une facture</span>
              </label>
            </div>
            {formData.invoice && (
              <div className="mt-3">
                <SearchableSelect
                  options={invoiceOptions}
                  value={formData.invoice}
                  onChange={id => setFormData({ ...formData, invoice: id })}
                  placeholder="Choisir une facture..."
                />
              </div>
            )}
          </div>

          {/* Produits utilisés */}
          <div className="space-y-5 border-t border-slate-200 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                Produits utilisés
              </label>
              <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="input-field py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={addProductToForm}
                className="btn-secondary text-sm py-1 px-3 flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
            {formData.products.map((product, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <select
                    value={product.product}
                    onChange={(e) => updateProductInForm(index, 'product', e.target.value)}
                    className="input-field appearance-none"
                  >
                    <option value="">Sélectionner un produit</option>
                    {filteredProductsForSelection.map(p => (
                      <option key={p.id} value={p.id}>{p.name}{p.reference ? ` (${p.reference})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={product.quantity}
                    onChange={(e) => updateProductInForm(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="input-field"
                    placeholder="Qté"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={product.serial_number || ''}
                    onChange={(e) => updateProductInForm(index, 'serial_number', e.target.value)}
                    className="input-field"
                    placeholder="N° série"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeProductFromForm(index)}
                  className="col-span-2 p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={fetching}
              className="btn-primary flex-1"
            >
              {fetching ? 'Enregistrement...' : editingInstallation ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Nouveau versement */}
      <Modal
        isOpen={!!paymentModalInstallation}
        onClose={() => { setPaymentModalInstallation(null); setPaymentAmount(''); }}
        title="Nouveau versement"
        size="md"
      >
        {paymentModalInstallation && (() => {
          const total = Number(paymentModalInstallation.total_amount) || 0;
          const advance = Number(paymentModalInstallation.advance_amount) || 0;
          const remaining = (paymentModalInstallation.remaining_amount != null && String(paymentModalInstallation.remaining_amount).trim() !== '')
            ? (Number(paymentModalInstallation.remaining_amount) || 0)
            : Math.max(0, total - advance);
          const amountToPay = parseFloat(String(paymentAmount).replace(/\s/g, '').replace(',', '.')) || 0;
          const newRemainingAfter = Math.max(0, remaining - amountToPay);
          const newAdvanceAfter = advance + amountToPay;
          return (
          <div className="space-y-6">
            <p className="text-slate-500 text-sm">
              {paymentModalInstallation.client_name || 'Client'} — {paymentModalInstallation.installation_number}
            </p>

            <div className="grid gap-3">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600 font-medium">Montant total (FCFA)</span>
                <span className="font-bold text-slate-800">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600 font-medium">Montant déjà payé (FCFA)</span>
                <span className="font-bold text-slate-800">{formatCurrency(advance)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-amber-800 font-medium">Montant restant à payer (FCFA)</span>
                <span className="font-bold text-amber-900">{formatCurrency(remaining)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Montant à verser (FCFA) <span className="text-rose-500">*</span>
                  </label>
                  {remaining > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(String(Math.round(remaining)))}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      Verser tout le restant ({formatCurrency(remaining)})
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={`Ex: ${formatCurrency(remaining)}`}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9,.\s]/g, ''))}
                  className="input-field w-full text-lg font-semibold"
                  autoFocus
                />
                {amountToPay > 0 && (
                  <>
                    {amountToPay > remaining + 1 ? (
                      <div className="mt-2 p-3 bg-rose-50 rounded-lg border border-rose-200 text-sm">
                        <span className="text-rose-800 font-medium">Le montant dépasse le restant ({formatCurrency(remaining)} F). Réduisez le montant.</span>
                      </div>
                    ) : (
                      <div className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-sm">
                        <span className="text-emerald-800 font-medium">Après ce versement : </span>
                        <span className="text-emerald-900 font-bold">Payé = {formatCurrency(newAdvanceAfter)} F</span>
                        <span className="text-emerald-700"> · </span>
                        <span className="text-emerald-900 font-bold">Restant = {formatCurrency(newRemainingAfter)} F</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Date du versement <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="input-field w-full pl-12"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setPaymentModalInstallation(null); setPaymentAmount(''); }}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment || !paymentAmount || amountToPay <= 0 || amountToPay > remaining + 1}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingPayment ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4" />
                      Valider le versement
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          );
        })()}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!installationToDelete}
        onClose={() => setInstallationToDelete(null)}
        onConfirm={handleDeleteInstallation}
        title="Supprimer l'installation"
        message={`Êtes-vous sûr de vouloir supprimer l'installation "${installationToDelete?.installation_number}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleting}
      />
    </div>
  );
};

export default Installations;
