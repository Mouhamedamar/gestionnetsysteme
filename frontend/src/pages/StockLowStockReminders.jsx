import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Send, Package, AlertTriangle, ExternalLink, ImageOff, CheckCircle, List } from 'lucide-react';
import Loader from '../components/Loader';
import PageHeader from '../components/PageHeader';
import { USE_API, API_BASE_URL } from '../config';

const StockLowStockReminders = () => {
  const { apiCall, showNotification } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [alertSettings, setAlertSettings] = useState({
    reminder_interval_days: 0,
    last_reminder_sent_at: null,
  });
  const [savingReminder, setSavingReminder] = useState(false);
  const [listHiddenAfterSend, setListHiddenAfterSend] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!USE_API) return;
    try {
      const response = await apiCall('/api/stock-alert-settings/');
      if (response.ok) {
        const data = await response.json();
        setAlertSettings({
          reminder_interval_days: data.reminder_interval_days ?? 0,
          last_reminder_sent_at: data.last_reminder_sent_at ?? null,
        });
      }
    } catch (e) {
      console.error('Erreur fetch alert settings:', e);
    }
  }, [apiCall]);

  const fetchList = useCallback(async () => {
    if (!USE_API) {
      setProducts([]);
      return;
    }
    try {
      const response = await apiCall('/api/stock-low-stock-reminders/');
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      } else {
        setProducts([]);
      }
    } catch (e) {
      console.error('Erreur fetch rappels stock faible:', e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    setLoading(true);
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!USE_API) return;
    const intervalMs = 60 * 1000;
    const tid = setInterval(fetchSettings, intervalMs);
    return () => clearInterval(tid);
  }, [fetchSettings]);

  /** Date du prochain rappel (jour J). Si un rappel a déjà été envoyé : last + interval. Sinon (rappele vient d'être défini) : aujourd'hui + interval. */
  const nextReminderDue = () => {
    const interval = Number(alertSettings.reminder_interval_days) || 0;
    if (interval <= 0) return null;
    const now = new Date();
    if (alertSettings.last_reminder_sent_at) {
      const last = new Date(alertSettings.last_reminder_sent_at);
      const next = new Date(last);
      next.setDate(next.getDate() + interval);
      return next;
    }
    // Rappel défini mais jamais envoyé : jour J = aujourd'hui + intervalle
    const next = new Date(now);
    next.setDate(next.getDate() + interval);
    return next;
  };

  /** Retourne la date du jour en YYYY-MM-DD (heure locale) pour comparaison fiable */
  const todayDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  /** True si on est avant le jour J → on masque le bouton "Envoyer les rappels" jusqu'au jour J */
  const isBeforeNextDueDay = () => {
    const next = nextReminderDue();
    if (!next) return false;
    const todayStr = todayDateString();
    const nextStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
    return todayStr < nextStr;
  };
  const reminderLocked = isBeforeNextDueDay();
  const nextDueDate = nextReminderDue();

  const handleSaveReminderInterval = async (e) => {
    e.preventDefault();
    if (!USE_API) return;
    setSavingReminder(true);
    try {
      const interval = Number(alertSettings.reminder_interval_days) || 0;
      const response = await apiCall('/api/stock-alert-settings/', {
        method: 'PATCH',
        body: JSON.stringify({ reminder_interval_days: interval }),
      });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        setAlertSettings({
          reminder_interval_days: data.reminder_interval_days ?? interval,
          last_reminder_sent_at: data.last_reminder_sent_at ?? alertSettings.last_reminder_sent_at,
        });
        showNotification('Rappel automatique mis à jour');
        await fetchSettings();
      } else {
        const err = await response.json().catch(() => ({}));
        showNotification(err.detail || 'Erreur', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Erreur', 'error');
    } finally {
      setSavingReminder(false);
    }
  };

  const handleSendReminders = async () => {
    if (!USE_API) {
      showNotification('API désactivée', 'error');
      return;
    }
    setSending(true);
    try {
      const response = await apiCall('/api/stock-low-stock-reminders/send/', { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        showNotification(data.message || 'Rappels envoyés.');
        setListHiddenAfterSend(true);
        // Mise à jour immédiate pour que le bouton disparaisse tout de suite (jusqu'au jour J)
        setAlertSettings((prev) => ({
          ...prev,
          last_reminder_sent_at: new Date().toISOString(),
        }));
        await fetchSettings();
        await fetchList();
      } else {
        showNotification(data.detail || data.error || 'Erreur', 'error');
      }
    } catch (e) {
      showNotification(e.message || 'Erreur', 'error');
    } finally {
      setSending(false);
    }
  };

  const getProductImageSrc = (p) => {
    if (!p) return null;
    const url = p.image_url || p.photo_url;
    if (url) {
      return url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
    }
    return null;
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Rappels stock faible"
        subtitle="Produits sous le seuil d'alerte — envoi de rappels par SMS et email aux responsables"
        icon={AlertTriangle}
      />

      {/* Bloc Me rappeler dans… — design amélioré */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary-600" />
          Rappel automatique
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Envoyer un rappel périodique aux responsables (commande cron : <code className="text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">send_stock_reminders_if_due</code>).
        </p>
        <form onSubmit={handleSaveReminderInterval} className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="reminder-interval" className="text-sm font-medium text-slate-700 whitespace-nowrap">
              Me rappeler dans
            </label>
            <select
              id="reminder-interval"
              value={String(alertSettings.reminder_interval_days ?? 0)}
              onChange={(e) => setAlertSettings({ ...alertSettings, reminder_interval_days: Number(e.target.value) })}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 bg-white min-w-[140px] focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="0">Désactivé</option>
              <option value="1">1 jour</option>
              <option value="2">2 jours</option>
              <option value="3">3 jours</option>
              <option value="7">7 jours</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={savingReminder}
            className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {savingReminder ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          {alertSettings.last_reminder_sent_at && (
            <span className="text-sm text-slate-500">
              Dernier rappel : {new Date(alertSettings.last_reminder_sent_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {nextReminderDue() && (
            <span className="text-sm font-medium text-primary-700">
              Prochain rappel prévu ({Number(alertSettings.reminder_interval_days) || 0} jour{Number(alertSettings.reminder_interval_days) > 1 ? 's' : ''}) : {nextReminderDue().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <p className="text-slate-600 font-medium">
            {products.length === 0
              ? "Aucun produit en stock faible."
              : `${products.length} produit${products.length > 1 ? 's' : ''} en dessous du seuil d'alerte`}
          </p>
          <div className="flex flex-wrap gap-2 shrink-0 items-center">
            {reminderLocked && nextDueDate ? (
              <p className="text-sm text-slate-600 font-medium">
                Prochain envoi de rappel possible le{' '}
                <span className="text-primary-700 font-bold">
                  {nextDueDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleSendReminders}
                disabled={sending || products.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Envoi…' : 'Envoyer les rappels'}
              </button>
            )}
            <Link
              to="/products?low_stock=true"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Voir les produits
            </Link>
          </div>
        </div>

        {listHiddenAfterSend ? (
          <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/80 p-8 text-center">
            <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-emerald-800 mb-2">Rappels envoyés</p>
            <p className="text-slate-600 mb-6">Les responsables ont été notifiés par SMS et email. La liste des produits en stock faible est masquée.</p>
            <button
              type="button"
              onClick={() => setListHiddenAfterSend(false)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
            >
              <List className="w-4 h-4" />
              Afficher la liste
            </button>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p) => {
              const imgSrc = getProductImageSrc(p);
              return (
                <div
                  key={p.id}
                  className="group rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200 overflow-hidden"
                >
                  <div className="aspect-square bg-slate-100 relative overflow-hidden">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextElementSibling) e.target.nextElementSibling.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full flex items-center justify-center bg-slate-200/80 ${imgSrc ? 'hidden' : ''}`}
                      aria-hidden
                    >
                      <ImageOff className="w-14 h-14 text-slate-400" />
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-sm font-bold shadow">
                        {p.quantity} en stock
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-700/90 text-white text-xs font-medium">
                        Seuil {p.alert_threshold}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-slate-800 leading-tight line-clamp-2 min-h-[2.5rem]" title={p.name}>
                      {p.name}
                    </h4>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-amber-700 font-medium">Quantité : {p.quantity}</span>
                      <span className="text-slate-500">Seuil : {p.alert_threshold}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
            <Package className="w-16 h-16 mb-4 opacity-40" />
            <p className="font-medium text-slate-600">Aucun produit en stock faible pour le moment.</p>
            <Link to="/stock-notifications" className="mt-4 px-4 py-2 rounded-xl bg-primary-100 text-primary-700 font-medium hover:bg-primary-200 transition-colors">
              Configurer les notifications stock
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockLowStockReminders;
