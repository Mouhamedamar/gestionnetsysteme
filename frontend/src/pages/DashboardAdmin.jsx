import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Users,
  Settings,
  Wrench,
  ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, Cell } from 'recharts';
import Loader from '../components/Loader';
import PageHeader from '../components/PageHeader';
import StockAlertNotification from '../components/StockAlertNotification';
import { formatCurrency } from '../utils/formatCurrency';
import { API_BASE_URL } from '../config';

const StatCard = ({ title, value, icon: Icon, color, subtitle, trend, trendValue }) => {
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
          {trend && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${trend === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
              }`}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trendValue}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-black text-slate-800 mb-1 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Layers className="w-3 h-3" /> {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${bgGradient} opacity-50`}></div>
    </div>
  );
};

const DashboardAdmin = () => {
  const { dashboardStats, stockMovements, loading, users, clients } = useApp();

  if (loading) return <Loader />;

  const safeStats = dashboardStats || {};
  const monthlyRevenue = safeStats.monthly_revenue || [];
  const topProducts = safeStats.top_products || [];
  const topTechnicians = safeStats.top_technicians_installations || [];
  const topTechniciansInterventions = safeStats.top_technicians_interventions || [];

  /** Affiche le rang en français : 1er, 2e, 3e, 4e, 5e */
  const formatRank = (rank) => {
    if (rank === 1) return '1er';
    if (rank >= 2 && rank <= 9) return `${rank}e`;
    return `${rank}e`;
  };
  
  // Filtrer les produits avec stock faible
  const lowStockProducts = (safeStats.top_products || []).filter(product => product.is_low_stock);

  const stats = [
    {
      title: 'Total Produits',
      value: safeStats.total_products ?? 0,
      icon: Package,
      color: 'blue',
      subtitle: 'Produits actifs',
      trend: 'up',
      trendValue: '+12%'
    },
    {
      title: 'Rupture Stock',
      value: safeStats.low_stock_products ?? 0,
      icon: AlertTriangle,
      color: 'red',
      subtitle: 'Réapprovisionner',
      trend: 'down',
      trendValue: '-5%'
    },
    {
      title: 'Valeur Stock',
      value: `${formatCurrency(safeStats.stock_value ?? 0)} F CFA`,
      icon: DollarSign,
      color: 'green',
      subtitle: 'Inventaire total',
      trend: 'up',
      trendValue: '+8%'
    },
    {
      title: 'Factures',
      value: safeStats.total_invoices ?? 0,
      icon: FileText,
      color: 'purple',
      subtitle: 'Ce mois-ci',
      trend: 'up',
      trendValue: '+15%'
    },
    {
      title: 'CA Global',
      value: `${formatCurrency(safeStats.revenue ?? 0)} F CFA`,
      icon: TrendingUp,
      color: 'yellow',
      subtitle: 'Revenus payés',
      trend: 'up',
      trendValue: '+22%'
    },
    {
      title: 'Utilisateurs',
      value: users?.length ?? 0,
      icon: Users,
      color: 'blue',
      subtitle: 'Comptes actifs',
      trend: 'up',
      trendValue: '+3'
    },
    {
      title: 'Clients',
      value: clients?.length ?? 0,
      icon: Users,
      color: 'green',
      subtitle: 'Base clients',
      trend: 'up',
      trendValue: '+8'
    }
  ];

  const stockMovementChartData = useMemo(() => {
    if (!stockMovements || stockMovements.length === 0) return [];
    const map = new Map();
    stockMovements.forEach((movement) => {
      const dateKey = new Date(movement.date).toISOString().split('T')[0];
      const existing = map.get(dateKey) || { date: dateKey, ENTREE: 0, SORTIE: 0 };
      if (movement.movement_type === 'ENTREE') {
        existing.ENTREE += movement.quantity;
      } else if (movement.movement_type === 'SORTIE') {
        existing.SORTIE += movement.quantity;
      }
      map.set(dateKey, existing);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [stockMovements]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Rappel produits en stock faible – en haut du dashboard */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <div className="animate-slide-up">
          <div className="glass-card border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/80 shadow-lg rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black text-amber-900">
                  Produits en stock faible
                </h2>
                <p className="text-sm text-amber-800/90 mt-0.5">
                  {lowStockProducts.length} produit{lowStockProducts.length > 1 ? 's' : ''} à réapprovisionner
                </p>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-amber-900/90">
                  {lowStockProducts.slice(0, 5).map((p) => (
                    <li key={p.id} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      <span className="truncate max-w-[140px] sm:max-w-none">{p.name}</span>
                      {p.quantity != null && (
                        <span className="text-amber-700 font-semibold">({p.quantity})</span>
                      )}
                    </li>
                  ))}
                  {lowStockProducts.length > 5 && (
                    <li className="text-amber-700">+ {lowStockProducts.length - 5} autre{lowStockProducts.length - 5 > 1 ? 's' : ''}</li>
                  )}
                </ul>
              </div>
            </div>
            <div className="flex flex-shrink-0 flex-wrap gap-2">
              <Link
                to="/stock-reminders"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 shadow-md hover:shadow-lg transition-all"
              >
                Envoyer les rappels
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/90 text-amber-800 font-bold text-sm hover:bg-white border border-amber-200 transition-all"
              >
                Voir les produits
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Notification flottante (rappel complémentaire) */}
      <StockAlertNotification lowStockProducts={lowStockProducts} />

      <PageHeader
        title="Tableau de Bord Administrateur"
        subtitle={`${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} — Gestion complète de l'application`}
        badge="Administration"
        icon={Settings}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 70}ms`, animationFillMode: 'both' }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="card p-8 group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Chiffre d'Affaires</h2>
              <p className="text-sm text-slate-400 font-medium mt-1">Évolution sur 6 mois</p>
            </div>
            <div className="bg-primary-50 p-3 rounded-2xl text-primary-600 group-hover:rotate-12 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                tickFormatter={(value) => new Date(value + '-01').toLocaleDateString('fr-FR', { month: 'short' })}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                formatter={(value) => [`${formatCurrency(value)} F CFA`, 'Revenu']}
              />
              <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Chart */}
        <div className="card p-8 group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Meilleures Ventes</h2>
              <p className="text-sm text-slate-400 font-medium mt-1">Top 5 produits</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 group-hover:rotate-12 transition-transform">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
              <Bar dataKey="total_sold" radius={[6, 6, 0, 0]}>
                {topProducts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#10b981'][index % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stock Movements Chart */}
        <div className="card p-8 group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Flux de Stock</h2>
              <p className="text-sm text-slate-400 font-medium mt-1">Entrées vs Sorties</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-2xl text-amber-600 group-hover:rotate-12 transition-transform">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockMovementChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
              <Bar dataKey="ENTREE" name="Entrées" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="SORTIE" name="Sorties" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Classement des techniciens par installations */}
      <div className="card p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Top Techniciens (Installations)</h2>
            <p className="text-sm text-slate-400 font-medium mt-1">Classement par nombre d&apos;installations terminées</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl text-slate-700">
            <Wrench className="w-6 h-6" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Rang</th>
                <th className="table-header">Technicien</th>
                <th className="table-header">Installations terminées</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topTechnicians.map((tech) => (
                <tr key={tech.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="table-cell">
                    <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-full font-bold text-sm ${
                      tech.rank === 1
                        ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                        : tech.rank === 2
                        ? 'bg-slate-200 text-slate-800 ring-1 ring-slate-300'
                        : tech.rank === 3
                        ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {formatRank(tech.rank)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                        {(tech.full_name || tech.username || '?').trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {tech.full_name?.trim() || tech.username || '—'}
                        </p>
                        {tech.username && (tech.full_name?.trim() || '').toLowerCase() !== tech.username.toLowerCase() && (
                          <p className="text-xs text-slate-500 truncate">@{tech.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-sm">
                      {typeof tech.total_installations === 'number' ? tech.total_installations : (tech.total_installations ?? 0)} installation{(tech.total_installations ?? 0) > 1 ? 's' : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {topTechnicians.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <Wrench className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Aucune installation terminée pour le moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Classement des techniciens par interventions */}
      <div className="card p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Top Techniciens (Interventions)</h2>
            <p className="text-sm text-slate-400 font-medium mt-1">Classement par nombre d&apos;interventions terminées</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl text-slate-700">
            <Wrench className="w-6 h-6" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Rang</th>
                <th className="table-header">Technicien</th>
                <th className="table-header">Interventions terminées</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topTechniciansInterventions.map((tech) => (
                <tr key={tech.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="table-cell">
                    <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-full font-bold text-sm ${
                      tech.rank === 1
                        ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                        : tech.rank === 2
                        ? 'bg-slate-200 text-slate-800 ring-1 ring-slate-300'
                        : tech.rank === 3
                        ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {formatRank(tech.rank)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                        {(tech.full_name || tech.username || '?').trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {tech.full_name?.trim() || tech.username || '—'}
                        </p>
                        {tech.username && (tech.full_name?.trim() || '').toLowerCase() !== tech.username.toLowerCase() && (
                          <p className="text-xs text-slate-500 truncate">@{tech.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-sm">
                      {typeof tech.total_interventions === 'number' ? tech.total_interventions : (tech.total_interventions ?? 0)} intervention{(tech.total_interventions ?? 0) > 1 ? 's' : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {topTechniciansInterventions.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <Wrench className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Aucune intervention terminée pour le moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Selling Products Table */}
      <div className="card p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Produits les Plus Vendus</h2>
            <p className="text-sm text-slate-400 font-medium mt-1">Classement des meilleures ventes</p>
          </div>
          <TrendingUp className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Rang</th>
                <th className="table-header">Image</th>
                <th className="table-header">Produit</th>
                <th className="table-header">Catégorie</th>
                <th className="table-header">Quantité Vendue</th>
                <th className="table-header">Prix Unitaire</th>
                <th className="table-header">Revenu Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topProducts.map((product, index) => (
                <tr key={product.id || index} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="table-cell">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                      index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                      {product.photo ? (
                        <img
                          src={
                            product.photo.startsWith('http')
                              ? product.photo
                              : product.photo.startsWith('/media')
                              ? `${API_BASE_URL}${product.photo}`
                              : `${API_BASE_URL}/media/products/${product.photo}`
                          }
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<Package className="w-6 h-6 text-slate-400" />';
                          }}
                        />
                      ) : (
                        <Package className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                  </td>
                  <td className="table-cell font-semibold text-slate-800">
                    <div className="relative inline-block">
                      {product.name}
                      {product.is_low_stock && (
                        <div className="absolute -top-1 -right-6 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse-blink shadow-lg whitespace-nowrap">
                          <AlertTriangle className="w-3 h-3 animate-bounce" />
                          Stock ⚠️
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell text-slate-600">{product.category}</td>
                  <td className="table-cell">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold">
                      {product.total_sold} unités
                    </span>
                  </td>
                  <td className="table-cell text-slate-700 font-semibold">
                    {formatCurrency(product.sale_price || 0)} F CFA
                  </td>
                  <td className="table-cell font-black text-slate-800">
                    {formatCurrency(product.total_sold * (product.sale_price || 0))} F CFA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {topProducts.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Aucune donnée de vente disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="card p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Factures Récentes</h2>
            <p className="text-sm text-slate-400 font-medium mt-1">Suivi des dernières transactions</p>
          </div>
          <button className="btn-secondary text-sm">Voir tout</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Numéro</th>
                <th className="table-header">Client</th>
                <th className="table-header">Date</th>
                <th className="table-header">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(safeStats.recent_invoices || []).slice(0, 5).map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="table-cell">
                    <span className="font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-lg">{invoice.invoice_number}</span>
                  </td>
                  <td className="table-cell font-semibold text-slate-700">{invoice.client_name || 'N/A'}</td>
                  <td className="table-cell text-slate-500">
                    {new Date(invoice.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="table-cell font-black text-slate-800">
                    {formatCurrency(invoice.total_ttc)} F CFA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
