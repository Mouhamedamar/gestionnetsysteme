import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import Loader from '../components/Loader';
import PageHeader from '../components/PageHeader';
import { Ban, User, Search, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const ClientsBlacklist = () => {
  const {
    loading,
    loggedIn,
    user,
    apiCall,
    showNotification,
    updateClient,
  } = useApp();
  const role = user?.role || 'admin';
  const canManage = role === 'admin' || role === 'commercial';

  const [blacklisted, setBlacklisted] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [unblacklistingId, setUnblacklistingId] = useState(null);

  const loadBlacklisted = useCallback(async () => {
    try {
      const response = await apiCall('/api/auth/clients/?is_blacklisted=true');
      if (!response.ok) return;
      const data = await response.json();
      const list = data.results ?? data;
      setBlacklisted(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Erreur chargement clients blacklistés:', err);
      setBlacklisted([]);
    } finally {
      setInitialLoadDone(true);
    }
  }, [apiCall]);

  useEffect(() => {
    if (!loggedIn) return;
    loadBlacklisted();
  }, [loggedIn, loadBlacklisted]);

  const handleUnblacklist = async (client) => {
    if (!canManage) return;
    setUnblacklistingId(client.id);
    try {
      await updateClient(client.id, {
        name: client.name,
        first_name: client.first_name,
        last_name: client.last_name,
        phone: client.phone,
        email: client.email,
        address: client.address,
        company: client.company,
        client_type: client.client_type,
        observation: client.observation,
        is_blacklisted: false,
      });
      showNotification('Contact retiré de la blacklist');
      setBlacklisted((prev) => prev.filter((c) => c.id !== client.id));
    } catch (e) {
      showNotification(e.message || 'Erreur', 'error');
    } finally {
      setUnblacklistingId(null);
    }
  };

  const search = searchTerm.toLowerCase();
  const filtered = blacklisted.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(search) ||
      (c.email || '').toLowerCase().includes(search) ||
      (c.phone || '').toLowerCase().includes(search) ||
      (c.company || '').toLowerCase().includes(search)
  );

  const showLoader = loading && !initialLoadDone;
  if (showLoader) return <Loader />;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader
        title="Clients blacklistés"
        subtitle="Contacts à ne plus contacter — vous pouvez les retirer de la blacklist si besoin"
        badge="Blacklist"
        icon={Ban}
      >
        <Link
          to="/clients"
          className="px-6 py-2.5 rounded-xl bg-white text-primary-600 font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <User className="w-5 h-5" />
          Voir tous les clients
        </Link>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card overflow-hidden border-white/60 shadow-lg">
          <div className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 shadow-lg">
              <Ban className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total blacklistés</p>
              <p className="text-3xl font-black text-slate-800">{blacklisted.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="glass-card overflow-hidden shadow-xl border-white/60">
        <div className="p-6 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher dans les blacklistés..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Contact</th>
                <th className="table-header">Entreprise</th>
                <th className="table-header">Téléphone / Email</th>
                <th className="table-header max-w-[200px]">Observation</th>
                {canManage && <th className="table-header text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {(client.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{client.name}</div>
                        <div className="text-xs text-slate-500">
                          Modifié le {client.updated_at ? new Date(client.updated_at).toLocaleDateString('fr-FR') : '-'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-slate-600">{client.company || '-'}</td>
                  <td className="table-cell">
                    <div className="text-slate-700">{client.phone || '-'}</div>
                    <div className="text-sm text-slate-500">{client.email || '-'}</div>
                  </td>
                  <td className="table-cell max-w-[200px] truncate text-slate-600" title={client.observation || ''}>
                    {client.observation || '-'}
                  </td>
                  {canManage && (
                    <td className="table-cell text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleUnblacklist(client)}
                          disabled={unblacklistingId === client.id || loading}
                          className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all flex items-center gap-1.5"
                          title="Retirer de la blacklist"
                        >
                          <UserCheck className="w-5 h-5" />
                          <span className="text-sm font-medium">Retirer</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Ban className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-700 text-lg">Aucun client blacklisté</h3>
              <p className="mt-1 text-slate-500 text-sm">
                {searchTerm
                  ? 'Aucun résultat pour cette recherche.'
                  : 'Les contacts blacklistés apparaîtront ici.'}
              </p>
              {!searchTerm && (
                <Link to="/clients" className="inline-block mt-6 btn-primary">
                  Voir la liste des clients
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientsBlacklist;
