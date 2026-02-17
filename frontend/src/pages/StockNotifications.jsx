import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MessageSquare, ArrowLeft, Plus, Trash2, Send, Save, Search, AlertCircle, User, Phone, Settings2, Bell } from 'lucide-react';
import Loader from '../components/Loader';
import ConfirmationModal from '../components/ConfirmationModal';
import PageHeader from '../components/PageHeader';
import { USE_API } from '../config';

const StockNotifications = () => {
  const navigate = useNavigate();
  const { apiCall, showNotification, loading: ctxLoading } = useApp();
  const [recipients, setRecipients] = useState([]);
  const [settings, setSettings] = useState({ alert_threshold: 10 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchRecipients = useCallback(async () => {
    if (!USE_API) {
      setRecipients([]);
      return;
    }
    try {
      const response = await apiCall('/api/stock-notification-recipients/');
      if (response.ok) {
        const data = await response.json();
        setRecipients(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (e) {
      console.error('Erreur fetch recipients:', e);
      setRecipients([]);
    }
  }, [apiCall]);

  const fetchSettings = useCallback(async () => {
    if (!USE_API) return;
    try {
      const response = await apiCall('/api/stock-alert-settings/');
      if (response.ok) {
        const data = await response.json();
        setSettings({ alert_threshold: data.alert_threshold ?? 10 });
      }
    } catch (e) {
      console.error('Erreur fetch settings:', e);
    }
  }, [apiCall]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchRecipients(), fetchSettings()]);
      setLoading(false);
    };
    load();
  }, [fetchRecipients, fetchSettings]);

  const handleAddRecipient = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.phone?.trim()) {
      showNotification('Nom et numéro requis', 'error');
      return;
    }
    if (!USE_API) {
      showNotification('API désactivée', 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await apiCall('/api/stock-notification-recipients/', {
        method: 'POST',
        body: JSON.stringify({ name: formData.name.trim(), phone: formData.phone.trim(), is_active: true })
      });
      if (response.ok) {
        showNotification('Responsable ajouté');
        setFormData({ name: '', phone: '' });
        await fetchRecipients();
      } else {
        const err = await response.json().catch(() => ({}));
        showNotification(err.detail || err.phone?.[0] || 'Erreur', 'error');
      }
    } catch (e) {
      showNotification(e.message || 'Erreur', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecipient = async (id) => {
    if (!USE_API) return;
    try {
      const response = await apiCall(`/api/stock-notification-recipients/${id}/`, { method: 'DELETE' });
      if (response.ok) {
        showNotification('Responsable supprimé');
        setDeleteTarget(null);
        await fetchRecipients();
      }
    } catch (e) {
      showNotification(e.message || 'Erreur', 'error');
    }
  };

  const handleSendTestSms = async (id) => {
    if (!USE_API) return;
    setSendingTest(id);
    try {
      const response = await apiCall(`/api/stock-notification-recipients/${id}/send_test_sms/`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      showNotification(data.status || 'SMS envoyé');
    } catch (e) {
      showNotification(e.message || 'Erreur', 'error');
    } finally {
      setSendingTest(null);
    }
  };

  const handleSaveThreshold = async (e) => {
    e.preventDefault();
    if (!USE_API) return;
    setSaving(true);
    try {
      const response = await apiCall('/api/stock-alert-settings/', {
        method: 'PATCH',
        body: JSON.stringify({ alert_threshold: parseInt(settings.alert_threshold, 10) || 10 })
      });
      if (response.ok) {
        showNotification('Seuil enregistré');
        await fetchSettings();
      }
    } catch (e) {
      showNotification(e.message || 'Erreur', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredRecipients = recipients.filter(
    r =>
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (ctxLoading || loading) return <Loader />;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader
        title="Configuration SMS Stock"
        subtitle="Notifications en temps réel pour les entrées et sorties de stock"
        badge="Configuration"
        icon={MessageSquare}
      >
        <button
          onClick={() => navigate('/stock-movements')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold backdrop-blur-sm border border-white/20 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux mouvements
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Responsables à notifier */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8 shadow-xl border-white/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-500 to-primary-600 rounded-l-2xl" />
            <div className="flex items-center gap-4 mb-6 pl-2">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">Responsables à notifier par SMS</h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  Ajoutez les numéros qui recevront les alertes à chaque mouvement
                </p>
              </div>
            </div>

            <form onSubmit={handleAddRecipient} className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-6 p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 shadow-inner">
              <div className="sm:col-span-5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Nom</label>
                <input
                  type="text"
                  placeholder="Ex: Amadou Diallo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field w-full focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Téléphone</label>
                <input
                  type="text"
                  placeholder="771234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field w-full focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                />
              </div>
              <div className="sm:col-span-3 flex items-end">
                <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto px-6 py-3 flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-shadow">
                  <Plus className="w-5 h-5" />
                  {saving ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
            <p className="text-xs text-slate-500 mb-6 pl-1">Formats : 771234567 ou +221771234567</p>

            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                  Liste ({filteredRecipients.length})
                </h3>
                <div className="relative w-44">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-9 py-2 text-sm w-full rounded-xl"
                  />
                </div>
              </div>
              {filteredRecipients.length === 0 ? (
                <div className="py-16 px-6 text-center bg-gradient-to-b from-slate-50/80 to-white rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Phone className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="font-bold text-slate-700 mb-1 text-lg">Aucun responsable</p>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">Ajoutez un numéro pour recevoir les alertes SMS en temps réel.</p>
                </div>
              ) : (
                <ul className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {filteredRecipients.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-md shadow-primary-500/25">
                          {(r.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{r.name}</p>
                          <p className="text-sm text-slate-500 font-mono">{r.phone}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleSendTestSms(r.id)}
                          disabled={sendingTest === r.id}
                          className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-60"
                        >
                          <Send className="w-4 h-4" />
                          {sendingTest === r.id ? 'Envoi...' : 'Test'}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Exemples de messages SMS - Style bulles téléphone */}
          <div className="glass-card p-8 shadow-xl border-white/60">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25">
                <Bell className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Types d&apos;alertes SMS</h3>
                <p className="text-slate-500 text-sm">Aperçu des messages envoyés</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="relative pl-4">
                <div className="absolute left-0 top-2 w-2 h-2 rounded-full bg-emerald-500" />
                <div className="p-4 rounded-2xl rounded-tl-md bg-emerald-50/80 border border-emerald-100/80 shadow-sm">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Entrée de stock</p>
                  <p className="text-sm text-slate-700 font-mono leading-relaxed">ENTREE DE STOCK<br />Article: [Produit]<br />Qté: [X] | Stock: [Y]</p>
                </div>
              </div>
              <div className="relative pl-4">
                <div className="absolute left-0 top-2 w-2 h-2 rounded-full bg-rose-500" />
                <div className="p-4 rounded-2xl rounded-tl-md bg-rose-50/80 border border-rose-100/80 shadow-sm">
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">Sortie de stock</p>
                  <p className="text-sm text-slate-700 font-mono leading-relaxed">SORTIE DE STOCK<br />Article: [Produit]<br />Qté: [X] | Reste: [Y]</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          <div className="glass-card p-8 shadow-xl border-white/60">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/25">
                <Settings2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-800">Statistiques</h3>
            </div>
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-50/50 border border-primary-100">
                <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">Responsables</p>
                <p className="text-4xl font-black text-primary-600">{recipients.filter((r) => r.is_active !== false).length}</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Seuil alerte</p>
                <p className="text-4xl font-black text-slate-800">{settings.alert_threshold}</p>
                <p className="text-xs text-slate-500 mt-1">unités</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 shadow-xl border-white/60">
            <h3 className="text-lg font-black text-slate-800 mb-2">Seuil d&apos;alerte</h3>
            <p className="text-sm text-slate-600 mb-4">
              Quantité minimale avant alerte (optionnel)
            </p>
            <form onSubmit={handleSaveThreshold} className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                min="0"
                value={settings.alert_threshold}
                onChange={(e) => setSettings({ ...settings, alert_threshold: e.target.value })}
                className="input-field w-full sm:w-28 text-center text-xl font-black"
              />
              <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30">
                <Save className="w-4 h-4" />
                {saving ? '...' : 'Enregistrer'}
              </button>
            </form>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 shadow-lg">
            <div className="flex gap-4">
              <AlertCircle className="w-7 h-7 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-slate-700 space-y-2">
                <p className="font-bold text-amber-800">À savoir</p>
                <ul className="space-y-2 text-slate-600 leading-relaxed">
                  <li>SMS automatiques à chaque entrée ou sortie</li>
                  <li>Vérifiez régulièrement les numéros</li>
                  <li>Utilisez « Test » pour valider</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Configuration API Orange</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              NETSYSTEME : <span className="font-mono text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">ORANGE_CLIENT_ID</span>, <span className="font-mono text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">ORANGE_CLIENT_SECRET</span>, <span className="font-mono text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">ORANGE_SENDER_NAME</span>. SSE : <span className="font-mono text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">ORANGE_CLIENT_ID_SSE</span>, <span className="font-mono text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">ORANGE_CLIENT_SECRET_SSE</span>, <span className="font-mono text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">ORANGE_SENDER_NAME_SSE</span>.
            </p>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDeleteRecipient(deleteTarget.id)}
        title="Supprimer le responsable"
        message={deleteTarget ? `Supprimer "${deleteTarget.name}" ?` : ''}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};

export default StockNotifications;
