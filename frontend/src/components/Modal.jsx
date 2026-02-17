import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center min-h-full animate-fade-in">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in"
        aria-hidden
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200/80 animate-scale-in ${sizeClasses[size]}`}
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 id="modal-title" className="text-xl font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-white">{children}</div>
      </div>
    </div>
  );
};

export default Modal;

