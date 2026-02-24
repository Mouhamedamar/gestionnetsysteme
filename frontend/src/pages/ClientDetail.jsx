import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Loader from '../components/Loader';
import { ArrowLeft, Phone, Clock, FileText, User, ShieldBan, CheckCircle2 } from 'lucide-react';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    apiCall,
    showNotification,
    loading,
    updateClient,
    fetchClients,
    invoices = [],
    quotes = [],
  } = useApp();

  const [client, setClient] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiCall(`/api/auth/clients/${id}/`);
        if (!res.ok) {
          showNotification('Client introuvable', 'error');
          navigate('/clients');
          return;
        }
        const data = await res.json();
        if (!cancelled) setClient(data);
      } catch (e) {
        if (!cancelled) {
          console.error('Erreur chargement client:', e);
          showNotification('Erreur lors du chargement du client', 'error');
          navigate('/clients');
        }
      } finally {
        if (!cancelled) setLocalLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, apiCall, showNotification, navigate]);

  const handleBlacklist = async () => {
    if (!client) return;
    setActionLoading(true);
    try {
      const res = await apiCall(`/api/auth/clients/${client.id}/blacklist/`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.error || 'Erreur lors de la mise en blacklist');
      setClient(data);
      showNotification('Client blacklisté');
      fetchClients?.();
    } catch (e) {
      console.error('Erreur blacklist client:', e);
      showNotification(e.message || 'Erreur lors de la mise en blacklist', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblacklist = async () => {
    if (!client) return;
    setActionLoading(true);
    try {
      const updated = await updateClient(client.id, {
        name: client.name,
        first_name: client.first_name,
        last_name: client.last_name,
        phone: client.phone,
        email: client.email,
        address: client.address,
        company: client.company,
        client_type: client.client_type,
        observation: client.observation,
        is_blacklisted: false,
      });
      setClient(updated);
      fetchClients?.();
      showNotification('Client retiré de la blacklist');
    } catch (e) {
      console.error('Erreur unblacklist client:', e);
      showNotification(e.message || 'Erreur lors du retrait de la blacklist', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const relatedInvoices = useMemo(
    () =>
      invoices.filter(
        (inv) =>
          inv.client === Number(id) ||
          inv.client_id === Number(id) ||
          (client && inv.client_name && inv.client_name === client.name),
      ),
    [invoices, client, id],
  );

  const relatedQuotes = useMemo(
    () =>
      quotes.filter(
        (q) =>
          q.client === Number(id) ||
          q.client_id === Number(id) ||
          (client && q.client_name && q.client_name === client.name),
      ),
    [quotes, client, id],
  );

  const invoicesSummary = useMemo(() => {
    let total = 0;
    for (const inv of relatedInvoices) {
      const t = Number(inv.total_ttc || inv.total_ht || 0);
      if (!Number.isNaN(t)) total += t;
    }
    return { count: relatedInvoices.length, total };
  }, [relatedInvoices]);

  if (localLoading || (!client && (loading || localLoading))) {
    return <Loader />;
  }

  if (!client) {
    return null;
  }

  const headerStatus = client.is_blacklisted ? 'Blacklisté' : 'Client actif';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-4">
        <Link
          to="/clients"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-white shadow-sm hover:shadow-md text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </Link>
      </div>

      {/* Bandeau principal */}
      <div className="glass-card overflow-hidden shadow-xl border-white/60">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {client.name || 'Client'}
              </h1>
              <p className="text-sm text-primary-100">
                {client.phone || client.email || 'Contact non renseigné'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15">
              Statut :{' '}
              <span className="uppercase tracking-wide">
                {headerStatus}
              </span>
            </span>
            {client.created_at && (
              <p className="text-xs text-primary-100">
                Client depuis le {new Date(client.created_at).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actions rapides */}
          <div className="space-y-4 lg:col-span-1">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Actions rapides
            </h2>
            <div className="space-y-3">
              <button
                type="button"
                className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100"
              >
                <span className="inline-flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Appeler le client
                </span>
              </button>
              <button
                type="button"
                className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl bg-sky-50 text-sky-700 text-sm font-medium hover:bg-sky-100"
              >
                <span className="inline-flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Résultat d&apos;appel
                </span>
              </button>
              <button
                type="button"
                className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100"
              >
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Rappeler plus tard
                </span>
              </button>
            </div>
          </div>

          {/* Gestion du client + résumé activité */}
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Gestion du client
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {!client.is_blacklisted ? (
                <button
                  type="button"
                  onClick={handleBlacklist}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  <ShieldBan className="w-4 h-4" />
                  Blacklister
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleUnblacklist}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Retirer de la blacklist
                </button>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-slate-600 mb-3">
                  Informations client
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Nom</dt>
                    <dd className="font-medium text-slate-800">{client.name || '-'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Entreprise</dt>
                    <dd className="font-medium text-slate-800">{client.company || '-'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Email</dt>
                    <dd className="font-medium text-slate-800">{client.email || '-'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Téléphone</dt>
                    <dd className="font-medium text-slate-800">{client.phone || '-'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Adresse</dt>
                    <dd className="font-medium text-slate-800 max-w-xs text-right">
                      {client.address || '-'}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-slate-600 mb-3">
                  Activité commerciale
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Nombre de factures</dt>
                    <dd className="font-medium text-slate-800">
                      {invoicesSummary.count}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Montant total facturé</dt>
                    <dd className="font-medium text-slate-800">
                      {invoicesSummary.total.toLocaleString('fr-FR')} F CFA
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Dernier devis</dt>
                    <dd className="font-medium text-slate-800">
                      {relatedQuotes.length && relatedQuotes[0].date
                        ? new Date(relatedQuotes[0].date).toLocaleDateString('fr-FR')
                        : '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Observation</dt>
                    <dd className="font-medium text-slate-800 max-w-xs text-right">
                      {client.observation || '-'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;

