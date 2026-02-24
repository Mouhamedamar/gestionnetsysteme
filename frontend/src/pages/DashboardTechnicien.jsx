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
  Package,
  LogIn,
  LogOut
} from 'lucide-react';
import Loader from '../components/Loader';
import PageHeader from '../components/PageHeader';
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
  const role = user?.role || '';
  const isPointageOnly = role === 'pointage_only';
  const [interventions, setInterventions] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [pointages, setPointages] = useState([]);
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

  // Charger les pointages (pour rôle pointage seul)
  const fetchPointages = useCallback(async () => {
    if (!loggedIn) return;
    try {
      setFetching(true);
      const response = await apiCall('/api/pointages/', { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        const list = data.results ?? data;
        setPointages(Array.isArray(list) ? list : []);
      } else {
        setPointages([]);
      }
    } catch (e) {
      setPointages([]);
    } finally {
      setFetching(false);
    }
  }, [loggedIn, apiCall]);

  useEffect(() => {
    if (loggedIn && user?.id) {
      if (isPointageOnly) {
        fetchPointages();
      } else {
        fetchInterventions();
        fetchInstallations();
      }
    }
  }, [loggedIn, user?.id, isPointageOnly, fetchInterventions, fetchInstallations, fetchPointages]);

  // Statistiques (pour pointage_only : uniquement interventions)
  const stats = useMemo(() => {
    const interventionsEnCours = interventions.filter(i => i.status === 'EN_COURS').length;
    const interventionsTerminees = interventions.filter(i => i.status === 'TERMINE').length;
    const interventionsPlanifiees = interventions.filter(i => i.status === 'EN_ATTENTE').length;
    const installationsEnCours = isPointageOnly ? 0 : installations.filter(i => i.status === 'EN_COURS').length;
    const installationsTerminees = isPointageOnly ? 0 : installations.filter(i => i.status === 'TERMINEE').length;
    const installationsPlanifiees = isPointageOnly ? 0 : installations.filter(i => i.status === 'PLANIFIEE').length;

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
  }, [interventions, installations, isPointageOnly]);

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

  // Pour pointage_only : pointages du jour et lignes quotidiennes (DATE, AGENT, TYPE, ENTRÉE, SORTIE, DURÉE, LIEU, STATUT)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const pointagesAujourdhui = useMemo(() => {
    return pointages.filter((p) => p.timestamp && p.timestamp.startsWith(todayStr));
  }, [pointages, todayStr]);

  const formatDateShort = (str) => {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const formatTimeShort = (str) => {
    if (!str) return '—';
    return new Date(str).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  /** Lignes quotidiennes pour le rapport pointage : une ligne par jour/agent avec ENTRÉE, SORTIE, DURÉE, STATUT */
  const dailyPointageRows = useMemo(() => {
    const byKey = {};
    const list = Array.isArray(pointages) ? pointages : [];
    list.forEach((p) => {
      const d = new Date(p.timestamp);
      const dateStr = d.toISOString().slice(0, 10);
      const agentName = p.username ?? (typeof p.user === 'object' ? p.user?.username : null) ?? user?.username ?? '—';
      const key = `${agentName}_${dateStr}`;
      if (!byKey[key]) {
        byKey[key] = {
          key,
          date: dateStr,
          dateFormatted: formatDateShort(p.timestamp),
          agent: agentName,
          type: (p.work_zone_details?.zone_type === 'chantier' ? 'Chantier' : 'Bureau'),
          zoneTypeRaw: p.work_zone_details?.zone_type || 'bureau',
          entree: null,
          sortie: null,
          entreeTs: null,
          sortieTs: null,
          lieu: p.zone_name || (p.work_zone_details?.address || p.work_zone_details?.name) || '—',
        };
      }
      const row = byKey[key];
      if (p.check_type === 'entree') {
        if (!row.entreeTs || new Date(p.timestamp) < new Date(row.entreeTs)) {
          row.entree = formatTimeShort(p.timestamp);
          row.entreeTs = p.timestamp;
          if (!row.lieu || row.lieu === '—') row.lieu = p.zone_name || (p.work_zone_details?.address || p.work_zone_details?.name) || '—';
          if (p.work_zone_details?.zone_type) row.zoneTypeRaw = p.work_zone_details.zone_type;
          row.type = row.zoneTypeRaw === 'chantier' ? 'Chantier' : 'Bureau';
        }
      } else {
        if (!row.sortieTs || new Date(p.timestamp) > new Date(row.sortieTs)) {
          row.sortie = formatTimeShort(p.timestamp);
          row.sortieTs = p.timestamp;
        }
      }
    });
    const rows = Object.values(byKey).map((r) => {
      let duree = '—';
      let statut = 'En cours';
      if (r.entreeTs && r.sortieTs) {
        const ms = new Date(r.sortieTs) - new Date(r.entreeTs);
        const h = Math.round((ms / 3600000) * 10) / 10;
        duree = `${h}h`;
        statut = 'Present';
      }
      return { ...r, duree, statut, entree: r.entree || '—', sortie: r.sortie || '—' };
    });
    rows.sort((a, b) => (b.date + b.agent).localeCompare(a.date + a.agent));
    return rows;
  }, [pointages, user?.username]);

  /** Présence du mois en cours : jours avec statut Present + total heures (depuis dailyPointageRows) */
  const presenceMois = useMemo(() => {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const rowsMois = dailyPointageRows.filter((r) => r.date && r.date.startsWith(monthStr));
    const joursPresents = rowsMois.filter((r) => r.statut === 'Present').length;
    let totalHeures = 0;
    rowsMois.forEach((r) => {
      if (r.duree && r.duree.endsWith('h')) {
        const h = parseFloat(r.duree.replace('h', '').trim());
        if (!Number.isNaN(h)) totalHeures += h;
      }
    });
    totalHeures = Math.round(totalHeures * 10) / 10;
    const moisLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return { joursPresents, totalHeures, moisLabel, rowsMois };
  }, [dailyPointageRows]);

  if (loading || fetching) return <Loader />;

  // Tableau de bord dédié au pointage (rôle pointage seul)
  if (isPointageOnly) {
    const dernierPointage = [...pointages].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))[0];
    const dernierTexte = dernierPointage?.timestamp
      ? new Date(dernierPointage.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
      : '—';
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <PageHeader
          title={`Bienvenue, ${user?.username || 'Technicien'}`}
          subtitle={`${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} — Votre espace pointage`}
          badge="Tableau de bord"
          icon={Clock}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Pointages aujourd'hui"
            value={pointagesAujourdhui.length}
            icon={LogIn}
            color="blue"
            subtitle="Entrées et sorties du jour"
          />
          <StatCard
            title="Dernier pointage"
            value={dernierPointage?.check_type === 'entree' ? 'Entrée' : dernierPointage?.check_type === 'sortie' ? 'Sortie' : '—'}
            icon={dernierPointage?.check_type === 'sortie' ? LogOut : LogIn}
            color="green"
            subtitle={dernierTexte}
          />
          <StatCard
            title="Accéder au pointage"
            value="Page Pointage"
            icon={Clock}
            color="purple"
            subtitle="Pointer / Dépointer"
          />
          <StatCard
            title="Présence du mois"
            value={`${presenceMois.joursPresents} jours`}
            icon={CheckCircle2}
            color="blue"
            subtitle={`${presenceMois.moisLabel} — ${presenceMois.totalHeures}h total`}
          />
        </div>

        <div className="card p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-8 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Rapport de pointage</h2>
              <p className="text-sm text-slate-400 font-medium mt-1">Entrées et sorties par jour</p>
              <p className="text-sm font-semibold text-slate-600 mt-2">
                Présence du mois ({presenceMois.moisLabel}) : <span className="text-primary-600">nombre de jours = {presenceMois.joursPresents}</span>, <span className="text-primary-600">{presenceMois.totalHeures}h</span> total
              </p>
            </div>
            <button type="button" onClick={() => navigate('/pointage')} className="btn-primary text-sm">
              Voir tout / Pointer
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">DATE</th>
                  <th className="table-header">AGENT</th>
                  <th className="table-header">TYPE</th>
                  <th className="table-header">ENTRÉE</th>
                  <th className="table-header">SORTIE</th>
                  <th className="table-header">DURÉE</th>
                  <th className="table-header">LIEU</th>
                  <th className="table-header">STATUT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dailyPointageRows.length > 0 ? (
                  dailyPointageRows.map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50/80 transition-colors">
                      <td className="table-cell text-slate-800 font-medium">{row.dateFormatted}</td>
                      <td className="table-cell text-slate-700">{row.agent}</td>
                      <td className="table-cell text-slate-600">{row.type}</td>
                      <td className="table-cell text-slate-600">{row.entree}</td>
                      <td className="table-cell text-slate-600">{row.sortie}</td>
                      <td className="table-cell text-slate-600">{row.duree}</td>
                      <td className="table-cell text-slate-600">{row.lieu}</td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                          row.statut === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {row.statut}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="table-cell text-center text-slate-500 py-8">
                      Aucun pointage enregistré. Allez sur la page Pointage pour pointer.
                    </td>
                  </tr>
                )}
              </tbody>
              {dailyPointageRows.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-200 font-semibold text-slate-800">
                    <td colSpan="5" className="table-cell py-3 text-right">
                      Mois ({presenceMois.moisLabel}) — nombre de jours :
                    </td>
                    <td className="table-cell py-3">{presenceMois.totalHeures}h</td>
                    <td className="table-cell py-3">—</td>
                    <td className="table-cell py-3">{presenceMois.joursPresents} jours</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader
        title={`Bienvenue, ${user?.username || 'Technicien'}`}
        subtitle={`${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} — Votre espace de gestion des interventions et installations`}
        badge="Tableau de bord"
        icon={Wrench}
      />

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

      {/* Prochaines Installations (masqué pour pointage_only) */}
      {!isPointageOnly && (
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
      )}
    </div>
  );
};

export default DashboardTechnicien;
