import { useState, useEffect } from 'react';
import { X, Save, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';

const ProductForm = ({ product, onClose, onSave }) => {
  const { addProduct, updateProduct } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 0,
    purchase_price: 0,
    sale_price: 0,
    alert_threshold: 10,
    is_active: true,
    photo: null
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        quantity: product.quantity || 0,
        purchase_price: Math.round(Number(product.purchase_price) || 0),
        sale_price: Math.round(Number(product.sale_price) || 0),
        alert_threshold: product.alert_threshold || 10,
        is_active: product.is_active !== false,
        photo: null
      });
      
      // Afficher l'image existante
      if (product.photo) {
        const photoUrl = product.photo.startsWith('http') 
          ? product.photo 
          : `${API_BASE_URL}${product.photo}`;
        setPhotoPreview(photoUrl);
      }
    }
  }, [product]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }

    if (isNaN(formData.purchase_price) || formData.purchase_price < 0) {
      newErrors.purchase_price = 'Prix d\'achat invalide';
    }

    if (isNaN(formData.sale_price) || formData.sale_price < 0) {
      newErrors.sale_price = 'Prix de vente invalide';
    }

    if (formData.sale_price < formData.purchase_price) {
      newErrors.sale_price = 'Le prix de vente doit être >= au prix d\'achat';
    }

    if (isNaN(formData.quantity) || formData.quantity < 0) {
      newErrors.quantity = 'Quantité invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    }));
    // Supprimer l'erreur du champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          photo: 'Veuillez sélectionner une image'
        }));
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          photo: 'L\'image doit faire moins de 5MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        photo: file
      }));

      // Créer un preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result);
      };
      reader.readAsDataURL(file);

      setErrors(prev => ({
        ...prev,
        photo: undefined
      }));
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({
      ...prev,
      photo: null
    }));
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Créer un FormData pour gérer l'upload de fichier
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('quantity', formData.quantity);
      data.append('purchase_price', Math.round(Number(formData.purchase_price) || 0));
      data.append('sale_price', Math.round(Number(formData.sale_price) || 0));
      data.append('alert_threshold', formData.alert_threshold);
      data.append('is_active', formData.is_active);

      if (formData.photo) {
        data.append('photo', formData.photo);
        console.log('Photo ajoutée au FormData');
      }

      console.log('Envoi du formulaire...');
      
      if (product && product.id) {
        // Modification
        console.log(`Modification du produit ${product.id}`);
        await updateProduct(product.id, data);
      } else {
        // Création
        console.log('Création d\'un nouveau produit');
        await addProduct(data);
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error('Erreur handleSubmit:', error);
      const errorMsg = error.message || 'Une erreur est survenue';
      setErrors({ submit: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">
            {product?.id ? 'Modifier le produit' : 'Nouveau produit'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Erreur générale */}
          {errors.submit && (
            <div className="p-3 bg-red-100 text-red-700 rounded">
              {errors.submit}
            </div>
          )}

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Photo du produit</label>
            <div className="flex gap-4">
              {/* Upload area */}
              <div className="flex-1">
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition flex flex-col items-center justify-center min-h-[120px]">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 text-center">
                    Cliquez pour sélectionner une image
                  </p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG (Max 5MB)</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                {errors.photo && (
                  <p className="text-red-500 text-sm mt-1">{errors.photo}</p>
                )}
              </div>

              {/* Preview */}
              {photoPreview && (
                <div className="flex-shrink-0">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="mt-2 w-full px-2 py-1 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200 transition"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium mb-1">Nom du produit *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Casque audio"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description du produit (optionnel)"
            />
          </div>

          {/* Prix d'achat et vente */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prix d'achat (FCFA) *</label>
              <input
                type="number"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleChange}
                step="1"
                min="0"
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.purchase_price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.purchase_price && (
                <p className="text-red-500 text-sm mt-1">{errors.purchase_price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Prix de vente (FCFA) *</label>
              <input
                type="number"
                name="sale_price"
                value={formData.sale_price}
                onChange={handleChange}
                step="1"
                min="0"
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sale_price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.sale_price && (
                <p className="text-red-500 text-sm mt-1">{errors.sale_price}</p>
              )}
            </div>
          </div>

          {/* Quantité et seuil d'alerte */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantité en stock</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Seuil d'alerte</label>
              <input
                type="number"
                name="alert_threshold"
                value={formData.alert_threshold}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10"
              />
            </div>
          </div>

          {/* Statut actif */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Produit actif
            </label>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
