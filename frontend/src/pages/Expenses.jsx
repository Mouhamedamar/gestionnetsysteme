import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DollarSign, Plus, Search, Eye, Edit, Trash2, CheckCircle, XCircle, Filter, Image as ImageIcon, Download, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import { formatCurrency } from '../utils/formatCurrency';
import { exportExpensesToCSV } from '../utils/exportData';
import { useDebounce } from '../hooks/useDebounce';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';

const Expenses = () => {
  const { expenses, loading, fetchExpenses, showNotification, loggedIn, deleteExpense } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const hasLoadedRef = useRef(false);

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
    
    const loadExpenses = async () => {
      try {
        hasLoadedRef.current = true;
        await fetchExpenses();
      } catch (error) {
        console.error('Erreur lors du chargement des dépenses:', error);
        showNotification('Erreur lors du chargement des dépenses', 'error');
        hasLoadedRef.current = false;
      }
    };
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  const filteredExpenses = expenses.filter(expense => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    const matchesSearch = (
      expense.title?.toLowerCase().includes(searchLower) ||
      expense.description?.toLowerCase().includes(searchLower) ||
      expense.supplier?.toLowerCase().includes(searchLower) ||
      expense.receipt_number?.toLowerCase().includes(searchLower)
    );
    
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExpenses = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleViewExpense = (expense) => {
    setSelectedExpense(expense);
    setShowDetailsModal(true);
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    
    try {
      await deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
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
      case 'PAYE':
        return 'bg-green-500/20 text-green-400';
      case 'NON_PAYE':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAYE':
        return CheckCircle;
      case 'NON_PAYE':
        return XCircle;
      default:
        return DollarSign;
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'FOURNITURE': 'Fourniture',
      'TRANSPORT': 'Transport',
      'SALAIRE': 'Salaire',
      'LOYER': 'Loyer',
      'UTILITAIRE': 'Utilitaires',
      'MARKETING': 'Marketing',
      'MAINTENANCE': 'Maintenance',
      'AUTRE': 'Autre'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'FOURNITURE': 'bg-blue-500/20 text-blue-400',
      'TRANSPORT': 'bg-purple-500/20 text-purple-400',
      'SALAIRE': 'bg-green-500/20 text-green-400',
      'LOYER': 'bg-orange-500/20 text-orange-400',
      'UTILITAIRE': 'bg-cyan-500/20 text-cyan-400',
      'MARKETING': 'bg-pink-500/20 text-pink-400',
      'MAINTENANCE': 'bg-red-500/20 text-red-400',
      'AUTRE': 'bg-slate-500/20 text-slate-400'
    };
    return colors[category] || 'bg-slate-500/20 text-slate-400';
  };

  const handleExportCSV = () => {
    const toExport = filteredExpenses.length > 0 ? filteredExpenses : expenses;
    if (!toExport || toExport.length === 0) {
      showNotification('Aucune dépense à télécharger', 'error');
      return;
    }
    try {
      const filename = `depenses_${new Date().toISOString().split('T')[0]}.csv`;
      exportExpensesToCSV(toExport, filename);
      showNotification(`${toExport.length} dépense(s) téléchargée(s) en CSV`, 'success');
    } catch (error) {
      console.error('Erreur lors de l\'export des dépenses:', error);
      showNotification('Erreur lors du téléchargement', 'error');
    }
  };

  const handleExportPDF = () => {
    const toExport = filteredExpenses.length > 0 ? filteredExpenses : expenses;
    if (!toExport || toExport.length === 0) {
      showNotification('Aucune dépense à télécharger', 'error');
      return;
    }

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();

      // Titre
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Liste des dépenses', pdfWidth / 2, 15, { align: 'center' });

      // En-têtes du tableau
      const headers = ['Date', 'Titre', 'Catégorie', 'Montant (FCFA)', 'Statut'];
      const colWidths = [26, 60, 30, 32, 32]; // total ~180mm avec marge gauche 15mm
      const leftMargin = 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      let y = 26;

      headers.forEach((h, i) => {
        const x = leftMargin + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(h, x + 1, y);
      });

      doc.setFont('helvetica', 'normal');
      y += 6;

      const formatStatus = (status) => {
        if (!status) return '';
        const upper = status.toUpperCase();
        if (upper === 'PAYE') return 'Payé';
        if (upper === 'NON_PAYE') return 'Non payé';
        return status;
      };

      toExport.forEach((expense, idx) => {
        const dateText = formatDate(expense.date);
        const amountNum =
          typeof expense.amount === 'string'
            ? parseFloat(expense.amount) || 0
            : Number(expense.amount) || 0;
        const amountText = formatCurrency(amountNum);
        const row = [
          dateText,
          String(expense.title ?? '').slice(0, 40),
          String(expense.category ?? '').slice(0, 20),
          amountText,
          formatStatus(expense.status),
        ];

        row.forEach((cell, i) => {
          const x = leftMargin + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.text(String(cell ?? ''), x + 1, y);
        });

        y += 6;
        if (y > pdfHeight - 20 && idx < toExport.length - 1) {
          doc.addPage();
          y = 20;
        }
      });

      const filename = `depenses_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      showNotification(`${toExport.length} dépense(s) téléchargée(s) en PDF`, 'success');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF des dépenses:', error);
      showNotification('Erreur lors du téléchargement PDF', 'error');
    }
  };

  // Calculer les statistiques
  const totalExpenses = expenses.reduce((sum, exp) => {
    const amount = typeof exp.amount === 'string' 
      ? parseFloat(exp.amount) || 0 
      : Number(exp.amount) || 0;
    return sum + amount;
  }, 0);

  const paidExpenses = expenses.filter(e => e.status === 'PAYE').reduce((sum, exp) => {
    const amount = typeof exp.amount === 'string' 
      ? parseFloat(exp.amount) || 0 
      : Number(exp.amount) || 0;
    return sum + amount;
  }, 0);

  const unpaidExpenses = expenses.filter(e => e.status === 'NON_PAYE').reduce((sum, exp) => {
    const amount = typeof exp.amount === 'string' 
      ? parseFloat(exp.amount) || 0 
      : Number(exp.amount) || 0;
    return sum + amount;
  }, 0);

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
          <DollarSign className="w-32 h-32 text-primary-600" />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-primary-600 mb-2">Dépenses</h1>
          <p className="text-slate-800 text-lg mb-6 font-semibold">Gestion complète de vos dépenses</p>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher une dépense..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full md:w-80 pl-12 pr-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium placeholder-slate-500"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
              >
                <option value="all">Toutes les catégories</option>
                <option value="FOURNITURE">Fourniture</option>
                <option value="TRANSPORT">Transport</option>
                <option value="SALAIRE">Salaire</option>
                <option value="LOYER">Loyer</option>
                <option value="UTILITAIRE">Utilitaires</option>
                <option value="MARKETING">Marketing</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="AUTRE">Autre</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
              >
                <option value="all">Tous les statuts</option>
                <option value="PAYE">Payé</option>
                <option value="NON_PAYE">Non payé</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={!expenses || expenses.length === 0}
                className="btn-secondary py-3 px-6 font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Télécharger les dépenses affichées en fichier CSV (Excel)"
              >
                <Download className="w-5 h-5" />
                Télécharger les dépenses (CSV)
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={!expenses || expenses.length === 0}
                className="btn-secondary py-3 px-6 font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Télécharger les dépenses affichées en PDF"
              >
                <FileDown className="w-5 h-5" />
                Télécharger les dépenses (PDF)
              </button>
              <Link
                to="/expenses/new"
                className="btn-primary py-3 px-6 font-bold shadow-lg shadow-primary-500/20 transition-all hover:shadow-xl flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nouvelle Dépense
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-white/40 text-center">
          <p className="text-slate-800 text-sm mb-2 font-bold">Total Dépenses</p>
          <p className="text-4xl font-black text-primary-600">{formatCurrency(totalExpenses)} Fcfa</p>
        </div>

        <div className="glass-card p-6 border-white/40 text-center">
          <p className="text-slate-800 text-sm mb-2 font-bold">Payées</p>
          <p className="text-4xl font-black text-green-600">{formatCurrency(paidExpenses)} Fcfa</p>
        </div>

        <div className="glass-card p-6 border-white/40 text-center">
          <p className="text-slate-800 text-sm mb-2 font-bold">Non Payées</p>
          <p className="text-4xl font-black text-yellow-600">{formatCurrency(unpaidExpenses)} Fcfa</p>
        </div>

        <div className="glass-card p-6 border-white/40 text-center">
          <p className="text-slate-800 text-sm mb-2 font-bold">Nombre Total</p>
          <p className="text-4xl font-black text-primary-600">{expenses.length}</p>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-card p-0 border-white/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-primary-600/10 backdrop-blur-sm">
              <tr>
                <th className="table-header">Titre</th>
                <th className="table-header">Catégorie</th>
                <th className="table-header text-center">Date</th>
                <th className="table-header text-right">Montant</th>
                <th className="table-header text-center">Statut</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {currentExpenses.length > 0 ? (
                currentExpenses.map((expense) => {
                  const StatusIcon = getStatusIcon(expense.status);
                  return (
                    <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          {expense.justification_image || expense.justification_image_url ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-slate-200 flex-shrink-0">
                              <img
                                src={expense.justification_image_url || 
                                  (expense.justification_image?.startsWith('http') 
                                    ? expense.justification_image 
                                    : `http://localhost:8000${expense.justification_image}`)}
                                alt="Justification"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="w-full h-full bg-primary-100 flex items-center justify-center" style={{ display: 'none' }}>
                                <ImageIcon className="w-6 h-6 text-primary-600" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border-2 border-slate-200 flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-800">{expense.title || 'Sans titre'}</div>
                            {expense.supplier && (
                              <div className="text-xs text-slate-500">Fournisseur: {expense.supplier}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(expense.category)}`}>
                          {getCategoryLabel(expense.category)}
                        </span>
                      </td>
                      <td className="table-cell text-center text-slate-700">
                        {formatDate(expense.date)}
                      </td>
                      <td className="table-cell text-right font-bold text-slate-900">
                        {(() => {
                          const amount = typeof expense.amount === 'string' 
                            ? parseFloat(expense.amount) || 0 
                            : Number(expense.amount) || 0;
                          return formatCurrency(amount);
                        })} Fcfa
                      </td>
                      <td className="table-cell text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 ${getStatusColor(expense.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {expense.status === 'PAYE' ? 'Payé' : 'Non payé'}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewExpense(expense)}
                            className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-all"
                            title="Voir les détails"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <Link
                            to={`/expenses/${expense.id}/edit`}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                            title="Modifier"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => setExpenseToDelete(expense)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="table-cell text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <DollarSign className="w-16 h-16 text-slate-400" />
                      <p className="text-slate-800 text-lg font-bold">Aucune dépense trouvée</p>
                      <p className="text-slate-700 text-sm max-w-md font-medium">
                        Commencez par créer une nouvelle dépense en cliquant sur le bouton ci-dessus.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="glass-card p-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-slate-700 font-medium">
              Page {currentPage} sur {totalPages} ({filteredExpenses.length} dépense(s))
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-secondary py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn-secondary py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedExpense && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedExpense(null);
          }}
          title={`Détails de la dépense: ${selectedExpense.title}`}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">Titre</label>
              <p className="text-slate-700">{selectedExpense.title || 'Non spécifié'}</p>
            </div>
            {selectedExpense.description && (
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Description</label>
                <p className="text-slate-700 whitespace-pre-wrap">{selectedExpense.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Catégorie</label>
                <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${getCategoryColor(selectedExpense.category)}`}>
                  {getCategoryLabel(selectedExpense.category)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Statut</label>
                <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${getStatusColor(selectedExpense.status)}`}>
                  {selectedExpense.status === 'PAYE' ? 'Payé' : 'Non payé'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Montant</label>
                <p className="text-slate-700 font-bold text-lg">
                  {formatCurrency(Number(selectedExpense.amount) || 0)} Fcfa
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Date</label>
                <p className="text-slate-700">{formatDateTime(selectedExpense.date)}</p>
              </div>
            </div>
            {selectedExpense.supplier && (
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Fournisseur</label>
                <p className="text-slate-700">{selectedExpense.supplier}</p>
              </div>
            )}
            {selectedExpense.receipt_number && (
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Numéro de reçu</label>
                <p className="text-slate-700">{selectedExpense.receipt_number}</p>
              </div>
            )}
            {(selectedExpense.justification_image || selectedExpense.justification_image_url) && (
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Image de justification</label>
                <div className="mt-2">
                  <img
                    src={selectedExpense.justification_image_url || 
                      (selectedExpense.justification_image?.startsWith('http') 
                        ? selectedExpense.justification_image 
                        : `http://localhost:8000${selectedExpense.justification_image}`)}
                    alt="Justification de la dépense"
                    className="max-w-full h-auto rounded-lg border-2 border-slate-200 shadow-sm"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="w-full h-48 bg-slate-100 rounded-lg border-2 border-slate-200 flex items-center justify-center" style={{ display: 'none' }}>
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">Image non disponible</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Créé le</label>
                <p className="text-slate-700 text-sm">{formatDateTime(selectedExpense.created_at)}</p>
              </div>
              {selectedExpense.updated_at && (
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1">Modifié le</label>
                  <p className="text-slate-700 text-sm">{formatDateTime(selectedExpense.updated_at)}</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <ConfirmationModal
          isOpen={!!expenseToDelete}
          onClose={() => setExpenseToDelete(null)}
          onConfirm={handleDeleteExpense}
          title="Supprimer la dépense"
          message={`Êtes-vous sûr de vouloir supprimer la dépense "${expenseToDelete.title}" ? Cette action est irréversible.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          type="danger"
        />
      )}
    </div>
  );
};

export default Expenses;
