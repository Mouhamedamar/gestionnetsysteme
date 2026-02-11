import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package
} from 'lucide-react';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorConfigs = {
    blue: 'from-blue-500 to-indigo-600 shadow-blue-500/20',
    green: 'from-emerald-400 to-teal-600 shadow-emerald-500/20',
    yellow: 'from-amber-400 to-orange-500 shadow-amber-500/20',
    purple: 'from-violet-500 to-purple-700 shadow-violet-500/20',
    red: 'from-rose-500 to-red-700 shadow-rose-500/20'
  };

  const bgGradient = colorConfigs[color] || colorConfigs.blue;

  return (
    <div className="group relative overflow-hidden card p-0 border-none">
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500`}></div>
      <div className="p-6 relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${bgGradient} shadow-lg animate-float`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-black text-slate-800 mb-1 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 font-medium mt-2">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardCommercial = () => {
  const { user, loggedIn, apiCall, clients, quotes, invoices, loading } = useApp();
  const navigate = useNavigate();
  const [fetching, setFetching] = useState(false);

  // Statistiques calculées
  const stats = useMemo(() => {
    const totalClients = clients?.length || 0;
    const totalQuotes = quotes?.length || 0;
    const totalInvoices = invoices?.length || 0;
    
    // Devis en attente
    const quotesPending = quotes?.filter(q => q.status === 'EN_ATTENTE' || q.status === 'BROUILLON').length || 0;
    
    // Factures payées
    const invoicesPaid = invoices?.filter(i => i.status === 'PAYE').length || 0;
    
    // Chiffre d'affaires (factures payées)
    const revenue = invoices
      ?.filter(i => i.status === 'PAYE')
      .reduce((sum, inv) => sum + (parseFloat(inv.total_ttc) || 0), 0) || 0;
    
    // Devis convertis (devis qui ont une facture associée)
    const quotesConverted = quotes?.filter(q => q.status === 'ACCEPTE').length || 0;
    
    // Taux de conversion
    const conversionRate = totalQuotes > 0 ? ((quotesConverted / totalQuotes) * 100).toFixed(1) : 0;

    return {
      totalClients,
      totalQuotes,
      totalInvoices,
      quotesPending,
      invoicesPaid,
      revenue,
      quotesConverted,
      conversionRate
    };
  }, [clients, quotes, invoices]);

  // Devis récents (5 derniers)
  const recentQuotes = useMemo(() => {
    return quotes
      ?.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
      .slice(0, 5) || [];
  }, [quotes]);

  // Factures récentes (5 dernières)
  const recentInvoices = useMemo(() => {
    return invoices
      ?.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
      .slice(0, 5) || [];
  }, [invoices]);

  // Clients récents (5 derniers)
  const recentClients = useMemo(() => {
    return clients
      ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5) || [];
  }, [clients]);

  if (loading || fetching) return <Loader />;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Header */}
      <div className="glass-card p-8 border-white/40 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Users className="w-32 h-32 text-primary-600" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-1 w-12 bg-primary-600 rounded-full"></div>
            <span className="text-primary-600 font-bold uppercase tracking-widest text-xs">Tableau de bord</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">
            Bienvenue, {user?.username || 'Commercial'}
          </h1>
          <div className="flex items-center gap-4 text-slate-500">
            <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-lg border border-slate-200/50">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-semibold">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="h-4 w-px bg-slate-300"></div>
            <p className="text-sm font-medium">Votre espace de gestion commerciale.</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Clients"
          value={stats.totalClients}
          icon={Users}
          color="blue"
          subtitle="Base clients totale"
        />
        <StatCard
          title="Devis"
          value={stats.totalQuotes}
          icon={FileText}
          color="purple"
          subtitle={`${stats.quotesPending} en attente`}
        />
        <StatCard
          title="Factures"
          value={stats.totalInvoices}
          icon={DollarSign}
          color="green"
          subtitle={`${stats.invoicesPaid} payées`}
        />
        <StatCard
          title="Chiffre d'Affaires"
          value={`${formatCurrency(stats.revenue)} F CFA`}
          icon={TrendingUp}
          color="yellow"
          subtitle={`Taux: ${stats.conversionRate}%`}
        />
      </div>

      {/* Devis Récents */}
      <div className="card p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Devis Récents</h2>
            <p className="text-sm text-slate-400 font-medium mt-1">Derniers devis créés</p>
          </div>
          <button
            onClick={() => navigate('/quotes')}
            className="btn-secondary text-sm"
          >
            Voir tout
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Numéro</th>
                <th className="table-header">Client</th>
                <th className="table-header">Date</th>
                <th className="table-header">Total</th>
                <th className="table-header">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentQuotes.length > 0 ? (
                recentQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="table-cell">
                      <span className="font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-lg">
                        {quote.quote_number || quote.number || 'N/A'}
                      </span>
                    </td>
                    <td className="table-cell font-semibold text-slate-700">
                      {quote.client_name || quote.client?.name || 'N/A'}
                    </td>
                    <td className="table-cell text-slate-500">
                      {quote.date || quote.created_at
                        ? new Date(quote.date || quote.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'N/A'}
                    </td>
                    <td className="table-cell font-black text-slate-800">
                      {formatCurrency(quote.total_ttc || quote.total || 0)} F CFA
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                        quote.status === 'ACCEPTE' ? 'bg-green-100 text-green-700' :
                        quote.status === 'REFUSE' ? 'bg-red-100 text-red-700' :
                        quote.status === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {quote.status || 'BROUILLON'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="table-cell text-center text-slate-500 py-8">
                    Aucun devis récent
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Factures Récentes */}
      <div className="card p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Factures Récentes</h2>
            <p className="text-sm text-slate-400 font-medium mt-1">Dernières factures émises</p>
          </div>
          <button
            onClick={() => navigate('/invoices')}
            className="btn-secondary text-sm"
          >
            Voir tout
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Numéro</th>
                <th className="table-header">Client</th>
                <th className="table-header">Date</th>
                <th className="table-header">Total TTC</th>
                <th className="table-header">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentInvoices.length > 0 ? (
                recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="table-cell">
                      <span className="font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-lg">
                        {invoice.invoice_number || invoice.number || 'N/A'}
                      </span>
                    </td>
                    <td className="table-cell font-semibold text-slate-700">
                      {invoice.client_name || invoice.client?.name || 'N/A'}
                    </td>
                    <td className="table-cell text-slate-500">
                      {invoice.date || invoice.created_at
                        ? new Date(invoice.date || invoice.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'N/A'}
                    </td>
                    <td className="table-cell font-black text-slate-800">
                      {formatCurrency(invoice.total_ttc || invoice.total || 0)} F CFA
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase ${
                        invoice.status === 'PAYE' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {invoice.status === 'PAYE' ? '✓ Payé' : '⏳ En attente'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="table-cell text-center text-slate-500 py-8">
                    Aucune facture récente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clients Récents */}
      <div className="card p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Clients Récents</h2>
            <p className="text-sm text-slate-400 font-medium mt-1">Derniers clients ajoutés</p>
          </div>
          <button
            onClick={() => navigate('/clients')}
            className="btn-secondary text-sm"
          >
            Voir tout
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Nom</th>
                <th className="table-header">Téléphone</th>
                <th className="table-header">Email</th>
                <th className="table-header">Date d'ajout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentClients.length > 0 ? (
                recentClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="table-cell font-semibold text-slate-800">{client.name}</td>
                    <td className="table-cell text-slate-600">{client.phone || 'N/A'}</td>
                    <td className="table-cell text-slate-600">{client.email || 'N/A'}</td>
                    <td className="table-cell text-slate-500">
                      {client.created_at
                        ? new Date(client.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="table-cell text-center text-slate-500 py-8">
                    Aucun client récent
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardCommercial;
