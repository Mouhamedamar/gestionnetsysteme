import { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DocumentFooter from './DocumentFooter';
import StampNetsysteme from './StampNetsysteme';
import StampSSE from './StampSSE';

// Images d'en-tête par société (comme sur facture/devis)
const COMPANY_HEADERS = {
  NETSYSTEME: { src: '/invoice-header.png', alt: 'NETSYSTEME - En-tête' },
  SSE: { src: '/invoice-header-sse.png', alt: 'SSE - En-tête' },
};

function formatDateFR(date = new Date()) {
  try {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  } catch {
    return '';
  }
}

function getAgrementFilename(companyName) {
  const base = (companyName || 'Agrement').toString().trim() || 'Agrement';
  const safe = base.replace(/[\\/:*?"<>|]+/g, '-');
  return `AGREMENT - ${safe}.pdf`;
}

const AgrementPDF = ({
  companyName,
  city = 'Dakar',
  date = new Date(),
  company = 'NETSYSTEME',
  onClose,
  autoDownload = false,
  silent = false
}) => {
  const page1Ref = useRef(null);
  const page2Ref = useRef(null);
  const page3Ref = useRef(null);
  const page4Ref = useRef(null);
  const dateStr = useMemo(() => formatDateFR(date instanceof Date ? date : new Date(date)), [date]);
  const [headerImageError, setHeaderImageError] = useState(false);

  const resolvedCompany = (company && String(company).toUpperCase()) === 'SSE' ? 'SSE' : 'NETSYSTEME';
  const headerConfig = COMPANY_HEADERS[resolvedCompany] || COMPANY_HEADERS.NETSYSTEME;
  const showHtmlHeader = headerImageError;

  const REFERENCES = useMemo(() => ([
    'AFRITEL',
    'SOFATELCOM',
    'SAGEMCOM SENEGAL',
    'UNIPARCO COSMETIC',
    'AREZKI',
    'CARITAS THIES',
    'OLYMPIQUE CLUB DAKAR',
    'GLOBAL TRANSPORT ET MINE (GTM)',
    'SENEGAL SUPPLY BASE (SSB)',
    'ZEYDAYAD ARCHITECTE',
    'ECOLE ARMEE DE L’AIR (THIES)',
    'CMA-CGM-SENEGAL',
    'PREBAT',
    'PROMETRA',
    'PORT AUTONOME DE DAKAR',
    'CONFEMEN',
    'EXCO AFRIQUE',
    'AUII AFRICA',
    'UNION EUROPENNE',
    'AUBI SA',
    'DAROU SALAM CONSULTING',
    'UPOA',
    'DAKAR ICE',
    'BISCOM',
    'CLINIQUE MEDICKANE',
    'CLINIQUE MEDICAL IMAM TAIBOU',
    'BASE AERIENNE OUKAM',
    'MINISTERE DE L’INTERIEUR',
    'SIDICOM',
    'ISTAMCO',
    'AGS',
    'TERANGA OIL GAZ SERVICES',
    'SOLENER TECHNOLOGIES',
    'DIRECTION DOUANE',
    'EGLISE UNIVERSEL',
    'EGLISE BETHEL',
    'DIRECTION DES ARTS',
    'UNIVERSITE POLYTECHNIQUE DE L’OUEST AFRICAIN (UPOA)',
    'ELEPHANT VERT SENEGAL',
    'CABINET IMMOBILIER DU MONDE (CIM)',
    'MICROMATIC',
    'IDEAL TRAITEUR',
    'BAMBA TRAITEUR',
    'SYBEL COSMETICS',
    'ADS PHARMA',
    'CISCO AFRIQUE',
    'TOUT POUR L’AUTOMOBILE',
    'GANDIOL MOTO',
    'CLINIQUE NABI',
    'CLINIQUE YA SALAM',
    'KAMI EDUCATION',
    'DIAKHATE PALETTE',
    'FIDELIA RISK SOLUTION',
    'AFRICAINE DES PRODUITS POUR LA CONSTRUCTION « APC »',
    'SOCIETE INDUSTRIELLE MODERNE DES PLASTIQUES AFRICAINE « SIMPA »',
    'INSTITUT SUPERIEUR D’ENSEIGNEMENT PROFESSIONEL',
    'YAYA DIA AGRO',
    'YAYA DIA BTP',
  ]), []);

  const refsMid = Math.ceil(REFERENCES.length / 2);
  const refsPart1 = REFERENCES.slice(0, refsMid);
  const refsPart2 = REFERENCES.slice(refsMid);

  const HeaderBlock = () => (
    <div className="invoice-header-image w-full mb-4 overflow-hidden" style={{ pageBreakAfter: 'avoid' }}>
      {!showHtmlHeader ? (
        <img
          src={headerConfig.src}
          alt={headerConfig.alt}
          className="w-full min-w-full h-auto object-cover object-top block"
          style={{ width: '100%', maxHeight: 'none' }}
          onLoad={() => setHeaderImageError(false)}
          onError={() => setHeaderImageError(true)}
        />
      ) : (
        <div className="w-full border-b-2 border-slate-200 pb-4 px-8 pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${resolvedCompany === 'SSE' ? 'bg-[#ea580c]' : 'bg-blue-800'}`}>
              <span className="text-white font-black text-xl">{resolvedCompany}</span>
            </div>
            <div>
              <h1 className={`text-lg font-black uppercase tracking-tight leading-tight ${resolvedCompany === 'SSE' ? 'text-[#c2410c]' : 'text-blue-800'}`}>
                {resolvedCompany === 'SSE'
                  ? 'La Sénégalaise de Sécurité et d\'Équipement'
                  : 'Netsysteme Informatique & Télécommunication'}
              </h1>
              <p className="text-sm font-semibold text-slate-600 mt-0.5">
                SITE : {resolvedCompany === 'SSE' ? 'www.sse.sn' : 'www.netsys-info.com'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const handleDownload = async () => {
    if (!page1Ref.current || !page2Ref.current || !page3Ref.current || !page4Ref.current) {
      if (!silent) alert('Erreur: Contenu du document non trouvé');
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();

      const addPageFromRef = async (ref, addNewPage = false) => {
        const el = ref?.current;
        if (!el) return;
        if (addNewPage) pdf.addPage();
        
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const width = pdfWidth;
        const height = pdfWidth / ratio;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
      };

      await addPageFromRef(page1Ref, false);
      await addPageFromRef(page2Ref, true);
      await addPageFromRef(page3Ref, true);
      await addPageFromRef(page4Ref, true);

      pdf.save(getAgrementFilename(companyName));
      if (!silent) alert('PDF généré avec succès !');
      onClose?.();
    } catch (error) {
      console.error('Erreur lors de la génération du PDF agrément:', error);
      if (!silent) alert(`Erreur lors de la génération du PDF: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!autoDownload) return;
    const t = setTimeout(() => { handleDownload(); }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload]);

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-50">
      <div className="w-full min-h-screen p-4">
      <div className="flex items-center justify-between gap-2 mb-4 px-4">
        <div className="text-sm text-slate-600">
          {companyName ? <span className="font-semibold">{companyName}</span> : <span>Destinataire</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 shadow-sm"
          >
            Télécharger PDF
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
            >
              Fermer
            </button>
          )}
        </div>
      </div>

      {/* 4 parties/pages claires (comme le PDF) */}
      <div className="space-y-6 w-full px-4">
        {/* PAGE 1 */}
        <div ref={page1Ref} className="bg-white text-slate-900 shadow-lg border-2 border-slate-200 rounded-lg overflow-hidden">
          <HeaderBlock />
          <div className="px-10 pb-10">
            <div className="text-right text-sm mb-6">
              <div>{city}, le {dateStr}</div>
            </div>

            <div className="text-sm leading-6">
              <div>A Monsieur le Directeur General</div>
              <div className="font-semibold">{companyName || 'Entreprise'}</div>
            </div>

            <div className="mt-4 text-sm font-semibold underline">
              OBJET : Demande d’Agrément
            </div>

            <div className="mt-4 text-base leading-7 space-y-4 text-slate-800">
              <p>
                Dans le cadre du développement de nos activités et soucieux de contribuer durablement à la performance de votre activité,
                la société NETSYSTEME sollicite par la présente son agrément en qualité de prestataire.
              </p>
              <p>
                NETSYSTEME s’engage à respecter l’ensemble des normes de qualité, de sécurité et de performance établies par votre Entreprise.
                Nous sommes convaincus qu’une collaboration renforcée entre nos deux entités permettra de proposer des solutions innovantes et fiables,
                contribuant ainsi au renforcement de votre positionnement sur le marché.
              </p>
              <p>
                À cet effet, nous serions honorés de pouvoir convenir d’un entretien afin de vous présenter plus en détail notre offre,
                notre expertise ainsi que les valeurs ajoutées que nous sommes en mesure d’apporter en tant que partenaire technique de premier niveau.
              </p>
              <p>
                Créée en 2010, NETSYSTEME est une entreprise composée d’une équipe hautement qualifiée, reconnue pour sa rigueur, sa réactivité
                et sa capacité d’adaptation aux exigences du client. Jeune et dynamique, notre société intervient notamment dans les domaines suivants :
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Réseaux et Systèmes</li>
                <li>Système de Sécurité Incendie</li>
                <li>Application Web & Mobile / Site Web</li>
                <li>Vidéosurveillance Professionnelle</li>
                <li>Système d’Energie Solaire</li>
                <li>Sécurité électronique et Domotique</li>
                <li>Electricité Bâtiment et Industrielle</li>
                <li>Fourniture de solutions bureautiques et informatiques</li>
              </ul>
            </div>
          </div>
        </div>

        {/* PAGE 2 : Références (partie 1) */}
        <div ref={page2Ref} className="bg-white text-slate-900 shadow-lg border-2 border-slate-200 rounded-lg overflow-hidden">
          <div className="px-10 py-10">
            <p className="text-sm leading-6">
              Nous accordons une importance particulière au respect des délais d’intervention et de livraison, ainsi qu’à la qualité et la durabilité de nos réalisations.
            </p>
            <p className="mt-3 text-base leading-7">
              NETSYSTEME a su tisser au fil des années d’excellentes relations de confiance avec de nombreuses entreprises et institutions opérant dans divers secteurs d’activités.
            </p>
            <p className="mt-6 text-base font-semibold text-slate-900">Nous comptons parmi nos références :</p>
            <div className="mt-3 text-base space-y-2">
              {refsPart1.map((ref) => (
                <div key={ref} className="leading-5">• {ref}</div>
              ))}
            </div>
          </div>
        </div>

        {/* PAGE 3 : Références (partie 2) */}
        <div ref={page3Ref} className="bg-white text-slate-900 shadow-lg border-2 border-slate-200 rounded-lg overflow-hidden">
          <div className="px-10 py-10">
            <div className="text-base space-y-2">
              {refsPart2.map((ref) => (
                <div key={ref} className="leading-5">• {ref}</div>
              ))}
            </div>
          </div>
        </div>

        {/* PAGE 4 : Conclusion + signature + tampon + pied de page */}
        <div ref={page4Ref} className="bg-white text-slate-900 shadow-lg border-2 border-slate-200 rounded-lg overflow-hidden">
          <div className="px-10 py-8">
            <div className="text-base leading-7 space-y-4">
              <p>
                Nous vous remercions par avance de l’attention portée à notre demande et restons à votre disposition pour tout complément d’information
                ou pour convenir d&apos;un rendez-vous.
              </p>
              <p>
                Dans l’attente de votre réponse, veuillez agréer, Monsieur l’Administrateur Général, l’expression de nos salutations distinguées.
              </p>

              <div className="mt-8 text-sm">
                <div className="font-semibold">LE DIRECTEUR GENERAL</div>
                <div className="mt-6 flex items-end justify-between gap-6">
                  <div className="flex items-center justify-center">
                    {resolvedCompany === 'SSE' ? <StampSSE /> : <StampNetsysteme />}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">AMETH DIARRA</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DocumentFooter company={resolvedCompany} />
        </div>
      </div>
      </div>
    </div>
  );
};

export default AgrementPDF;

