import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';
import Loader from '../components/Loader';
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
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Gestion des Clients</h1>
        <p className="page-subtitle">Gérez vos clients et leurs informations</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {canManageClients && (
              <button
                onClick={() => {
                  setEditingClient(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nouveau client
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adresse
                </th>
                {canManageClients && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">
                          Créé le {new Date(client.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.email || '-'}</div>
                    <div className="text-sm text-gray-500">{client.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {client.address || '-'}
                    </div>
                  </td>
                  {canManageClients && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingClient(client);
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(client)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun client</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? 'Aucun client trouvé pour votre recherche.'
                  : canManageClients
                    ? 'Commencez par créer un nouveau client.'
                    : 'Aucun client disponible.'}
              </p>
              {!searchTerm && canManageClients && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau client
                  </button>
                </div>
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
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
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