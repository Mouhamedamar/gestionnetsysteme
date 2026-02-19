/**
 * URL de l'API backend (Django).
 *
 * En build **production** (import.meta.env.PROD = true) :
 *  - on utilise toujours le backend Render (API réelle en ligne)
 *  - et on peut décider d'**ignorer complètement** les appels API côté frontend
 *    si on veut un mode démo (voir USE_API ci-dessous).
 *
 * En **dev** (npm run dev) :
 *  - on utilise http://localhost:8000 par défaut
 *  - ou VITE_API_URL si définie dans .env
 */
const PRODUCTION_API = 'https://gestionnetsysteme.onrender.com';
const isProd = import.meta.env.PROD;

// URL de base de l'API : vide = même origine (reverse proxy Nginx), sinon URL explicite
export const API_BASE_URL = (() => {
  const u = import.meta.env.VITE_API_URL;
  if (u !== undefined && u !== '') return u;
  if (isProd) return ''; // même origine quand derrière Nginx
  return 'http://localhost:8000';
})();

/**
 * Flag global pour activer/désactiver les appels API.
 *
 * - En production (build déployé) : on désactive les appels API par défaut
 *   pour éviter les erreurs si l'API n'est pas disponible ou si on veut
 *   uniquement une démo front.
 * - En dev : on laisse les appels API actifs.
 *
 * Pour forcer l'utilisation de l'API en prod :
 *   VITE_USE_API=true
 */
export const USE_API = (() => {
  const fromEnv = (import.meta.env.VITE_USE_API || '').toString().toLowerCase();
  if (fromEnv === 'true') return true;
  if (fromEnv === 'false') return false;
  // Par défaut : API active en dev, désactivée en production
  return !isProd ? true : false;
})();
