import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

const Notification = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right max-w-[min(100vw-2rem,28rem)]">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-0 break-words`}>
        <Icon className="w-5 h-5" />
        <span className="flex-1">{typeof message === 'string' || typeof message === 'number' ? message : String(message ?? '')}</span>
        <button onClick={onClose} className="hover:bg-white/20 rounded p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Notification;

