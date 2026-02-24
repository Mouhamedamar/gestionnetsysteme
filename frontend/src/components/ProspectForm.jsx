import React, { useState, useEffect } from 'react';

const STATUS_LABELS = {
  new: 'Nouveau',
  contacted: 'Contacté',
  converted: 'Converti',
  lost: 'Perdu',
};

const ProspectForm = ({ prospect, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    status: 'new',
    observation: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (prospect) {
      setFormData({
        name: prospect.name || '',
        phone: prospect.phone || '',
        email: prospect.email || '',
        company: prospect.company || '',
        status: prospect.status || 'new',
        observation: prospect.observation || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        company: '',
        status: 'new',
        observation: '',
      });
    }
  }, [prospect]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await onSave(prospect?.id, formData);
      onClose();
    } catch (err) {
      console.error('Erreur sauvegarde prospect:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
          placeholder="Nom du prospect"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
        <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
        <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <input type="text" value="Prospect" disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
        <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Observation</label>
        <textarea name="observation" value={formData.observation} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Notes de suivi..." />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
          Annuler
        </button>
        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          Enregistrer
        </button>
      </div>
    </form>
  );
};

export default ProspectForm;
