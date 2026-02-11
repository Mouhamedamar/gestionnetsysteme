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
  MapPin,
  Phone,
  Edit,
  Trash2,
  Eye,
  Shield,
  Download
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Loader from '../components/Loader';
import { useDebounce } from '../hooks/useDebounce';

const Installations = () => {
  const navigate = useNavigate();
  const { clients = [], users = [], products = [], loading, loggedIn, apiCall, showNotification, fetchClients, fetchUsers } = useApp();
  const [installations, setInstallations] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstallation, setEditingInstallation] = useState(null);
  const [viewingInstallation, setViewingInstallation] = useState(null);
  const [installationToDelete, setInstallationToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
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
    status: 'PLANIFIEE',
    scheduled_date: '',
    warranty_period: '',
    notes: '',
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
  const technicians = useMemo(() => {
    if (!users || users.length === 0) return [];
    return users.filter(user => {
      // Vérifier si l'utilisateur a le rôle technicien
      const userRole = user.role || (user.profile && user.profile.role);
      return userRole === 'technicien';
    });
  }, [users]);

  // Charger les installations
  const fetchInstallations = useCallback(async () => {
    if (!loggedIn) return;
    try {
      setFetching(true);
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
      showNotification(error.message || 'Erreur lors du chargement des installations', 'error');
      setInstallations([]);
    } finally {
      setFetching(false);
    }
  }, [loggedIn, apiCall, showNotification]);

  useEffect(() => {
    if (!loggedIn) return;
    fetchInstallations();
  }, [loggedIn, fetchInstallations]);

  // Charger les clients et utilisateurs si pas déjà chargés
  useEffect(() => {
    if (!loggedIn) return;
    if ((!clients || clients.length === 0) && fetchClients) {
      fetchClients().catch(console.error);
    }
    if ((!users || users.length === 0) && fetchUsers) {
      fetchUsers().catch(console.error);
    }
  }, [loggedIn, clients?.length, users?.length, fetchClients, fetchUsers]);

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

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === statusFilter);
    }

    // Filtre par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(i => i.installation_type === typeFilter);
    }

    // Filtre par technicien
    if (technicianFilter) {
      filtered = filtered.filter(i => i.technician === parseInt(technicianFilter));
    }

    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [installations, debouncedSearchTerm, statusFilter, typeFilter, technicianFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredInstallations.length / itemsPerPage);
  const paginatedInstallations = filteredInstallations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Obtenir le statut avec icône et couleur
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
        return { label: status, color: 'slate', icon: AlertCircle };
    }
  };

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
      status: 'PLANIFIEE',
      scheduled_date: '',
      warranty_period: '',
      notes: '',
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
      status: installation.status || 'PLANIFIEE',
      scheduled_date: installation.scheduled_date ? installation.scheduled_date.split('T')[0] + 'T' + installation.scheduled_date.split('T')[1]?.slice(0, 5) : '',
      warranty_period: installation.warranty_period || '',
      notes: installation.notes || '',
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
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="glass-card p-8 border-white/40 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Settings className="w-32 h-32 text-primary-600" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-12 bg-primary-600 rounded-full"></div>
              <span className="text-primary-600 font-bold uppercase tracking-widest text-xs">Technique</span>
            </div>
            <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Installations</h1>
            <p className="text-slate-500 font-medium">Gérez les installations techniques effectuées par les techniciens.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadCSV}
              disabled={filteredInstallations.length === 0}
              className="btn-secondary px-6 py-4 text-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Télécharger (CSV)
            </button>
            <button 
              onClick={handleAddInstallation}
              className="btn-primary shadow-xl shadow-primary-500/30 px-8 py-4 text-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nouvelle Installation
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              <option value="PLANIFIEE">Planifiée</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINEE">Terminée</option>
              <option value="ANNULEE">Annulée</option>
            </select>
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

      {/* Installations Table */}
      <div className="card p-0 overflow-hidden border-none shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Numéro</th>
                <th className="table-header">Titre</th>
                <th className="table-header">Type</th>
                <th className="table-header">Client</th>
                <th className="table-header">Technicien</th>
                <th className="table-header text-center">Statut</th>
                <th className="table-header">Date prévue</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedInstallations.map(installation => {
                const statusInfo = getStatusInfo(installation.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <tr key={installation.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="table-cell font-mono text-sm font-bold text-primary-600">
                      {installation.installation_number}
                    </td>
                    <td className="table-cell font-bold text-slate-700">{installation.title}</td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${getTypeColor(installation.installation_type)}`}>
                        {installation.installation_type_display || installation.installation_type}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">{installation.client_name || installation.client_detail?.name || 'N/A'}</span>
                        {installation.client_phone && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {installation.client_phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      {installation.technician_detail ? (
                        <span className="text-slate-600">
                          {installation.technician_detail.first_name || installation.technician_detail.last_name
                            ? `${installation.technician_detail.first_name} ${installation.technician_detail.last_name}`.trim()
                            : installation.technician_detail.username}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">Non assigné</span>
                      )}
                    </td>
                    <td className="table-cell text-center">
                      <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase ${
                        statusInfo.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                        statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                        statusInfo.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="table-cell">
                      {installation.scheduled_date ? (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(installation.scheduled_date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-300 italic">Non planifiée</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setViewingInstallation(installation)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Voir détails"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditInstallation(installation)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                          title="Modifier"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setInstallationToDelete(installation)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
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
        <div className="card p-20 text-center">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Aucune installation trouvée</h3>
          <p className="text-slate-500 font-medium">Essayez de modifier vos critères de recherche ou créez une nouvelle installation.</p>
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInstallation ? 'Modifier l\'installation' : 'Nouvelle Installation'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
            <div className="space-y-2">
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

          <div className="space-y-2">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
            <div className="space-y-2">
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

          <div className="space-y-2">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
            <div className="space-y-2">
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

          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
              Adresse d'installation
            </label>
            <textarea
              value={formData.client_address}
              onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
              className="input-field min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field appearance-none"
              >
                <option value="PLANIFIEE">Planifiée</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINEE">Terminée</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>
            <div className="space-y-2">
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
          </div>

          {/* Produits utilisés */}
          <div className="space-y-4 border-t pt-4">
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

          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
              Notes techniques
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field min-h-[80px]"
            />
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

      {/* View Details Modal */}
      <Modal
        isOpen={!!viewingInstallation}
        onClose={() => setViewingInstallation(null)}
        title={`Installation ${viewingInstallation?.installation_number}`}
        size="lg"
      >
        {viewingInstallation && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Titre</label>
                <p className="text-slate-800 font-bold mt-1">{viewingInstallation.title}</p>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Type</label>
                <p className="text-slate-800 font-bold mt-1">{viewingInstallation.installation_type_display || viewingInstallation.installation_type}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Description</label>
              <p className="text-slate-700 mt-1">{viewingInstallation.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Client</label>
                <p className="text-slate-800 font-bold mt-1">{viewingInstallation.client_name || viewingInstallation.client_detail?.name || 'N/A'}</p>
                {viewingInstallation.client_phone && (
                  <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {viewingInstallation.client_phone}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Technicien</label>
                <p className="text-slate-800 font-bold mt-1">
                  {viewingInstallation.technician_detail
                    ? (viewingInstallation.technician_detail.first_name || viewingInstallation.technician_detail.last_name
                        ? `${viewingInstallation.technician_detail.first_name} ${viewingInstallation.technician_detail.last_name}`.trim()
                        : viewingInstallation.technician_detail.username)
                    : 'Non assigné'}
                </p>
              </div>
            </div>
            {viewingInstallation.client_address && (
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Adresse</label>
                <p className="text-slate-700 mt-1 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  {viewingInstallation.client_address}
                </p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Statut</label>
                <div className="mt-1">
                  {(() => {
                    const statusInfo = getStatusInfo(viewingInstallation.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold ${
                        statusInfo.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                        statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                        statusInfo.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
              {viewingInstallation.scheduled_date && (
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Date prévue</label>
                  <p className="text-slate-700 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(viewingInstallation.scheduled_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
              {viewingInstallation.warranty_period && (
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Garantie</label>
                  <p className="text-slate-700 mt-1 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {viewingInstallation.warranty_period} mois
                    {viewingInstallation.warranty_end_date && (
                      <span className="text-xs text-slate-500">
                        (jusqu'au {new Date(viewingInstallation.warranty_end_date).toLocaleDateString('fr-FR')})
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
            {viewingInstallation.products_used && viewingInstallation.products_used.length > 0 && (
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Produits utilisés</label>
                <div className="mt-2 space-y-2">
                  {viewingInstallation.products_used.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-slate-800">{product.product_detail?.name || product.product_name || 'N/A'}</p>
                        {product.serial_number && (
                          <p className="text-xs text-slate-500">N° série: {product.serial_number}</p>
                        )}
                      </div>
                      <span className="font-bold text-primary-600">x{product.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {viewingInstallation.notes && (
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Notes</label>
                <p className="text-slate-700 mt-1">{viewingInstallation.notes}</p>
              </div>
            )}
          </div>
        )}
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
