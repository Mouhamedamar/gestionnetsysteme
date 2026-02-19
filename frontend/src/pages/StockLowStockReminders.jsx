import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader';
import { AlertTriangle, Send, RefreshCw, ArrowLeft, Package } from 'lucide-react';
import { USE_API } from '../config';

const REMINDER_OPTIONS = [
  { value: '', label: 'Désactivé' },
  { value: 1, label: '1 jour' },
  { value: 2, label: '2 jours' },
  { value: 3, label: '3 jours' },
  { value: 7, label: '7 jours' },
];

const StockLowStockReminders = () => {
  const navigate = useNavigate();
  const { apiCall, showNotification } = useApp();
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ reminder_interval_days: null, last_reminder_sent_at: null });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [savingInterval, setSavingInterval] = useState(false);

  const fetchSettings = async () => {
    if (!USE_API) return;
    try {
      const res = await apiCall('/api/stock-alert-settings/');
      if (res.ok) {
        const data = await res.json();
        setSettings({
          reminder_interval_days: data.reminder_interval_days ?? null,
          last_reminder_sent_at: data.last_reminder_sent_at ?? null,
        });
      }
    } catch (_) {}
  };

  const fetchProducts = async () => {
    if (!USE_API) {
      setProducts([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await apiCall('/api/stock-low-stock-reminders/');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        throw new Error('Erreur lors du chargement');
      }
    } catch (e) {
      showNotification(e.message || 'Erreur lors du chargement des produits en stock faible', 'error');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchSettings()]);
      setLoading(false);
    };
    load();
  }, []);

  const handleSaveReminderInterval = async (e) => {
    e.preventDefault();
    if (!USE_API) return;
    setSavingInterval(true);
    try {
      const val = settings.reminder_interval_days === '' || settings.reminder_interval_days == null
        ? null
        : parseInt(settings.reminder_interval_days, 10) || 1;
      const response = await apiCall('/api/stock-alert-settings/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminder_interval_days: val }),
      });
      if (response.ok) {
        showNotification(val ? `Me rappeler tous les ${val} jour(s)` : 'Rappel automatique désactivé');
        fetchSettings();
      } else {
        const err = await response.json().catch(() => ({}));
        showNotification(err.reminder_interval_days?.[0] || err.detail || 'Erreur', 'error');
      }
    } catch (e) {
      showNotification(e.message || 'Erreur', 'error');
    } finally {
      setSavingInterval(false);
    }
  };

  const nextReminderText = () => {
    const interval = settings.reminder_interval_days;
    const last = settings.last_reminder_sent_at;
    if (!interval || interval < 1) return null;
    if (!last) return `Prochain rappel : dès que le cron s'exécutera (tous les ${interval} jour(s))`;
    const next = new Date(last);
    next.setDate(next.getDate() + interval);
    const now = new Date();
    if (next <= now) return 'Prochain rappel : dès la prochaine exécution du cron';
    const daysLeft = Math.ceil((next - now) / (24 * 60 * 60 * 1000));
    return `Prochain rappel prévu : dans ${daysLeft} jour(s)`;
  };

  const handleSendReminders = async () => {
    if (products.length === 0) {
      showNotification('Aucun produit en stock faible à rappeler', 'warning');
      return;
    }
    try {
      setSending(true);
      const response = await apiCall('/api/stock-low-stock-reminders/send/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: false }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur envoi');
      }
      const result = await response.json();
      const parts = [];
      if (result.sms_sent > 0) parts.push(`${result.sms_sent} SMS`);
      if (result.emails_sent > 0) parts.push(`${result.emails_sent} email(s)`);
      showNotification(
        parts.length ? `Rappels envoyés : ${parts.join(', ')}` : 'Aucun destinataire configuré (voir Notifications Stock)',
        parts.length ? 'success' : 'warning'
      );
      fetchProducts();
    } catch (e) {
      showNotification(e.message || "Erreur lors de l'envoi des rappels", 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader
        title="Rappels stock faible"
        subtitle="Envoyer un rappel SMS et email aux responsables pour les produits sous le seuil d'alerte"
        badge="Stock"
        icon={AlertTriangle}
      >
        <Link
          to="/stock-notifications"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold backdrop-blur-sm border border-white/20 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Notifications Stock
        </Link>
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold backdrop-blur-sm border border-white/20 transition-all"
        >
          <Package className="w-5 h-5" />
          Voir les produits
        </button>
      </PageHeader>

      {/* Option : Me rappeler dans X jours */}
      <div className="glass-card p-6 sm:p-8 shadow-xl border-white/60 border-l-4 border-l-amber-400">
        <h2 className="text-lg font-black text-slate-800 mb-2">Me rappeler dans…</h2>
        <p className="text-slate-600 text-sm mb-4">
          Choisissez un rappel automatique par SMS et email pour les produits en stock faible. Le serveur doit exécuter chaque jour : <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">python manage.py send_stock_reminders_if_due</code>
        </p>
        <form onSubmit={handleSaveReminderInterval} className="flex flex-wrap items-center gap-3">
          <select
            value={settings.reminder_interval_days ?? ''}
            onChange={(e) => setSettings({
              ...settings,
              reminder_interval_days: e.target.value === '' ? null : parseInt(e.target.value, 10),
            })}
            className="input-field w-full sm:w-56"
          >
            {REMINDER_OPTIONS.map((opt) => (
              <option key={String(opt.value)} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button type="submit" disabled={savingInterval} className="btn-primary">
            {savingInterval ? '...' : 'Enregistrer'}
          </button>
        </form>
        {nextReminderText() && (
          <p className="text-sm text-amber-800 mt-3 font-medium">{nextReminderText()}</p>
        )}
      </div>

      <div className="glass-card p-6 sm:p-8 shadow-xl border-white/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-800">Produits en stock faible</h2>
            <p className="text-slate-500 text-sm mt-1">
              {products.length} produit{products.length !== 1 ? 's' : ''} sous le seuil d'alerte. Les rappels seront envoyés à tous les responsables configurés (page Notifications Stock).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchProducts}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Actualiser
            </button>
            <button
              type="button"
              onClick={handleSendReminders}
              disabled={sending || products.length === 0}
              className="btn-primary flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              {sending ? 'Envoi…' : 'Envoyer les rappels'}
            </button>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600">Aucun produit en stock faible</p>
            <p className="text-slate-500 text-sm mt-1">Les produits dont la quantité est inférieure ou égale au seuil d'alerte apparaîtront ici.</p>
            <Link to="/stock-notifications" className="inline-block mt-4 text-primary-600 font-medium hover:underline">
              Configurer les responsables (SMS / email)
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="table-modern w-full">
              <thead>
                <tr>
                  <th className="table-header">Produit</th>
                  <th className="table-header">Catégorie</th>
                  <th className="table-header text-right">Quantité</th>
                  <th className="table-header text-right">Seuil d'alerte</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="table-cell font-medium text-slate-800">{p.name}</td>
                    <td className="table-cell text-slate-600">{p.category || '—'}</td>
                    <td className="table-cell text-right font-semibold text-amber-700">{p.quantity}</td>
                    <td className="table-cell text-right text-slate-600">{p.alert_threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockLowStockReminders;
