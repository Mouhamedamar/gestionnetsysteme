import { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Wrench, 
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
  UserPlus
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Loader from '../components/Loader';
import { useDebounce } from '../hooks/useDebounce';

const Interventions = () => {
  const { clients = [], users = [], products = [], loading, loggedIn, apiCall, showNotification, fetchClients, fetchUsers } = useApp();
  const [interventions, setInterventions] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState(null);
  const [viewingIntervention, setViewingIntervention] = useState(null);
  const [interventionToDelete, setInterventionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client: '',
    client_name: '',
    client_phone: '',
    client_address: '',
    technician: '',
    status: 'EN_ATTENTE',
    priority: 'NORMALE',
    scheduled_date: '',
    notes: '',
    products: []
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filtrer les utilisateurs pour ne garder que les techniciens
  const technicians = useMemo(() => {
    if (!users || users.length === 0) return [];
    return users.filter(user => {
      // Vérifier si l'utilisateur a le rôle technicien
      const userRole = user.role || (user.profile && user.profile.role);
      return userRole === 'technicien';
    });
  }, [users]);

  // Charger les interventions (uniquement si connecté)
  const fetchInterventions = useCallback(async () => {
    if (!loggedIn) return;
    try {
      setFetching(true);
      const response = await apiCall('/api/interventions/', {
        method: 'GET'
      });

      if (!response.ok) {
        // Try to get more details from the error response
        let errorMessage = 'Erreur lors du chargement des interventions';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
          console.error('Erreur API interventions:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
        } catch (e) {
          const errorText = await response.text().catch(() => '');
          console.error('Erreur API interventions (texte):', {
            status: response.status,
            statusText: response.statusText,
            errorText
          });
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const apiInterventions = data.results ? data.results : data;
      setInterventions(Array.isArray(apiInterventions) ? apiInterventions : []);
    } catch (error) {
      console.error('Erreur fetchInterventions:', error);
      showNotification(error.message || 'Erreur lors du chargement des interventions', 'error');
      setInterventions([]);
    } finally {
      setFetching(false);
    }
  }, [loggedIn, apiCall, showNotification]);

  useEffect(() => {
    if (!loggedIn) return;
    fetchInterventions();
  }, [loggedIn, fetchInterventions]);

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

  // Filtrer les interventions
  const filteredInterventions = useMemo(() => {
    let filtered = Array.isArray(interventions) ? interventions : [];

    // Filtre par recherche
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(i =>
        i.title?.toLowerCase().includes(term) ||
        i.intervention_number?.toLowerCase().includes(term) ||
        (i.client_name || i.client_detail?.name || '')?.toLowerCase().includes(term)
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === statusFilter);
    }

    // Filtre par priorité
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(i => i.priority === priorityFilter);
    }

    // Filtre par technicien
    if (technicianFilter) {
      filtered = filtered.filter(i => i.technician === parseInt(technicianFilter));
    }

    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [interventions, debouncedSearchTerm, statusFilter, priorityFilter, technicianFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredInterventions.length / itemsPerPage);
  const paginatedInterventions = filteredInterventions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Obtenir le statut avec icône et couleur
  const getStatusInfo = (status) => {
    switch (status) {
      case 'EN_ATTENTE':
        return { label: 'En attente', color: 'amber', icon: Clock };
      case 'EN_COURS':
        return { label: 'En cours', color: 'blue', icon: TrendingUp };
      case 'TERMINE':
        return { label: 'Terminé', color: 'emerald', icon: CheckCircle2 };
      case 'ANNULE':
        return { label: 'Annulé', color: 'rose', icon: XCircle };
      default:
        return { label: status, color: 'slate', icon: AlertCircle };
    }
  };

  // Obtenir la priorité avec couleur
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENTE':
        return 'bg-rose-100 text-rose-700 border-rose-300';
      case 'HAUTE':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'NORMALE':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'BASSE':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  // Ouvrir le modal de création
  const handleAddIntervention = () => {
    setEditingIntervention(null);
    setFormData({
      title: '',
      description: '',
      client: '',
      client_name: '',
      client_phone: '',
      client_address: '',
      technician: '',
      status: 'EN_ATTENTE',
      priority: 'NORMALE',
      scheduled_date: '',
      notes: '',
      products: []
    });
    setIsModalOpen(true);
  };

  // Ouvrir le modal d'édition
  const handleEditIntervention = (intervention) => {
    setEditingIntervention(intervention);
    setFormData({
      title: intervention.title || '',
      description: intervention.description || '',
      client: intervention.client || '',
      client_name: intervention.client_name || intervention.client_detail?.name || '',
      client_phone: intervention.client_phone || '',
      client_address: intervention.client_address || '',
      technician: intervention.technician || '',
      status: intervention.status || 'EN_ATTENTE',
      priority: intervention.priority || 'NORMALE',
      scheduled_date: intervention.scheduled_date ? intervention.scheduled_date.split('T')[0] : '',
      notes: intervention.notes || '',
      products: (intervention.products_used || []).map(p => ({
        product: p.product,
        quantity: p.quantity,
        notes: p.notes || ''
      }))
    });
    setIsModalOpen(true);
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setFetching(true);
      // Si un client est sélectionné mais le nom est vide, remplir depuis la liste des clients
      let client_name = formData.client_name;
      let client_phone = formData.client_phone;
      let client_address = formData.client_address;
      if (formData.client && !client_name?.trim()) {
        const selectedClient = clients?.find(c => String(c.id) === String(formData.client));
        if (selectedClient) {
          client_name = selectedClient.name || '';
          client_phone = client_phone || selectedClient.phone || '';
          client_address = client_address || selectedClient.address || '';
        }
      }
      const payload = {
        ...formData,
        client: formData.client || null,
        client_name: client_name?.trim() || '',
        client_phone: client_phone?.trim() || '',
        client_address: client_address?.trim() || '',
        technician: formData.technician || null,
        scheduled_date: formData.scheduled_date || null,
        products: formData.products.filter(p => p.product)
      };

      let response;
      if (editingIntervention) {
        response = await apiCall(`/api/interventions/${editingIntervention.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
      } else {
        response = await apiCall('/api/interventions/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'Erreur lors de la sauvegarde');
      }

      showNotification(
        editingIntervention ? 'Intervention modifiée avec succès' : 'Intervention créée avec succès'
      );
      setIsModalOpen(false);
      fetchInterventions();
    } catch (error) {
      console.error('Erreur handleSubmit:', error);
      showNotification(error.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setFetching(false);
    }
  };

  // Supprimer une intervention
  const handleDeleteIntervention = async () => {
    if (!interventionToDelete) return;
    
    try {
      setDeleting(true);
      const response = await apiCall(`/api/interventions/${interventionToDelete.id}/soft_delete/`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      showNotification('Intervention supprimée avec succès');
      setInterventionToDelete(null);
      fetchInterventions();
    } catch (error) {
      console.error('Erreur handleDeleteIntervention:', error);
      showNotification('Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Changer le statut
  const handleChangeStatus = async (interventionId, newStatus) => {
    try {
      const response = await apiCall(`/api/interventions/${interventionId}/change_status/`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du changement de statut');
      }

      showNotification('Statut modifié avec succès');
      fetchInterventions();
    } catch (error) {
      console.error('Erreur handleChangeStatus:', error);
      showNotification('Erreur lors du changement de statut', 'error');
    }
  };

  // Ajouter un produit au formulaire
  const addProductToForm = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { product: '', quantity: 1, notes: '' }]
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
          <Wrench className="w-32 h-32 text-primary-600" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-12 bg-primary-600 rounded-full"></div>
              <span className="text-primary-600 font-bold uppercase tracking-widest text-xs">Technique</span>
            </div>
            <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Interventions</h1>
            <p className="text-slate-500 font-medium">Gérez les interventions techniques et assignez les techniciens.</p>
          </div>
          <button 
            onClick={handleAddIntervention}
            className="btn-primary shadow-xl shadow-primary-500/30 px-8 py-4 text-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Intervention
          </button>
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
              <option value="EN_ATTENTE">En attente</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
          <div className="relative">
            <AlertCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input-field pl-12 appearance-none"
            >
              <option value="all">Toutes les priorités</option>
              <option value="URGENTE">Urgente</option>
              <option value="HAUTE">Haute</option>
              <option value="NORMALE">Normale</option>
              <option value="BASSE">Basse</option>
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

      {/* Interventions Table */}
      <div className="card p-0 overflow-hidden border-none shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Numéro</th>
                <th className="table-header">Titre</th>
                <th className="table-header">Client</th>
                <th className="table-header">Technicien</th>
                <th className="table-header text-center">Statut</th>
                <th className="table-header text-center">Priorité</th>
                <th className="table-header">Date prévue</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedInterventions.map(intervention => {
                const statusInfo = getStatusInfo(intervention.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <tr key={intervention.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="table-cell font-mono text-sm font-bold text-primary-600">
                      {intervention.intervention_number}
                    </td>
                    <td className="table-cell font-bold text-slate-700">{intervention.title}</td>
                    <td className="table-cell">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">{intervention.client_name || intervention.client_detail?.name || 'N/A'}</span>
                        {intervention.client_phone && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {intervention.client_phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      {intervention.technician_detail ? (
                        <span className="text-slate-600">
                          {intervention.technician_detail.first_name || intervention.technician_detail.last_name
                            ? `${intervention.technician_detail.first_name} ${intervention.technician_detail.last_name}`.trim()
                            : intervention.technician_detail.username}
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
                    <td className="table-cell text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${getPriorityColor(intervention.priority)}`}>
                        {intervention.priority_display || intervention.priority}
                      </span>
                    </td>
                    <td className="table-cell">
                      {intervention.scheduled_date ? (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(intervention.scheduled_date).toLocaleDateString('fr-FR', {
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
                          onClick={() => setViewingIntervention(intervention)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Voir détails"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditIntervention(intervention)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                          title="Modifier"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setInterventionToDelete(intervention)}
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

      {paginatedInterventions.length === 0 && (
        <div className="card p-20 text-center">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Aucune intervention trouvée</h3>
          <p className="text-slate-500 font-medium">Essayez de modifier vos critères de recherche ou créez une nouvelle intervention.</p>
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
        title={editingIntervention ? 'Modifier l\'intervention' : 'Nouvelle Intervention'}
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
                Priorité
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input-field appearance-none"
              >
                <option value="BASSE">Basse</option>
                <option value="NORMALE">Normale</option>
                <option value="HAUTE">Haute</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field min-h-[100px]"
              required
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
                  const selectedClient = clients?.find(c => String(c.id) === String(clientId));
                  setFormData({
                    ...formData,
                    client: clientId,
                    client_name: selectedClient ? (selectedClient.name || '') : formData.client_name,
                    client_phone: selectedClient ? (selectedClient.phone || '') : formData.client_phone,
                    client_address: selectedClient ? (selectedClient.address || '') : formData.client_address
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
              Adresse d'intervention
            </label>
            <textarea
              value={formData.client_address}
              onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
              className="input-field min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input-field appearance-none"
            >
              <option value="EN_ATTENTE">En attente</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>

          {/* Produits utilisés */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                Produits utilisés
              </label>
              <button
                type="button"
                onClick={addProductToForm}
                className="btn-secondary text-sm py-1 px-3 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
            {formData.products.map((product, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <select
                    value={product.product}
                    onChange={(e) => updateProductInForm(index, 'product', e.target.value)}
                    className="input-field appearance-none"
                  >
                    <option value="">Sélectionner un produit</option>
                    {(products || []).filter(p => !p.deleted_at && p.is_active).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    value={product.quantity}
                    onChange={(e) => updateProductInForm(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="input-field"
                    placeholder="Qté"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeProductFromForm(index)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
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
              className="input-field min-h-[100px]"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="flex-1 btn-primary py-4 text-lg shadow-xl shadow-primary-500/20">
              {editingIntervention ? 'Modifier' : 'Créer'} l'Intervention
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

      {/* View Details Modal */}
      {viewingIntervention && (
        <Modal
          isOpen={!!viewingIntervention}
          onClose={() => setViewingIntervention(null)}
          title={`Intervention ${viewingIntervention.intervention_number}`}
          size="lg"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-2">{viewingIntervention.title}</h3>
              <p className="text-slate-600">{viewingIntervention.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Client</p>
                <p className="font-bold text-slate-700">{viewingIntervention.client_name || viewingIntervention.client_detail?.name || 'N/A'}</p>
                {viewingIntervention.client_phone && (
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" />
                    {viewingIntervention.client_phone}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Technicien</p>
                <p className="font-bold text-slate-700">
                  {viewingIntervention.technician_detail
                    ? (viewingIntervention.technician_detail.first_name || viewingIntervention.technician_detail.last_name
                        ? `${viewingIntervention.technician_detail.first_name} ${viewingIntervention.technician_detail.last_name}`.trim()
                        : viewingIntervention.technician_detail.username)
                    : 'Non assigné'}
                </p>
              </div>
            </div>

            {viewingIntervention.client_address && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Adresse</p>
                <p className="text-slate-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {viewingIntervention.client_address}
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Statut</p>
                {(() => {
                  const statusInfo = getStatusInfo(viewingIntervention.status);
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
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Priorité</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${getPriorityColor(viewingIntervention.priority)}`}>
                  {viewingIntervention.priority_display || viewingIntervention.priority}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Date prévue</p>
                <p className="text-slate-600">
                  {viewingIntervention.scheduled_date
                    ? new Date(viewingIntervention.scheduled_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'Non planifiée'}
                </p>
              </div>
            </div>

            {viewingIntervention.products_used && viewingIntervention.products_used.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Produits utilisés</p>
                <div className="space-y-2">
                  {viewingIntervention.products_used.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-bold text-slate-700">{product.product_name || product.product_detail?.name}</p>
                        {product.notes && <p className="text-xs text-slate-500">{product.notes}</p>}
                      </div>
                      <span className="font-black text-primary-600">x{product.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewingIntervention.notes && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Notes techniques</p>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{viewingIntervention.notes}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => {
                  handleEditIntervention(viewingIntervention);
                  setViewingIntervention(null);
                }}
                className="flex-1 btn-primary py-3"
              >
                Modifier
              </button>
              {viewingIntervention.status !== 'TERMINE' && viewingIntervention.status !== 'ANNULE' && (
                <button
                  onClick={() => {
                    handleChangeStatus(viewingIntervention.id, 'TERMINE');
                    setViewingIntervention(null);
                  }}
                  className="btn-secondary py-3 px-6"
                >
                  Marquer Terminé
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!interventionToDelete}
        onClose={() => setInterventionToDelete(null)}
        onConfirm={handleDeleteIntervention}
        title="Supprimer l'intervention"
        message={`Êtes-vous sûr de vouloir supprimer l'intervention "${interventionToDelete?.intervention_number}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        loading={deleting}
      />
    </div>
  );
};

export default Interventions;
