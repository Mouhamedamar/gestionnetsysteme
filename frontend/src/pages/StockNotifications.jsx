import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MessageSquare, ArrowLeft, Plus, Trash2, Send, Save, Search, AlertCircle, User, Phone, Mail, Settings2, Bell, Pencil, X } from 'lucide-react';
import Loader from '../components/Loader';
import ConfirmationModal from '../components/ConfirmationModal';
import PageHeader from '../components/PageHeader';
import { USE_API } from '../config';

const StockNotifications = () => {
  const navigate = useNavigate();
  const { apiCall, showNotification, loading: ctxLoading } = useApp();
  const [recipients, setRecipients] = useState([]);
  const [settings, setSettings] = useState({
    alert_threshold: 10,
    reminder_interval_days: null,
    last_reminder_sent_at: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', email: '' });
  const [savingEdit, setSavingEdit] = useState(false);

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
        setSettings({
          alert_threshold: data.alert_threshold ?? 10,
          reminder_interval_days: data.reminder_interval_days ?? null,
          last_reminder_sent_at: data.last_reminder_sent_at ?? null,
        });
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
    if (!formData.name?.trim()) {
      showNotification('Nom requis', 'error');
      return;
    }
    const phone = (formData.phone || '').trim();
    const email = (formData.email || '').trim();
    if (!phone && !email) {
      showNotification('Indiquez au moins un numéro de téléphone ou une adresse email', 'error');
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
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: phone || '',
          email: email || '',
          is_active: true
        })
      });
      if (response.ok) {
        showNotification('Responsable ajouté');
        setFormData({ name: '', phone: '', email: '' });
        await fetchRecipients();
      } else {
        const err = await response.json().catch(() => ({}));
        showNotification(err.detail || err.phone?.[0] || err.email?.[0] || 'Erreur', 'error');
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
        setEditingRecipient(null);
        await fetchRecipients();
      }
    } catch (e) {
      showNotification(e.message || 'Erreur', 'error');
    }
  };

  const startEditRecipient = (r) => {
    setEditingRecipient(r);
    setEditFormData({
      name: r.name || '',
      phone: r.phone || '',
      email: r.email || ''
    });
  };

  const cancelEditRecipient = () => {
    setEditingRecipient(null);
    setEditFormData({ name: '', phone: '', email: '' });
  };

  const handleUpdateRecipient = async (e) => {
    e.preventDefault();
    if (!editingRecipient || !USE_API) return;
    const name = (editFormData.name || '').trim();
    if (!name) {
      showNotification('Nom requis', 'error');
      return;
    }
    const phone = (editFormData.phone || '').trim();
    const email = (editFormData.email || '').trim();
    if (!phone && !email) {
      showNotification('Indiquez au moins un téléphone ou un email', 'error');
      return;
    }
    setSavingEdit(true);
    try {
      const response = await apiCall(`/api/stock-notification-recipients/${editingRecipient.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          phone: phone || '',
          email: email || '',
          is_active: editingRecipient.is_active !== false
        })
      });
      if (response.ok) {
        showNotification('Responsable modifié');
        setEditingRecipient(null);
        setEditFormData({ name: '', phone: '', email: '' });
        await fetchRecipients();
      } else {
        const err = await response.json().catch(() => ({}));
        showNotification(err.detail || err.phone?.[0] || err.email?.[0] || 'Erreur', 'error');
      }
    } catch (e) {
      showNotification(e.message || 'Erreur', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSendTestSms = async (id) => {
    if (!USE_API) return;
    setSendingTest(`sms-${id}`);
    try {
      const response = await apiCall(`/api/stock-notification-recipients/${id}/send_test_sms/`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      showNotification(data.status || data.error || 'SMS envoyé');
    } catch (e) {
      showNotification(e.message || 'Erreur', 'error');
    } finally {
      setSendingTest(null);
    }
  };

  const handleSendTestEmail = async (id) => {
    if (!USE_API) return;
    setSendingTest(`email-${id}`);
    try {
      const response = await apiCall(`/api/stock-notification-recipients/${id}/send_test_email/`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        showNotification(data.status || 'Email envoyé');
      } else {
        showNotification(data.error || 'Erreur envoi email', 'error');
      }
    } catch (e) {
      showNotification(e.message || 'Erreur', 'error');
    } finally {
      setSendingTest(null);
    }
  };

  const handleSaveReminderInterval = async (e) => {
    e.preventDefault();
    if (!USE_API) return;
    setSaving(true);
    try {
      const val = settings.reminder_interval_days === '' || settings.reminder_interval_days == null
        ? null
        : parseInt(settings.reminder_interval_days, 10) || 1;
      const response = await apiCall('/api/stock-alert-settings/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminder_interval_days: val })
      });
      if (response.ok) {
        showNotification(val ? `Rappel automatique : tous les ${val} jour(s)` : 'Rappel automatique désactivé');
        fetchSettings();
      } else {
        const err = await response.json().catch(() => ({}));
        showNotification(err.reminder_interval_days?.[0] || err.detail || 'Erreur', 'error');
      }
    } catch (e) {
      showNotification(e.message || 'Erreur', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveThreshold = async (e) => {
    e.preventDefault();
    if (!USE_API) return;
    setSaving(true);
    try {
      const response = await apiCall('/api/stock-alert-settings/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
      r.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (ctxLoading || loading) return <Loader />;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader
        title="Notifications Stock (SMS & Email)"
        subtitle="Alertes en temps réel par SMS et email pour les entrées et sorties de stock"
        badge="Configuration"
        icon={MessageSquare}
      >
        <button
          onClick={() => navigate('/stock-reminders')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-white font-semibold backdrop-blur-sm border border-amber-400/50 transition-all"
        >
          <AlertCircle className="w-5 h-5" />
          Rappels stock faible
        </button>
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
                <h2 className="text-xl font-black text-slate-800">Responsables à notifier (SMS et/ou email)</h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  Ajoutez les contacts qui recevront les alertes à chaque mouvement (téléphone et/ou email)
                </p>
              </div>
            </div>

            <form onSubmit={handleAddRecipient} className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-6 p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 shadow-inner">
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Nom</label>
                <input
                  type="text"
                  placeholder="Ex: Amadou Diallo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field w-full focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Téléphone</label>
                <input
                  type="text"
                  placeholder="771234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field w-full focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="contact@exemple.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field w-full focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                />
              </div>
              <div className="sm:col-span-2 flex items-end">
                <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto px-6 py-3 flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-shadow">
                  <Plus className="w-5 h-5" />
                  {saving ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
            <p className="text-xs text-slate-500 mb-6 pl-1">Au moins un : téléphone (771234567 ou +221771234567) ou email</p>

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
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">Ajoutez un contact (téléphone et/ou email) pour recevoir les alertes en temps réel.</p>
                </div>
              ) : (
                <ul className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {filteredRecipients.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-col gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 group"
                    >
                      {editingRecipient?.id === r.id ? (
                        <form onSubmit={handleUpdateRecipient} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-4">
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Nom</label>
                            <input
                              type="text"
                              value={editFormData.name}
                              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                              className="input-field w-full text-sm"
                              placeholder="Nom"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Téléphone</label>
                            <input
                              type="text"
                              value={editFormData.phone}
                              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                              className="input-field w-full text-sm"
                              placeholder="771234567"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Email</label>
                            <input
                              type="email"
                              value={editFormData.email}
                              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                              className="input-field w-full text-sm"
                              placeholder="email@exemple.com"
                            />
                          </div>
                          <div className="sm:col-span-2 flex items-end gap-2">
                            <button type="submit" disabled={savingEdit} className="px-3 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 font-semibold text-sm flex items-center gap-1.5 disabled:opacity-60">
                              <Save className="w-4 h-4" />
                              {savingEdit ? '...' : 'Enregistrer'}
                            </button>
                            <button type="button" onClick={cancelEditRecipient} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl" title="Annuler">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-4 min-w-0">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-md shadow-primary-500/25">
                                {(r.name || '?').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 truncate">{r.name}</p>
                                {r.phone && <p className="text-sm text-slate-500 font-mono">{r.phone}</p>}
                                {r.email && <p className="text-sm text-slate-500 truncate">{r.email}</p>}
                                {!r.phone && !r.email && <p className="text-sm text-slate-400">—</p>}
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => startEditRecipient(r)}
                                className="px-3 py-2.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-sm flex items-center gap-1.5 transition-colors"
                                title="Modifier"
                              >
                                <Pencil className="w-4 h-4" />
                                Modifier
                              </button>
                              {r.phone && (
                                <button
                                  onClick={() => handleSendTestSms(r.id)}
                                  disabled={sendingTest === `sms-${r.id}`}
                                  className="px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-sm flex items-center gap-1.5 transition-colors disabled:opacity-60"
                                  title="Test SMS"
                                >
                                  <Send className="w-4 h-4" />
                                  {sendingTest === `sms-${r.id}` ? '...' : 'SMS'}
                                </button>
                              )}
                              {r.email && (
                                <button
                                  onClick={() => handleSendTestEmail(r.id)}
                                  disabled={sendingTest === `email-${r.id}`}
                                  className="px-3 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-sm flex items-center gap-1.5 transition-colors disabled:opacity-60"
                                  title="Test email"
                                >
                                  <Mail className="w-4 h-4" />
                                  {sendingTest === `email-${r.id}` ? '...' : 'Email'}
                                </button>
                              )}
                              <button
                                onClick={() => setDeleteTarget(r)}
                                className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                title="Supprimer"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
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
                <h3 className="text-lg font-black text-slate-800">Types d&apos;alertes (SMS et email)</h3>
                <p className="text-slate-500 text-sm">Aperçu des messages envoyés</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="relative pl-4">
                <div className="absolute left-0 top-2 w-2 h-2 rounded-full bg-emerald-500" />
                <div className="p-4 rounded-2xl rounded-tl-md bg-emerald-50/80 border border-emerald-100/80 shadow-sm">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Entrée de stock (SMS + email)</p>
                  <p className="text-sm text-slate-700 font-mono leading-relaxed">ENTREE DE STOCK<br />Article: [Produit]<br />Qté: [X] | Stock: [Y]</p>
                </div>
              </div>
              <div className="relative pl-4">
                <div className="absolute left-0 top-2 w-2 h-2 rounded-full bg-rose-500" />
                <div className="p-4 rounded-2xl rounded-tl-md bg-rose-50/80 border border-rose-100/80 shadow-sm">
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">Sortie de stock (SMS + email)</p>
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

          <div className="glass-card p-8 shadow-xl border-white/60">
            <h3 className="text-lg font-black text-slate-800 mb-2">Rappel automatique (stock faible)</h3>
            <p className="text-sm text-slate-600 mb-4">
              Me rappeler par SMS et email tous les X jours pour les produits en stock faible. Exécutez un cron quotidien : <span className="font-mono text-xs bg-slate-100 px-1 rounded">python manage.py send_stock_reminders_if_due</span>
            </p>
            <form onSubmit={handleSaveReminderInterval} className="flex flex-col sm:flex-row gap-3">
              <select
                value={settings.reminder_interval_days ?? ''}
                onChange={(e) => setSettings({
                  ...settings,
                  reminder_interval_days: e.target.value === '' ? null : parseInt(e.target.value, 10)
                })}
                className="input-field w-full sm:w-48"
              >
                <option value="">Désactivé</option>
                <option value="1">Tous les 1 jour</option>
                <option value="2">Tous les 2 jours</option>
                <option value="3">Tous les 3 jours</option>
                <option value="7">Tous les 7 jours</option>
              </select>
              <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30">
                <Save className="w-4 h-4" />
                {saving ? '...' : 'Enregistrer'}
              </button>
            </form>
            {settings.last_reminder_sent_at && (
              <p className="text-xs text-slate-500 mt-3">
                Dernier rappel envoyé : {new Date(settings.last_reminder_sent_at).toLocaleString('fr-FR')}
              </p>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 shadow-lg">
            <div className="flex gap-4">
              <AlertCircle className="w-7 h-7 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-slate-700 space-y-2">
                <p className="font-bold text-amber-800">À savoir</p>
                <ul className="space-y-2 text-slate-600 leading-relaxed">
                  <li>SMS et emails automatiques à chaque entrée ou sortie</li>
                  <li>Indiquez au moins un téléphone ou une adresse email</li>
                  <li>Utilisez « SMS » et « Email » pour tester</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Configuration</p>
            <p className="text-sm text-slate-600 leading-relaxed mb-2">
              <strong>Email :</strong> Par défaut les emails ne partent pas en boîte mail — ils s&apos;affichent dans le <strong>terminal Django</strong> (runserver). Pour les recevoir vraiment, configurez SMTP dans le fichier <span className="font-mono text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">.env</span> : <span className="font-mono text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend</span>, <span className="font-mono text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">EMAIL_HOST</span>, <span className="font-mono text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">EMAIL_HOST_USER</span>, <span className="font-mono text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">EMAIL_HOST_PASSWORD</span> (voir <span className="font-mono text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">.env.example</span>).
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong>SMS Orange :</strong> <span className="font-mono text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">ORANGE_CLIENT_ID</span>, <span className="font-mono text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">ORANGE_CLIENT_SECRET</span>, <span className="font-mono text-xs bg-slate-200/80 px-1.5 py-0.5 rounded">ORANGE_SENDER_NAME</span>.
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
