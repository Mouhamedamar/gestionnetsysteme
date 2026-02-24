import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';
import Loader from '../components/Loader';
import PageHeader from '../components/PageHeader';
import { Search, Plus, Edit, Trash2, User, Download, Users, CheckCircle2, TrendingUp, Eye } from 'lucide-react';
import { API_BASE_URL } from '../config';

const TYPE_FILTER_ALL = '';
const TYPE_FILTER_CLIENT = 'CLIENT';
const TYPE_FILTER_BLACKLIST = 'BLACKLIST';
const SORT_NAME = 'name';
const SORT_DATE = 'date';

const Clients = () => {
  const {
    addClient,
    updateClient,
    deleteClient,
    loading,
    loggedIn,
    user,
    apiCall,
    showNotification,
  } = useApp();
  const role = user?.role || 'admin';
  const canManageClients = role === 'admin' || role === 'commercial';

  const [clients, setClients] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState(TYPE_FILTER_ALL);
  const [sortBy, setSortBy] = useState(SORT_NAME);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') ?? '');
  }, [searchParams]);

  const loadClients = async () => {
    if (!loggedIn) return;
    setLoadingClients(true);
    try {
      const res = await apiCall('/api/auth/clients/?client_type=CLIENT');
      if (!res.ok) {
        if (res.status === 403) {
          setClients([]);
          return;
        }
        throw new Error('Erreur chargement clients');
      }
      const data = await res.json();
      const list = Array.isArray(data.results ?? data) ? (data.results ?? data) : [];
      setClients(list);
    } catch (err) {
      console.error('Erreur chargement clients:', err);
      setClients([]);
      showNotification('Erreur lors du chargement des clients', 'error');
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    const run = async () => {
      try {
        await loadClients();
      } catch (_) { /* ignore */ }
      if (!cancelled) setInitialLoadDone(true);
    };
    run();
    return () => { cancelled = true; };
  }, [loggedIn]);

  const handleSaveClient = async (id, clientData) => {
    try {
      if (id) {
        await updateClient(id, clientData);
      } else {
        await addClient(clientData);
      }
      setShowForm(false);
      setEditingClient(null);
      loadClients();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du client:', error);
    }
  };

  const handleDeleteClient = async (id) => {
    try {
      await deleteClient(id);
      setConfirmDelete(null);
      loadClients();
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
    }
  };

  const list = Array.isArray(clients) ? clients : [];
  const confirmedClients = list.filter(c => c && !c.is_blacklisted && (c.client_type === 'CLIENT' || !c.client_type));

  const search = searchTerm.toLowerCase();
  const filteredClients = useMemo(() => {
    if (typeFilter === TYPE_FILTER_BLACKLIST) {
      return list.filter(c => c && c.is_blacklisted && (
        (c.name || '').toLowerCase().includes(search) || (c.email || '').toLowerCase().includes(search) ||
        (c.phone || '').toLowerCase().includes(search) || (c.company || '').toLowerCase().includes(search)
      ));
    }
    return list.filter(client =>
      client && !client.is_blacklisted && (
        (client.name || '').toLowerCase().includes(search) ||
        (client.email || '').toLowerCase().includes(search) ||
        (client.phone || '').toLowerCase().includes(search) ||
        (client.company || '').toLowerCase().includes(search)
      )
    ).filter(c => typeFilter !== TYPE_FILTER_CLIENT || c.client_type === 'CLIENT' || !c.client_type);
  }, [list, search, typeFilter]);

  const sortedList = useMemo(() => {
    const arr = [...filteredClients];
    arr.sort((a, b) => {
      const na = (a.name || '').toLowerCase();
      const nb = (b.name || '').toLowerCase();
      if (sortBy === SORT_NAME) return na.localeCompare(nb);
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();
      return db - da;
    });
    return arr;
  }, [filteredClients, sortBy]);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('accessToken');
      const qs = new URLSearchParams();
      if (typeFilter === TYPE_FILTER_CLIENT) qs.set('client_type', 'CLIENT');
      else if (typeFilter === TYPE_FILTER_BLACKLIST) qs.set('is_blacklisted', 'true');
      const base = `${API_BASE_URL}/api/auth/clients/export-excel/`;
      const url = qs.toString() ? `${base}?${qs.toString()}` : base;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Export échoué');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'clients.xlsx';
      a.click();
      URL.revokeObjectURL(a.href);
      showNotification('Export Excel téléchargé');
    } catch (e) {
      showNotification(e.message || 'Erreur export', 'error');
    } finally {
      setExporting(false);
    }
  };

  const showLoader = (loading || loadingClients) && !initialLoadDone;
  if (showLoader) return <Loader />;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader
        title="Clients"
        subtitle="Gestion des clients de l'entreprise"
        badge="Clients"
        icon={Users}
      >
        {canManageClients && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setEditingClient(null); setShowForm(true); }}
              className="px-4 py-2.5 rounded-xl bg-white text-primary-600 font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all text-sm hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              Nouveau client
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting}
              className="px-4 py-2.5 rounded-xl bg-white/90 text-slate-700 font-medium flex items-center gap-2 border border-white/60 hover:bg-white hover:shadow-md transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Export...' : 'Exporter'}
            </button>
          </div>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center gap-4 hover:shadow-lg transition-shadow">
          <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total clients</p>
            <p className="text-2xl font-black text-slate-800">{confirmedClients.length}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4 hover:shadow-lg transition-shadow">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clients actifs</p>
            <p className="text-2xl font-black text-slate-800">{confirmedClients.length}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4 hover:shadow-lg transition-shadow">
          <div className="p-3 rounded-2xl bg-violet-100 text-violet-700">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top commerciaux</p>
            <p className="text-2xl font-black text-slate-800">0</p>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden shadow-xl border-white/60">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un client..."
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
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field max-w-[180px]"
            >
              <option value={TYPE_FILTER_ALL}>Tous</option>
              <option value={TYPE_FILTER_CLIENT}>Clients actifs</option>
              <option value={TYPE_FILTER_BLACKLIST}>Blacklistés</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field max-w-[180px]"
            >
              <option value={SORT_NAME}>Trier par nom</option>
              <option value={SORT_DATE}>Trier par date</option>
            </select>
          </div>
        </div>

        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-500" />
            Liste des clients
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Clients de l&apos;entreprise
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Client</th>
                <th className="table-header">Entreprise</th>
                <th className="table-header">Contact</th>
                <th className="table-header max-w-[200px]">Observation</th>
                <th className="table-header">Adresse</th>
                {canManageClients && <th className="table-header text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sortedList.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="table-cell">
                    <Link to={`/clients/${client.id}`} className="flex items-center gap-4 group/link">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md shadow-primary-500/25 group-hover/link:shadow-lg group-hover/link:scale-105 transition-all">
                        {(client.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 group-hover/link:text-primary-600 transition-colors">{client.name}</div>
                        <div className="text-xs text-slate-500">
                          Créé le {client.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR') : '-'}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="table-cell text-slate-600">{client.company || '-'}</td>
                  <td className="table-cell">
                    <div className="text-slate-700">{client.phone || client.email || '-'}</div>
                    {client.phone && client.email && (
                      <div className="text-xs text-slate-500">{client.email}</div>
                    )}
                  </td>
                  <td className="table-cell max-w-[200px] truncate text-slate-600" title={client.observation || ''}>{client.observation || '-'}</td>
                  <td className="table-cell max-w-xs truncate">{client.address || '-'}</td>
                  {canManageClients && (
                    <td className="table-cell text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <Link to={`/clients/${client.id}`} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="Voir le détail">
                          <Eye className="w-5 h-5" />
                        </Link>
                        <button onClick={() => { setEditingClient(client); setShowForm(true); }} className="p-2.5 text-primary-600 hover:bg-primary-50 rounded-xl transition-all" title="Modifier">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => setConfirmDelete(client)} className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Supprimer">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {sortedList.length === 0 && (
            <div className="text-center py-20 px-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mx-auto mb-5 ring-4 ring-slate-100">
                <Users className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-700 text-lg">Aucun client</h3>
              <p className="mt-2 text-slate-500 text-sm max-w-sm mx-auto">
                {searchTerm || typeFilter ? 'Aucun résultat pour votre recherche ou filtre.' : canManageClients ? 'Commencez par créer un nouveau client.' : 'Aucun client disponible.'}
              </p>
              {!searchTerm && canManageClients && (
                <button onClick={() => setShowForm(true)} className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors">
                  <Plus className="w-5 h-5" />
                  Nouveau client
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingClient(null); }} title={editingClient ? 'Modifier le client' : 'Nouveau client'} size="md">
        <ClientForm client={editingClient} onClose={() => { setShowForm(false); setEditingClient(null); }} onSave={handleSaveClient} />
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmer la suppression" size="sm">
        <div className="p-4">
          <p className="text-gray-700 mb-6">
            Êtes-vous sûr de vouloir supprimer le client <strong>{confirmDelete?.name}</strong> ? Cette action est irréversible.
          </p>
          <div className="flex justify-end space-x-3">
            <button onClick={() => setConfirmDelete(null)} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Annuler
            </button>
            <button onClick={() => handleDeleteClient(confirmDelete?.id)} disabled={loading} className="btn-danger">
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Clients;
