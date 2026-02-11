import { Phone, Mail, Globe, MapPin, MessageCircle } from 'lucide-react';

const DocumentFooter = ({ className = '' }) => {
  return (
    <div className={`document-footer ${className}`} style={{ pageBreakInside: 'avoid' }}>
      {/* Bande bleue supérieure */}
      <div className="bg-[#0f6fb5] text-white px-6 py-2">
        <p className="text-center font-bold tracking-[0.3em] text-sm uppercase">
          MERCI POUR VOTRE CONFIANCE
        </p>
      </div>

      {/* Zone blanche à deux colonnes */}
      <div className="flex bg-white text-[#0f6fb5] text-sm px-6 py-3 gap-6 items-start">
        {/* Colonne gauche : contacts */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <MessageCircle className="w-4 h-4" aria-hidden />
            <span className="font-bold">77 846 16 55</span>
            <span className="font-bold">|</span>
            <Phone className="w-4 h-4" aria-hidden />
            <span className="font-bold">33 827 28 45</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" aria-hidden />
            <span className="font-semibold break-all">sales@netsys-info.com</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" aria-hidden />
            <span className="font-semibold">www.netsys-info.com</span>
          </div>
        </div>

        {/* Séparateur vertical */}
        <div className="w-px bg-[#0f6fb5] self-stretch" aria-hidden />

        {/* Colonne droite : adresse + RCS */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5" aria-hidden />
            <span className="font-semibold leading-snug">
              Ouest foire sur la route de l&apos;aeroport Leopold Sedar Senghor immeuble Seigneurie
            </span>
          </div>
          <div className="inline-block bg-[#0f6fb5] text-white px-3 py-1 rounded text-xs font-bold tracking-wide">
            R.C.SN/DKR-2010.A. 7987/NINEA: 004225464
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentFooter;
