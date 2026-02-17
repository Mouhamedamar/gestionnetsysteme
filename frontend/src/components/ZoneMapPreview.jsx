import React, { useMemo, useEffect } from 'react';
import { useJsApiLoader, GoogleMap, Circle, Marker, useGoogleMap } from '@react-google-maps/api';
import L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

const DAKAR_CENTER = { lat: 14.7167, lng: -17.4677 };

const mapContainerStyle = { width: '100%', height: '100%' };
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  fullscreenControl: true,
  mapTypeId: 'satellite',
  mapTypeControl: true,
};

function zoomForRadius(radiusM) {
  const r = Number(radiusM);
  if (r <= 30) return 18;
  if (r <= 75) return 17;
  if (r <= 150) return 16;
  if (r <= 300) return 15;
  if (r <= 600) return 14;
  if (r <= 1200) return 13;
  return 12;
}

function ZonePerimeterOSM({ lat, lng, radiusM }) {
  const map = useMap();
  React.useEffect(() => {
    const r = Number(radiusM);
    if (r <= 0 || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) return;
    const center = [Number(lat), Number(lng)];
    const circle = L.circle(center, {
      radius: r,
      color: '#047857',
      fillColor: '#0d9488',
      fillOpacity: 0.55,
      weight: 5,
    }).addTo(map);
    return () => {
      if (map && circle) map.removeLayer(circle);
    };
  }, [map, lat, lng, radiusM]);
  return null;
}

/** Ne pas appeler invalidateSize trop tôt pour éviter _leaflet_pos undefined */
function MapResizeFix() {
  const map = useMap();
  React.useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (map && map.getContainer && map.getContainer()) map.invalidateSize();
      } catch (_) {}
    }, 500);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

/** Cercle de précision (incertitude) autour de la position utilisateur sur OpenStreetMap */
function UserAccuracyCircleOSM({ userLat, userLng, accuracyM }) {
  const map = useMap();
  React.useEffect(() => {
    if (accuracyM == null || accuracyM <= 0 || accuracyM > 5000) return;
    const lat = Number(userLat);
    const lng = Number(userLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    const circle = L.circle([lat, lng], {
      radius: accuracyM,
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.2,
      weight: 2,
      dashArray: '5, 5',
    }).addTo(map);
    return () => { if (map && circle) map.removeLayer(circle); };
  }, [map, userLat, userLng, accuracyM]);
  return null;
}

/** Marqueur position utilisateur sur OpenStreetMap — affiché en premier pour que l'utilisateur voie sa position avant de pointer */
function UserPositionMarkerOSM({ userLat, userLng }) {
  const map = useMap();
  React.useEffect(() => {
    if (userLat == null || userLng == null || Number.isNaN(Number(userLat)) || Number.isNaN(Number(userLng))) return;
    const lat = Number(userLat);
    const lng = Number(userLng);
    const icon = L.divIcon({
      className: 'user-position-marker',
      html: '<div style="width:24px;height:24px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);" title="Vous êtes ici"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    const marker = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindTooltip(`Vous êtes ici — ${lat.toFixed(6)}, ${lng.toFixed(6)}`, {
        permanent: false,
        direction: 'top',
        offset: [0, -12],
        className: 'user-position-tooltip',
      });
    return () => {
      if (map && marker) map.removeLayer(marker);
    };
  }, [map, userLat, userLng]);
  return null;
}

/** Ajuste la vue de la carte pour inclure la zone ET la position utilisateur (l'utilisateur voit sa position exacte avant de pointer) */
function FitBoundsOSM({ zoneLat, zoneLng, radiusM, userLat, userLng }) {
  const map = useMap();
  React.useEffect(() => {
    if (!map || userLat == null || userLng == null) return;
    const lat = Number(zoneLat);
    const lng = Number(zoneLng);
    const uLat = Number(userLat);
    const uLng = Number(userLng);
    if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(uLat) || Number.isNaN(uLng)) return;
    try {
      const r = Math.max(10, Number(radiusM) || 50);
      const circle = L.circle([lat, lng], { radius: r });
      const bounds = circle.getBounds();
      bounds.extend([uLat, uLng]);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
      }
    } catch (_) {
      try {
        const bounds = L.latLngBounds([lat, lng], [uLat, uLng]);
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
      } catch (__) {}
    }
  }, [map, zoneLat, zoneLng, radiusM, userLat, userLng]);
  return null;
}

/** Ajuste la vue Google Map pour inclure zone + position utilisateur (voir sa position exacte avant de pointer) */
function FitBoundsGoogle({ zone, userPosition }) {
  const map = useGoogleMap();
  useEffect(() => {
    if (!map || !userPosition || typeof userPosition.lat !== 'number' || typeof userPosition.lng !== 'number') return;
    try {
      if (typeof window === 'undefined' || !window.google?.maps?.LatLngBounds) return;
      const lat = parseFloat(zone?.latitude) || DAKAR_CENTER.lat;
      const lng = parseFloat(zone?.longitude) || DAKAR_CENTER.lng;
      const radiusM = Math.max(10, parseFloat(zone?.radius_m) || 50);
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: userPosition.lat, lng: userPosition.lng });
      const degLat = radiusM / 111320;
      const degLng = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
      bounds.extend({ lat: lat + degLat, lng });
      bounds.extend({ lat: lat - degLat, lng });
      bounds.extend({ lat, lng: lng + degLng });
      bounds.extend({ lat, lng: lng - degLng });
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    } catch (_) {}
  }, [map, zone?.latitude, zone?.longitude, zone?.radius_m, userPosition?.lat, userPosition?.lng]);
  return null;
}

function GoogleMapZone({ zone, userPosition }) {
  const lat = useMemo(() => parseFloat(zone?.latitude) || DAKAR_CENTER.lat, [zone?.latitude]);
  const lng = useMemo(() => parseFloat(zone?.longitude) || DAKAR_CENTER.lng, [zone?.longitude]);
  const radius = useMemo(() => Math.max(0, parseFloat(zone?.radius_m) || 50), [zone?.radius_m]);
  const center = useMemo(() => ({ lat, lng }), [lat, lng]);
  const zoom = useMemo(() => zoomForRadius(radius), [radius]);
  const mapKey = `${zone?.latitude}-${zone?.longitude}-${zone?.radius_m}-${userPosition?.lat}-${userPosition?.lng}`;

  return (
    <GoogleMap
      key={mapKey}
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={zoom}
      options={mapOptions}
    >
      <Circle
        center={center}
        radius={radius}
        options={{
          fillColor: '#0d9488',
          fillOpacity: 0.55,
          strokeColor: '#047857',
          strokeWeight: 5,
        }}
      />
      {userPosition && typeof userPosition.lat === 'number' && typeof userPosition.lng === 'number' && (
        <>
          {userPosition.accuracy != null && userPosition.accuracy > 5 && userPosition.accuracy < 5000 && (
            <Circle
              center={{ lat: userPosition.lat, lng: userPosition.lng }}
              radius={userPosition.accuracy}
              options={{
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                strokeColor: '#2563eb',
                strokeWeight: 2,
                strokeOpacity: 0.8,
              }}
            />
          )}
          <Marker
            position={{ lat: userPosition.lat, lng: userPosition.lng }}
            title={`Vous êtes ici — ${userPosition.lat.toFixed(6)}, ${userPosition.lng.toFixed(6)}`}
          />
          <FitBoundsGoogle zone={zone} userPosition={userPosition} />
        </>
      )}
    </GoogleMap>
  );
}

function OSMZone({ zone, userPosition }) {
  const lat = useMemo(() => parseFloat(zone?.latitude) || DAKAR_CENTER.lat, [zone?.latitude]);
  const lng = useMemo(() => parseFloat(zone?.longitude) || DAKAR_CENTER.lng, [zone?.longitude]);
  const radius = useMemo(() => Math.max(0, parseFloat(zone?.radius_m) || 50), [zone?.radius_m]);
  const center = useMemo(() => [lat, lng], [lat, lng]);
  const zoom = useMemo(() => zoomForRadius(radius), [radius]);
  const mapKey = `osm-${zone?.latitude}-${zone?.longitude}-${zone?.radius_m}-${userPosition?.lat}-${userPosition?.lng}`;
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full min-h-[200px]"
      style={{ height: '100%', minHeight: 300 }}
      scrollWheelZoom={true}
      key={mapKey}
      whenReady={() => {}}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a> — Satellite'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <MapResizeFix />
      <ZonePerimeterOSM lat={lat} lng={lng} radiusM={radius} />
      {userPosition && (userPosition.lat != null && userPosition.lng != null) && (
        <>
          {userPosition.accuracy != null && userPosition.accuracy > 5 && userPosition.accuracy < 5000 && (
            <UserAccuracyCircleOSM userLat={userPosition.lat} userLng={userPosition.lng} accuracyM={userPosition.accuracy} />
          )}
          <UserPositionMarkerOSM userLat={userPosition.lat} userLng={userPosition.lng} />
          <FitBoundsOSM zoneLat={lat} zoneLng={lng} radiusM={radius} userLat={userPosition.lat} userLng={userPosition.lng} />
        </>
      )}
    </MapContainer>
  );
}

/**
 * Affiche la carte d'une zone (cercle lat/lng/radius) et optionnellement la position utilisateur.
 * @param {Object} props
 * @param {Object} props.zone - { latitude, longitude, radius_m } (formData ou objet API)
 * @param {Object} [props.userPosition] - { lat, lng } position actuelle (ex: géolocalisation)
 * @param {string} [props.className] - classes pour le conteneur (ex: "h-[400px]")
 */
export default function ZoneMapPreview({ zone, userPosition = null, className = 'h-[400px]', style = {} }) {
  const [osmReady, setOsmReady] = React.useState(false);
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const useGoogle = Boolean(apiKey);
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || 'no-key',
    skip: !useGoogle,
  });

  React.useEffect(() => {
    if (!useGoogle || loadError) {
      const t = setTimeout(() => setOsmReady(true), 400);
      return () => clearTimeout(t);
    }
  }, [useGoogle, loadError]);

  const lat = zone?.latitude != null && zone?.latitude !== '' ? Number(zone.latitude) : null;
  const lng = zone?.longitude != null && zone?.longitude !== '' ? Number(zone.longitude) : null;
  const rad = zone?.radius_m != null && zone?.radius_m !== '' ? Number(zone.radius_m) : 0;
  const hasValidLatLng = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);
  const hasRadius = rad > 0;
  const canShowMap = zone && (hasValidLatLng || hasRadius);
  const zoneForDisplay = zone && !hasValidLatLng
    ? { ...zone, latitude: DAKAR_CENTER.lat, longitude: DAKAR_CENTER.lng, radius_m: rad > 0 ? rad : 100 }
    : zone;

  if (!zone) {
    return (
      <div className={`rounded-xl border-2 border-slate-200 bg-slate-100 flex items-center justify-center text-slate-500 ${className}`}>
        <span>Aucune zone.</span>
      </div>
    );
  }

  if (!canShowMap) {
    return (
      <div className={`rounded-xl border-2 border-slate-200 bg-slate-100 flex items-center justify-center text-slate-500 ${className}`}>
        <span>Cette zone n&apos;a pas de coordonnées (latitude, longitude, rayon) pour afficher la carte.</span>
      </div>
    );
  }

  const containerStyle = { minHeight: 200, height: 400, width: '100%', ...style };
  const displayZone = zoneForDisplay || zone;

  return (
    <div className={`relative rounded-xl overflow-hidden border-2 border-slate-300 bg-slate-100 ${className}`} style={containerStyle}>
      {useGoogle && !isLoaded && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-200 text-slate-600 font-medium">
          Chargement de la carte…
        </div>
      )}
      {(!useGoogle || loadError) && (
        <>
          <div className="absolute top-2 left-2 right-2 z-[1000] rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800 shadow">
            {!useGoogle
              ? 'Pour afficher Google Maps et votre position en direct : ajoutez VITE_GOOGLE_MAPS_API_KEY dans le fichier .env du frontend.'
              : 'Google Maps indisponible. Carte OpenStreetMap affichée (position en direct activée).'}
          </div>
          <div style={{ position: 'absolute', top: 48, left: 0, right: 0, bottom: 0, minHeight: 350 }}>
            {!osmReady ? (
              <div className="h-full w-full flex items-center justify-center bg-slate-200 text-slate-600 font-medium">
                Chargement de la carte…
              </div>
            ) : (
              <OSMZone zone={displayZone} userPosition={userPosition} />
            )}
          </div>
        </>
      )}
      {useGoogle && isLoaded && !loadError && (
        <div className="absolute inset-0">
          <GoogleMapZone zone={displayZone} userPosition={userPosition} />
        </div>
      )}
    </div>
  );
}

export { zoomForRadius, DAKAR_CENTER };
