import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const UserForm = ({ user, onClose, onSave }) => {
  const { loading } = useApp();
  // Liste de toutes les pages disponibles avec leurs labels
  const availablePages = [
    { path: '/', label: 'Tableau de Bord' },
    { path: '/products', label: 'Produits' },
    { path: '/stock', label: 'Gestion Stock' },
    { path: '/stock-movements', label: 'Mouvements Stock' },
    { path: '/interventions', label: 'Interventions' },
    { path: '/installations', label: 'Installations' },
    { path: '/clients', label: 'Clients' },
    { path: '/quotes', label: 'Devis' },
    { path: '/invoices', label: 'Factures' },
    { path: '/proforma-invoices', label: 'Pro Forma' },
    { path: '/expenses', label: 'Dépenses' },
    { path: '/users', label: 'Utilisateurs' },
  ];

  // Fonction pour obtenir les permissions par défaut selon le rôle
  const getDefaultPermissionsForRole = (role) => {
    switch (role) {
      case 'admin':
        return ['/', '/products', '/stock', '/stock-movements', '/interventions', 
                '/installations', '/clients', '/quotes', '/invoices', 
                '/proforma-invoices', '/expenses', '/users'];
      case 'technicien':
        return ['/', '/interventions'];
      case 'commercial':
        return ['/clients', '/interventions'];
      default:
        return ['/clients', '/interventions'];
    }
  };

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    is_staff: false,
    is_active: true,
    role_write: 'commercial',
    phone: '',
    page_permissions: []
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      // Récupérer les permissions depuis plusieurs emplacements possibles
      // Si page_permissions est null/undefined, l'utilisateur utilise les permissions par défaut
      const permissions = user.profile?.page_permissions !== undefined
        ? user.profile.page_permissions
        : (user.page_permissions !== undefined ? user.page_permissions : null);
      
      const userRole = user.role || user.profile?.role || 'commercial';
      
      // Obtenir les permissions par défaut du rôle
      const defaultPermissions = getDefaultPermissionsForRole(userRole);
      
      // Si l'utilisateur a des permissions personnalisées, les combiner avec les permissions par défaut pour l'affichage
      // Sinon, utiliser uniquement les permissions par défaut
      let displayPermissions = defaultPermissions;
      if (Array.isArray(permissions) && permissions.length > 0) {
        // Combiner : permissions par défaut + permissions personnalisées
        displayPermissions = [...new Set([...defaultPermissions, ...permissions])];
      }
      
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '', // Ne pas pré-remplir le mot de passe
        is_staff: user.is_staff || false,
        is_active: user.is_active !== undefined ? user.is_active : true,
        role_write: userRole,
        phone: user.profile?.phone || '',
        // Afficher les permissions par défaut + permissions personnalisées
        page_permissions: displayPermissions
      });
    } else {
      // Pour un nouvel utilisateur, pré-cocher les permissions par défaut du rôle sélectionné
      const defaultRole = 'commercial';
      setFormData({
        username: '',
        email: '',
        password: '',
        is_staff: false,
        is_active: true,
        role_write: defaultRole,
        phone: '',
        page_permissions: getDefaultPermissionsForRole(defaultRole)
      });
    }
  }, [user]);

  // Mettre à jour les permissions par défaut si le rôle change (uniquement pour les nouveaux utilisateurs)
  const [previousRole, setPreviousRole] = useState(null);
  
  useEffect(() => {
    if (!user) {
      // Pour un nouvel utilisateur, mettre à jour les permissions quand le rôle change
      if (previousRole !== null && formData.role_write !== previousRole) {
        setFormData(prev => ({
          ...prev,
          page_permissions: getDefaultPermissionsForRole(prev.role_write)
        }));
      }
      setPreviousRole(formData.role_write);
    } else {
      setPreviousRole(null);
    }
  }, [formData.role_write, user, previousRole]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePagePermissionChange = (pagePath, checked) => {
    const defaultPermissions = getDefaultPermissionsForRole(formData.role_write);
    const currentPermissions = formData.page_permissions || [];

    // Empêcher de décocher uniquement les permissions par défaut
    if (!checked && defaultPermissions.includes(pagePath)) {
      return;
    }

    let newPermissions;
    if (checked) {
      if (currentPermissions.includes(pagePath)) return;
      newPermissions = [...currentPermissions, pagePath];
    } else {
      newPermissions = currentPermissions.filter(p => p !== pagePath);
    }

    setFormData(prev => ({ ...prev, page_permissions: newPermissions }));

    // Enregistrement automatique des permissions pour un utilisateur existant
    if (user?.id && onSave) {
      const additionalPermissions = newPermissions.filter(perm => !defaultPermissions.includes(perm));
      const dataToSend = {
        username: formData.username,
        email: formData.email,
        is_staff: formData.is_staff,
        is_active: formData.is_active,
        role_write: formData.role_write,
        phone: formData.phone || null,
        page_permissions: additionalPermissions
      };
      onSave(user.id, dataToSend, { autoSave: true });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    // Le mot de passe est requis uniquement lors de la création
    if (!user && !formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      // Les permissions cochées sont les permissions supplémentaires à ajouter aux permissions par défaut
      // Si aucune permission supplémentaire n'est cochée, envoyer un tableau vide [] (qui sera traité comme "pas de permissions supplémentaires")
      // Si des permissions supplémentaires sont cochées, envoyer le tableau (qui sera combiné avec les permissions par défaut)
      const selectedPermissions = formData.page_permissions || [];
      
      // Filtrer les permissions par défaut des permissions cochées pour ne garder que les permissions supplémentaires
      const defaultPermissions = getDefaultPermissionsForRole(formData.role_write);
      const additionalPermissions = selectedPermissions.filter(perm => !defaultPermissions.includes(perm));
      
      // Toujours envoyer un tableau (vide si aucune permission supplémentaire, ou avec les permissions supplémentaires)
      // Le backend convertira un tableau vide en None pour utiliser uniquement les permissions par défaut
      const permissionsToSend = additionalPermissions;
      
      // Debug: afficher ce qui est envoyé
      console.log('Permissions à envoyer:', {
        selectedPermissions,
        defaultPermissions,
        additionalPermissions: permissionsToSend
      });
      
      // Préparer les données à envoyer
      const dataToSend = {
        username: formData.username,
        email: formData.email,
        is_staff: formData.is_staff,
        is_active: formData.is_active,
        role_write: formData.role_write,
        phone: formData.phone || null,
        // Toujours envoyer un tableau (même vide) pour indiquer les permissions supplémentaires
        // [] sera converti en None par le backend pour utiliser uniquement les permissions par défaut
        page_permissions: permissionsToSend
      };
      
      // Ajouter le mot de passe seulement s'il est fourni
      if (formData.password) {
        dataToSend.password = formData.password;
      }
      
      if (user) {
        await onSave(user.id, dataToSend);
      } else {
        await onSave(null, dataToSend);
      }
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);
      // Afficher l'erreur à l'utilisateur
      if (error.response) {
        console.error('Réponse du serveur:', error.response.data);
        setErrors({ submit: error.response.data?.message || 'Erreur lors de la sauvegarde' });
      } else if (error.message) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: 'Une erreur est survenue lors de la sauvegarde' });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
          Nom d'utilisateur *
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.username ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder="Entrez le nom d'utilisateur"
        />
        {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder="Entrez l'email"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Mot de passe {!user && '*'}
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder={user ? "Laissez vide pour ne pas modifier" : "Entrez le mot de passe (min. 8 caractères)"}
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        {user && (
          <p className="mt-1 text-xs text-gray-500">
            Laissez vide pour ne pas modifier le mot de passe
          </p>
        )}
      </div>

      <div>
        <label htmlFor="role_write" className="block text-sm font-medium text-gray-700 mb-1">
          Rôle *
        </label>
        <select
          id="role_write"
          name="role_write"
          value={formData.role_write}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.role_write ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
        >
          <option value="admin">Administrateur</option>
          <option value="technicien">Technicien</option>
          <option value="commercial">Commercial</option>
        </select>
        {errors.role_write && <p className="mt-1 text-sm text-red-600">{errors.role_write}</p>}
        <p className="mt-1 text-xs text-gray-500">
          Le rôle détermine les permissions et le dashboard de l'utilisateur
        </p>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Téléphone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder="+221 77 123 45 67"
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_staff"
            name="is_staff"
            checked={formData.is_staff}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_staff" className="ml-2 block text-sm text-gray-700">
            Administrateur (is_staff)
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
            Actif
          </label>
        </div>
      </div>

      {/* Section Permissions par Page */}
      <div className="border-t pt-4 mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Permissions d'accès aux pages
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Sélectionnez les pages supplémentaires auxquelles cet utilisateur peut accéder. 
          Les pages cochées s'ajouteront aux permissions par défaut de son rôle. 
          Vous pouvez ajouter ou retirer des pages supplémentaires, mais les pages par défaut (affichées en gris) 
          ne peuvent pas être retirées.
        </p>
        <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
          {availablePages.map((page) => {
            const isChecked = formData.page_permissions?.includes(page.path) || false;
            const defaultPermissions = getDefaultPermissionsForRole(formData.role_write);
            const isDefaultPermission = defaultPermissions.includes(page.path);
            
            // Désactiver uniquement les permissions par défaut (elles ne peuvent pas être retirées)
            const isDisabled = isDefaultPermission;
            
            return (
              <div key={page.path} className="flex items-center">
                <input
                  type="checkbox"
                  id={`page_${page.path}`}
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={(e) => handlePagePermissionChange(page.path, e.target.checked)}
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <label 
                  htmlFor={`page_${page.path}`} 
                  className={`ml-2 block text-sm ${
                    isDisabled 
                      ? 'text-gray-500 font-medium' 
                      : 'text-gray-700'
                  }`}
                >
                  {page.label}
                  {isDefaultPermission && (
                    <span className="ml-1 text-xs text-gray-400">(par défaut)</span>
                  )}
                </label>
              </div>
            );
          })}
        </div>
        {formData.page_permissions?.length > 0 && (
          <p className="mt-2 text-xs text-blue-600">
            {formData.page_permissions.length} page(s) autorisée(s)
          </p>
        )}
      </div>

      {errors.submit && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : user ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
