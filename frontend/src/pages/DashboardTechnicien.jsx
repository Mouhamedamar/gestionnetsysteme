import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wrench,
  Settings,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  User,
  TrendingUp,
  Package
} from 'lucide-react';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';

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

const DashboardTechnicien = () => {
  const { user, loggedIn, apiCall, loading } = useApp();
  const navigate = useNavigate();
  const [interventions, setInterventions] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [fetching, setFetching] = useState(false);

  // Charger les interventions du technicien
  const fetchInterventions = useCallback(async () => {
    if (!loggedIn || !user?.id) return;
    try {
      setFetching(true);
      const response = await apiCall(`/api/interventions/?technician=${user.id}`, {
        method: 'GET'
      });
      if (response.ok) {
        const data = await response.json();
        const apiInterventions = data.results || data;
        setInterventions(Array.isArray(apiInterventions) ? apiInterventions : []);
      }
    } catch (error) {
      console.error('Erreur fetchInterventions:', error);
      setInterventions([]);
    } finally {
      setFetching(false);
    }
  }, [loggedIn, user?.id, apiCall]);

  // Charger les installations du technicien
  const fetchInstallations = useCallback(async () => {
    if (!loggedIn || !user?.id) return;
    try {
      setFetching(true);
      const response = await apiCall(`/api/installations/?technician=${user.id}`, {
        method: 'GET'
      });
      if (response.ok) {
        const data = await response.json();
        const apiInstallations = data.results || data;
        setInstallations(Array.isArray(apiInstallations) ? apiInstallations : []);
      }
    } catch (error) {
      console.error('Erreur fetchInstallations:', error);
      setInstallations([]);
    } finally {
      setFetching(false);
    }
  }, [loggedIn, user?.id, apiCall]);

  useEffect(() => {
    if (loggedIn && user?.id) {
      fetchInterventions();
      fetchInstallations();
    }
  }, [loggedIn, user?.id, fetchInterventions, fetchInstallations]);

  // Statistiques
  const stats = useMemo(() => {
    const interventionsEnCours = interventions.filter(i => i.status === 'EN_COURS').length;
    const interventionsTerminees = interventions.filter(i => i.status === 'TERMINE').length;
    const installationsEnCours = installations.filter(i => i.status === 'EN_COURS').length;
    const installationsTerminees = installations.filter(i => i.status === 'TERMINEE').length;
    const interventionsPlanifiees = interventions.filter(i => i.status === 'EN_ATTENTE').length;
    const installationsPlanifiees = installations.filter(i => i.status === 'PLANIFIEE').length;

    return {
      interventionsEnCours,
      interventionsTerminees,
      installationsEnCours,
      installationsTerminees,
      interventionsPlanifiees,
      installationsPlanifiees,
      totalEnCours: interventionsEnCours + installationsEnCours,
      totalTerminees: interventionsTerminees + installationsTerminees,
      totalPlanifiees: interventionsPlanifiees + installationsPlanifiees
    };
  }, [interventions, installations]);

  // Interventions à venir (prochaines 5)
  const upcomingInterventions = useMemo(() => {
    return interventions
      .filter(i => i.status === 'EN_ATTENTE' || i.status === 'EN_COURS')
      .sort((a, b) => {
        const dateA = a.scheduled_date ? new Date(a.scheduled_date) : new Date(0);
        const dateB = b.scheduled_date ? new Date(b.scheduled_date) : new Date(0);
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [interventions]);

  // Installations à venir (prochaines 5)
  const upcomingInstallations = useMemo(() => {
    return installations
      .filter(i => i.status === 'PLANIFIEE' || i.status === 'EN_COURS')
      .sort((a, b) => {
        const dateA = a.scheduled_date ? new Date(a.scheduled_date) : new Date(0);
        const dateB = b.scheduled_date ? new Date(b.scheduled_date) : new Date(0);
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [installations]);

  if (loading || fetching) return <Loader />;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Header */}
      <div className="glass-card p-8 border-white/40 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Wrench className="w-32 h-32 text-primary-600" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-1 w-12 bg-primary-600 rounded-full"></div>
            <span className="text-primary-600 font-bold uppercase tracking-widest text-xs">Tableau de bord</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">
            Bienvenue, {user?.username || 'Technicien'}
          </h1>
          <div className="flex items-center gap-4 text-slate-500">
            <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-lg border border-slate-200/50">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-semibold">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="h-4 w-px bg-slate-300"></div>
            <p className="text-sm font-medium">Votre espace de gestion des interventions et installations.</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="En Cours"
          value={stats.totalEnCours}
          icon={Clock}
          color="yellow"
          subtitle={`${stats.interventionsEnCours} interventions, ${stats.installationsEnCours} installations`}
        />
        <StatCard
          title="Terminées"
          value={stats.totalTerminees}
          icon={CheckCircle2}
          color="green"
          subtitle={`${stats.interventionsTerminees} interventions, ${stats.installationsTerminees} installations`}
        />
        <StatCard
          title="Planifiées"
          value={stats.totalPlanifiees}
          icon={Calendar}
          color="blue"
          subtitle={`${stats.interventionsPlanifiees} interventions, ${stats.installationsPlanifiees} installations`}
        />
        <StatCard
          title="Total"
          value={interventions.length + installations.length}
          icon={TrendingUp}
          color="purple"
          subtitle="Toutes vos missions"
        />
      </div>

      {/* Prochaines Interventions */}
      <div className="card p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Prochaines Interventions</h2>
            <p className="text-sm text-slate-400 font-medium mt-1">Vos interventions à venir</p>
          </div>
          <button
            onClick={() => navigate('/interventions')}
            className="btn-secondary text-sm"
          >
            Voir tout
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Titre</th>
                <th className="table-header">Client</th>
                <th className="table-header">Date prévue</th>
                <th className="table-header">Priorité</th>
                <th className="table-header">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {upcomingInterventions.length > 0 ? (
                upcomingInterventions.map((intervention) => (
                  <tr key={intervention.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="table-cell font-semibold text-slate-800">{intervention.title}</td>
                    <td className="table-cell text-slate-600">{intervention.client_name || intervention.client?.name || 'N/A'}</td>
                    <td className="table-cell text-slate-500">
                      {intervention.scheduled_date
                        ? new Date(intervention.scheduled_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Non planifiée'}
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                        intervention.priority === 'URGENTE' ? 'bg-red-100 text-red-700' :
                        intervention.priority === 'HAUTE' ? 'bg-orange-100 text-orange-700' :
                        intervention.priority === 'NORMALE' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {intervention.priority}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                        intervention.status === 'EN_COURS' ? 'bg-yellow-100 text-yellow-700' :
                        intervention.status === 'TERMINE' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {intervention.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="table-cell text-center text-slate-500 py-8">
                    Aucune intervention planifiée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prochaines Installations */}
      <div className="card p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Prochaines Installations</h2>
            <p className="text-sm text-slate-400 font-medium mt-1">Vos installations à venir</p>
          </div>
          <button
            onClick={() => navigate('/installations')}
            className="btn-secondary text-sm"
          >
            Voir tout
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Titre</th>
                <th className="table-header">Client</th>
                <th className="table-header">Type</th>
                <th className="table-header">Date prévue</th>
                <th className="table-header">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {upcomingInstallations.length > 0 ? (
                upcomingInstallations.map((installation) => (
                  <tr key={installation.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="table-cell font-semibold text-slate-800">{installation.title}</td>
                    <td className="table-cell text-slate-600">{installation.client_name || installation.client?.name || 'N/A'}</td>
                    <td className="table-cell text-slate-500">{installation.installation_type || 'N/A'}</td>
                    <td className="table-cell text-slate-500">
                      {installation.scheduled_date
                        ? new Date(installation.scheduled_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Non planifiée'}
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                        installation.status === 'EN_COURS' ? 'bg-yellow-100 text-yellow-700' :
                        installation.status === 'TERMINEE' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {installation.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="table-cell text-center text-slate-500 py-8">
                    Aucune installation planifiée
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

export default DashboardTechnicien;
