import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Loader from '../components/Loader';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ProspectForm from '../components/ProspectForm';
import { UserPlus, Users, Search, Upload, Eye, Edit, ArrowRight, CheckCircle2 } from 'lucide-react';

const STATUS_LABELS = {
  new: 'Nouveau',
  contacted: 'Contacté',
  converted: 'Converti',
  lost: 'Perdu',
};

const Prospects = () => {
const { apiCall, showNotification, loggedIn, loading } = useApp();
  const [prospects, setProspects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProspect, setEditingProspect] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiCall('/api/auth/prospects/');
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data.results ?? data) ? (data.results ?? data) : [];
        if (!cancelled) setProspects(list);
      } catch (e) {
        if (!cancelled) {
          console.error('Erreur chargement prospects:', e);
          showNotification('Erreur lors du chargement des prospects', 'error');
        }
      } finally {
        if (!cancelled) setInitialLoadDone(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [loggedIn, apiCall, showNotification]);

  const handleSaveProspect = async (id, formData) => {
    try {
      const res = await apiCall(`/api/auth/prospects/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.error || 'Erreur lors de la mise à jour');
      }
      const updated = await res.json();
      setProspects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showNotification('Prospect mis à jour');
      setShowForm(false);
      setEditingProspect(null);
    } catch (e) {
      console.error('Erreur mise à jour prospect:', e);
      showNotification(e.message || 'Erreur lors de la mise à jour', 'error');
      throw e;
    }
  };

  const search = searchTerm.toLowerCase();
  const filteredProspects = useMemo(
    () =>
      prospects.filter((p) =>
        (p.name || '').toLowerCase().includes(search) ||
        (p.email || '').toLowerCase().includes(search) ||
        (p.phone || '').toLowerCase().includes(search) ||
        (p.company || '').toLowerCase().includes(search)
      ),
    [prospects, search],
  );

  const counts = useMemo(() => {
    const base = { total: prospects.length, new: 0, contacted: 0, converted: 0, lost: 0 };
    for (const p of prospects) {
      if (p.status && base[p.status] !== undefined) base[p.status] += 1;
    }
    return base;
  }, [prospects]);

  const totalContactsCount = counts.total;

  const showLoader = loading && !initialLoadDone;
  if (showLoader) return <Loader />;

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx')) {
      showNotification('Utilisez un fichier .xlsx', 'error');
      return;
    }
    setImporting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiCall('/api/auth/prospects/import-excel/', {
        method: 'POST',
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.detail || 'Erreur lors de l\'import');
      showNotification(data.message || `${data.created} prospect(s) importé(s)`);
      // Recharger la liste
      const reloadRes = await apiCall('/api/auth/prospects/');
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json();
        const list = Array.isArray(reloadData.results ?? reloadData)
          ? (reloadData.results ?? reloadData)
          : [];
        setProspects(list);
      }
    } catch (e) {
      console.error('Erreur import prospects:', e);
      showNotification(e.message || 'Erreur lors de l\'import des prospects', 'error');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader
        title="Tableau de bord Prospects"
        subtitle="Suivez vos leads commerciaux et convertissez-les en clients"
        badge="Prospects"
        icon={Users}
      >
        <div className="hidden sm:flex items-center gap-3 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            <Users className="w-4 h-4" />
            {counts.total} prospect(s)
          </span>
        </div>
      </PageHeader>

      {/* Résumé global */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total contacts</p>
            <p className="text-2xl font-black text-slate-800">{totalContactsCount}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clients confirmés</p>
            <p className="text-2xl font-black text-slate-800">{counts.converted}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-violet-100 text-violet-700">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total prospections</p>
            <p className="text-2xl font-black text-slate-800">{counts.total}</p>
          </div>
        </div>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nouveaux</p>
            <p className="text-2xl font-black text-slate-800">{counts.new}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
            <ArrowRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contactés</p>
            <p className="text-2xl font-black text-slate-800">{counts.contacted}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Convertis</p>
            <p className="text-2xl font-black text-slate-800">{counts.converted}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Perdus</p>
            <p className="text-2xl font-black text-slate-800">{counts.lost}</p>
          </div>
        </div>
      </div>

      {/* Liste des prospects */}
      <div className="glass-card overflow-hidden shadow-xl border-white/60">
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un prospect..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleImportExcel}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-700 font-medium flex items-center gap-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
            >
              <Upload className="w-5 h-5" />
              {importing ? 'Import...' : 'Importer Excel'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Type</th>
                <th className="table-header">Prospect</th>
                <th className="table-header">Entreprise</th>
                <th className="table-header">Contact</th>
                <th className="table-header max-w-[200px]">Observation</th>
                <th className="table-header">Créé le</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProspects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="table-cell">
                    <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800">
                      Prospect
                    </span>
                  </td>
                  <td className="table-cell">
                    <Link to={`/prospects/${p.id}`} className="flex items-center gap-4 hover:underline-offset-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {(p.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.email || '-'}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="table-cell text-slate-600">{p.company || '-'}</td>
                  <td className="table-cell">
                    <div className="text-slate-700">{p.phone || p.email || '-'}</div>
                  </td>
                  <td className="table-cell max-w-[200px] truncate text-slate-600" title={p.observation || ''}>
                    {p.observation || '-'}
                  </td>
                  <td className="table-cell text-slate-600">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <Link
                        to={`/prospects/${p.id}`}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50"
                      >
                        <Eye className="w-4 h-4" />
                        Détail
                      </Link>
                      <button
                        type="button"
                        onClick={() => { setEditingProspect(p); setShowForm(true); }}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <Edit className="w-4 h-4" />
                        Modification
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProspects.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-700 text-lg">Aucun prospect</h3>
              <p className="mt-1 text-slate-500 text-sm">
                {searchTerm
                  ? 'Aucun prospect ne correspond à votre recherche.'
                  : 'Les prospects créés apparaîtront ici.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingProspect(null); }}
        title={editingProspect ? 'Modifier le prospect' : 'Nouveau prospect'}
        size="md"
      >
        <ProspectForm
          prospect={editingProspect}
          onClose={() => { setShowForm(false); setEditingProspect(null); }}
          onSave={handleSaveProspect}
        />
      </Modal>
    </div>
  );
};

export default Prospects;

