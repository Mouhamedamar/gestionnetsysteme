import { useRef, useEffect } from 'react';
import { Package, Phone, Mail, Globe, MapPin, MessageCircle } from 'lucide-react';
import jsPDF from "jspdf";
import DocumentFooter from './DocumentFooter';
import html2canvas from 'html2canvas';
import { formatCurrency } from '../utils/formatCurrency';
import { getQuotePdfFilename } from '../utils/pdfFilename';
import StampNetsysteme from './StampNetsysteme';
import StampSSE from './StampSSE';

// Images d'en-tête par société (comme sur la facture)
const COMPANY_HEADERS = {
  NETSYSTEME: { src: '/invoice-header.png', alt: 'NETSYSTEME - En-tête' },
  SSE: { src: '/invoice-header-sse.png', alt: 'SSE - En-tête' },
};

const QuotePDF = ({ quote, onClose, autoDownload = false, silent = false }) => {
  const page1Ref = useRef(null);
  const page2Ref = useRef(null);

  const handleDownload = async () => {
    if (!page1Ref.current || !page2Ref.current) {
      alert('Erreur: Contenu du devis non trouvé');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const addPageFromRef = async (ref, addNewPage = false) => {
        const canvas = await html2canvas(ref.current, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        if (addNewPage) pdf.addPage();
        const imgData = canvas.toDataURL('image/png');
        const h = (canvas.height * pdfWidth) / canvas.width;
        const finalH = Math.min(h, pdfHeight);
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalH);
      };

      await addPageFromRef(page1Ref, false);
      await addPageFromRef(page2Ref, true);

      const clientName = quote.client_name || quote.client?.name;
      pdf.save(getQuotePdfFilename(clientName));
      if (!silent) alert('PDF généré avec succès !');
      if (onClose) onClose();
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      if (!silent) alert(`Erreur lors de la génération du PDF: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!autoDownload || !quote) return;
    const t = setTimeout(() => { handleDownload(); }, 800);
    return () => clearTimeout(t);
  }, [autoDownload]);

  const handlePrint = () => {
    window.print();
  };

  // Calcul des totaux
  const totalHT = quote.quote_items?.reduce((sum, item) => {
    const qty = item.quantity || 0;
    const price = item.unit_price || 0;
    return sum + (qty * price);
  }, 0) || quote.total_ht || 0;
  const tva = totalHT * 0.18;
  const totalTTC = totalHT + tva;

  // Format de date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date non spécifiée';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const company = (quote.company && String(quote.company).toUpperCase()) === 'SSE' ? 'SSE' : 'NETSYSTEME';
  const headerConfig = COMPANY_HEADERS[company] || COMPANY_HEADERS.NETSYSTEME;
  const isSSE = company === 'SSE';
  const theme = {
    label: isSSE ? 'text-[#c2410c]' : 'text-blue-800',
    badge: isSSE ? 'bg-[#ea580c]' : 'bg-blue-800',
    tableBorder: isSSE ? 'border-[#c2410c]' : 'border-blue-900',
    totalBox: isSSE ? 'bg-[#ea580c]' : 'bg-blue-800',
    borderLight: isSSE ? 'border-[#ea580c]/30' : 'border-blue-800/20',
  };
  const InvoiceHeaderImage = () => (
    <div className="invoice-header-image w-full mb-4 overflow-hidden" style={{ pageBreakAfter: 'avoid' }}>
      <img
        src={headerConfig.src}
        alt={headerConfig.alt}
        className="w-full min-w-full h-auto object-cover object-top block"
        style={{ width: '100%', maxHeight: 'none' }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header avec boutons */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10 no-print">
            <h2 className="text-xl font-bold text-gray-800">Devis {quote.quote_number}</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="btn-secondary text-sm"
              >
                Imprimer
              </button>
              <button
                onClick={handleDownload}
                className="btn-primary text-sm"
              >
                Télécharger PDF
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="btn-secondary text-sm"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>

          {/* Contenu du devis — même en-tête que la facture */}
          <div className="p-8 bg-white quote-print" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
            <div className="mx-auto" style={{ width: '210mm', maxWidth: '100%' }}>
              {/* Page 1 : en-tête + infos + tableau + totaux (capture séparée pour le PDF) */}
              <div ref={page1Ref} className="bg-white">
              <InvoiceHeaderImage />
              {/* CLIENT (nom uniquement) à gauche, DEVIS + N° + Date à droite */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className={`pb-3 border-b-2 ${theme.borderLight}`}>
                  <div className="inline-flex flex-col">
                    <span className={`text-[11px] font-semibold tracking-wider uppercase ${theme.label}`}>
                      Client
                    </span>
                    <span className="mt-1 text-base font-semibold text-slate-900 leading-snug">
                      {quote.client_name || quote.client?.name || '—'}
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className={`${theme.badge} text-white px-5 py-3 rounded-lg shadow-sm w-fit`}>
                    <p className="text-sm font-bold uppercase tracking-wide">Devis</p>
                    <p className="text-sm font-bold mt-1">N° : {quote.quote_number || quote.number || 'N/A'}</p>
                  </div>
                  <p className="text-sm text-slate-700 mt-3 font-medium">Date : {formatDate(quote.date || quote.created_at)}</p>
                  {quote.expiration_date && (
                    <p className="text-sm text-slate-600 mt-1">Valable jusqu'au : {formatDate(quote.expiration_date)}</p>
                  )}
                </div>
              </div>

            {/* Tableau des items */}
            <div className="border border-slate-200 rounded-lg p-5 mb-6 bg-slate-50/50" style={{ pageBreakInside: 'avoid' }}>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Détail des prestations</p>
              <div className="overflow-hidden rounded-lg">
              <table className="w-full border-collapse text-base">
                <thead>
                  <tr className={theme.badge}>
                    <th className={`border ${theme.tableBorder} px-4 py-3 text-left text-sm font-bold text-white`}>Désignation</th>
                    <th className={`border ${theme.tableBorder} px-4 py-3 text-center text-sm font-bold text-white w-20`}>Qté</th>
                    <th className={`border ${theme.tableBorder} px-4 py-3 text-right text-sm font-bold text-white`}>P. Unit</th>
                    <th className={`border ${theme.tableBorder} px-4 py-3 text-right text-sm font-bold text-white`}>Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.quote_items?.map((item, index) => (
                    <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border border-slate-300 px-4 py-3 text-sm text-slate-900">{item.product_name || item.product_detail?.name || 'Produit non spécifié'}</td>
                      <td className="border border-slate-300 px-4 py-3 text-center text-sm text-slate-800">{item.quantity}</td>
                      <td className="border border-slate-300 px-4 py-3 text-right text-sm text-slate-800">{formatCurrency(item.unit_price || 0)} F CFA</td>
                      <td className="border border-slate-300 px-4 py-3 text-right text-sm font-medium text-slate-900">{formatCurrency((item.quantity || 0) * (item.unit_price || 0))} F CFA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* Totaux */}
            <div className="flex justify-end mb-6 relative" style={{ pageBreakInside: 'avoid' }}>
              <div className="w-80 bg-slate-100 p-4 rounded-lg border border-slate-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-700">
                    <span className="font-medium">Total HT:</span>
                    <span className="font-semibold">{formatCurrency(totalHT)} F CFA</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-700">
                    <span className="font-medium">TVA (18%):</span>
                    <span className="font-semibold">{formatCurrency(tva)} F CFA</span>
                  </div>
                  <div className={`flex justify-between text-base font-bold ${theme.totalBox} text-white px-4 py-3 rounded-lg mt-2`}>
                    <span>Total TTC</span>
                    <span>{formatCurrency(totalTTC)} F CFA</span>
                  </div>
                </div>
              </div>
              {/* Tampon selon société */}
              <div className="absolute left-0 bottom-0">
                {company === 'SSE' ? <StampSSE /> : <StampNetsysteme />}
              </div>
            </div>

            </div>

            {/* Page 2 : conditions générales + pied de page (capture séparée pour le PDF) */}
            <div ref={page2Ref} className="bg-white mt-8 pt-8 quote-page2" style={{ width: '210mm', maxWidth: '100%' }}>
              <InvoiceHeaderImage />
              <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Conditions générales</h3>
              <div className="text-xs text-slate-700 space-y-2">
                <p>
                  <span className="font-semibold">Validité :</span> Ce devis est valable jusqu'au {quote.expiration_date ? formatDate(quote.expiration_date) : 'date non spécifiée'}.
                </p>
                <p>
                  <span className="font-semibold">Garantie :</span> Tous appareils vendus sont garantis pour une période de 01 an à compter de la date d'installation.
                </p>
                <p>
                  La garantie contre les vices cachés conformément à l'article 237 du COCC est exclue dans les cas suivants :
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>En cas de choc ou de démontage de l'appareil et de manipulation par l'acheteur ou un tiers</li>
                  <li>En cas de panne due à une surtension électrique</li>
                  <li>En cas d'utilisation de l'appareil dans des conditions incompatibles avec celles prévues par le fabricant</li>
                </ul>
                <p className="mt-2">
                  Un service après-vente expérimenté, compétent et dynamique est à votre disposition pour toute assistance technique.
                </p>
                <p className="mt-3 font-semibold">Merci pour la confiance.</p>
              </div>

            {/* Pied de page (page 2) */}
            <div className={`mt-10 pt-6 border-t-2 ${theme.borderLight}`}>
              <DocumentFooter company={company} />
            </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      <style>{`
        @media print {
          .quote-page2 { page-break-before: always; }
        }
      `}</style>
    </div>
  );
};

export default QuotePDF;
