import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import ProspectForm from '../components/ProspectForm';
import { ArrowLeft, Phone, Clock, FileText, User, ShieldBan, ArrowRight, MessageCircle, BookOpen, Search, Edit } from 'lucide-react';

const STATUS_LABELS = {
  new: 'Nouveau',
  contacted: 'Contacté',
  converted: 'Converti',
  lost: 'Perdu',
};

const ProspectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { apiCall, showNotification, loading, fetchClients } = useApp();

  const [prospect, setProspect] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCallResultModal, setShowCallResultModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiCall(`/api/auth/prospects/${id}/`);
        if (!res.ok) {
          showNotification('Prospect introuvable', 'error');
          navigate('/prospects');
          return;
        }
        const data = await res.json();
        if (!cancelled) setProspect(data);
      } catch (e) {
        if (!cancelled) {
          console.error('Erreur chargement prospect:', e);
          showNotification('Erreur lors du chargement du prospect', 'error');
          navigate('/prospects');
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

  const handleConvert = async () => {
    if (!prospect) return;
    setActionLoading(true);
    try {
      const res = await apiCall(`/api/auth/prospects/${prospect.id}/convert_to_client/`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.error || 'Erreur lors de la conversion');
      showNotification('Prospect converti en client');
      fetchClients?.();
      navigate('/clients');
    } catch (e) {
      console.error('Erreur conversion:', e);
      showNotification(e.message || 'Erreur lors de la conversion en client', 'error');
    } finally {
      setActionLoading(false);
    };
  };

  const handleBlacklist = async () => {
    if (!prospect) return;
    setActionLoading(true);
    try {
      const res = await apiCall(`/api/auth/prospects/${prospect.id}/blacklist/`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.error || 'Erreur lors du blacklist');
      showNotification('Prospect blacklisté');
      fetchClients?.();
      navigate('/clients/blacklist');
    } catch (e) {
      console.error('Erreur blacklist:', e);
      showNotification(e.message || 'Erreur lors de la mise en blacklist', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCall = () => {
    const phone = prospect?.phone?.replace(/\s/g, '') || prospect?.email;
    if (phone && /^[0-9+]+$/.test(phone)) {
      window.location.href = `tel:${phone}`;
    } else {
      showNotification('Numéro de téléphone non disponible', 'warning');
    }
  };

  const handleSaveCallResult = async (status) => {
    if (!prospect) return;
    setActionLoading(true);
    try {
      const res = await apiCall(`/api/auth/prospects/${prospect.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour');
      setProspect((prev) => (prev ? { ...prev, status } : null));
      showNotification('Résultat d\'appel enregistré');
      setShowCallResultModal(false);
    } catch (e) {
      console.error('Erreur mise à jour statut:', e);
      showNotification(e.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemindLater = async () => {
    if (!prospect) return;
    setActionLoading(true);
    try {
      const res = await apiCall(`/api/auth/prospects/${prospect.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'contacted' }),
      });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour');
      setProspect((prev) => (prev ? { ...prev, status: 'contacted' } : null));
      showNotification('Prospect marqué pour rappel');
    } catch (e) {
      console.error('Erreur mise à jour statut:', e);
      showNotification(e.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendCatalog = () => {
    const email = prospect?.email;
    if (email) {
      const a = document.createElement('a');
      a.href = `mailto:${email}?subject=Catalogue produits`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      showNotification('Email du prospect non renseigné', 'warning');
    }
  };

  const handleQuoteRequest = () => {
    navigate(`/quotes/new?prospect=${prospect?.id}&client_name=${encodeURIComponent(prospect?.name || '')}&client_email=${encodeURIComponent(prospect?.email || '')}&client_phone=${encodeURIComponent(prospect?.phone || '')}`);
  };

  const handleSaveProspect = async (pid, formData) => {
    if (!prospect) return;
    setActionLoading(true);
    try {
      const res = await apiCall(`/api/auth/prospects/${pid}/`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.error || 'Erreur lors de la mise à jour');
      }
      const updated = await res.json();
      setProspect(updated);
      showNotification('Prospect mis à jour');
      setShowEditModal(false);
    } catch (e) {
      console.error('Erreur mise à jour prospect:', e);
      showNotification(e.message || 'Erreur lors de la mise à jour', 'error');
      throw e;
    } finally {
      setActionLoading(false);
    }
  };

  if (localLoading || (!prospect && (loading || localLoading))) {
    return <Loader />;
  }

  if (!prospect) {
    return null;
  }

  const statusLabel = STATUS_LABELS[prospect.status] || prospect.status || 'Nouveau';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-4">
        <Link
          to="/prospects"
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
                {prospect.name || 'Prospect'}
              </h1>
              <p className="text-sm text-primary-100">
                {prospect.phone || prospect.email || 'Contact non renseigné'}
              </p>
              <p className="text-xs text-primary-200 mt-0.5">
                Suivi et gestion du prospect
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15">
              Statut : <span className="uppercase tracking-wide">{statusLabel}</span>
            </span>
            {prospect.created_at && (
              <p className="text-xs text-primary-100">
                Créé le {new Date(prospect.created_at).toLocaleDateString('fr-FR')}
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
                onClick={handleCall}
                className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100"
              >
                <span className="inline-flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Appeler le prospect
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowCallResultModal(true)}
                className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl bg-sky-50 text-sky-700 text-sm font-medium hover:bg-sky-100"
              >
                <span className="inline-flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Résultat d&apos;appel
                </span>
              </button>
              <button
                type="button"
                onClick={handleRemindLater}
                disabled={actionLoading}
                className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Rappeler plus tard
                </span>
              </button>
              <button
                type="button"
                onClick={handleSendCatalog}
                className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100"
              >
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Envoyer le catalogue
                </span>
              </button>
              <button
                type="button"
                onClick={handleQuoteRequest}
                className="w-full inline-flex items-center justify-between px-4 py-3 rounded-xl bg-cyan-50 text-cyan-700 text-sm font-medium hover:bg-cyan-100"
              >
                <span className="inline-flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Demande de devis
                </span>
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Rechercher"
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Gestion du prospect */}
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Gestion du prospect
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-60"
              >
                <Edit className="w-4 h-4" />
                Modification
              </button>
              <button
                type="button"
                onClick={handleConvert}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60"
              >
                <ArrowRight className="w-4 h-4" />
                Convertir en client
              </button>
              <button
                type="button"
                onClick={handleBlacklist}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
              >
                <ShieldBan className="w-4 h-4" />
                Blacklister
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-slate-600 mb-3">
                  Informations prospect
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Nom</dt>
                    <dd className="font-medium text-slate-800">{prospect.name || '-'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Entreprise</dt>
                    <dd className="font-medium text-slate-800">{prospect.company || '-'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Email</dt>
                    <dd className="font-medium text-slate-800">{prospect.email || '-'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Téléphone</dt>
                    <dd className="font-medium text-slate-800">{prospect.phone || '-'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Observation</dt>
                    <dd className="font-medium text-slate-800 max-w-xs text-right">{prospect.observation || '-'}</dd>
                  </div>
                </dl>
              </div>
              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-slate-600 mb-3">Suivi</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Type</dt>
                    <dd className="font-medium text-slate-800">Prospect</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Statut</dt>
                    <dd className="font-medium text-slate-800">{statusLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Créé le</dt>
                    <dd className="font-medium text-slate-800">
                      {prospect.created_at
                        ? new Date(prospect.created_at).toLocaleString('fr-FR')
                        : '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Mis à jour le</dt>
                    <dd className="font-medium text-slate-800">
                      {prospect.updated_at
                        ? new Date(prospect.updated_at).toLocaleString('fr-FR')
                        : '-'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showCallResultModal}
        onClose={() => setShowCallResultModal(false)}
        title="Résultat d'appel"
        size="sm"
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-600">
            Sélectionnez le statut du prospect après l&apos;appel :
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['new', 'contacted', 'converted', 'lost']).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSaveCallResult(s)}
                disabled={actionLoading || prospect?.status === s}
                className="px-4 py-3 rounded-xl text-sm font-medium bg-slate-100 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed text-slate-800"
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowCallResultModal(false)}
            className="w-full mt-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-200 hover:bg-slate-300 text-slate-700"
          >
            Annuler
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier le prospect"
        size="md"
      >
        <ProspectForm
          prospect={prospect}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProspect}
        />
      </Modal>
    </div>
  );
};

export default ProspectDetail;

