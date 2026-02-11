import { useState, useEffect } from 'react';
import { AlertTriangle, X, Bell } from 'lucide-react';

const StockAlertNotification = ({ lowStockProducts }) => {
  const [alerts, setAlerts] = useState([]);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    if (lowStockProducts && lowStockProducts.length > 0) {
      const newAlerts = lowStockProducts.map((product, index) => ({
        id: product.id,
        name: product.name,
        quantity: product.quantity,
        threshold: product.alert_threshold,
        index
      }));
      setAlerts(newAlerts);

      if (!hasPlayed) {
        playAlertSound();
        setHasPlayed(true);
      }
    }
  }, [lowStockProducts, hasPlayed]);

  const playAlertSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-50 space-y-4 max-w-2xl">
      {/* Alerte principale massive */}
      <div
        className="relative bg-red-600 text-white px-8 py-6 rounded-2xl shadow-2xl flex items-start gap-6 border-4 border-red-400 transform transition-all duration-300"
        style={{
          animation: `slideInScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both, shake 0.6s ease-in-out infinite`
        }}
      >
        {/* Halo de fond */}
        <div className="absolute inset-0 bg-red-500 rounded-2xl blur-2xl opacity-40 -z-10 animate-pulse"></div>

        {/* Icône massive */}
        <div className="flex-shrink-0 relative pt-1">
          <div className="absolute -inset-2 bg-red-400 rounded-full blur-lg opacity-60 animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-red-500 to-red-700 p-3 rounded-full">
            <Bell className="w-10 h-10 text-yellow-300 animate-bounce" style={{ animationDuration: '0.6s' }} />
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <p className="text-4xl font-black tracking-wider leading-tight">
            ⚠️ RUPTURE DE STOCK!
          </p>
          <p className="text-xl font-bold mt-3 text-red-50">
            {alerts.length} produit{alerts.length > 1 ? 's' : ''} en rupture
          </p>

          {/* Liste des produits */}
          <div className="mt-4 space-y-2 bg-red-700/40 p-4 rounded-xl border-2 border-red-500/50">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="text-lg font-bold text-yellow-300 flex items-center gap-2">
                <span className="text-2xl">🔴</span>
                <span>{alert.name}</span>
                <span className="text-white ml-auto text-lg">
                  {alert.quantity}/{alert.threshold}
                </span>
              </div>
            ))}
            {alerts.length > 5 && (
              <p className="text-lg font-bold text-yellow-200 mt-3 px-2">
                ... et {alerts.length - 5} autre{alerts.length - 5 > 1 ? 's' : ''} produit{alerts.length - 5 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Bouton fermer */}
        <button
          onClick={() => setAlerts([])}
          className="flex-shrink-0 text-white bg-red-700/60 hover:bg-red-800 p-2 rounded-lg transition-all hover:scale-110 mt-1"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      <style>{`
        @keyframes slideInScale {
          from {
            opacity: 0;
            transform: translateX(500px) scale(0.7);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0) rotateZ(0deg); }
          25% { transform: translateX(-3px) rotateZ(-0.5deg); }
          75% { transform: translateX(3px) rotateZ(0.5deg); }
        }
      `}</style>
    </div>
  );
};

export default StockAlertNotification;
