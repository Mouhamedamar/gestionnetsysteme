import { useRef, useEffect } from 'react';
import { Package } from 'lucide-react';
import jsPDF from "jspdf";
import DocumentFooter from './DocumentFooter';
import html2canvas from 'html2canvas';
import { formatCurrency } from '../utils/formatCurrency';
import { getProformaPdfFilename } from '../utils/pdfFilename';
import StampNetsysteme from './StampNetsysteme';
import StampSSE from './StampSSE';

// Images d'en-tête par société (comme sur la facture et le devis)
const COMPANY_HEADERS = {
  NETSYSTEME: { src: '/invoice-header.png', alt: 'NETSYSTEME - En-tête' },
  SSE: { src: '/invoice-header-sse.png', alt: 'SSE - En-tête' },
};

const ProFormaInvoicePDF = ({ invoice, onClose, autoDownload = false, silent = false }) => {
  const invoiceRef = useRef(null);

  const handleDownload = async () => {
    if (!invoiceRef.current) {
      alert('Erreur: Contenu de la facture pro forma non trouvé');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Même logique que la facture : pleine largeur, découpage en plusieurs pages si le contenu est long
      const contentWidth = pdfWidth;
      const scale = contentWidth / canvas.width;
      const totalHeightInPdf = (canvas.height * scale);
      const numPages = Math.ceil(totalHeightInPdf / pdfHeight) || 1;
      const pageHeightPx = (pdfHeight / scale);

      for (let page = 0; page < numPages; page++) {
        if (page > 0) pdf.addPage();
        const srcY = page * pageHeightPx;
        const srcH = Math.min(pageHeightPx, canvas.height - srcY);
        const destH = srcH * scale;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = srcH;
        const ctx = tempCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        const pageImgData = tempCanvas.toDataURL('image/png');
        pdf.addImage(pageImgData, 'PNG', 0, 0, contentWidth, destH);
      }

      const clientName = invoice.client_name || invoice.client?.name;
      pdf.save(getProformaPdfFilename(clientName));
      if (!silent) alert('PDF pro forma généré avec succès !');
      if (onClose) onClose();
    } catch (error) {
      console.error('Erreur lors de la génération du PDF pro forma:', error);
      if (!silent) alert(`Erreur lors de la génération du PDF pro forma: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!autoDownload || !invoice) return;
    const t = setTimeout(() => { handleDownload(); }, 800);
    return () => clearTimeout(t);
  }, [autoDownload]);

  const handlePrint = () => {
    window.print();
  };

  // Calcul des totaux
  const totalHT = invoice.items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0;
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

  const company = (invoice.company && String(invoice.company).toUpperCase()) === 'SSE' ? 'SSE' : 'NETSYSTEME';
  const headerConfig = COMPANY_HEADERS[company] || COMPANY_HEADERS.NETSYSTEME;
  const isSSE = company === 'SSE';
  const theme = {
    label: isSSE ? 'text-[#c2410c]' : 'text-blue-800',
    badge: isSSE ? 'bg-[#ea580c]' : 'bg-blue-800',
    tableBorder: isSSE ? 'border-[#c2410c]' : 'border-blue-900',
    totalBox: isSSE ? 'bg-[#ea580c]' : 'bg-blue-800',
    borderLight: isSSE ? 'border-[#ea580c]/30' : 'border-blue-800/20',
  };
  // En-tête avec image — même que sur la facture
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
            <h2 className="text-xl font-bold text-gray-800">Facture Pro Forma {invoice.invoice_number}</h2>
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

          {/* Contenu de la facture pro forma — même en-tête que la facture */}
          <div ref={invoiceRef} className="p-8 bg-white invoice-print" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
            <div className="mx-auto" style={{ width: '210mm', maxWidth: '100%' }}>
              {/* Page 1 : en-tête + infos + tableau + totaux — hauteur min A4 pour que la page 2 commence après */}
              <div style={{ minHeight: '297mm' }}>
              <InvoiceHeaderImage />
              {/* CLIENT (nom uniquement) à gauche, PROFORMA + N° + Date à droite */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className={`pb-3 border-b-2 ${theme.borderLight}`}>
                  <div className="inline-flex flex-col">
                    <span className={`text-[11px] font-semibold tracking-wider uppercase ${theme.label}`}>
                      Client
                    </span>
                    <span className="mt-1 text-base font-semibold text-slate-900 leading-snug">
                      {invoice.client_name || invoice.client?.name || '—'}
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className={`${theme.badge} text-white px-5 py-3 rounded-lg shadow-sm w-fit`}>
                    <p className="text-sm font-bold uppercase tracking-wide">Pro forma</p>
                    <p className="text-sm font-bold mt-1">N° : {invoice.invoice_number || 'N/A'}</p>
                  </div>
                  <p className="text-sm text-slate-700 mt-3 font-medium">Date : {formatDate(invoice.date)}</p>
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
                  {invoice.items?.map((item, index) => (
                    <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border border-slate-300 px-4 py-3 text-sm text-slate-900">{item.product_name || 'Produit non spécifié'}</td>
                      <td className="border border-slate-300 px-4 py-3 text-center text-sm text-slate-800">{item.quantity}</td>
                      <td className="border border-slate-300 px-4 py-3 text-right text-sm text-slate-800">{formatCurrency(item.unit_price || 0)} F CFA</td>
                      <td className="border border-slate-300 px-4 py-3 text-right text-sm font-medium text-slate-900">{formatCurrency((item.quantity || 0) * (item.unit_price || 0))} F CFA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* Totaux avec tampon */}
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

            {/* ========== PAGE 2 : CONDITIONS COMMERCIALES / CONDITIONS GÉNÉRALES ========== */}
            <div className={`mt-8 pt-6 border-t-2 ${theme.borderLight} mb-8`} style={{ pageBreakBefore: 'always' }}>
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">
                Conditions générales / commerciales
              </h3>
              <div className="min-h-[100px] border border-slate-200 rounded-lg p-4 bg-slate-50 text-xs text-slate-700 space-y-2">
                <p>
                  <span className="font-semibold">Validité :</span>{' '}
                  Cette facture pro forma est valable à compter de la date d&apos;émission mentionnée ci-dessus,
                  sauf indication contraire précisée dans l&apos;offre.
                </p>
                <p>
                  <span className="font-semibold">Garantie :</span>{' '}
                  Tous les appareils vendus sont garantis pour une période de 01 an à compter de la date
                  d&apos;installation, sauf conditions particulières précisées sur l&apos;offre commerciale.
                </p>
                <p>
                  La garantie contre les vices cachés conformément à l&apos;article 237 du COCC est exclue dans les cas suivants :
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>En cas de choc ou de démontage de l&apos;appareil et de manipulation par l&apos;acheteur ou un tiers</li>
                  <li>En cas de panne due à une surtension électrique</li>
                  <li>En cas d&apos;utilisation de l&apos;appareil dans des conditions incompatibles avec celles prévues par le fabricant</li>
                </ul>
                <p className="mt-2">
                  Un service après-vente expérimenté, compétent et dynamique est à votre disposition pour toute
                  assistance technique et le suivi du matériel installé.
                </p>
                <p className="mt-3 font-semibold">Merci pour la confiance.</p>
              </div>
            </div>

            {/* Section BON POUR ACCORD */}
            <div className={`mt-8 pt-6 border-t-2 ${theme.borderLight} mb-8`}>
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Bon pour accord</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">Pour un montant total de:</span>
                  <div className="flex-1 border-b-2 border-gray-400 border-dotted min-h-[20px]"></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm text-gray-700 font-medium">Date:</span>
                    <div className="flex-1 border-2 border-gray-300 rounded p-2 min-h-[36px] bg-white"></div>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm text-gray-700 font-medium">Nom:</span>
                    <div className="flex-1 border-2 border-gray-300 rounded p-2 min-h-[36px] bg-white"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">Signature et cachet:</span>
                  <div className="flex-1 border-b-2 border-gray-400 border-dotted min-h-[20px]"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">Mode de règlement:</span>
                  <div className="flex-1 border-b-2 border-gray-400 border-dotted min-h-[20px]"></div>
                </div>
              </div>
              
              {/* Tampon NETSYSTEME */}
              <div className="flex justify-end mt-6">
                {company === 'SSE' ? <StampSSE /> : <StampNetsysteme />}
              </div>
              </div>
            </div>

            {/* Pied de page (page 2 - Pro forma) */}
            <div className={`mt-10 pt-6 border-t-2 ${theme.borderLight}`}>
              <DocumentFooter company={company} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProFormaInvoicePDF;
