import { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import AgrementPDF from '../components/AgrementPDF';
import { useApp } from '../context/AppContext';

const Agrement = () => {
  const { clients = [] } = useApp();
  const [companyName, setCompanyName] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const suggestions = useMemo(() => {
    const list = Array.isArray(clients) ? clients : [];
    const raw = list
      .map((c) => (c?.company || c?.name || '').toString().trim())
      .filter(Boolean);
    return Array.from(new Set(raw)).slice(0, 200);
  }, [clients]);

  const canGenerate = companyName.trim().length > 1;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader
        title="Agrément"
        subtitle="Générez une lettre de demande d'agrément (un seul champ : nom du client/entreprise)"
        badge="Documents"
        icon={FileText}
      />

      <div className="glass-card p-6">
        <div className="max-w-2xl space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Nom du client / entreprise destinataire
            </label>
            <input
              className="input-field"
              list="agrement-company-suggestions"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Agence de voyage et de location de voiture"
            />
            <datalist id="agrement-company-suggestions">
              {suggestions.map((s, idx) => <option key={`${s}-${idx}`} value={s} />)}
            </datalist>
            <p className="mt-2 text-xs text-slate-500">
              Le reste du document est généré automatiquement selon le modèle NETSYSTEME.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={!canGenerate}
              onClick={() => setPreviewOpen(true)}
            >
              Prévisualiser
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={!canGenerate}
              onClick={() => {
                setDownloadOpen(true);
              }}
            >
              Télécharger PDF
            </button>
          </div>
        </div>
      </div>

      {previewOpen && (
        <AgrementPDF
          companyName={companyName.trim()}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {/* Génération directe du PDF (sans prévisualisation) */}
      {downloadOpen && (
        <div className="hidden">
          <AgrementPDF
            companyName={companyName.trim()}
            autoDownload
            onClose={() => setDownloadOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Agrement;
