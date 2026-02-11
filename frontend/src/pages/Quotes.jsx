import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { FileText, Plus, Search, Download, Eye, CheckCircle, XCircle, Clock, FileDown, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { useDebounce } from '../hooks/useDebounce';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import QuotePDF from '../components/QuotePDF';
import { exportQuotesToCSV } from '../utils/exportData';

const Quotes = () => {
  const { quotes, loading, fetchQuotes, showNotification, loggedIn, apiCall } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showQuotePDF, setShowQuotePDF] = useState(false);
  const [quoteToConvert, setQuoteToConvert] = useState(null);
  const [converting, setConverting] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') ?? '');
  }, [searchParams]);

  // Debounce de la recherche
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    // Réinitialiser le ref si l'utilisateur se déconnecte
    if (!loggedIn) {
      hasLoadedRef.current = false;
      return;
    }
    
    // Éviter les appels multiples
    if (hasLoadedRef.current) return;
    
    const loadQuotes = async () => {
      try {
        hasLoadedRef.current = true;
        await fetchQuotes();
      } catch (error) {
        console.error('Erreur lors du chargement des devis:', error);
        showNotification('Erreur lors du chargement des devis', 'error');
        hasLoadedRef.current = false;
      }
    };
    loadQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  const filteredQuotes = quotes.filter(quote => {
    const searchLower = (debouncedSearchTerm || '').toLowerCase();
    const matchesSearch = !searchLower || (
      (quote.quote_number ?? '').toString().toLowerCase().includes(searchLower) ||
      (quote.client_name || '').toLowerCase().includes(searchLower) ||
      (quote.client_email || '').toLowerCase().includes(searchLower) ||
      (quote.status || '').toLowerCase().includes(searchLower)
    );
    
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuotes = filteredQuotes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleViewQuote = (quote) => {
    setSelectedQuote(quote);
    setShowDetailsModal(true);
  };

  const handleDownloadQuote = (quote) => {
    setSelectedQuote(quote);
    setShowQuotePDF(true);
  };

  const handleExportCSV = () => {
    try {
      // Exporter tous les devis (pas seulement ceux filtrés)
      exportQuotesToCSV(quotes, `devis_${new Date().toISOString().split('T')[0]}.csv`);
      showNotification('Export CSV réussi', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      showNotification('Erreur lors de l\'export CSV', 'error');
    }
  };

  const handleConvertToInvoice = async () => {
    if (!quoteToConvert) return;
    
    try {
      setConverting(true);
      const response = await apiCall(`/api/quotes/${quoteToConvert.id}/convert_to_invoice/`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la conversion');
      }

      const data = await response.json();
      showNotification('Devis converti en facture avec succès', 'success');
      setQuoteToConvert(null);
      await fetchQuotes();
      
      // Rediriger vers la facture créée si possible
      if (data.invoice && data.invoice.id) {
        window.location.href = `/invoices/${data.invoice.id}/items`;
      }
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      showNotification(error.message || 'Erreur lors de la conversion en facture', 'error');
    } finally {
      setConverting(false);
    }
  };

  const handleStatusChange = async (quoteId, action) => {
    try {
      const response = await apiCall(`/api/quotes/${quoteId}/${action}/`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Erreur lors du changement de statut');
      }

      showNotification('Statut modifié avec succès', 'success');
      await fetchQuotes();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors du changement de statut', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non spécifiée';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Date non spécifiée';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'BROUILLON':
        return 'bg-slate-500/20 text-slate-400';
      case 'ENVOYE':
        return 'bg-blue-500/20 text-blue-400';
      case 'ACCEPTE':
        return 'bg-green-500/20 text-green-400';
      case 'REFUSE':
        return 'bg-red-500/20 text-red-400';
      case 'EXPIRE':
        return 'bg-orange-500/20 text-orange-400';
      case 'CONVERTI':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACCEPTE':
        return CheckCircle;
      case 'REFUSE':
        return XCircle;
      case 'ENVOYE':
      case 'BROUILLON':
        return Clock;
      default:
        return FileText;
    }
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
          <h1 className="text-4xl font-black text-primary-600 mb-2">Devis</h1>
          <p className="text-slate-800 text-lg mb-6 font-semibold">Gestion complète de vos devis clients</p>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher un devis..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                    const next = new URLSearchParams(searchParams);
                    if (e.target.value.trim()) next.set('search', e.target.value); else next.delete('search');
                    setSearchParams(next, { replace: true });
                  }}
                  className="w-full md:w-80 pl-12 pr-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium placeholder-slate-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
              >
                <option value="all">Tous les statuts</option>
                <option value="BROUILLON">Brouillon</option>
                <option value="ENVOYE">Envoyé</option>
                <option value="ACCEPTE">Accepté</option>
                <option value="REFUSE">Refusé</option>
                <option value="EXPIRE">Expiré</option>
                <option value="CONVERTI">Converti</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="btn-secondary py-3 px-6 font-bold shadow-lg shadow-slate-500/20 transition-all hover:shadow-xl flex items-center gap-2"
                title="Exporter en CSV"
              >
                <FileDown className="w-5 h-5" />
                Exporter CSV
              </button>
              <Link
                to="/quotes/new"
                className="btn-primary py-3 px-6 font-bold shadow-lg shadow-primary-500/20 transition-all hover:shadow-xl flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nouveau Devis
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-white/40 text-center">
          <p className="text-slate-800 text-sm mb-2 font-bold">Total Devis</p>
          <p className="text-4xl font-black text-primary-600">{quotes.length}</p>
        </div>

        <div className="glass-card p-6 border-white/40 text-center">
          <p className="text-slate-800 text-sm mb-2 font-bold">Envoyés</p>
          <p className="text-4xl font-black text-blue-600">
            {quotes.filter(q => q.status === 'ENVOYE').length}
          </p>
        </div>

        <div className="glass-card p-6 border-white/40 text-center">
          <p className="text-slate-800 text-sm mb-2 font-bold">Acceptés</p>
          <p className="text-4xl font-black text-green-600">
            {quotes.filter(q => q.status === 'ACCEPTE').length}
          </p>
        </div>

        <div className="glass-card p-6 border-white/40 text-center">
          <p className="text-slate-800 text-sm mb-2 font-bold">Montant Total</p>
          <p className="text-4xl font-black text-primary-600">
            {(() => {
              const total = quotes.reduce((sum, q) => {
                const amount = typeof q.total_ttc === 'string' 
                  ? parseFloat(q.total_ttc) || 0 
                  : Number(q.total_ttc) || 0;
                return sum + amount;
              }, 0);
              return formatCurrency(total);
            })()} Fcfa
          </p>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="glass-card p-0 border-white/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-primary-600/10 backdrop-blur-sm">
              <tr>
                <th className="table-header"># Devis</th>
                <th className="table-header">Client</th>
                <th className="table-header text-center">Date</th>
                <th className="table-header text-center">Expiration</th>
                <th className="table-header text-right">Montant</th>
                <th className="table-header text-center">Statut</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {currentQuotes.length > 0 ? (
                currentQuotes.map((quote) => {
                  const StatusIcon = getStatusIcon(quote.status);
                  return (
                    <tr key={quote.id} className="hover:bg-white/5 transition-colors">
                      <td className="table-cell font-semibold text-slate-800">
                        {quote.quote_number || 'N/A'}
                      </td>
                      <td className="table-cell text-slate-700 font-medium">
                        <div>
                          <div>{quote.client_name || 'Client non spécifié'}</div>
                          {quote.client_email && (
                            <div className="text-xs text-slate-500">{quote.client_email}</div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell text-center text-slate-700">
                        {formatDate(quote.date)}
                      </td>
                      <td className="table-cell text-center text-slate-700">
                        {quote.expiration_date ? (
                          <span className={quote.is_expired ? 'text-red-500 font-bold' : ''}>
                            {formatDate(quote.expiration_date)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Non définie</span>
                        )}
                      </td>
                      <td className="table-cell text-right font-bold text-slate-900">
                        {(() => {
                          const amount = typeof quote.total_ttc === 'string' 
                            ? parseFloat(quote.total_ttc) || 0 
                            : Number(quote.total_ttc) || 0;
                          return formatCurrency(amount);
                        })()} Fcfa
                      </td>
                      <td className="table-cell text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 ${getStatusColor(quote.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {quote.status || 'Inconnu'}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewQuote(quote)}
                            className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-all"
                            title="Voir les détails"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDownloadQuote(quote)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-all"
                            title="Télécharger le devis"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          {quote.status === 'ACCEPTE' && (
                            <button
                              onClick={() => setQuoteToConvert(quote)}
                              className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-all"
                              title="Convertir en facture"
                            >
                              <ArrowRight className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="table-cell text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <FileText className="w-16 h-16 text-slate-400" />
                      <p className="text-slate-800 text-lg font-bold">Aucun devis trouvé</p>
                      <p className="text-slate-700 text-sm max-w-md font-medium">
                        Commencez par créer un nouveau devis en cliquant sur le bouton ci-dessus.
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
            Page {currentPage} sur {totalPages} - {filteredQuotes.length} devis
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all ${currentPage === 1 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-800 hover:bg-slate-200 hover:text-slate-900 font-semibold'}`}
            >
              ←
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
              →
            </button>
          </div>
        </div>
      )}

      {/* Quote Details Modal */}
      {showDetailsModal && selectedQuote && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedQuote(null);
          }}
          title={`Devis ${selectedQuote.quote_number}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Client</p>
                <p className="font-bold text-slate-700">{selectedQuote.client_name || 'N/A'}</p>
                {selectedQuote.client_email && (
                  <p className="text-sm text-slate-500">{selectedQuote.client_email}</p>
                )}
                {selectedQuote.client_phone && (
                  <p className="text-sm text-slate-500">{selectedQuote.client_phone}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Statut</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(selectedQuote.status)}`}>
                  {selectedQuote.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Date</p>
                <p className="text-slate-700">{formatDateTime(selectedQuote.date)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Date d'expiration</p>
                <p className={`text-slate-700 ${selectedQuote.is_expired ? 'text-red-500 font-bold' : ''}`}>
                  {selectedQuote.expiration_date ? formatDateTime(selectedQuote.expiration_date) : 'Non définie'}
                </p>
              </div>
            </div>

            {selectedQuote.quote_items && selectedQuote.quote_items.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Articles</p>
                <div className="space-y-2">
                  {selectedQuote.quote_items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-bold text-slate-700">{item.product_name || item.product_detail?.name}</p>
                        <p className="text-sm text-slate-500">Qté: {item.quantity} × {formatCurrency(item.unit_price)} Fcfa</p>
                      </div>
                      <span className="font-black text-primary-600">{formatCurrency(item.subtotal)} Fcfa</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Total HT</span>
                <span className="font-black text-slate-900">{formatCurrency(selectedQuote.total_ht)} Fcfa</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-slate-700">Total TTC</span>
                <span className="font-black text-primary-600 text-xl">{formatCurrency(selectedQuote.total_ttc)} Fcfa</span>
              </div>
            </div>

            {selectedQuote.notes && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedQuote.notes}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              {selectedQuote.status === 'BROUILLON' && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedQuote.id, 'mark_as_sent');
                    setShowDetailsModal(false);
                  }}
                  className="flex-1 btn-primary py-3"
                >
                  Marquer comme envoyé
                </button>
              )}
              {selectedQuote.status === 'ENVOYE' && (
                <>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedQuote.id, 'mark_as_accepted');
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 btn-secondary py-3"
                  >
                    Marquer comme accepté
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedQuote.id, 'mark_as_refused');
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 btn-secondary py-3 bg-red-500 hover:bg-red-600"
                  >
                    Marquer comme refusé
                  </button>
                </>
              )}
              {selectedQuote.status === 'ACCEPTE' && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setQuoteToConvert(selectedQuote);
                  }}
                  className="flex-1 btn-primary py-3"
                >
                  Convertir en facture
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Convert to Invoice Confirmation Modal */}
      {quoteToConvert && (
        <ConfirmationModal
          isOpen={!!quoteToConvert}
          onClose={() => setQuoteToConvert(null)}
          onConfirm={handleConvertToInvoice}
          title="Convertir le devis en facture"
          message={`Êtes-vous sûr de vouloir convertir le devis "${quoteToConvert.quote_number}" en facture ? Cette action créera une nouvelle facture et réduira le stock des produits.`}
          confirmText="Convertir"
          cancelText="Annuler"
          type="info"
          loading={converting}
        />
      )}

      {/* Quote PDF Modal */}
      {showQuotePDF && selectedQuote && (
        <QuotePDF
          quote={selectedQuote}
          onClose={() => {
            setShowQuotePDF(false);
            setSelectedQuote(null);
          }}
        />
      )}
    </div>
  );
};

export default Quotes;
