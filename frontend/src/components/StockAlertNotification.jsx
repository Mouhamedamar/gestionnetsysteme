import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const StockAlertNotification = ({ lowStockProducts }) => {
  const [dismissed, setDismissed] = useState(false);

  // Dépendre d'une clé stable (ids + length) pour éviter la boucle : lowStockProducts est un nouveau tableau à chaque rendu du parent
  const listKey = !lowStockProducts?.length
    ? ''
    : lowStockProducts.map((p) => p.id).join(',');

  useEffect(() => {
    if (listKey) setDismissed(false);
  }, [listKey]);

  if (!lowStockProducts || lowStockProducts.length === 0 || dismissed) {
    return null;
  }

  const visible = lowStockProducts.slice(0, 3);
  const extraCount = lowStockProducts.length - visible.length;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-full max-w-[min(100vw-2rem,28rem)] px-4 sm:px-0">
      <div className="glass-card border border-amber-200/80 bg-amber-50/90 shadow-lg px-4 py-3 sm:px-5 sm:py-4 flex items-start gap-3 rounded-2xl">
        <div className="mt-0.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900">
            Rupture de stock sur {lowStockProducts.length} produit{lowStockProducts.length > 1 ? 's' : ''}
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-amber-900/90">
            {visible.map((p) => (
              <li key={p.id} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="truncate">{p.name}</span>
              </li>
            ))}
            {extraCount > 0 && (
              <li className="text-[11px] text-amber-900/70">
                + {extraCount} autre{extraCount > 1 ? 's' : ''} produit{extraCount > 1 ? 's' : ''}
              </li>
            )}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="ml-1 mt-0.5 p-1.5 rounded-full text-amber-700 hover:bg-amber-100 hover:text-amber-900 transition-colors"
          aria-label="Fermer l'alerte de stock"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default StockAlertNotification;
