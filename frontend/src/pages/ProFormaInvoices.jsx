import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { FileText, Plus, Search, Eye, Printer, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import ProFormaInvoicePDF from '../components/ProFormaInvoicePDF';
import { formatCurrency } from '../utils/formatCurrency';
import { useDebounce } from '../hooks/useDebounce';
import { exportInvoicesToCSV } from '../utils/exportData';

const ProFormaInvoices = () => {
  const { invoices, loading, fetchInvoices, showNotification, loggedIn } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoicePDF, setShowInvoicePDF] = useState(false);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        if (loggedIn) {
          await fetchInvoices();
        }
      } catch (error) {
        console.error('Erreur lors du chargement des factures pro forma:', error);
        showNotification('Erreur lors du chargement des factures pro forma', 'error');
      }
    };
    loadInvoices();
  }, []);

  // Filtrer uniquement les factures pro forma
  const proFormaInvoices = invoices.filter(invoice => invoice.is_proforma === true);

  // Debounce de la recherche
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredInvoices = proFormaInvoices.filter(invoice => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    return (
      invoice.invoice_number?.toString().toLowerCase().includes(searchLower) ||
      invoice.client_name?.toLowerCase().includes(searchLower) ||
      invoice.status?.toLowerCase().includes(searchLower)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoicePDF(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non spécifiée';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAYE':
        return 'bg-green-500/20 text-green-400';
      case 'NON_PAYE':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'ANNULE':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const handleExportCSV = () => {
    if (proFormaInvoices.length === 0) {
      showNotification('Aucune facture pro forma à exporter', 'warning');
      return;
    }
    exportInvoicesToCSV(proFormaInvoices, 'factures_proforma.csv');
    showNotification('Export CSV réussi', 'success');
  };

  if (loading) return (
    <div className="p-8">
      <div className="glass-card p-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded mb-4"></div>
        <div className="h-6 bg-slate-200 rounded mb-2 w-3/4"></div>
        <div className="h-6 bg-slate-200 rounded mb-2 w-1/2"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="glass-card p-8 border-white/40 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <FileText className="w-32 h-32 text-primary-600" />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-primary-600 mb-2">Factures Pro Forma</h1>
          <p className="text-slate-800 text-lg mb-6 font-semibold">Gestion complète de vos factures pro forma</p>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher une facture pro forma..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full md:w-80 pl-12 pr-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium placeholder-slate-500"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleExportCSV}
                className="btn-secondary py-3 px-6 font-bold shadow-lg shadow-slate-500/20 transition-all hover:shadow-xl flex items-center gap-2"
                title="Exporter en CSV"
              >
                <FileDown className="w-5 h-5" />
                Exporter CSV
              </button>
              <Link
                to="/invoices/new?proforma=true"
                className="btn-primary py-3 px-6 font-bold shadow-lg shadow-primary-500/20 transition-all hover:shadow-xl flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nouvelle Facture Pro Forma
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-white/40 text-center">
          <p className="text-slate-800 text-sm mb-2 font-bold">Total Pro Forma</p>
          <p className="text-4xl font-black text-primary-600">{proFormaInvoices.length}</p>
        </div>

        <div className="glass-card p-6 border-white/40 text-center">
          <p className="text-slate-800 text-sm mb-2 font-bold">En attente</p>
          <p className="text-4xl font-black text-yellow-600">
            {proFormaInvoices.filter(inv => inv.status?.toUpperCase() === 'NON_PAYE').length}
          </p>
        </div>

        <div className="glass-card p-6 border-white/40 text-center">
          <p className="text-slate-800 text-sm mb-2 font-bold">Montant Total</p>
          <p className="text-4xl font-black text-primary-600">
            {(() => {
              const total = proFormaInvoices.reduce((sum, inv) => {
                const amount = typeof inv.total_ttc === 'string' 
                  ? parseFloat(inv.total_ttc) || 0 
                  : Number(inv.total_ttc) || 0;
                return sum + amount;
              }, 0);
              return formatCurrency(total);
            })()} Fcfa
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="glass-card p-0 border-white/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-primary-600/10 backdrop-blur-sm">
              <tr>
                <th className="table-header"># Facture</th>
                <th className="table-header">Client</th>
                <th className="table-header text-center">Date</th>
                <th className="table-header text-right">Montant</th>
                <th className="table-header text-center">Statut</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {currentInvoices.length > 0 ? (
                currentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                    <td className="table-cell font-semibold text-slate-800">
                      {invoice.invoice_number || 'N/A'}
                    </td>
                    <td className="table-cell text-slate-700 font-medium">
                      {invoice.client_name || 'Client non spécifié'}
                    </td>
                    <td className="table-cell text-center text-slate-700">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="table-cell text-right font-bold text-slate-900">
                      {(() => {
                        const amount = typeof invoice.total_ttc === 'string' 
                          ? parseFloat(invoice.total_ttc) || 0 
                          : Number(invoice.total_ttc) || 0;
                        return formatCurrency(amount);
                      })()} Fcfa
                    </td>
                    <td className="table-cell text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(invoice.status)}`}>
                        {invoice.status || 'Inconnu'}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/invoices/${invoice.id}/items`}
                          className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-all"
                          title="Voir les détails"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Voir la facture pro forma"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="table-cell text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <FileText className="w-16 h-16 text-slate-400" />
                      <p className="text-slate-700 text-lg font-semibold">Aucune facture pro forma trouvée</p>
                      <p className="text-slate-600 text-sm max-w-md">
                        Commencez par créer une nouvelle facture pro forma en cliquant sur le bouton ci-dessus.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="glass-card p-6 border-white/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-slate-800 text-sm font-bold">
            Page {currentPage} sur {totalPages} - {filteredInvoices.length} facture(s) pro forma
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all ${currentPage === 1 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-800 hover:bg-slate-200 hover:text-slate-900 font-semibold'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                if (page === currentPage) {
                  return (
                    <button
                      key={page}
                      className="w-10 h-10 rounded-lg bg-primary-500/20 text-primary-400 font-bold flex items-center justify-center"
                    >
                      {page}
                    </button>
                  );
                }
                return (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    className="w-10 h-10 rounded-lg text-slate-800 hover:bg-slate-200 hover:text-slate-900 transition-all font-bold"
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-all ${currentPage === totalPages ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Pro Forma Invoice PDF Modal */}
      {showInvoicePDF && selectedInvoice && (
        <ProFormaInvoicePDF
          invoice={selectedInvoice}
          onClose={() => setShowInvoicePDF(false)}
        />
      )}
    </div>
  );
};

export default ProFormaInvoices;
