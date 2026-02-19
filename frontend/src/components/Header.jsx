import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Bell, Search, Menu, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';

const Header = ({ onOpenMobileMenu }) => {
  const { logout, user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = (searchQuery || '').trim();
    if (!q) return;
    const pathname = location.pathname;
    const isListPage = ['/products', '/clients', '/stock', '/invoices', '/quotes', '/expenses', '/proforma-invoices', '/users', '/stock-movements', '/interventions', '/installations', '/pointage'].some(p => pathname === p || pathname.startsWith(p + '/'));
    if (isListPage) {
      const params = new URLSearchParams(location.search);
      params.set('search', q);
      navigate(`${pathname}?${params.toString()}`);
    } else {
      navigate(`/products?search=${encodeURIComponent(q)}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-sm shadow-slate-200/50 safe-area-inset-top min-w-0 max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 md:px-6 lg:px-8 py-3 min-h-[3.5rem] sm:min-h-[4rem] min-w-0">
        {/* Menu hamburger (mobile) */}
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-primary-600 touch-manipulation"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        {/* Barre accent gauche (cachée sous le hamburger sur mobile) */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 via-primary-400 to-primary-600 rounded-r-full opacity-90 hidden md:block" aria-hidden />

        {/* Search Bar (desktop) */}
        <form
          onSubmit={handleSearchSubmit}
          className={`hidden md:flex items-center gap-3 flex-1 min-w-0 max-w-xl transition-all duration-300 rounded-2xl border px-4 py-2.5 ${
            searchFocused
              ? 'bg-white border-primary-300 shadow-md shadow-primary-500/10 ring-2 ring-primary-500/20'
              : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300/80'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
          <input
            type="search"
            placeholder="Rechercher (produits, clients, factures…)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder:text-slate-400"
            aria-label="Rechercher"
          />
        </form>

        {/* Recherche mobile : bouton ou barre dépliante */}
        <div className="flex md:hidden items-center gap-2 flex-1 min-w-0">
          {mobileSearchOpen ? (
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="search"
                placeholder="Rechercher…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm"
                autoFocus
                aria-label="Rechercher"
              />
              <button type="button" onClick={() => setMobileSearchOpen(false)} className="text-slate-500 text-sm font-medium">
                Annuler
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 touch-manipulation"
              aria-label="Rechercher"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 sm:gap-2 ml-auto shrink-0 min-w-0">
          {/* Lien Administration Django (uniquement pour les admins) */}
          {(user?.role === 'admin' || user?.is_staff) && (
            <a
              href={`${API_BASE_URL.replace(/\/$/, '')}/admin/`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:text-primary-600 hover:bg-primary-50 font-medium text-sm transition-colors"
              title="Ouvrir l’administration Django pour modifier les données sans passer par le code"
            >
              <Settings className="w-5 h-5" />
              Administration
            </a>
          )}
          {/* Notifications */}
          <button
            type="button"
            className="relative p-2.5 rounded-xl text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white ring-1 ring-rose-200" aria-hidden />
          </button>

          <div className="h-8 w-px bg-slate-200/80 hidden sm:block" aria-hidden />

          {/* User Profile */}
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="flex items-center gap-3 pl-1 pr-3 sm:pr-4 py-1.5 rounded-2xl hover:bg-slate-50 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow shrink-0 ring-2 ring-white">
                <User className="w-5 h-5" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-slate-800 leading-tight">{user?.username || 'Admin'}</p>
                <p className="text-xs text-slate-500 leading-tight capitalize">{user?.role || 'Administrateur'}</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
              title="Déconnexion"
              aria-label="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
