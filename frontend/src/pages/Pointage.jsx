import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, LogIn, LogOut, MapPin, Building2, HardHat, Filter, Eye, X, Copy, FileSpreadsheet, FileText, FileDown, Printer, Search, CheckCircle } from 'lucide-react';
import Loader from '../components/Loader';
import PageHeader from '../components/PageHeader';
import ZoneMapPreview from '../components/ZoneMapPreview';
import Modal from '../components/Modal';
import { exportToCSV } from '../utils/exportData';
import jsPDF from 'jspdf';

const DAKAR_FALLBACK = { lat: 14.7167, lng: -17.4677, radius_m: 100 };

/** Distance en mètres entre deux points (formule de Haversine). */
function distanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Retourne true si la position (lat, lng) est dans la zone (centre + rayon en m). */
function isInsideZone(userLat, userLng, zone) {
  if (userLat == null || userLng == null) return false;
  const zLat = zone?.latitude != null && zone?.latitude !== '' ? Number(zone.latitude) : null;
  const zLng = zone?.longitude != null && zone?.longitude !== '' ? Number(zone.longitude) : null;
  const radius = zone?.radius_m != null && zone?.radius_m !== '' ? Number(zone.radius_m) : 0;
  if (zLat == null || zLng == null || Number.isNaN(zLat) || Number.isNaN(zLng) || radius < 0) return true;
  const dist = distanceInMeters(userLat, userLng, zLat, zLng);
  return dist <= radius;
}

/** Retourne une zone avec lat/lng/radius garantis pour l'affichage carte (évite carte vide côté utilisateur). */
function normalizeZoneForMap(zone) {
  if (!zone) return null;
  return {
    ...zone,
    latitude: zone.latitude != null && zone.latitude !== '' ? Number(zone.latitude) : DAKAR_FALLBACK.lat,
    longitude: zone.longitude != null && zone.longitude !== '' ? Number(zone.longitude) : DAKAR_FALLBACK.lng,
    radius_m: zone.radius_m != null && zone.radius_m !== '' ? Number(zone.radius_m) : DAKAR_FALLBACK.radius_m,
  };
}

const Pointage = () => {
  const { user, loggedIn, apiCall, showNotification, users } = useApp();
  const role = user?.role || 'admin';
  const isAdmin = role === 'admin' || user?.is_staff;

  const [pointages, setPointages] = useState([]);
  const [workZones, setWorkZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [positionLoading, setPositionLoading] = useState(false);
  const [positionError, setPositionError] = useState(null);
  const [selectedPointageForMap, setSelectedPointageForMap] = useState(null);
  const [modalMapReady, setModalMapReady] = useState(false);
  const modalMapContainerRef = React.useRef(null);
  const [hideZoneStatusAfterPoint, setHideZoneStatusAfterPoint] = useState(false);
  const hideZoneStatusTimeoutRef = React.useRef(null);
  const [filterUser, setFilterUser] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDateAfter, setFilterDateAfter] = useState('');
  const [filterDateBefore, setFilterDateBefore] = useState('');
  const [searchPointage, setSearchPointage] = useState('');
  const pointageTableRef = React.useRef(null);

  const buildPointagesUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (isAdmin && filterUser) params.set('user', filterUser);
    if (isAdmin && filterZone) params.set('work_zone', filterZone);
    if (isAdmin && filterType) params.set('check_type', filterType);
    if (isAdmin && filterDateAfter) params.set('date_after', filterDateAfter);
    if (isAdmin && filterDateBefore) params.set('date_before', filterDateBefore);
    const qs = params.toString();
    return qs ? `/api/pointages/?${qs}` : '/api/pointages/';
  }, [isAdmin, filterUser, filterZone, filterType, filterDateAfter, filterDateBefore]);

  const fetchPointages = useCallback(async () => {
    if (!loggedIn) return;
    try {
      setLoading(true);
      const url = buildPointagesUrl();
      const response = await apiCall(url, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        const list = data.results ?? data;
        setPointages(Array.isArray(list) ? list : []);
      } else if (response.status === 403) {
        setPointages([]);
      }
    } catch (e) {
      setPointages([]);
    } finally {
      setLoading(false);
    }
  }, [loggedIn, apiCall, buildPointagesUrl]);

  const fetchWorkZones = useCallback(async () => {
    if (!loggedIn) return;
    try {
      setZonesLoading(true);
      const response = await apiCall('/api/work-zones/', { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        const list = data.results ?? data;
        const zones = Array.isArray(list) ? list : [];
        setWorkZones(zones);
      } else if (response.status === 403) {
        setWorkZones([]);
      }
    } catch (e) {
      setWorkZones([]);
    } finally {
      setZonesLoading(false);
    }
  }, [loggedIn, apiCall]);

  useEffect(() => {
    if (loggedIn) {
      fetchPointages();
      fetchWorkZones();
    }
  }, [loggedIn, fetchPointages, fetchWorkZones]);

  useEffect(() => {
    if (!selectedPointageForMap) {
      setModalMapReady(false);
      return;
    }
    setModalMapReady(false);
    let t2Id;
    const tryShowMap = () => {
      const el = modalMapContainerRef.current;
      if (el && el.offsetHeight > 0 && el.offsetWidth > 0) {
        setModalMapReady(true);
        return true;
      }
      return false;
    };
    const t1Id = setTimeout(() => {
      if (!tryShowMap()) t2Id = setTimeout(() => setModalMapReady(true), 400);
    }, 600);
    return () => {
      clearTimeout(t1Id);
      if (t2Id) clearTimeout(t2Id);
    };
  }, [selectedPointageForMap]);

  /** Normalise lat/lng : corrige une éventuelle inversion (latitude doit être entre -90 et 90). */
  const normalizeCoords = useCallback((latitude, longitude) => {
    let lat = Number(latitude);
    let lng = Number(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return { lat: latitude, lng: longitude };
    if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
      [lat, lng] = [lng, lat];
    }
    return { lat, lng };
  }, []);

  const refreshUserPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setPositionError('Géolocalisation non supportée par le navigateur.');
      return;
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setPositionError('La géolocalisation nécessite une connexion sécurisée (HTTPS) ou l\'utilisation de localhost. Ouvrez la page en https:// ou via http://localhost.');
      setPositionLoading(false);
      return;
    }
    setPositionError(null);
    setPositionLoading(true);

    const updateFromPos = (pos) => {
      const { lat, lng } = normalizeCoords(pos.coords.latitude, pos.coords.longitude);
      const accuracy = typeof pos.coords.accuracy === 'number' && pos.coords.accuracy > 0 ? Math.round(pos.coords.accuracy) : null;
      setUserPosition({ lat, lng, accuracy });
      setPositionLoading(false);
    };
    const onError = (err) => {
      const code = err?.code;
      const msg =
        code === 1
          ? 'Autorisez l\'accès à la position dans votre navigateur (icône cadenas ou paramètres du site).'
          : code === 2
            ? 'Position indisponible. Vérifiez votre connexion ou utilisez un appareil avec GPS.'
            : code === 3
              ? 'Délai dépassé. Cliquez sur « Rafraîchir ma position » ou rapprochez-vous d\'une fenêtre.'
              : err?.message || 'Impossible d\'obtenir la position.';
      setPositionError(msg);
      setUserPosition(null);
      setPositionLoading(false);
    };

    // 1) Essai très rapide : accepter une position en cache (jusqu'à 5 min) pour affichage immédiat
    const optionsCacheFirst = { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 };
    // 2) Sinon essai réseau (sans GPS, plus rapide que GPS)
    const optionsNetwork = { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 };
    // 3) Dernier recours : GPS (le plus lent)
    const optionsGps = { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(
      updateFromPos,
      () => {
        navigator.geolocation.getCurrentPosition(
          updateFromPos,
          () => {
            navigator.geolocation.getCurrentPosition(updateFromPos, onError, optionsGps);
          },
          optionsNetwork
        );
      },
      optionsCacheFirst
    );
  }, [normalizeCoords]);

  /** Suivi de la position en direct : watchPosition + mise à jour périodique. */
  useEffect(() => {
    if (!loggedIn || !navigator.geolocation || typeof window !== 'undefined' && !window.isSecureContext) return;

    const updatePosition = (pos) => {
      const { lat, lng } = normalizeCoords(pos.coords.latitude, pos.coords.longitude);
      const accuracy = typeof pos.coords.accuracy === 'number' && pos.coords.accuracy > 0 ? Math.round(pos.coords.accuracy) : null;
      setUserPosition({ lat, lng, accuracy });
      setPositionLoading(false);
      setPositionError(null);
    };
    const onError = () => {
      setPositionLoading(false);
      // En cas d'échec du watch, tenter une position en cache pour afficher quand même quelque chose
      navigator.geolocation.getCurrentPosition(updatePosition, () => {}, { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 });
    };
    const optionsWatch = { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 };
    const optionsCache = { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 };

    const watchId = navigator.geolocation.watchPosition(updatePosition, onError, optionsWatch);

    const intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(updatePosition, () => {}, optionsCache);
    }, 5000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(intervalId);
    };
  }, [loggedIn, normalizeCoords]);

  /** Demander la position dès l'arrivée sur la page pour que l'utilisateur voie sa position exacte sur la carte avant de pointer */
  useEffect(() => {
    if (loggedIn) {
      refreshUserPosition();
    }
  }, [loggedIn, refreshUserPosition]);

  useEffect(() => {
    return () => {
      if (hideZoneStatusTimeoutRef.current) clearTimeout(hideZoneStatusTimeoutRef.current);
    };
  }, []);

  const handlePointer = async (checkType) => {
    if (isAdmin) return;

    const zoneWithCoords = workZones.find(
      (z) => z != null && z.latitude != null && z.latitude !== '' && z.longitude != null && z.longitude !== '' && z.radius_m != null && z.radius_m !== ''
    ) || null;

    if (!zoneWithCoords) {
      showNotification(
        workZones.length > 0
          ? 'Aucune zone n\'a de coordonnées (latitude, longitude, rayon). L\'administrateur doit les renseigner dans Zone de travail.'
          : 'Aucune zone de travail configurée. L\'administrateur doit créer une zone avec latitude, longitude et rayon.',
        'error'
      );
      return;
    }

    const predefinedZone = zoneWithCoords;

    if (!navigator.geolocation) {
      showNotification('La géolocalisation est requise pour pointer. Activez-la dans votre navigateur.', 'error');
      return;
    }

    setSubmitting(checkType);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { lat, lng } = normalizeCoords(pos.coords.latitude, pos.coords.longitude);
        const accuracy = typeof pos.coords.accuracy === 'number' && pos.coords.accuracy > 0 ? Math.round(pos.coords.accuracy) : null;
        setUserPosition({ lat, lng, accuracy });
        if (!isInsideZone(lat, lng, predefinedZone)) {
          const radius = Number(predefinedZone.radius_m) || 100;
          const zLat = Number(predefinedZone.latitude);
          const zLng = Number(predefinedZone.longitude);
          const dist = Math.round(distanceInMeters(lat, lng, zLat, zLng));
          showNotification(`Vous n'êtes pas dans la zone autorisée « ${predefinedZone.name } ». Distance : ${dist} m (max : ${radius} m). Rapprochez-vous pour pointer.`, 'error');
          setSubmitting(null);
          return;
        }
        await submitPointage(checkType, predefinedZone, lat, lng);
        setSubmitting(null);
      },
      (err) => {
        showNotification('Impossible de vérifier votre position. Autorisez la géolocalisation pour pointer.', 'error');
        setSubmitting(null);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const submitPointage = async (checkType, selectedZone, latitude, longitude) => {
    const body = { check_type: checkType };
    if (!isAdmin && latitude != null && longitude != null) {
      body.latitude = latitude;
      body.longitude = longitude;
    } else if (isAdmin && selectedZone) {
      body.work_zone = Number(selectedZone.id);
      if (latitude != null && longitude != null) {
        body.latitude = latitude;
        body.longitude = longitude;
      }
    } else if (isAdmin && selectedZone == null) {
      body.work_zone = null;
    }
    const response = await apiCall('/api/pointages/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      showNotification(checkType === 'entree' ? 'Entrée enregistrée' : 'Sortie enregistrée');
      setHideZoneStatusAfterPoint(true);
      if (hideZoneStatusTimeoutRef.current) clearTimeout(hideZoneStatusTimeoutRef.current);
      hideZoneStatusTimeoutRef.current = setTimeout(() => setHideZoneStatusAfterPoint(false), 6000);
      const data = await response.json().catch(() => ({}));
      fetchPointages();
      const zoneDetails = selectedZone
        ? {
            id: selectedZone.id,
            name: selectedZone.name,
            address: selectedZone.address ?? '',
            zone_type: selectedZone.zone_type,
            latitude: selectedZone.latitude != null && selectedZone.latitude !== '' ? Number(selectedZone.latitude) : 14.7167,
            longitude: selectedZone.longitude != null && selectedZone.longitude !== '' ? Number(selectedZone.longitude) : -17.4677,
            radius_m: selectedZone.radius_m != null && selectedZone.radius_m !== '' ? Number(selectedZone.radius_m) : 100,
          }
        : { id: null, name: 'Sans zone', address: '', zone_type: 'bureau', latitude: 14.7167, longitude: -17.4677, radius_m: 100 };
      const pointageForMap = {
        ...(data || {}),
        zone_name: selectedZone?.name ?? 'Sans zone',
        work_zone_details: zoneDetails,
        check_type: checkType,
        timestamp: data?.timestamp || new Date().toISOString(),
        username: user?.username,
      };
      setSelectedPointageForMap(pointageForMap);
      if (navigator.geolocation && (latitude == null || longitude == null)) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { lat, lng } = normalizeCoords(pos.coords.latitude, pos.coords.longitude);
            setUserPosition({ lat, lng });
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      }
    } else {
      const data = await response.json().catch(() => ({}));
      showNotification(data.detail || data.error || 'Erreur', 'error');
    }
  };

  const formatDate = (str) => {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const formatTime = (str) => {
    if (!str) return '—';
    return new Date(str).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  const formatDateShort = (str) => {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const formatTimeShort = (str) => {
    if (!str) return '—';
    return new Date(str).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  /** Construit les lignes "quotidiennes" (une ligne par jour/agent) : DATE, AGENT, TYPE, ENTRÉE, SORTIE, DURÉE, LIEU, STATUT */
  const dailyRows = useMemo(() => {
    const byKey = {};
    const list = Array.isArray(pointages) ? pointages : [];
    list.forEach((p) => {
      const d = new Date(p.timestamp);
      const dateStr = d.toISOString().slice(0, 10);
      const key = `${p.username ?? p.user ?? ''}_${dateStr}`;
      if (!byKey[key]) {
        byKey[key] = {
          key,
          date: dateStr,
          dateFormatted: formatDateShort(p.timestamp),
          agent: p.username ?? (typeof p.user === 'object' ? p.user?.username : null) ?? '—',
          type: (p.work_zone_details?.zone_type === 'chantier' ? 'Chantier' : 'Bureau'),
          zoneTypeRaw: p.work_zone_details?.zone_type || 'bureau',
          entree: null,
          sortie: null,
          entreeTs: null,
          sortieTs: null,
          lieu: p.zone_name || (p.work_zone_details?.address || p.work_zone_details?.name) || '—',
          pointageEntree: null,
          pointageSortie: null,
        };
      }
      const row = byKey[key];
      if (p.check_type === 'entree') {
        if (!row.entreeTs || new Date(p.timestamp) < new Date(row.entreeTs)) {
          row.entree = formatTimeShort(p.timestamp);
          row.entreeTs = p.timestamp;
          row.pointageEntree = p;
          if (!row.lieu || row.lieu === '—') row.lieu = p.zone_name || (p.work_zone_details?.address || p.work_zone_details?.name) || '—';
          if (p.work_zone_details?.zone_type) row.zoneTypeRaw = p.work_zone_details.zone_type;
          row.type = row.zoneTypeRaw === 'chantier' ? 'Chantier' : 'Bureau';
        }
      } else {
        if (!row.sortieTs || new Date(p.timestamp) > new Date(row.sortieTs)) {
          row.sortie = formatTimeShort(p.timestamp);
          row.sortieTs = p.timestamp;
          row.pointageSortie = p;
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
  }, [pointages]);

  const filteredDailyRows = useMemo(() => {
    if (!searchPointage.trim()) return dailyRows;
    const q = searchPointage.trim().toLowerCase();
    return dailyRows.filter(
      (r) =>
        (r.agent && r.agent.toLowerCase().includes(q)) ||
        (r.dateFormatted && r.dateFormatted.toLowerCase().includes(q)) ||
        (r.type && r.type.toLowerCase().includes(q)) ||
        (r.lieu && r.lieu.toLowerCase().includes(q)) ||
        (r.statut && r.statut.toLowerCase().includes(q))
    );
  }, [dailyRows, searchPointage]);

  /** Une zone est "configurée" seulement si elle a latitude, longitude et rayon (sinon le backend refuse le pointage). */
  const zoneHasCoords = (z) =>
    z != null &&
    z.latitude != null && z.latitude !== '' &&
    z.longitude != null && z.longitude !== '' &&
    z.radius_m != null && z.radius_m !== '';
  /** Zone prédéfinie pour le pointage : première zone avec coordonnées complètes (sans ça, "aucune zone configurée"). */
  const predefinedZone = workZones.find(zoneHasCoords) || null;

  /** Dernier pointage de l'utilisateur (liste triée par -timestamp). */
  const lastPointage = pointages[0];
  /** True si l'utilisateur a pointé l'entrée et peut dépointer (bouton Dépointer affiché). */
  const canDepointer = lastPointage?.check_type === 'entree';

  /** Retourne la date locale au format YYYY-MM-DD pour comparer avec "aujourd'hui". */
  const toLocalDateStr = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const todayStr = toLocalDateStr(new Date());
  const lastPointageIsToday = lastPointage && toLocalDateStr(lastPointage.timestamp) === todayStr;
  /** Journée terminée : l'utilisateur a dépointé (sortie) aujourd'hui → afficher "Journée terminée", pas de bouton Pointer. */
  const dayCompleted = lastPointage?.check_type === 'sortie' && lastPointageIsToday;
  /** Afficher le bouton "Pointer l'entrée" seulement si pas en cours (entree) et pas journée terminée → disponible le lendemain. */
  const canPointerEntree = !canDepointer && !dayCompleted;

  /** Distance (m) de l'utilisateur au centre de la zone prédéfinie ; null si pas de zone/position. */
  const distanceToZone = predefinedZone && userPosition && predefinedZone.latitude != null && predefinedZone.longitude != null
    ? Math.round(distanceInMeters(userPosition.lat, userPosition.lng, Number(predefinedZone.latitude), Number(predefinedZone.longitude)))
    : null;
  const insideZone = predefinedZone && userPosition ? isInsideZone(userPosition.lat, userPosition.lng, predefinedZone) : false;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader
        title="Pointage"
        subtitle={isAdmin ? 'Vue de tous les pointages' : 'Enregistrez vos entrées et sorties'}
        badge="Horaires"
        icon={Clock}
      />

      {!isAdmin && (
        <>
          {/* Horaires et zone de pointage */}
          <div className="rounded-2xl bg-primary-50/80 border-2 border-primary-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-primary-800 flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-primary-600" />
              Horaires de pointage
            </h3>
            <p className="text-slate-700 text-sm">
              <span className="font-semibold">Pointer l&apos;entrée à 9h</span> — <span className="font-semibold">Dépointer la sortie à 17h</span>. Votre position est localisée en temps réel. <span className="font-semibold text-primary-700">Vous devez être à l&apos;intérieur de la zone de travail créée (cercle vert sur la carte) pour pouvoir pointer</span> ; en dehors de cette zone, le pointage est refusé.
            </p>
          </div>

          {/* Pointage du jour + Votre position (layout type carte) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gauche : Pointage du jour */}
            <div className="glass-card p-6 flex flex-col shadow-xl border-white/60">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary-600" />
                Pointage du jour
              </h2>

              {zonesLoading ? (
                <Loader />
              ) : !predefinedZone ? (
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-semibold mb-1">Aucune zone de travail configurée pour le pointage.</p>
                  {workZones.length > 0 ? (
                    <p>Des zones existent mais aucune n&apos;a de coordonnées (latitude, longitude, rayon). L&apos;administrateur doit aller dans <strong>Zone de travail</strong>, modifier une zone et renseigner <strong>Latitude</strong>, <strong>Longitude</strong> et <strong>Rayon (m)</strong>.</p>
                  ) : (
                    <p>L&apos;administrateur doit créer une zone dans <strong>Zone de travail</strong> et renseigner le <strong>nom</strong>, le <strong>rayon (m)</strong>, la <strong>latitude</strong> et la <strong>longitude</strong>.</p>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600 mb-2">
                    Zone de travail créée (obligatoire pour pointer) : <strong>{predefinedZone.name}</strong>
                    {predefinedZone.address ? ` — ${predefinedZone.address}` : ''}
                  </p>

                  {/* Encadré vert : Vous êtes dans la zone / orange si hors zone — masqué juste après un pointage réussi */}
                  {!hideZoneStatusAfterPoint && userPosition ? (
                    <div className={`rounded-xl border-2 p-4 mb-4 flex items-start gap-3 ${insideZone ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-amber-50 border-amber-300 text-amber-800'}`}>
                      <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        {insideZone ? (
                          dayCompleted ? (
                            <p className="font-semibold text-sm">Journée terminée. Le bouton « Pointer l&apos;entrée » sera disponible demain.</p>
                          ) : canDepointer ? (
                            <p className="font-semibold text-sm">Vous êtes dans la zone. Cliquez sur « Pointer la sortie » pour enregistrer votre départ.</p>
                          ) : (
                            <>
                              <p className="font-semibold text-sm">Vous êtes dans la zone créée : {predefinedZone.name}. Vous pouvez pointer.</p>
                              {distanceToZone != null && (
                                <p className="text-sm mt-1 font-medium">Distance au centre : {distanceToZone} m</p>
                              )}
                            </>
                          )
                        ) : (
                          <>
                            <p className="font-semibold text-sm">Vous n&apos;êtes pas dans la zone créée : {predefinedZone.name}. Le pointage est refusé.</p>
                            {distanceToZone != null && (
                              <p className="text-sm mt-1">
                                Distance : {distanceToZone} m (rayon autorisé : {Number(predefinedZone.radius_m) || 0} m). Rapprochez-vous de la zone pour pointer.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ) : !hideZoneStatusAfterPoint && !userPosition ? (
                    <div className="text-sm text-slate-500 mb-4">
                      <p>Localisation en cours… Autorisez la géolocalisation pour voir si vous êtes dans la zone.</p>
                      {(positionLoading || !positionError) && (
                        <p className="text-xs text-slate-400 mt-1">Sur ordinateur la première fois peut prendre 10–20 s. Sur téléphone avec GPS c&apos;est plus rapide.</p>
                      )}
                    </div>
                  ) : null}

                  {/* Bouton Pointer entrée ou Pointer sortie ou Journée terminée */}
                  {userPosition && !insideZone && !dayCompleted && (
                    <p className="text-sm font-semibold text-amber-700 mb-2 text-center">
                      Vous ne pouvez pas pointer : vous devez être à l&apos;intérieur de la zone créée (cercle vert sur la carte).
                    </p>
                  )}
                  {dayCompleted && (
                    <div className="mt-auto w-full py-6 px-6 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-800 flex flex-col items-center justify-center gap-2">
                      <CheckCircle className="w-10 h-10 text-emerald-600" />
                      <p className="font-bold text-lg">Journée terminée</p>
                      <p className="text-sm text-emerald-700">Le bouton « Pointer l&apos;entrée » sera disponible demain.</p>
                    </div>
                  )}
                  {canPointerEntree && (
                    <button
                      type="button"
                      onClick={() => handlePointer('entree')}
                      disabled={!!submitting || !userPosition || !insideZone}
                      className="mt-auto w-full py-4 px-6 rounded-xl border-2 border-emerald-500 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      title={!userPosition ? 'Attendez la localisation' : !insideZone ? 'Entrez dans la zone créée (cercle vert) pour pointer' : ''}
                    >
                      <LogIn className="w-6 h-6" />
                      Pointer l&apos;entrée (9h)
                      {submitting === 'entree' && <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />}
                    </button>
                  )}
                  {canDepointer && (
                    <button
                      type="button"
                      onClick={() => handlePointer('sortie')}
                      disabled={!!submitting || !userPosition || !insideZone}
                      className="mt-auto w-full py-4 px-6 rounded-xl border-2 border-rose-500 bg-rose-500 hover:bg-rose-600 text-white font-bold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      title={!userPosition ? 'Attendez la localisation' : !insideZone ? 'Entrez dans la zone créée (cercle vert) pour pointer' : ''}
                    >
                      <LogOut className="w-6 h-6" />
                      → Pointer la sortie (17h)
                      {submitting === 'sortie' && <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />}
                    </button>
                  )}
                  {canDepointer && (
                    <p className="text-xs text-slate-500 mt-3 text-center">Après la sortie, la journée sera terminée. Vous pourrez pointer à nouveau demain.</p>
                  )}
                  {canPointerEntree && !dayCompleted && (
                    <p className="text-xs text-slate-500 mt-3 text-center">Après l&apos;entrée, le bouton « Pointer la sortie » apparaîtra.</p>
                  )}
                </>
              )}
            </div>

            {/* Droite : Votre position (carte) */}
            <div className="glass-card p-6 flex flex-col shadow-xl border-white/60">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  Votre position
                </h2>
                <button
                  type="button"
                  onClick={refreshUserPosition}
                  disabled={positionLoading}
                  className="text-sm font-medium text-primary-600 hover:underline disabled:opacity-50"
                >
                  Rafraîchir ma position
                </button>
              </div>
              {positionLoading && (
                <div className="text-xs text-slate-600 mb-2">
                  <p>Position en cours… Autorisez l&apos;accès à la localisation si le navigateur le demande.</p>
                  <p className="text-slate-500 mt-1">Sur ordinateur : 10–20 s. Sur téléphone avec GPS : plus rapide.</p>
                </div>
              )}
              {positionError && (
                <div className="mb-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  {positionError}
                  <p className="mt-1 font-medium">Cliquez sur « Rafraîchir ma position » pour réessayer.</p>
                </div>
              )}
              {!userPosition && !positionLoading && !positionError && (
                <p className="text-xs text-slate-500 mb-2">En attente de la position…</p>
              )}
              <div className="flex-1 min-h-[320px] rounded-xl overflow-hidden border border-slate-200">
                <ZoneMapPreview
                  zone={normalizeZoneForMap(predefinedZone || { latitude: 14.7167, longitude: -17.4677, radius_m: 200 })}
                  userPosition={userPosition}
                  className="h-[320px] w-full"
                />
              </div>
              {userPosition && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-200 text-sm">
                  <p className="font-semibold text-primary-800 mb-1">Position</p>
                  <p className="text-slate-700 font-mono text-xs">
                    Latitude : <strong>{Number(userPosition.lat).toFixed(6)}</strong>
                    {' · '}
                    Longitude : <strong>{Number(userPosition.lng).toFixed(6)}</strong>
                  </p>
                  {userPosition.accuracy != null && userPosition.accuracy > 0 ? (
                    <p className="text-slate-600 text-xs mt-1">
                      Précision : ± <strong>{userPosition.accuracy} m</strong>
                    </p>
                  ) : (
                    <p className="text-amber-700 text-xs mt-1 font-medium">
                      Précision inconnue — la position peut être incorrecte (réseau / IP).
                    </p>
                  )}
                  {(userPosition.accuracy == null || userPosition.accuracy > 150) && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                      <strong>Position possiblement incorrecte ?</strong> Sur ordinateur le navigateur utilise souvent le réseau (IP), très imprécise. Pour une position correcte : utilisez un <strong>téléphone avec GPS</strong>, autorisez la &quot;position précise&quot;, et ouvrez cette page sur le téléphone.
                    </div>
                  )}
                  <a
                    href={`https://www.google.com/maps?q=${Number(userPosition.lat)},${Number(userPosition.lng)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:underline mt-2 inline-block"
                  >
                    Vérifier ma position sur Google Maps →
                  </a>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-slate-400" />
                Vous devez être à l&apos;intérieur du cercle vert (zone créée) pour pouvoir pointer.
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                Position mise à jour automatiquement sur la carte.
              </p>
              <p className="text-xs text-primary-600 font-medium mt-1 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                Sur la carte : le point bleu = vous ; le cercle en pointillés = zone d&apos;incertitude (précision).
              </p>
            </div>
          </div>
        </>
      )}

      {/* Carte avec position pour l'admin */}
      {isAdmin && (
        <div className="glass-card p-6 shadow-xl border-white/60">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              Votre position
            </h2>
            <div className="flex items-center gap-2">
              {positionLoading && (
                <span className="text-xs text-slate-500">Position en cours…</span>
              )}
              {positionError && (
                <span className="text-xs text-amber-600">{positionError}</span>
              )}
              <button
                type="button"
                onClick={refreshUserPosition}
                disabled={positionLoading}
                className="text-xs font-medium text-primary-600 hover:underline disabled:opacity-50"
              >
                Rafraîchir ma position
              </button>
            </div>
          </div>
          {zonesLoading ? (
            <Loader />
          ) : (
            <ZoneMapPreview
              zone={
                workZones.length > 0
                  ? workZones[0]
                  : { latitude: 14.7167, longitude: -17.4677, radius_m: 200 }
              }
              userPosition={userPosition}
              className="h-[320px] w-full"
            />
          )}
          {userPosition && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-200 text-sm">
              <p className="font-semibold text-primary-800 mb-1">Position</p>
              <p className="text-slate-700 font-mono text-xs">
                Latitude : <strong>{Number(userPosition.lat).toFixed(6)}</strong>
                {' · '}
                Longitude : <strong>{Number(userPosition.lng).toFixed(6)}</strong>
              </p>
              {userPosition.accuracy != null && userPosition.accuracy > 0 && (
                <p className="text-slate-600 text-xs mt-1">Précision : ± <strong>{userPosition.accuracy} m</strong></p>
              )}
              <a
                href={`https://www.google.com/maps?q=${Number(userPosition.lat)},${Number(userPosition.lng)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:underline mt-2 inline-block"
              >
                Vérifier ma position sur Google Maps →
              </a>
            </div>
          )}
          {userPosition && (
            <>
              <p className="text-xs text-slate-500 mt-1">
                Votre position sur la carte (point bleu). Si la position est incorrecte, utilisez un téléphone avec GPS.
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                Position mise à jour automatiquement.
              </p>
            </>
          )}
        </div>
      )}

      <div className="glass-card p-6 shadow-xl border-white/60">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary-600" />
          {isAdmin ? 'Tous les pointages' : 'Historique des pointages'}
        </h2>

        {isAdmin && (
          <div className="mb-6 p-5 rounded-2xl glass-card border border-slate-200/80 bg-white/60">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-primary-600" />
              Filtres
            </h3>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[140px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">Utilisateur</label>
                <select
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Tous</option>
                  {(users || []).map((u) => (
                    <option key={u.id} value={u.id}>{u.username || u.email || `User ${u.id}`}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[140px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">Zone</label>
                <select
                  value={filterZone}
                  onChange={(e) => setFilterZone(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Toutes</option>
                  {workZones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[120px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Tous</option>
                  <option value="entree">Entrée</option>
                  <option value="sortie">Sortie</option>
                </select>
              </div>
              <div className="min-w-[140px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">Date du</label>
                <input
                  type="date"
                  value={filterDateAfter}
                  onChange={(e) => setFilterDateAfter(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div className="min-w-[140px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">Date au</label>
                <input
                  type="date"
                  value={filterDateBefore}
                  onChange={(e) => setFilterDateBefore(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterUser('');
                  setFilterZone('');
                  setFilterType('');
                  setFilterDateAfter('');
                  setFilterDateBefore('');
                }}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Réinitialiser
              </button>
            </div>
          </div>
        )}

        {/* Barre d'outils : Recherche + Export (Copier, Excel, CSV, PDF, Imprimer) */}
        {pointages.length > 0 && (
          <div className="mb-4 flex flex-wrap items-stretch gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Rechercher…"
                value={searchPointage}
                onChange={(e) => setSearchPointage(e.target.value)}
                className="input-field flex-1 min-w-0"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Exporter / Imprimer</span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const headers = ['DATE', 'AGENT', 'TYPE', 'ENTRÉE', 'SORTIE', 'DURÉE', 'LIEU', 'STATUT'];
                    const lines = [headers.join('\t'), ...filteredDailyRows.map((r) => [r.dateFormatted, r.agent, r.type, r.entree, r.sortie, r.duree, r.lieu, r.statut].join('\t'))];
                    navigator.clipboard.writeText(lines.join('\n')).then(() => showNotification('Copié dans le presse-papier', 'success')).catch(() => showNotification('Copie impossible', 'error'));
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border-2 border-slate-300 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition-colors"
                  title="Copier le tableau dans le presse-papier"
                >
                  <Copy className="w-4 h-4" aria-hidden />
                  Copier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const data = filteredDailyRows.map((r) => ({ DATE: r.dateFormatted, AGENT: r.agent, TYPE: r.type, ENTRÉE: r.entree, SORTIE: r.sortie, DURÉE: r.duree, LIEU: r.lieu, STATUT: r.statut }));
                    exportToCSV(data, [{ key: 'DATE', label: 'DATE' }, { key: 'AGENT', label: 'AGENT' }, { key: 'TYPE', label: 'TYPE' }, { key: 'ENTRÉE', label: 'ENTRÉE' }, { key: 'SORTIE', label: 'SORTIE' }, { key: 'DURÉE', label: 'DURÉE' }, { key: 'LIEU', label: 'LIEU' }, { key: 'STATUT', label: 'STATUT' }], `pointages_${new Date().toISOString().slice(0, 10)}.csv`);
                    showNotification('Export Excel/CSV téléchargé', 'success');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:bg-emerald-700 transition-colors"
                  title="Télécharger en Excel (fichier CSV)"
                >
                  <FileSpreadsheet className="w-4 h-4" aria-hidden />
                  Excel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const data = filteredDailyRows.map((r) => ({ DATE: r.dateFormatted, AGENT: r.agent, TYPE: r.type, ENTRÉE: r.entree, SORTIE: r.sortie, DURÉE: r.duree, LIEU: r.lieu, STATUT: r.statut }));
                    exportToCSV(data, [{ key: 'DATE', label: 'DATE' }, { key: 'AGENT', label: 'AGENT' }, { key: 'TYPE', label: 'TYPE' }, { key: 'ENTRÉE', label: 'ENTRÉE' }, { key: 'SORTIE', label: 'SORTIE' }, { key: 'DURÉE', label: 'DURÉE' }, { key: 'LIEU', label: 'LIEU' }, { key: 'STATUT', label: 'STATUT' }], `pointages_${new Date().toISOString().slice(0, 10)}.csv`);
                    showNotification('Export CSV téléchargé', 'success');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-700 text-white text-sm font-semibold shadow-sm hover:bg-slate-800 transition-colors"
                  title="Télécharger en CSV"
                >
                  <FileText className="w-4 h-4" aria-hidden />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const doc = new jsPDF('l', 'mm', 'a4');
                    const headers = ['DATE', 'AGENT', 'TYPE', 'ENTRÉE', 'SORTIE', 'DURÉE', 'LIEU', 'STATUT'];
                    const rows = filteredDailyRows.map((r) => [r.dateFormatted, r.agent, r.type, r.entree, r.sortie, r.duree, r.lieu, r.statut]);
                    doc.setFontSize(10);
                    const colWidths = [22, 35, 22, 18, 18, 18, 55, 22];
                    let y = 15;
                    headers.forEach((h, i) => { doc.text(h, 10 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y); });
                    y += 7;
                    rows.forEach((row) => {
                      row.forEach((cell, i) => { doc.text(String(cell ?? '').slice(0, 25), 10 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y); });
                      y += 5;
                      if (y > 270) { doc.addPage(); y = 15; }
                    });
                    doc.save(`pointages_${new Date().toISOString().slice(0, 10)}.pdf`);
                    showNotification('PDF téléchargé', 'success');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold shadow-sm hover:bg-red-700 transition-colors"
                  title="Télécharger en PDF"
                >
                  <FileDown className="w-4 h-4" aria-hidden />
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors"
                  title="Imprimer la page"
                >
                  <Printer className="w-4 h-4" aria-hidden />
                  Imprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <Loader />
        ) : pointages.length === 0 ? (
          <p className="text-slate-500 py-8 text-center">Aucun pointage enregistré.</p>
        ) : (
          <div ref={pointageTableRef} className="overflow-x-auto print:overflow-visible rounded-2xl border border-slate-100">
            <table className="table-modern w-full text-sm">
              <thead>
                <tr className="bg-primary-600/10">
                  <th className="table-header">DATE</th>
                  <th className="table-header">AGENT</th>
                  <th className="table-header">TYPE</th>
                  <th className="table-header">ENTRÉE</th>
                  <th className="table-header">SORTIE</th>
                  <th className="table-header">DURÉE</th>
                  <th className="table-header">LIEU</th>
                  <th className="table-header">STATUT</th>
                  <th className="table-header w-10 print:hidden" aria-label="Carte" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDailyRows.map((row) => (
                  <tr key={row.key} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.dateFormatted}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.agent}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.entree}</td>
                    <td className="px-4 py-3 text-slate-700">{row.sortie}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{row.duree}</td>
                    <td className="px-4 py-3 text-slate-600">{row.lieu}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {row.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 print:hidden">
                      {(row.pointageEntree || row.pointageSortie) && (
                        <button
                          type="button"
                          onClick={() => setSelectedPointageForMap(row.pointageEntree || row.pointageSortie)}
                          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded p-1"
                          title="Voir sur la carte"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDailyRows.length === 0 && searchPointage.trim() && (
              <p className="text-slate-500 py-4 text-center">Aucun résultat pour « {searchPointage} ».</p>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedPointageForMap}
        onClose={() => setSelectedPointageForMap(null)}
        title={selectedPointageForMap ? `Zone de pointage : ${selectedPointageForMap.zone_name || 'Sans zone'}` : ''}
        size="xl"
      >
        {selectedPointageForMap && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              {isAdmin ? (
                <>Pointage de <strong>{selectedPointageForMap.username}</strong> — {selectedPointageForMap.check_type === 'entree' ? 'Entrée' : 'Sortie'} le {formatDate(selectedPointageForMap.timestamp)} à {formatTime(selectedPointageForMap.timestamp)}.</>
              ) : (
                <>Vous avez {selectedPointageForMap.check_type === 'entree' ? 'pointé (entrée)' : 'dépointé (sortie)'} le {formatDate(selectedPointageForMap.timestamp)} à {formatTime(selectedPointageForMap.timestamp)}. Zone : <strong>{selectedPointageForMap.zone_name || 'Sans zone'}</strong></>
              )}
            </p>
            {!selectedPointageForMap.work_zone_details && (
              <p className="text-slate-500 py-4">Aucune zone associée à ce pointage.</p>
            )}
            {selectedPointageForMap.work_zone_details && (
              <div ref={modalMapContainerRef} className="w-full" style={{ minHeight: 420 }}>
                <p className="text-xs font-semibold text-slate-600 mb-2">
                  Carte : zone de pointage et position exacte au moment du pointage (marqueur bleu)
                </p>
                {modalMapReady ? (
                  <div className="block w-full rounded-xl overflow-hidden bg-slate-200" style={{ width: '100%', minWidth: 280, height: 400 }}>
                    <ZoneMapPreview
                      key={`zone-${selectedPointageForMap.work_zone_details?.id || selectedPointageForMap.timestamp || Date.now()}-${selectedPointageForMap.latitude}-${selectedPointageForMap.longitude}`}
                      zone={normalizeZoneForMap(selectedPointageForMap.work_zone_details)}
                      userPosition={
                        selectedPointageForMap.latitude != null && selectedPointageForMap.longitude != null
                          ? { lat: Number(selectedPointageForMap.latitude), lng: Number(selectedPointageForMap.longitude) }
                          : (!isAdmin ? userPosition : null)
                      }
                      className="w-full rounded-xl"
                      style={{ height: 400, width: '100%' }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 400, borderRadius: 12, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 500 }}>
                    Chargement de la carte…
                  </div>
                )}
                {selectedPointageForMap.latitude != null && selectedPointageForMap.longitude != null ? (
                  <p className="text-xs text-primary-600 font-medium mt-2">
                    Le marqueur bleu = position exacte {isAdmin ? `de ${selectedPointageForMap.username || 'l\'utilisateur'}` : 'au moment du pointage'} ({Number(selectedPointageForMap.latitude).toFixed(5)}, {Number(selectedPointageForMap.longitude).toFixed(5)}).
                  </p>
                ) : (
                  !isAdmin && userPosition && (
                    <p className="text-xs text-slate-500 mt-2">Position non enregistrée pour ce pointage (ancien enregistrement). Le marqueur bleu affiche votre position actuelle.</p>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Pointage;
