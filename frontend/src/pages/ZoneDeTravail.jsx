import React, { useState, useCallback, useEffect } from 'react';
import { MapPin, X, Eye, Building2, HardHat, Plus, Pencil, Trash2 } from 'lucide-react';
import ZoneMapPreview from '../components/ZoneMapPreview';
import Loader from '../components/Loader';
import ConfirmationModal from '../components/ConfirmationModal';
import PageHeader from '../components/PageHeader';
import { useApp } from '../context/AppContext';

const emptyForm = {
  name: '',
  radius_m: '',
  zone_type: 'bureau',
  address: '',
  latitude: '',
  longitude: '',
};

const ZoneDeTravail = () => {
  const { loggedIn, apiCall, showNotification } = useApp();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [zoneToDelete, setZoneToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const formCardRef = React.useRef(null);

  const fetchZones = useCallback(async () => {
    if (!loggedIn) return;
    try {
      setLoading(true);
      const response = await apiCall('/api/work-zones/', { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        const list = data.results ?? data;
        setZones(Array.isArray(list) ? list : []);
      } else {
        setZones([]);
      }
    } catch (e) {
      setZones([]);
    } finally {
      setLoading(false);
    }
  }, [loggedIn, apiCall]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAnnuler = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowPreview(false);
  };

  const handleNouvelleZone = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowPreview(false);
  };

  const handlePrevisualiser = () => {
    setShowPreview(true);
  };

  const handleEdit = (zone) => {
    const rad = zone.radius_m;
    const lat = zone.latitude;
    const lng = zone.longitude;
    setFormData({
      name: zone.name ?? '',
      radius_m: rad != null && rad !== '' ? String(rad) : '',
      zone_type: zone.zone_type ?? 'bureau',
      address: zone.address ?? '',
      latitude: lat != null && lat !== '' ? String(lat) : '',
      longitude: lng != null && lng !== '' ? String(lng) : '',
    });
    setEditingId(zone.id);
    setShowPreview(false);
    setTimeout(() => formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      showNotification('Le nom de la zone est obligatoire', 'error');
      return;
    }
    const radius = formData.radius_m != null && formData.radius_m !== '' ? Number(formData.radius_m) : null;
    if (radius == null || isNaN(radius) || radius < 0) {
      showNotification('Veuillez saisir un rayon valide (nombre ≥ 0)', 'error');
      return;
    }
    const latVal = formData.latitude?.trim() ? parseFloat(formData.latitude) : null;
    const lngVal = formData.longitude?.trim() ? parseFloat(formData.longitude) : null;
    const payload = {
      name: formData.name.trim(),
      radius_m: String(radius),
      zone_type: formData.zone_type || 'bureau',
      address: formData.address?.trim() || null,
      latitude: latVal != null && !Number.isNaN(latVal) ? latVal : null,
      longitude: lngVal != null && !Number.isNaN(lngVal) ? lngVal : null,
    };

    try {
      setSaving(true);
      if (editingId) {
        const response = await apiCall(`/api/work-zones/${editingId}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          showNotification('Zone mise à jour');
          handleAnnuler();
          fetchZones();
        } else {
          const data = await response.json().catch(() => ({}));
          const msg = data.detail || (Array.isArray(data.name) && data.name[0]) || (Array.isArray(data.radius_m) && data.radius_m[0]) || data.latitude?.[0] || data.longitude?.[0] || `Erreur ${response.status}`;
          showNotification(msg, 'error');
        }
      } else {
        const response = await apiCall('/api/work-zones/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          showNotification('Zone créée');
          handleAnnuler();
          fetchZones();
        } else {
          const data = await response.json().catch(() => ({}));
          showNotification(data.detail || data.name?.[0] || 'Erreur lors de la création', 'error');
        }
      }
    } catch (e) {
      showNotification('Erreur réseau', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!zoneToDelete) return;
    try {
      setDeleting(true);
      const response = await apiCall(`/api/work-zones/${zoneToDelete.id}/`, { method: 'DELETE' });
      if (response.ok) {
        showNotification('Zone supprimée');
        setZoneToDelete(null);
        if (editingId === zoneToDelete.id) handleAnnuler();
        fetchZones();
      } else {
        showNotification('Impossible de supprimer cette zone', 'error');
      }
    } catch (e) {
      showNotification('Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader
        title="Zone de travail"
        subtitle="Créer, modifier ou prévisualiser une zone (bureau ou chantier)"
        badge="Pointage"
        icon={MapPin}
      />

      <div ref={formCardRef} className="glass-card p-6 sm:p-8 shadow-xl border-white/60">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {editingId ? 'Modifier la zone' : 'Nouvelle zone'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={handleNouvelleZone}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle zone
            </button>
          )}
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Nom *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex : Siège Dakar"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Rayon (m) *</label>
              <input
                type="number"
                name="radius_m"
                min="0"
                step="0.01"
                value={formData.radius_m}
                onChange={handleChange}
                placeholder="Ex : 100"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Type de zone *</label>
              <select
                name="zone_type"
                value={formData.zone_type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="bureau">Bureau</option>
                <option value="chantier">Chantier</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-800 mb-2">Adresse</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Ex : Ouest foire, route de l'aéroport..."
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Latitude</label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="Ex : 14.7167"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Longitude</label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="Ex : -17.4677"
                className="input-field"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <button type="button" onClick={handleAnnuler} className="btn-secondary py-3 px-6 flex items-center gap-2">
              <X className="w-5 h-5" />
              Annuler
            </button>
            <button
              type="button"
              onClick={handlePrevisualiser}
              className="btn-secondary py-3 px-6 flex items-center gap-2"
            >
              <Eye className="w-5 h-5" />
              Prévisualiser
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary py-3 px-6 flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Enregistrement...
                </>
              ) : (
                <>Enregistrer la zone</>
              )}
            </button>
          </div>
        </form>
      </div>

      {showPreview && (
        <div className="glass-card p-6 shadow-xl border-2 border-primary-500/30 bg-primary-50/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary-600" />
              Aperçu de la zone
            </h2>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <ZoneMapPreview zone={formData} className="h-[320px] sm:h-[420px] min-h-[280px] w-full" />
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-semibold text-slate-500 uppercase tracking-wide">Nom</dt>
              <dd className="mt-1 font-medium text-slate-900">{formData.name || '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500 uppercase tracking-wide">Rayon (m)</dt>
              <dd className="mt-1 font-medium text-slate-900">{formData.radius_m || '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500 uppercase tracking-wide">Type de zone</dt>
              <dd className="mt-1 font-medium text-slate-900 flex items-center gap-2">
                {formData.zone_type === 'bureau' ? (
                  <>
                    <Building2 className="w-4 h-4 text-primary-600" /> Bureau
                  </>
                ) : (
                  <>
                    <HardHat className="w-4 h-4 text-amber-600" /> Chantier
                  </>
                )}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Adresse
              </dt>
              <dd className="mt-1 font-medium text-slate-900">{formData.address || '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500 uppercase tracking-wide">Latitude</dt>
              <dd className="mt-1 font-medium text-slate-900">{formData.latitude || '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500 uppercase tracking-wide">Longitude</dt>
              <dd className="mt-1 font-medium text-slate-900">{formData.longitude || '—'}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="glass-card p-6 shadow-xl border-white/60">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary-600" />
          Zones existantes
        </h2>

        {loading ? (
          <Loader />
        ) : zones.length === 0 ? (
          <p className="text-slate-500 py-8 text-center">Aucune zone enregistrée. Créez une zone ci-dessus puis cliquez sur Enregistrer.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="table-modern w-full text-sm">
              <thead>
                <tr className="bg-primary-600/10">
                  <th className="table-header">Nom</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Rayon</th>
                  <th className="table-header">Adresse</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {zones.map((z) => (
                  <tr key={z.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{z.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${z.zone_type === 'bureau' ? 'bg-primary-100 text-primary-700' : 'bg-amber-100 text-amber-700'}`}>
                        {z.zone_type === 'bureau' ? <Building2 className="w-3.5 h-3.5" /> : <HardHat className="w-3.5 h-3.5" />}
                        {z.zone_type_display ?? (z.zone_type === 'bureau' ? 'Bureau' : 'Chantier')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{z.radius_m != null ? `${z.radius_m} m` : '—'}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={z.address || ''}>{z.address || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(z)}
                          className="p-2 rounded-xl text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Modifier"
                          aria-label="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoneToDelete(z)}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Supprimer"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!zoneToDelete}
        onClose={() => !deleting && setZoneToDelete(null)}
        onConfirm={confirmDelete}
        title="Supprimer la zone"
        message={zoneToDelete ? `Êtes-vous sûr de vouloir supprimer la zone « ${zoneToDelete.name } » ? Les pointages déjà enregistrés garderont la référence à cette zone.` : ''}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        loading={deleting}
      />
    </div>
  );
};

export default ZoneDeTravail;
