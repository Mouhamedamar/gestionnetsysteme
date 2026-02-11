/**
 * URL de l'API backend (Django).
 * En production (Vercel) : définir VITE_API_URL sur Render ou dans .env.production
 * Ex: https://gestionnetsysteme.onrender.com
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
