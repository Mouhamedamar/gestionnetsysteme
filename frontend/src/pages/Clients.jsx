import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';
import Loader from '../components/Loader';
import PageHeader from '../components/PageHeader';
import { Search, Plus, Edit, Trash2, User } from 'lucide-react';

const Clients = () => {
  const { 
    clients = [], 
    fetchClients, 
    addClient, 
    updateClient, 
    deleteClient, 
    loading,
    loggedIn,
    user,
  } = useApp();
  const role = user?.role || 'admin';
  const canManageClients = role === 'admin' || role === 'commercial';
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') ?? '');
  }, [searchParams]);

  // Charger les clients au montage et quand loggedIn change
  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    const load = async () => {
      try {
        await fetchClients();
        if (!cancelled) setInitialLoadDone(true);
      } catch (err) {
        if (!cancelled) setInitialLoadDone(true);
        console.error('Erreur lors du chargement des clients:', err);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [loggedIn, fetchClients]);

  const handleSaveClient = async (id, clientData) => {
    try {
      if (id) {
        await updateClient(id, clientData);
      } else {
        await addClient(clientData);
      }
      setShowForm(false);
      setEditingClient(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du client:', error);
    }
  };

  const handleDeleteClient = async (id) => {
    try {
      await deleteClient(id);
      setConfirmDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
    }
  };

  const list = Array.isArray(clients) ? clients : [];
  const search = searchTerm.toLowerCase();
  const filteredClients = list.filter(client =>
    client && (
      (client.name || '').toLowerCase().includes(search) ||
      (client.email || '').toLowerCase().includes(search) ||
      (client.phone || '').toLowerCase().includes(search)
    )
  );

  const showLoader = loading && !initialLoadDone;

  if (showLoader) return <Loader />;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader
        title="Gestion des Clients"
        subtitle="Gérez vos clients et leurs informations"
        badge="Clients"
        icon={User}
      >
        {canManageClients && (
          <button
            onClick={() => { setEditingClient(null); setShowForm(true); }}
            className="px-6 py-2.5 rounded-xl bg-white text-primary-600 font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Nouveau client
          </button>
        )}
      </PageHeader>

      <div className="glass-card overflow-hidden shadow-xl border-white/60">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
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
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Client</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Adresse</th>
                {canManageClients && <th className="table-header text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md shadow-primary-500/25">
                        {(client.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{client.name}</div>
                        <div className="text-xs text-slate-500">Créé le {new Date(client.created_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-slate-700">{client.email || '-'}</div>
                    <div className="text-sm text-slate-500">{client.phone || '-'}</div>
                  </td>
                  <td className="table-cell max-w-xs truncate">{client.address || '-'}</td>
                  {canManageClients && (
                    <td className="table-cell text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setEditingClient(client); setShowForm(true); }}
                          className="p-2.5 text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                          title="Modifier"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(client)}
                          className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredClients.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-700 text-lg">Aucun client</h3>
              <p className="mt-1 text-slate-500 text-sm">
                {searchTerm ? 'Aucun client trouvé pour votre recherche.' : canManageClients ? 'Commencez par créer un nouveau client.' : 'Aucun client disponible.'}
              </p>
              {!searchTerm && canManageClients && (
                <button onClick={() => setShowForm(true)} className="btn-primary mt-6">
                  <Plus className="w-5 h-5" />
                  Nouveau client
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal pour le formulaire */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingClient(null);
        }}
        title={editingClient ? 'Modifier le client' : 'Nouveau client'}
        size="md"
      >
        <ClientForm
          client={editingClient}
          onClose={() => {
            setShowForm(false);
            setEditingClient(null);
          }}
          onSave={handleSaveClient}
        />
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="p-4">
          <p className="text-gray-700 mb-6">
            Êtes-vous sûr de vouloir supprimer le client <strong>{confirmDelete?.name}</strong> ?
            Cette action est irréversible.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setConfirmDelete(null)}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={() => handleDeleteClient(confirmDelete?.id)}
              disabled={loading}
              className="btn-danger"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Clients;