import { useRef, useEffect } from 'react';
import { Phone, Mail, Globe, MapPin, MessageCircle } from 'lucide-react';
import jsPDF from "jspdf";
import DocumentFooter from './DocumentFooter';
import html2canvas from 'html2canvas';
import { formatCurrency } from '../utils/formatCurrency';
import { getInvoicePdfFilename } from '../utils/pdfFilename';

// Chemin de l'image d'en-tête (à placer dans frontend/public/invoice-header.png)
const INVOICE_HEADER_IMAGE = '/invoice-header.png';

const InvoicePDF = ({ invoice, onClose, autoDownload = false, silent = false }) => {
  const page1Ref = useRef(null);  // Partie 1 : en-tête + facture
  const page2Ref = useRef(null);  // Partie 2 : en-tête + bordereau
  const page3Ref = useRef(null);  // Partie 3 : notes + pied de page
  const wrapper1Ref = useRef(null);
  const wrapper2Ref = useRef(null);
  const wrapper3Ref = useRef(null);

  const handleDownload = async () => {
    try {
      // Remonter en haut du contenu pour que la page 1 (FACTURE) soit bien rendue avant capture
      const printArea = wrapper1Ref.current?.closest('.overflow-y-auto');
      if (printArea) printArea.scrollTop = 0;
      await new Promise(r => setTimeout(r, 150));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const addPageToPdf = async (el, addNewPage = false) => {
        if (!el) return;
        if (addNewPage) pdf.addPage();
        const canvas = await html2canvas(el, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        const h = (canvas.height * pdfWidth) / canvas.width;
        const maxH = pdfHeight;
        const finalH = Math.min(h, maxH);
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalH);
      };

      await addPageToPdf(wrapper1Ref.current, false);
      await addPageToPdf(wrapper2Ref.current, true);
      await addPageToPdf(wrapper3Ref.current, true);

      const clientName = invoice.client_name || invoice.client?.name;
      pdf.save(getInvoicePdfFilename(clientName));
      if (!silent) alert('PDF généré avec succès !');
      if (onClose) onClose();
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      if (!silent) alert(`Erreur lors de la génération du PDF: ${error.message}`);
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

  const totalHT = invoice.items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0;
  const tva = totalHT * 0.18;
  const totalTTC = totalHT + tva;

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

  // En-tête avec image - occupe toute la largeur de la page (100 % du bloc = toute la page à l'export PDF)
  const InvoiceHeaderImage = () => (
    <div
      className="invoice-header-image w-full mb-4 overflow-hidden"
      style={{ pageBreakAfter: 'avoid' }}
    >
      <img
        src={INVOICE_HEADER_IMAGE}
        alt="NETSYSTEME - En-tête"
        className="w-full min-w-full h-auto object-cover object-top block"
        style={{ width: '100%', maxHeight: 'none' }}
        onLoad={() => {}}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10 no-print">
            <h2 className="text-xl font-bold text-gray-800">Facture {invoice.invoice_number}</h2>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="btn-secondary text-sm">Imprimer</button>
              <button onClick={handleDownload} className="btn-primary text-sm">Télécharger PDF</button>
              {onClose && (
                <button onClick={onClose} className="btn-secondary text-sm">Fermer</button>
              )}
            </div>
          </div>

          <div className="bg-white invoice-print invoice-print-readability" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
            {/* Largeur type A4 pour que l'en-tête prenne toute la page à l'export PDF */}
            <div className="mx-auto" style={{ width: '210mm', maxWidth: '100%' }}>
            {/* ========== PARTIE 1 - PAGE 1 : En-tête + FACTURE ========== */}
            <div
              ref={wrapper1Ref}
              className="invoice-page break-after-page mb-0"
              style={{ pageBreakAfter: 'always' }}
            >
              <InvoiceHeaderImage />
              <div ref={page1Ref} className="invoice-part-1 bg-white px-8 pb-6">
                {/* Informations : CLIENT (nom uniquement) à gauche, FACTURE + N° + Date à droite */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="pb-3 border-b-2 border-blue-800/20">
                    <div className="inline-flex flex-col">
                      <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                        Client
                      </span>
                      <span className="mt-1 text-base font-semibold text-slate-900 leading-snug">
                        {invoice.client_name || invoice.client?.name || '—'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="bg-blue-800 text-white px-5 py-3 rounded-lg shadow-sm w-fit">
                      <p className="text-sm font-bold uppercase tracking-wide">Facture</p>
                      <p className="text-sm font-bold mt-1">N° : {invoice.invoice_number || 'N/A'}</p>
                    </div>
                    <p className="text-sm text-slate-700 mt-3 font-medium">Date : {formatDate(invoice.date)}</p>
                  </div>
                </div>
                {/* Section 2 : Détail des prestations (tableau) */}
                <div className="border border-slate-200 rounded-lg p-5 mb-6 bg-slate-50/50" style={{ pageBreakInside: 'avoid' }}>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Détail des prestations</p>
                <div className="mb-0 overflow-hidden rounded-lg">
                  <table className="w-full border-collapse text-base table-fixed">
                    <thead>
                      <tr className="bg-blue-800">
                        <th className="border border-blue-900 px-4 py-3 text-left text-sm font-bold text-white">Désignation</th>
                        <th className="border border-blue-900 px-4 py-3 text-center text-sm font-bold text-white w-20">Qtd.</th>
                        <th className="border border-blue-900 px-4 py-3 text-right text-sm font-bold text-white">P. Unit.</th>
                        <th className="border border-blue-900 px-4 py-3 text-right text-sm font-bold text-white">Total HT</th>
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
                {/* Section 3 : Montants et signature */}
                <div className="border border-slate-200 rounded-lg p-4 mb-6 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Montants et signature</p>
                <div className="max-w-md ml-auto mb-4 space-y-2">
                  <div className="flex justify-between text-sm text-slate-800">
                    <span className="font-medium">Total HT</span>
                    <span className="font-semibold">{formatCurrency(totalHT)} F CFA</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-800">
                    <span className="font-medium">TVA (18%)</span>
                    <span className="font-semibold">{formatCurrency(tva)} F CFA</span>
                  </div>
                  <div className="flex justify-between text-base font-bold bg-blue-800 text-white px-4 py-3 rounded-lg">
                    <span>Total TTC</span>
                    <span>{formatCurrency(totalTTC)} F CFA</span>
                  </div>
                </div>
                {/* Tampon La Direction à gauche */}
                <div className="flex justify-start pt-2">
                  <div className="w-36 h-36 border-2 border-blue-800 rounded-full flex flex-col items-center justify-center bg-white relative shadow-sm">
                    <div className="absolute top-2 left-0 right-0 px-1">
                      <p className="text-[8px] font-bold text-blue-900 text-center leading-tight">Netsysteme Informatique et Télécommunication</p>
                    </div>
                    <div className="absolute bottom-5 left-0 right-0 flex justify-between px-8">
                      <span className="text-[10px] text-blue-900 font-bold">★</span>
                      <span className="text-[10px] text-blue-900 font-bold">★</span>
                    </div>
                    <div className="flex flex-col items-center justify-center mt-5">
                      <div className="border-2 border-blue-900 rounded px-2 py-1 bg-white">
                        <p className="text-sm font-bold text-blue-900 text-center">LA DIRECTION</p>
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                              </div>
            </div>

            {/* ========== PARTIE 2 - PAGE 2 : En-tête + BORDEREAU ========== */}
            <div
              ref={wrapper2Ref}
              className="invoice-page break-after-page mb-0"
              style={{ pageBreakAfter: 'always' }}
            >
              <InvoiceHeaderImage />
              <div ref={page2Ref} className="invoice-part-2 bg-white px-8 pb-6">
                {/* CLIENT (nom uniquement) à gauche, BORDEREAU + N° + Date à droite */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="pb-3 border-b-2 border-blue-800/20">
                    <div className="inline-flex flex-col">
                      <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                        Client
                      </span>
                      <span className="mt-1 text-base font-semibold text-slate-900 leading-snug">
                        {invoice.client_name || invoice.client?.name || '—'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="bg-blue-800 text-white px-5 py-3 rounded-lg shadow-sm w-fit">
                      <p className="text-sm font-bold uppercase tracking-wide">Bordereau de livraison</p>
                      <p className="text-sm font-bold mt-1">N° : {invoice.invoice_number || 'N/A'}</p>
                    </div>
                    <p className="text-sm text-slate-700 mt-3 font-medium">Date : {formatDate(invoice.date)}</p>
                  </div>
                </div>
                {/* Section 2 : Détail des prestations — SANS PRIX (bordereau = Qté + Désignation) */}
                <div className="border border-slate-200 rounded-lg p-5 mb-6 bg-slate-50/50" style={{ pageBreakInside: 'avoid' }}>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Détail des prestations</p>
                <div className="mb-0 overflow-hidden rounded-lg">
                  <table className="w-full border-collapse text-base">
                    <thead>
                      <tr className="bg-blue-800">
                        <th className="border border-blue-900 px-4 py-3 text-center text-sm font-bold text-white w-24">Qté</th>
                        <th className="border border-blue-900 px-4 py-3 text-left text-sm font-bold text-white">Désignation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items?.map((item, index) => (
                        <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="border border-slate-300 px-4 py-3 text-center text-sm text-slate-800">{item.quantity}</td>
                          <td className="border border-slate-300 px-4 py-3 text-sm text-slate-900">{item.product_name || 'Produit non spécifié'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
                {/* Signature uniquement (pas de montants sur le bordereau) */}
                <div className="border border-slate-200 rounded-lg p-5 mb-6 bg-slate-50/50" style={{ pageBreakInside: 'avoid' }}>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Signature</p>
                <div className="flex justify-start pt-2">
                  <div className="w-36 h-36 border-2 border-blue-800 rounded-full flex flex-col items-center justify-center bg-white relative shadow-sm">
                    <div className="absolute top-2 left-0 right-0 px-1">
                      <p className="text-[8px] font-bold text-blue-900 text-center leading-tight">Netsysteme Informatique et Télécommunication</p>
                    </div>
                    <div className="absolute bottom-5 left-0 right-0 flex justify-between px-8">
                      <span className="text-[10px] text-blue-900 font-bold">★</span>
                      <span className="text-[10px] text-blue-900 font-bold">★</span>
                    </div>
                    <div className="flex flex-col items-center justify-center mt-5">
                      <div className="border-2 border-blue-900 rounded px-2 py-1 bg-white">
                        <p className="text-sm font-bold text-blue-900 text-center">La Direction</p>
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                {/* Pied de page (page 2 - Bordereau) */}
                <div className="mt-10 pt-6 border-t-2 border-blue-800/20">
                  <DocumentFooter />
                </div>
              </div>
            </div>

            {/* ========== PARTIE 3 - PAGE 3 : NOTES uniquement + MERCI + Contact + Signature ========== */}
            <div ref={wrapper3Ref} className="invoice-page">
              <div ref={page3Ref} className="invoice-part-3 bg-white px-8 pb-6">
                {/* Section 1 : Notes et garantie */}
                <div className="border border-slate-200 rounded-lg p-4 mb-6 bg-slate-50/50">
                  <h3 className="text-base font-bold text-slate-800 mb-3 uppercase tracking-wide">NOTES :</h3>
                  <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
                    <p><span className="font-semibold text-slate-800">Garantie :</span> Tous appareils vendus sont garantis pour une période de 06 ans à compter de la date d'installation.</p>
                    <p>La garantie contre les vices cachés conformément à l'article 237 du COCC est exclue dans les cas suivants :</p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li>En cas de choc ou de démontage de l'appareil et de manipulation par l'acheteur ou un tiers</li>
                      <li>En cas de panne due à une surtension électrique</li>
                      <li>En cas d'utilisation de l'appareil dans des conditions incompatibles avec celles prévues par le fabricant</li>
                    </ul>
                  </div>
                </div>
                {/* Section 2 : Remerciement et contact */}
                <div className="border border-slate-200 rounded-lg p-4 mb-6 bg-slate-50/50">
                <DocumentFooter className="mb-4" />
                <p className="text-sm text-slate-700 leading-relaxed mb-4">
                  Un service après-vente expérimenté, compétent et dynamique est à votre disposition pour le suivi, conseils et l'entretien de l'ensemble des appareils que nous commercialisons. Merci pour la confiance.
                </p>
                </div>
                {/* Section 3 : Signature */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                <div className="flex justify-start pt-2">
                  <div className="w-36 h-36 border-2 border-blue-800 rounded-full flex flex-col items-center justify-center bg-white relative shadow-sm">
                    <div className="absolute top-2 left-0 right-0 px-1">
                      <p className="text-[8px] font-bold text-blue-900 text-center leading-tight">Netsysteme Informatique et Télécommunication</p>
                    </div>
                    <div className="absolute bottom-5 left-0 right-0 flex justify-between px-8">
                      <span className="text-[10px] text-blue-900 font-bold">★</span>
                      <span className="text-[10px] text-blue-900 font-bold">★</span>
                    </div>
                    <div className="flex flex-col items-center justify-center mt-5">
                      <div className="border-2 border-blue-900 rounded px-2 py-1 bg-white">
                        <p className="text-sm font-bold text-blue-900 text-center">La Direction</p>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .invoice-print-readability {
          font-size: 15px;
          line-height: 1.5;
          color: #1e293b;
        }
        @media print {
          .no-print { display: none !important; }
          .invoice-page { page-break-after: always; }
          .invoice-page:last-child { page-break-after: auto; }
          .invoice-header-image img { max-height: 120px; }
          .invoice-print-readability { font-size: 11pt; }
        }
        .break-after-page { page-break-after: always; }
      `}</style>
    </div>
  );
};

export default InvoicePDF;
