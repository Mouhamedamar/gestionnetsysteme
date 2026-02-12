/**
 * URL de l'API backend (Django) — production Render par défaut.
 * Pour utiliser un backend local : définir VITE_API_URL=http://localhost:8000 dans .env
 */
const PRODUCTION_API = 'https://gestionnetsysteme.onrender.com';
export const API_BASE_URL = import.meta.env.VITE_API_URL || PRODUCTION_API;
