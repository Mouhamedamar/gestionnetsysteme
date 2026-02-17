import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import UserForm from '../components/UserForm';
import PageHeader from '../components/PageHeader';
import { Search, Plus, Edit, Trash2, Users as UsersIcon, User, Shield, UserCheck, UserX } from 'lucide-react';

const Users = () => {
  const { 
    users: contextUsers = [],
    fetchUsers, 
    addUser, 
    updateUserById, 
    deleteUser, 
    loading,
    showNotification 
  } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Une seule source de vérité : la liste vient du contexte (mise à jour auto après add/update/delete)
  const users = Array.isArray(contextUsers) ? contextUsers : [];

  // Charger / rafraîchir la liste au montage de la page
  useEffect(() => {
    fetchUsers().catch(err => {
      console.error('Erreur lors du chargement des utilisateurs:', err);
    });
  }, [fetchUsers]);

  const handleSaveUser = async (id, userData, options = {}) => {
    try {
      if (id) {
        const updatedUser = await updateUserById(id, userData);
        // Mise à jour de l'utilisateur en cours d'édition (formulaire reste ouvert en autoSave)
        if (options.autoSave && editingUser?.id === id) {
          setEditingUser(updatedUser);
        }
      } else {
        await addUser(userData);
      }
      if (!options.autoSave) {
        setShowForm(false);
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await deleteUser(id);
      setConfirmDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader title="Gestion des Utilisateurs" subtitle="Gérez les utilisateurs et leurs permissions" badge="Administration" icon={UsersIcon}>
        <button
          onClick={() => { setEditingUser(null); setShowForm(true); }}
          className="px-6 py-2.5 rounded-xl bg-white text-primary-600 font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Nouvel utilisateur
        </button>
      </PageHeader>

      <div className="glass-card p-6 shadow-xl border-white/60">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="table-modern w-full">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date de création</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-slate-800">{user.username}</div>
                          {user.is_staff && (
                            <div className="text-xs text-primary-600 flex items-center gap-1 mt-1">
                              <Shield className="w-3 h-3" />
                              Administrateur
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">{user.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'technicien' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {user.role === 'admin' ? '👑 Admin' :
                         user.role === 'technicien' ? '🔧 Technicien' :
                         '💼 Commercial'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <UserX className="w-3 h-3 mr-1" />
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(user.date_joined)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setShowForm(true);
                          }}
                          className="text-primary-600 hover:text-primary-700 p-2 hover:bg-primary-50 rounded-xl transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(user)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <User className="mx-auto h-12 w-12 text-slate-400" />
                      <h3 className="mt-2 text-sm font-semibold text-slate-800">Aucun utilisateur</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {searchTerm ? 'Aucun utilisateur trouvé pour votre recherche.' : 'Commencez par créer un nouvel utilisateur.'}
                      </p>
                      {!searchTerm && (
                        <div className="mt-6">
                          <button
                            onClick={() => setShowForm(true)}
                            className="btn-primary"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Nouvel utilisateur
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal pour le formulaire */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingUser(null);
        }}
        title={editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        size="md"
      >
        <UserForm
          user={editingUser}
          onClose={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
          onSave={handleSaveUser}
        />
      </Modal>

      {/* Modal de confirmation de suppression */}
      {confirmDelete && (
        <Modal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          title="Confirmer la suppression"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-slate-700">
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{confirmDelete.username}</strong> ?
            </p>
            <p className="text-sm text-slate-500">
              Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary">
                Annuler
              </button>
              <button
                onClick={() => handleDeleteUser(confirmDelete.id)}
                disabled={loading}
                className="btn-danger disabled:opacity-50"
              >
                {loading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Users;
