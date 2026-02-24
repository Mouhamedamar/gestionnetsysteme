import { X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

const Notification = ({ message, type = 'success', onClose }) => {
  const isError = type === 'error';
  const isWarning = type === 'warning';
  const duration = isError || isWarning ? 10000 : 3000;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor =
    type === 'success' ? 'bg-green-500' :
    type === 'warning' ? 'bg-amber-500' :
    'bg-red-500';
  const Icon =
    type === 'success' ? CheckCircle :
    type === 'warning' ? AlertTriangle :
    AlertCircle;

  const text = typeof message === 'string' || typeof message === 'number' ? message : String(message ?? '');

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right max-w-[min(100vw-2rem,28rem)]">
      <div className={`${bgColor} text-white px-5 py-4 rounded-lg shadow-xl flex items-start gap-3 min-w-0`}>
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span className="flex-1 min-w-0 text-sm leading-snug whitespace-pre-line break-words">{text}</span>
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 hover:bg-white/20 rounded p-1"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Notification;

