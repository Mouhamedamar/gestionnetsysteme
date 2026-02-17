import { Phone, Mail, Globe, MapPin, MessageCircle } from 'lucide-react';

/** Couleurs selon la société : NETSYSTEME = bleu, SSE = orange (référence facture SSE) */
const FOOTER_STYLES = {
  NETSYSTEME: {
    band: 'bg-[#0f6fb5]',
    text: 'text-[#0f6fb5]',
    badge: 'bg-[#0f6fb5]',
    separator: 'bg-[#0f6fb5]',
  },
  SSE: {
    band: 'bg-[#ea580c]',
    text: 'text-[#c2410c]',
    badge: 'bg-[#ea580c]',
    separator: 'bg-[#ea580c]',
  },
};

/** Icône dans cercle blanc avec icône bleue (pour pied de page SSE) */
const IconCircle = ({ icon: Icon, children }) => (
  <div className="flex items-start gap-2">
    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-blue-600" aria-hidden />
    </div>
    <div className="text-white text-sm font-semibold leading-tight">{children}</div>
  </div>
);

const DocumentFooter = ({ className = '', company = 'NETSYSTEME' }) => {
  const style = FOOTER_STYLES[company] || FOOTER_STYLES.NETSYSTEME;
  const isSSE = company === 'SSE';

  if (isSSE) {
    return (
      <div className={`document-footer document-footer-sse ${className}`} style={{ pageBreakInside: 'avoid' }}>
        <div className="bg-[#ea580c] text-white px-4 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3">
            <IconCircle icon={Phone}>
              <div>+221 33 883 42 42</div>
              <div>+221 77 846 16 55</div>
            </IconCircle>
            <IconCircle icon={Globe}>
              <div>www.sse.sn</div>
              <div>direction@sse.sn</div>
            </IconCircle>
            <IconCircle icon={MapPin}>
              <div>Ouest foire sur la route de l&apos;aeroport,</div>
              <div>En face de l&apos;hopitale Philipe Senghor</div>
            </IconCircle>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6 items-center text-sm text-white border-t border-white/30 pt-2">
            <span className="font-semibold">R.C.SN / DKR-2010.A.7987</span>
            <span className="font-semibold">NINEA: 004225464 2Y2</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`document-footer ${className}`} style={{ pageBreakInside: 'avoid' }}>
      {/* Bande supérieure (bleue NETSYSTEME) */}
      <div className={`${style.band} text-white px-4 py-2`}>
        <p className="text-center font-bold tracking-[0.3em] text-sm uppercase">
          MERCI POUR VOTRE CONFIANCE
        </p>
      </div>

      {/* Zone à deux colonnes : blanche avec texte coloré (bleu) */}
      <div className={`flex bg-white ${style.text} text-sm px-4 py-2 gap-4 items-start`}>
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
        <div className={`w-px ${style.separator} self-stretch`} aria-hidden />
        <div className="flex-1 space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5" aria-hidden />
            <span className="font-semibold leading-snug">
              Ouest foire sur la route de l&apos;aeroport Leopold Sedar Senghor immeuble Seigneurie
            </span>
          </div>
          <div className={`inline-block ${style.badge} text-white px-3 py-1 rounded text-xs font-bold tracking-wide`}>
            R.C.SN/DKR-2010.A.7987 / NINEA: 004225464
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentFooter;
