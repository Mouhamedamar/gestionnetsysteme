import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirmer l\'action',
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'danger', // 'danger', 'warning', 'info'
  loading = false
}) => {
  if (!isOpen) return null;

  const typeConfigs = {
    danger: {
      buttonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      iconColor: 'text-red-600'
    },
    warning: {
      buttonClass: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      iconColor: 'text-yellow-600'
    },
    info: {
      buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      iconColor: 'text-blue-600'
    }
  };

  const config = typeConfigs[type] || typeConfigs.danger;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="p-4">
        <div className="flex items-start gap-4 mb-6">
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-slate-800 font-medium leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.buttonClass} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            {loading ? 'Chargement...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
