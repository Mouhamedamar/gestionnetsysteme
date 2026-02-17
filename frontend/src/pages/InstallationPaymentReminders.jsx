import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import {
  Bell,
  Send,
  RefreshCw,
  TestTube,
  Search,
  CheckCircle2,
  Clock,
  ArrowLeft
} from 'lucide-react';

const InstallationPaymentReminders = () => {
  const navigate = useNavigate();
  const { apiCall, showNotification } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/installations/payment-reminders/');
      if (response.ok) {
        const json = await response.json();
        setData(json);
      } else {
        throw new Error('Erreur lors du chargement');
      }
    } catch (e) {
      showNotification(e.message || 'Erreur lors du chargement des rappels', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleRefresh = () => {
    fetchReminders();
  };

  const handleTestDryRun = async () => {
    try {
      setDryRun(true);
      setSending(true);
      const response = await apiCall('/api/installations/payment-reminders/send/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: true })
      });
      if (!response.ok) throw new Error('Erreur test');
      const result = await response.json();
      showNotification(`Test OK: ${result.sent} rappel(s) auraient été envoyés`, 'success');
    } catch (e) {
      showNotification(e.message || 'Erreur test', 'error');
    } finally {
      setDryRun(false);
      setSending(false);
    }
  };

  const handleSendReminders = async () => {
    const pending = (data?.reminders || []).filter(r => r.status === 'pending');
    const toSend = selectedIds.size > 0
      ? pending.filter(r => selectedIds.has(r.installation_id))
      : pending;

    if (toSend.length === 0) {
      showNotification('Aucun rappel sélectionné ou à envoyer', 'warning');
      return;
    }
    try {
      setSending(true);
      const installationIds = toSend.map(r => r.installation_id);
      const response = await apiCall('/api/installations/payment-reminders/send/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installation_ids: installationIds, dry_run: false })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur envoi');
      }
      const result = await response.json();
      showNotification(`${result.sent} rappel(s) envoyé(s)`, 'success');
      if (result.errors?.length) {
        showNotification(result.errors.join(', '), 'warning');
      }
      setSelectedIds(new Set());
      fetchReminders();
    } catch (e) {
      showNotification(e.message || 'Erreur lors de l\'envoi des rappels', 'error');
    } finally {
      setSending(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pending = (data?.reminders || []).filter(r => r.status === 'pending');
    if (selectedIds.size >= pending.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pending.map(r => r.installation_id)));
    }
  };

  const reminders = data?.reminders || [];
  const filteredReminders = searchTerm.trim()
    ? reminders.filter(r =>
        (r.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.client_phone || '').includes(searchTerm) ||
        (r.installation_number || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : reminders;
  const pendingCount = reminders.filter(r => r.status === 'pending').length;

  if (loading && !data) {
    return (
      <div className="p-8">
        <div className="glass-card p-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded mb-4" />
          <div className="h-6 bg-slate-200 rounded mb-2 w-3/4" />
          <div className="h-6 bg-slate-200 rounded mb-2 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader
        title="Rappels de paiement automatiques"
        subtitle="Envoyez des SMS aux clients pour les reliquats des installations"
        badge="Installations"
        icon={Bell}
      >
        <button
          onClick={() => navigate('/installations')}
          className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold flex items-center gap-2 backdrop-blur-sm border border-white/20 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold flex items-center gap-2 backdrop-blur-sm border border-white/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
        <button
          onClick={handleTestDryRun}
          disabled={sending || pendingCount === 0}
          className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold flex items-center gap-2 backdrop-blur-sm border border-white/20 transition-all disabled:opacity-50"
        >
          <TestTube className="w-5 h-5" />
          Test (Dry Run)
        </button>
        <button
          onClick={handleSendReminders}
          disabled={sending || pendingCount === 0}
          className="px-6 py-2.5 rounded-xl bg-white text-primary-600 font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
          Envoyer les rappels
        </button>
      </PageHeader>

      {/* Cartes résumé */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 shadow-xl border-white/60 text-center">
          <p className="text-slate-600 text-sm font-bold mb-1">J-5</p>
          <p className="text-2xl font-black text-amber-600">{(data?.count_j5 ?? 0)}</p>
          <p className="text-slate-500 text-xs mt-1">rappel(s) à envoyer</p>
        </div>
        <div className="glass-card p-6 shadow-xl border-white/60 text-center">
          <p className="text-slate-600 text-sm font-bold mb-1">J-2</p>
          <p className="text-2xl font-black text-blue-600">{(data?.count_j2 ?? 0)}</p>
          <p className="text-slate-500 text-xs mt-1">rappel(s) à envoyer</p>
        </div>
        <div className="glass-card p-6 shadow-xl border-white/60 text-center">
          <p className="text-slate-600 text-sm font-bold mb-1">Jour J</p>
          <p className="text-2xl font-black text-emerald-600">{(data?.count_j0 ?? 0)}</p>
          <p className="text-slate-500 text-xs mt-1">rappel(s) à envoyer</p>
        </div>
        <div className="glass-card p-6 shadow-xl border-white/60 text-center">
          <p className="text-slate-600 text-sm font-bold mb-1">Aujourd'hui</p>
          <p className="text-2xl font-black text-primary-600">{(data?.count_sent_today ?? 0)}</p>
          <p className="text-slate-500 text-xs mt-1">rappel(s) envoyé(s)</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="glass-card p-0 shadow-xl border-white/60 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">Rappels de paiement</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher client, téléphone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-64"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-primary-600/10">
                <th className="table-header w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === reminders.filter(r => r.status === 'pending').length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="table-header text-left">Client</th>
                <th className="table-header text-left">Téléphone</th>
                <th className="table-header text-left">Paiement</th>
                <th className="table-header text-center">Date échéance</th>
                <th className="table-header text-right">Montant</th>
                <th className="table-header text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReminders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    Aucun rappel à afficher. Les installations avec un reliquat et une date d'échéance (J-5, J-2, Jour J) apparaîtront ici.
                  </td>
                </tr>
              ) : (
                filteredReminders.map((r) => (
                  <tr key={`${r.installation_id}-${r.due_date}`} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      {r.status === 'pending' && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(r.installation_id)}
                          onChange={() => toggleSelect(r.installation_id)}
                          className="rounded border-slate-300"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.client_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{r.client_phone || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{r.tranche_label || 'Reliquat'}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{r.due_date_str || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{r.amount_str || 0} F</td>
                    <td className="px-4 py-3 text-center">
                      {r.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          Envoyé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                          <Clock className="w-4 h-4" />
                          À envoyer
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InstallationPaymentReminders;
