import { useRef, useEffect, useState } from 'react';
import { Phone, Mail, Globe, MapPin, MessageCircle, FileText } from 'lucide-react';
import jsPDF from "jspdf";
import DocumentFooter from './DocumentFooter';
import html2canvas from 'html2canvas';
import { formatCurrency } from '../utils/formatCurrency';
import { getInvoicePdfFilename } from '../utils/pdfFilename';
import StampNetsysteme from './StampNetsysteme';
import StampSSE from './StampSSE';

// Images d'en-tête par société (à placer dans frontend/public/)
const COMPANY_HEADERS = {
  NETSYSTEME: {
    src: '/invoice-header.png',
    alt: 'NETSYSTEME - En-tête',
  },
  SSE: {
    src: '/invoice-header-sse.png',
    alt: 'SSE - En-tête',
  },
};

const InvoicePDF = ({ invoice, onClose, autoDownload = false, silent = false, headless = false, invoiceOnly = false }) => {
  const page1Ref = useRef(null);  // Partie 1 : en-tête + facture
  const page2Ref = useRef(null);  // Partie 2 : en-tête + bordereau
  const page3Ref = useRef(null);  // Partie 3 : notes + pied de page
  const wrapper1Ref = useRef(null);
  const wrapper2Ref = useRef(null);
  const wrapper3Ref = useRef(null);
  const [headerImageError, setHeaderImageError] = useState(false);

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
      if (autoDownload && onClose) onClose();
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

  if (!invoice) {
    return null;
  }

  // L'API renvoie invoice_items, le frontend peut mapper en items ; accepter les deux
  const invoiceLines = invoice.items ?? invoice.invoice_items ?? [];
  const totalHT = invoiceLines.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0);
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

  const company = (invoice.company && String(invoice.company).toUpperCase()) === 'SSE' ? 'SSE' : 'NETSYSTEME';
  const headerConfig = COMPANY_HEADERS[company] || COMPANY_HEADERS.NETSYSTEME;
  const showHtmlHeader = headerImageError;

  // Charte couleur : SSE = orange (#ea580c / #c2410c), Netsysteme = bleu
  const isSSE = company === 'SSE';
  const theme = {
    label: isSSE ? 'text-[#c2410c]' : 'text-blue-800',
    badge: isSSE ? 'bg-[#ea580c]' : 'bg-blue-800',
    tableHead: isSSE ? 'bg-[#ea580c] border-[#c2410c]' : 'bg-blue-800 border-blue-900',
    totalBox: isSSE ? 'bg-[#ea580c]' : 'bg-blue-800',
    borderLight: isSSE ? 'border-[#ea580c]/30' : 'border-blue-800/20',
    notesTitle: isSSE ? 'text-[#c2410c]' : 'text-blue-800',
  };

  // En-tête : image si disponible, sinon en-tête HTML (obligatoire pour SSE si image absente)
  const InvoiceHeaderImage = () => (
    <div
      className="invoice-header-image w-full mb-6 overflow-hidden"
      style={{ pageBreakAfter: 'avoid' }}
    >
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
        <div className="w-full border-b-2 border-slate-200 pb-4">
          {company === 'SSE' ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${isSSE ? 'bg-[#ea580c]' : 'bg-blue-800'}`}>
                <span className="text-white font-black text-xl">SSE</span>
              </div>
              <div>
                <h1 className="text-lg font-black text-[#c2410c] uppercase tracking-tight leading-tight">
                  La Sénégalaise de Sécurité et d&apos;Équipement
                </h1>
                <p className="text-sm font-semibold text-slate-600 mt-0.5">SITE : www.sse.sn</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-800 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">NET</span>
              </div>
              <div>
                <h1 className="text-lg font-black text-blue-800 uppercase tracking-tight">Netsysteme Informatique & Télécommunication</h1>
                <p className="text-sm font-semibold text-slate-600 mt-0.5">SITE : www.netsys-info.com</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto animate-fade-in ${headless ? 'invisible pointer-events-none' : 'bg-slate-900/60 backdrop-blur-md'}`}>
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
        <div className="glass-card animate-scale-in w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border-white/60 rounded-2xl">
          <div className="sticky top-0 z-10 shrink-0 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Facture {invoice.invoice_number}</h2>
                <p className="text-sm text-slate-600">{invoice.client_name || invoice.client?.name || 'Client'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!invoiceOnly && <button onClick={handlePrint} className="btn-secondary text-sm py-2 px-4">Imprimer</button>}
              {!invoiceOnly && <button onClick={handleDownload} className="btn-primary text-sm py-2 px-4">Télécharger PDF</button>}
              {onClose && (
                <button onClick={onClose} className="btn-secondary text-sm py-2 px-4">Fermer</button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="bg-white invoice-print invoice-print-readability rounded-xl border border-slate-100" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
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
                {/* En-tête facture : CLIENT à gauche, FACTURE + N° + Date à droite */}
                <div className="grid grid-cols-2 gap-8 mb-8 items-start">
                  <div>
                    <p className={`text-sm font-bold uppercase tracking-wide mb-2 ${theme.label}`}>Client</p>
                    <p className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-2">
                      {invoice.client_name || invoice.client?.name || '—'}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className={`${theme.badge} text-white px-5 py-3 rounded-lg shadow-sm w-fit`}>
                      <p className="text-sm font-bold uppercase tracking-wide">Facture</p>
                      <p className="text-sm font-bold mt-1">N° : {invoice.invoice_number || 'N/A'}</p>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 font-semibold uppercase">Société : {company}</p>
                    <p className="text-sm text-slate-700 mt-2 font-medium">Date : {formatDate(invoice.date)}</p>
                  </div>
                </div>
                {/* Section 2 : Détail des prestations (tableau) */}
                <div className="border border-slate-200 rounded-lg p-5 mb-6 bg-slate-50/50" style={{ pageBreakInside: 'avoid' }}>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Détail des prestations</p>
                <div className="mb-0 overflow-hidden rounded-lg">
                  <table className="w-full border-collapse text-base table-fixed">
                    <thead>
                      <tr className={theme.badge}>
                        <th className={`border px-4 py-3 text-left text-sm font-bold text-white ${isSSE ? 'border-[#c2410c]' : 'border-blue-900'}`}>Désignation</th>
                        <th className={`border px-4 py-3 text-center text-sm font-bold text-white w-20 ${isSSE ? 'border-[#c2410c]' : 'border-blue-900'}`}>Qtd.</th>
                        <th className={`border px-4 py-3 text-right text-sm font-bold text-white ${isSSE ? 'border-[#c2410c]' : 'border-blue-900'}`}>P. Unit.</th>
                        <th className={`border px-4 py-3 text-right text-sm font-bold text-white ${isSSE ? 'border-[#c2410c]' : 'border-blue-900'}`}>Total HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceLines.map((item, index) => (
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
                  <div className={`flex justify-between text-base font-bold ${theme.totalBox} text-white px-4 py-3 rounded-lg`}>
                    <span>Total TTC</span>
                    <span>{formatCurrency(totalTTC)} F CFA</span>
                  </div>
                </div>
                {/* Tampon NETSYSTEME ou La Direction (SSE) */}
                <div className="flex justify-start pt-2">
                  {company === 'NETSYSTEME' ? (
                    <StampNetsysteme />
                  ) : company === 'SSE' ? (
                    <StampSSE />
                  ) : (
                    <div className="w-36 h-36 border-2 border-blue-800 rounded-full flex flex-col items-center justify-center bg-white relative shadow-sm">
                      <div className="absolute top-2 left-0 right-0 px-1">
                        <p className="text-[8px] font-bold text-blue-900 text-center leading-tight">Netsysteme Informatique et Télécommunication</p>
                      </div>
                      <div className="flex flex-col items-center justify-center mt-5">
                        <div className="border-2 border-blue-900 rounded px-2 py-1 bg-white">
                          <p className="text-sm font-bold text-blue-900 text-center">LA DIRECTION</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                </div>

                </div>
            </div>

            {!invoiceOnly && (
            <>
            {/* ========== PARTIE 2 - PAGE 2 : En-tête + BORDEREAU ========== */}
            <div
              ref={wrapper2Ref}
              className="invoice-page break-after-page mb-0"
              style={{ pageBreakAfter: 'always' }}
            >
              <InvoiceHeaderImage />
              <div ref={page2Ref} className="invoice-part-2 bg-white px-8 pb-6">
                {/* En-tête bordereau : CLIENT à gauche, BORDEREAU + N° + Date à droite */}
                <div className="grid grid-cols-2 gap-8 mb-8 items-start">
                  <div>
                    <p className={`text-sm font-bold uppercase tracking-wide mb-2 ${theme.label}`}>Client</p>
                    <p className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-2">
                      {invoice.client_name || invoice.client?.name || '—'}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className={`${theme.badge} text-white px-5 py-3 rounded-lg shadow-sm w-fit`}>
                      <p className="text-sm font-bold uppercase tracking-wide">Bordereau de livraison</p>
                      <p className="text-sm font-bold mt-1">N° : {invoice.invoice_number || 'N/A'}</p>
                    </div>
                    <p className="text-sm text-slate-700 mt-2 font-medium">Date : {formatDate(invoice.date)}</p>
                  </div>
                </div>
                {/* Section 2 : Détail des prestations — SANS PRIX (bordereau = Qté + Désignation) */}
                <div className="border border-slate-200 rounded-lg p-5 mb-6 bg-slate-50/50" style={{ pageBreakInside: 'avoid' }}>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Détail des prestations</p>
                <div className="mb-0 overflow-hidden rounded-lg">
                  <table className="w-full border-collapse text-base">
                    <thead>
                      <tr className={theme.badge}>
                        <th className={`border px-4 py-3 text-center text-sm font-bold text-white w-24 ${isSSE ? 'border-[#c2410c]' : 'border-blue-900'}`}>Qté</th>
                        <th className={`border px-4 py-3 text-left text-sm font-bold text-white ${isSSE ? 'border-[#c2410c]' : 'border-blue-900'}`}>Désignation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceLines.map((item, index) => (
                        <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="border border-slate-300 px-4 py-3 text-center text-sm text-slate-800">{item.quantity}</td>
                          <td className="border border-slate-300 px-4 py-3 text-sm text-slate-900">{item.product_name || item.product_detail?.name || 'Produit non spécifié'}</td>
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
                  {company === 'NETSYSTEME' ? (
                    <StampNetsysteme />
                  ) : company === 'SSE' ? (
                    <StampSSE />
                  ) : (
                    <div className="w-36 h-36 border-2 border-blue-800 rounded-full flex flex-col items-center justify-center bg-white relative shadow-sm">
                      <div className="absolute top-2 left-0 right-0 px-1">
                        <p className="text-[8px] font-bold text-blue-900 text-center leading-tight">Netsysteme Informatique et Télécommunication</p>
                      </div>
                      <div className="flex flex-col items-center justify-center mt-5">
                        <div className="border-2 border-blue-900 rounded px-2 py-1 bg-white">
                          <p className="text-sm font-bold text-blue-900 text-center">La Direction</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                </div>

              </div>
            </div>

            {/* ========== PARTIE 3 - PAGE 3 : SSE = NOTES + bandeau bas ; NETSYSTEME = CLIENT/N° + NOTES + contact + tampon ========== */}
            <div ref={wrapper3Ref} className="invoice-page">
              <div ref={page3Ref} className="invoice-part-3 bg-white px-8 pb-6">
                {/* Pour NETSYSTEME : CLIENT et N° facture sur la dernière page */}
                {company !== 'SSE' && (
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">CLIENT</p>
                      <div className="border-2 border-slate-300 rounded p-4 bg-white min-h-[52px] flex items-center">
                        <p className="text-base font-semibold text-slate-900 break-words w-full">{invoice.client_name || 'Client non spécifié'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-800"><span className="font-semibold">N° facture :</span> {invoice.invoice_number || 'N/A'}</p>
                      <p className="text-sm text-slate-800 mt-1">Date : {formatDate(invoice.date)}</p>
                    </div>
                  </div>
                )}
                {/* Section Notes et garantie (SSE : 01 an + liste numérotée) */}
                <div className="border border-slate-200 rounded-lg p-4 mb-6 bg-slate-50/50">
                  <h3 className={`text-base font-bold mb-3 uppercase tracking-wide ${theme.notesTitle}`}>NOTES :</h3>
                  <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
                    <p><span className="font-semibold text-slate-800">Garantie :</span> Tous appareils vendus sont garantis pour une période de {company === 'SSE' ? '01 an' : '06 ans'} à compter de la date d&apos;installation.</p>
                    <p>La garantie contre les vices cachés conformément à l&apos;article 237 du COCC est exclue dans les cas suivants :</p>
                    {company === 'SSE' ? (
                      <>
                        <ol className="list-decimal list-inside ml-4 space-y-2">
                          <li>En cas de choc ou de démontage de l&apos;appareil et de manipulation par l&apos;acheteur ou un tiers</li>
                          <li>En cas de panne due à une surtension électrique</li>
                          <li>En cas d&apos;utilisation de l&apos;appareil dans des conditions incompatibles avec celles prévues par le fabricant</li>
                        </ol>
                        <p className="mt-3">Un service après-vente expérimenté, compétent et dynamique est à votre disposition pour le suivi, conseils et l&apos;entretien de l&apos;ensemble des appareils que nous commercialisons. Merci pour la confiance.</p>
                      </>
                    ) : (
                      <ul className="list-disc list-inside ml-4 space-y-2">
                        <li>En cas de choc ou de démontage de l&apos;appareil et de manipulation par l&apos;acheteur ou un tiers</li>
                        <li>En cas de panne due à une surtension électrique</li>
                        <li>En cas d&apos;utilisation de l&apos;appareil dans des conditions incompatibles avec celles prévues par le fabricant</li>
                      </ul>
                    )}
                  </div>
                </div>
                {/* Pour SSE : tampon uniquement */}
                {company === 'SSE' && (
                  <div className="border border-slate-200 rounded-lg p-4 mb-6 bg-slate-50/50">
                    <div className="flex justify-start pt-2">
                      <StampSSE />
                    </div>
                  </div>
                )}
                {/* Pour NETSYSTEME : Remerciement et tampon (sans footer ici) */}
                {company !== 'SSE' && (
                  <>
                    <div className="border border-slate-200 rounded-lg p-4 mb-6 bg-slate-50/50">
                      <p className="text-sm text-slate-700 leading-relaxed mb-4">
                        Un service après-vente expérimenté, compétent et dynamique est à votre disposition pour le suivi, conseils et l&apos;entretien de l&apos;ensemble des appareils que nous commercialisons. Merci pour la confiance.
                      </p>
                    </div>
                  </>
                )}
                {/* Section Signature (tampon) - NETSYSTEME uniquement */}
                {company !== 'SSE' && (
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                <div className="flex justify-start pt-2">
                  {company === 'NETSYSTEME' ? (
                    <StampNetsysteme />
                  ) : (
                    <div className="w-36 h-36 border-2 border-blue-800 rounded-full flex flex-col items-center justify-center bg-white relative shadow-sm">
                      <div className="absolute top-2 left-0 right-0 px-1">
                        <p className="text-[8px] font-bold text-blue-900 text-center leading-tight">Netsysteme Informatique et Télécommunication</p>
                      </div>
                      <div className="flex flex-col items-center justify-center mt-5">
                        <div className="border-2 border-blue-900 rounded px-2 py-1 bg-white">
                          <p className="text-sm font-bold text-blue-900 text-center">La Direction</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                </div>
                )}

                {/* Pied de page (uniquement sur la dernière page) */}
                <div className={`mt-10 pt-6 border-t-2 ${theme.borderLight}`}>
                  <DocumentFooter company={company} />
                </div>
              </div>
            </div>
            </>
            )}
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
