import { useState } from 'react';
import { Edit, Trash2, Eye, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

const BASE_URL = 'http://localhost:8000';

const ProductCard = ({ product, onEdit, onDelete, onView }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const isLowStock = product.quantity <= product.alert_threshold;

  // Construire l'URL de l'image
  const imageUrl = (() => {
    if (!product.photo) return null;

    // Si c'est déjà une URL complète
    if (product.photo.startsWith('http://') || product.photo.startsWith('https://')) {
      return product.photo;
    }

    // Si c'est un chemin relatif
    if (product.photo.startsWith('/')) {
      return `${BASE_URL}${product.photo}`;
    }

    // Chemin media
    return `${BASE_URL}/media/${product.photo}`;
  })();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image section */}
      <div className="relative h-40 bg-gray-100 border-b border-gray-200 overflow-hidden">
        {imageUrl && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="animate-spin">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
                </div>
              </div>
            )}
            <img
              src={imageUrl}
              alt={product.name}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
              className="w-full h-full object-cover"
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50">
            <ImageIcon className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Aucune image</p>
          </div>
        )}

        {isLowStock && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse-blink shadow-lg">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            Stock faible
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 truncate">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{product.category}</p>

        <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Stock:</span>
            <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
              {product.quantity} unités
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Prix achat:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(product.purchase_price ?? 0)} FCFA</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Prix vente:</span>
            <span className="font-bold text-blue-600">{formatCurrency(product.sale_price ?? 0)} FCFA</span>
          </div>
        </div>

        {/* Boutons actions */}
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium text-sm transition flex items-center justify-center gap-1"
          >
            <Eye className="w-4 h-4" />
            Voir
          </button>
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium text-sm transition flex items-center justify-center gap-1"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded font-medium text-sm transition flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
