import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import { DollarSign, Plus, Search, Eye, Edit, Trash2, CheckCircle, XCircle, Filter, Image as ImageIcon, Download, FileDown, Calendar, History, MapPin, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import { formatCurrency } from '../utils/formatCurrency';
import { exportExpensesToCSV } from '../utils/exportData';
import { useDebounce } from '../hooks/useDebounce';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { API_BASE_URL } from '../config';

const Expenses = () => {
  const { expenses, loading, fetchExpenses, showNotification, loggedIn, deleteExpense } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(''); // '' = tous les mois, '1'..'12' = janvier..décembre
  const [yearFilter, setYearFilter] = useState(() => new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const hasLoadedRef = useRef(false);

  // Approvisionnement par site (stocké en localStorage, comme sur la photo)
  const APPRO_STORAGE_DAKAR = 'expenses_appro_dakar';
  const APPRO_STORAGE_MBOUR = 'expenses_appro_mbour';
  const [approDakar, setApproDakar] = useState(() => parseFloat(localStorage.getItem(APPRO_STORAGE_DAKAR) || '0') || 0);
  const [approMbour, setApproMbour] = useState(() => parseFloat(localStorage.getItem(APPRO_STORAGE_MBOUR) || '0') || 0);
  const [showApproModal, setShowApproModal] = useState(false);
  const [showHistoriqueModal, setShowHistoriqueModal] = useState(false);
  const [approInputValue, setApproInputValue] = useState('');

  const saveApproDakar = (val) => {
    const n = parseFloat(val) || 0;
    setApproDakar(n);
    localStorage.setItem(APPRO_STORAGE_DAKAR, String(n));
  };
  const saveApproMbour = (val) => {
    const n = parseFloat(val) || 0;
    setApproMbour(n);
    localStorage.setItem(APPRO_STORAGE_MBOUR, String(n));
  };
  const openApproModal = () => {
    const current = siteFilter === 'DAKAR' ? approDakar : siteFilter === 'MBOUR' ? approMbour : 0;
    setApproInputValue(current ? String(current) : '');
    setShowApproModal(true);
  };
  const submitApproModal = () => {
    const val = parseFloat(approInputValue.replace(',', '.')) || 0;
    if (siteFilter === 'DAKAR') saveApproDakar(val);
    else if (siteFilter === 'MBOUR') saveApproMbour(val);
    else {
      saveApproDakar(val);
      saveApproMbour(val);
    }
    setShowApproModal(false);
    showNotification('Approvisionnement enregistré');
  };

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
    const matchesSite = siteFilter === 'all' || expense.site === siteFilter;

    // Filtre par mois / année : chaque site a ses propres données pour le mois choisi
    let matchesMonth = true;
    if (monthFilter) {
      try {
        const d = new Date(expense.date);
        const expenseMonth = String(d.getMonth() + 1);
        const expenseYear = d.getFullYear();
        matchesMonth = expenseMonth === monthFilter && expenseYear === yearFilter;
      } catch {
        matchesMonth = false;
      }
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesSite && matchesMonth;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExpenses = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  // Chacun ses dépenses : listes séparées par site pour la vue "Tous les sites"
  const filteredExpensesDakar = filteredExpenses.filter(e => e.site === 'DAKAR');
  const filteredExpensesMbour = filteredExpenses.filter(e => e.site === 'MBOUR');
  const [pageDakar, setPageDakar] = useState(1);
  const [pageMbour, setPageMbour] = useState(1);
  const perSitePageSize = 10;
  const currentDakar = filteredExpensesDakar.slice((pageDakar - 1) * perSitePageSize, pageDakar * perSitePageSize);
  const currentMbour = filteredExpensesMbour.slice((pageMbour - 1) * perSitePageSize, pageMbour * perSitePageSize);
  const totalPagesDakar = Math.ceil(filteredExpensesDakar.length / perSitePageSize);
  const totalPagesMbour = Math.ceil(filteredExpensesMbour.length / perSitePageSize);

  useEffect(() => {
    setPageDakar(1);
    setPageMbour(1);
  }, [siteFilter, monthFilter, yearFilter, categoryFilter, statusFilter, debouncedSearchTerm]);

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

  // Calculer les statistiques sur les dépenses filtrées (site + catégorie + statut)
  const statsExpenses = filteredExpenses.length > 0 ? filteredExpenses : expenses;
  const totalExpenses = statsExpenses.reduce((sum, exp) => {
    const amount = typeof exp.amount === 'string'
      ? parseFloat(exp.amount) || 0
      : Number(exp.amount) || 0;
    return sum + amount;
  }, 0);

  const paidExpenses = statsExpenses.filter(e => e.status === 'PAYE').reduce((sum, exp) => {
    const amount = typeof exp.amount === 'string'
      ? parseFloat(exp.amount) || 0
      : Number(exp.amount) || 0;
    return sum + amount;
  }, 0);

  const unpaidExpenses = statsExpenses.filter(e => e.status === 'NON_PAYE').reduce((sum, exp) => {
    const amount = typeof exp.amount === 'string'
      ? parseFloat(exp.amount) || 0
      : Number(exp.amount) || 0;
    return sum + amount;
  }, 0);

  // Approvisionnement pour le(s) site(s) affiché(s) — comme sur la photo
  const approTotal = siteFilter === 'DAKAR' ? approDakar : siteFilter === 'MBOUR' ? approMbour : approDakar + approMbour;
  const restantAppro = Math.max(0, approTotal - totalExpenses);
  const depensesNonAppro = Math.max(0, totalExpenses - approTotal);

  // Chaque site a ses propres dépenses et approvisionnement — calculs par site pour la vue "Tous les sites"
  const expensesBySite = {
    DAKAR: expenses.filter(e => e.site === 'DAKAR' && (() => {
      if (!monthFilter) return true;
      try {
        const d = new Date(e.date);
        return String(d.getMonth() + 1) === monthFilter && d.getFullYear() === yearFilter;
      } catch { return false; }
    })()),
    MBOUR: expenses.filter(e => e.site === 'MBOUR' && (() => {
      if (!monthFilter) return true;
      try {
        const d = new Date(e.date);
        return String(d.getMonth() + 1) === monthFilter && d.getFullYear() === yearFilter;
      } catch { return false; }
    })()),
  };
  const sumExpenses = (list) => list.reduce((s, e) => s + (parseFloat(e.amount) || Number(e.amount) || 0), 0);
  const statsDakar = {
    appro: approDakar,
    depenses: sumExpenses(expensesBySite.DAKAR),
    restant: Math.max(0, approDakar - sumExpenses(expensesBySite.DAKAR)),
    nonAppro: Math.max(0, sumExpenses(expensesBySite.DAKAR) - approDakar),
  };
  const statsMbour = {
    appro: approMbour,
    depenses: sumExpenses(expensesBySite.MBOUR),
    restant: Math.max(0, approMbour - sumExpenses(expensesBySite.MBOUR)),
    nonAppro: Math.max(0, sumExpenses(expensesBySite.MBOUR) - approMbour),
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

  const pageTitle = siteFilter === 'DAKAR'
    ? 'Dépenses du site : Dakar'
    : siteFilter === 'MBOUR'
      ? 'Dépenses du site : Mbour'
      : 'Dépenses - Tous les sites';
  const pageSubtitle = 'Analyse et suivi détaillés des finances et approvisionnements';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader title={pageTitle} subtitle={pageSubtitle} badge="Finance" icon={DollarSign}>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={openApproModal} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-lg transition-all">
            <DollarSign className="w-5 h-5" />
            Approvisionnement
          </button>
          <button type="button" onClick={() => setShowHistoriqueModal(true)} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-lg transition-all">
            <Calendar className="w-5 h-5" />
            Historique des approvisionnements
          </button>
          <button type="button" onClick={handleExportCSV} disabled={!expenses || expenses.length === 0} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold flex items-center gap-2 backdrop-blur-sm border border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed" title="Exporter CSV">
            <Download className="w-5 h-5" />
            CSV
          </button>
          <button type="button" onClick={handleExportPDF} disabled={!expenses || expenses.length === 0} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold flex items-center gap-2 backdrop-blur-sm border border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed" title="Exporter PDF">
            <FileDown className="w-5 h-5" />
            PDF
          </button>
          <Link to={siteFilter === 'all' ? '/expenses/new' : `/expenses/new?site=${siteFilter}`} className="px-6 py-2.5 rounded-xl bg-white text-primary-600 font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
            <Plus className="w-5 h-5" />
            Nouvelle Dépense
          </Link>
        </div>
      </PageHeader>

      {/* Sélecteur de site */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-slate-600 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary-500" />
          Afficher le site
        </span>
        <div className="flex rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm p-1 gap-0.5">
          <button
            type="button"
            onClick={() => { setSiteFilter('DAKAR'); setCurrentPage(1); }}
            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${siteFilter === 'DAKAR' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Dakar
          </button>
          <button
            type="button"
            onClick={() => { setSiteFilter('MBOUR'); setCurrentPage(1); }}
            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${siteFilter === 'MBOUR' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Mbour
          </button>
          <button
            type="button"
            onClick={() => { setSiteFilter('all'); setCurrentPage(1); }}
            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${siteFilter === 'all' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Les deux
          </button>
        </div>
      </div>

      {/* Filtrer par mois */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-500" />
          Filtrer par mois
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={yearFilter}
            onChange={(e) => { setYearFilter(Number(e.target.value)); setCurrentPage(1); }}
            className="input-field py-2.5 w-auto min-w-[100px] font-medium"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {[
            { value: '', label: 'Tous' },
            { value: '1', label: 'Janvier' },
            { value: '2', label: 'Février' },
            { value: '3', label: 'Mars' },
            { value: '4', label: 'Avril' },
            { value: '5', label: 'Mai' },
            { value: '6', label: 'Juin' },
            { value: '7', label: 'Juillet' },
            { value: '8', label: 'Août' },
            { value: '9', label: 'Septembre' },
            { value: '10', label: 'Octobre' },
            { value: '11', label: 'Novembre' },
            { value: '12', label: 'Décembre' },
          ].map((m) => (
            <button
              key={m.value || 'all'}
              type="button"
              onClick={() => { setMonthFilter(m.value); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                monthFilter === m.value
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtres recherche et catégorie */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher une dépense..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="input-field pl-12"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-slate-500 shrink-0" />
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className="input-field py-2.5 w-auto min-w-[160px]">
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
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="input-field py-2.5 w-auto min-w-[120px]">
              <option value="all">Tous les statuts</option>
              <option value="PAYE">Payé</option>
              <option value="NON_PAYE">Non payé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats + listes par site : Dakar | Mbour — design amélioré */}
      <div className={`grid grid-cols-1 gap-8 ${siteFilter === 'all' ? 'lg:grid-cols-2' : ''}`}>
        {/* Bloc Dakar */}
        {(siteFilter === 'all' || siteFilter === 'DAKAR') && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-primary-50 to-slate-50 border-b border-slate-100 flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-black text-slate-800">Dakar</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-800">Approvisionnement</span>
                    </div>
                    <p className="text-lg font-black text-emerald-700">{formatCurrency(statsDakar.appro)}</p>
                    <p className="text-xs text-emerald-600">Fcfa</p>
                  </div>
                  <div className="rounded-xl bg-primary-50 p-4 border border-primary-100">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-primary-600" />
                      <span className="text-xs font-bold text-primary-800">Dépenses</span>
                    </div>
                    <p className="text-lg font-black text-primary-700">{formatCurrency(statsDakar.depenses)}</p>
                    <p className="text-xs text-primary-600">Fcfa</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-blue-800">Restant Appro</span>
                    </div>
                    <p className="text-lg font-black text-blue-700">{formatCurrency(statsDakar.restant)}</p>
                    <p className="text-xs text-blue-600">Fcfa</p>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-4 border border-rose-100">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-bold text-rose-800">Non appro.</span>
                    </div>
                    <p className="text-lg font-black text-rose-700">{formatCurrency(statsDakar.nonAppro)}</p>
                    <p className="text-xs text-rose-600">Fcfa</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h4 className="font-bold text-slate-800">Liste des dépenses Dakar</h4>
                <span className="text-sm font-medium text-slate-500">{filteredExpensesDakar.length} dépense{filteredExpensesDakar.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 text-xs font-bold uppercase tracking-wider">
                      <th className="px-4 py-3 text-left rounded-tl-lg">Titre</th>
                      <th className="px-4 py-3">Catégorie</th>
                      <th className="px-4 py-3 text-center">Date</th>
                      <th className="px-4 py-3 text-right">Montant</th>
                      <th className="px-4 py-3 text-center">Statut</th>
                      <th className="px-4 py-3 text-center rounded-tr-lg w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentDakar.length > 0 ? currentDakar.map((expense) => (
                      <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{expense.title || 'Sans titre'}</div>
                          {expense.supplier && <div className="text-xs text-slate-500 mt-0.5">{expense.supplier}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${getCategoryColor(expense.category)}`}>{getCategoryLabel(expense.category)}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">{formatDate(expense.date)}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(parseFloat(expense.amount) || Number(expense.amount) || 0)} Fcfa</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusColor(expense.status)}`}>{expense.status === 'PAYE' ? 'Payé' : 'Non payé'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button type="button" onClick={() => handleViewExpense(expense)} className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors" title="Voir"><Eye className="w-4 h-4" /></button>
                            <Link to={`/expenses/${expense.id}/edit`} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors inline-flex" title="Modifier"><Edit className="w-4 h-4" /></Link>
                            <button type="button" onClick={() => setExpenseToDelete(expense)} className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-slate-500">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center"><DollarSign className="w-7 h-7 text-slate-400" /></div>
                            <p className="font-medium text-slate-600">Aucune dépense pour Dakar</p>
                            <Link to="/expenses/new?site=DAKAR" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">Ajouter une dépense <Plus className="w-4 h-4" /></Link>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPagesDakar > 1 && (
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-sm">
                  <span className="text-slate-600">Page {pageDakar} sur {totalPagesDakar}</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPageDakar(p => Math.max(1, p - 1))} disabled={pageDakar === 1} className="px-4 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Précédent</button>
                    <button type="button" onClick={() => setPageDakar(p => Math.min(totalPagesDakar, p + 1))} disabled={pageDakar === totalPagesDakar} className="px-4 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Suivant</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bloc Mbour */}
        {(siteFilter === 'all' || siteFilter === 'MBOUR') && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-primary-50 to-slate-50 border-b border-slate-100 flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-black text-slate-800">Mbour</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-800">Approvisionnement</span>
                    </div>
                    <p className="text-lg font-black text-emerald-700">{formatCurrency(statsMbour.appro)}</p>
                    <p className="text-xs text-emerald-600">Fcfa</p>
                  </div>
                  <div className="rounded-xl bg-primary-50 p-4 border border-primary-100">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-primary-600" />
                      <span className="text-xs font-bold text-primary-800">Dépenses</span>
                    </div>
                    <p className="text-lg font-black text-primary-700">{formatCurrency(statsMbour.depenses)}</p>
                    <p className="text-xs text-primary-600">Fcfa</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-blue-800">Restant Appro</span>
                    </div>
                    <p className="text-lg font-black text-blue-700">{formatCurrency(statsMbour.restant)}</p>
                    <p className="text-xs text-blue-600">Fcfa</p>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-4 border border-rose-100">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-bold text-rose-800">Non appro.</span>
                    </div>
                    <p className="text-lg font-black text-rose-700">{formatCurrency(statsMbour.nonAppro)}</p>
                    <p className="text-xs text-rose-600">Fcfa</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h4 className="font-bold text-slate-800">Liste des dépenses Mbour</h4>
                <span className="text-sm font-medium text-slate-500">{filteredExpensesMbour.length} dépense{filteredExpensesMbour.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 text-xs font-bold uppercase tracking-wider">
                      <th className="px-4 py-3 text-left rounded-tl-lg">Titre</th>
                      <th className="px-4 py-3">Catégorie</th>
                      <th className="px-4 py-3 text-center">Date</th>
                      <th className="px-4 py-3 text-right">Montant</th>
                      <th className="px-4 py-3 text-center">Statut</th>
                      <th className="px-4 py-3 text-center rounded-tr-lg w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentMbour.length > 0 ? currentMbour.map((expense) => (
                      <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{expense.title || 'Sans titre'}</div>
                          {expense.supplier && <div className="text-xs text-slate-500 mt-0.5">{expense.supplier}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${getCategoryColor(expense.category)}`}>{getCategoryLabel(expense.category)}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">{formatDate(expense.date)}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(parseFloat(expense.amount) || Number(expense.amount) || 0)} Fcfa</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusColor(expense.status)}`}>{expense.status === 'PAYE' ? 'Payé' : 'Non payé'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button type="button" onClick={() => handleViewExpense(expense)} className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors" title="Voir"><Eye className="w-4 h-4" /></button>
                            <Link to={`/expenses/${expense.id}/edit`} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors inline-flex" title="Modifier"><Edit className="w-4 h-4" /></Link>
                            <button type="button" onClick={() => setExpenseToDelete(expense)} className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-slate-500">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center"><DollarSign className="w-7 h-7 text-slate-400" /></div>
                            <p className="font-medium text-slate-600">Aucune dépense pour Mbour</p>
                            <Link to="/expenses/new?site=MBOUR" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">Ajouter une dépense <Plus className="w-4 h-4" /></Link>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPagesMbour > 1 && (
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-sm">
                  <span className="text-slate-600">Page {pageMbour} sur {totalPagesMbour}</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPageMbour(p => Math.max(1, p - 1))} disabled={pageMbour === 1} className="px-4 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Précédent</button>
                    <button type="button" onClick={() => setPageMbour(p => Math.min(totalPagesMbour, p + 1))} disabled={pageMbour === totalPagesMbour} className="px-4 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Suivant</button>
                  </div>
                </div>
              )}
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
                <label className="block text-sm font-bold text-slate-800 mb-1">Site</label>
                <span className="px-3 py-1 rounded-full text-xs font-bold inline-block bg-slate-100 text-slate-700">
                  {selectedExpense.site === 'MBOUR' ? 'Mbour' : selectedExpense.site === 'DAKAR' ? 'Dakar' : '—'}
                </span>
              </div>
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
                        : `${API_BASE_URL}${selectedExpense.justification_image}`)}
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

      {/* Modal Approvisionnement — enregistrer le montant pour le site sélectionné */}
      {showApproModal && (
        <Modal
          isOpen={showApproModal}
          onClose={() => setShowApproModal(false)}
          title="Approvisionnement"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-slate-600 text-sm">
              {siteFilter === 'DAKAR' && 'Montant d\'approvisionnement pour le site Dakar.'}
              {siteFilter === 'MBOUR' && 'Montant d\'approvisionnement pour le site Mbour.'}
              {siteFilter === 'all' && 'Montant d\'approvisionnement (sera appliqué aux deux sites).'}
            </p>
            <div>
              <label htmlFor="appro-montant" className="block text-sm font-bold text-slate-800 mb-1">Montant (Fcfa)</label>
              <input
                id="appro-montant"
                type="text"
                inputMode="decimal"
                value={approInputValue}
                onChange={(e) => setApproInputValue(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-lg font-semibold"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowApproModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50">
                Annuler
              </button>
              <button type="button" onClick={submitApproModal} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">
                Enregistrer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Historique des approvisionnements — comme sur la photo */}
      {showHistoriqueModal && (
        <Modal
          isOpen={showHistoriqueModal}
          onClose={() => setShowHistoriqueModal(false)}
          title="Historique des approvisionnements"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <History className="w-8 h-8 text-slate-500 shrink-0" />
              <div>
                <p className="font-bold text-slate-800">Dakar</p>
                <p className="text-2xl font-black text-emerald-600">{formatCurrency(approDakar)} Fcfa</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <History className="w-8 h-8 text-slate-500 shrink-0" />
              <div>
                <p className="font-bold text-slate-800">Mbour</p>
                <p className="text-2xl font-black text-emerald-600">{formatCurrency(approMbour)} Fcfa</p>
              </div>
            </div>
            <p className="text-slate-500 text-sm">Modifiez les montants via le bouton « Approvisionnement » en haut de page.</p>
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
