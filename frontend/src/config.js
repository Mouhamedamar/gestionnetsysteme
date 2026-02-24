/**
 * URL de l'API backend (Django).
 *
 * En build **production** (import.meta.env.PROD = true) :
 *  - on utilise l'API du même domaine pour le déploiement sur entreprise.louvrier.sn
 *  - et on active les appels API pour le fonctionnement normal
 *
 * En **dev** (npm run dev) :
 *  - on utilise http://localhost:8000 par défaut
 *  - ou VITE_API_URL si définie dans .env
 */
const PRODUCTION_API = 'https://entreprise.louvrier.sn';  // Changé pour utiliser le même domaine
const isProd = import.meta.env.PROD;

// URL de base de l'API utilisée par le frontend
export const API_BASE_URL = isProd
  ? PRODUCTION_API
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

/**
 * Flag global pour activer/désactiver les appels API.
 *
 * - En production (build déployé) : on active les appels API pour le fonctionnement normal
 * - En dev : on laisse les appels API actifs.
 *
 * Pour forcer l'utilisation de l'API en prod :
 *   VITE_USE_API=true
 */
export const USE_API = (() => {
  const fromEnv = (import.meta.env.VITE_USE_API || '').toString().toLowerCase();
  if (fromEnv === 'true') return true;
  if (fromEnv === 'false') return false;
  // Par défaut : API active en dev ET en production
  return true;  // Changé pour toujours activer l'API
})();

/** URL d'intégration du calendrier Google (iframe). À configurer dans .env : VITE_GOOGLE_CALENDAR_EMBED_URL */
export const GOOGLE_CALENDAR_EMBED_URL = (import.meta.env.VITE_GOOGLE_CALENDAR_EMBED_URL || '').toString().trim();
