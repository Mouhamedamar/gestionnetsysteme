import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Bell, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Header = () => {
  const { logout, user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

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
    <header className="sticky top-0 z-10 p-4">
      <div className="glass-card px-4 sm:px-6 py-3 flex items-center justify-between gap-4 border-white/40 shadow-xl">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-3 bg-slate-100/50 px-4 py-2.5 rounded-xl border border-slate-200/50 max-w-md w-full transition-all duration-300 focus-within:ring-2 focus-within:ring-primary-500/25 focus-within:bg-white focus-within:border-primary-500">
          <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
          <input
            type="search"
            placeholder="Rechercher (produits, clients, factures…)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder:text-slate-400"
            aria-label="Rechercher"
          />
        </form>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Notifications */}
          <button
            type="button"
            className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 hover:scale-105 active:scale-95 rounded-xl transition-all duration-200 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" aria-hidden />
          </button>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" aria-hidden />

          {/* User Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/profile"
              className="flex items-center gap-3 p-1 pr-3 sm:pr-4 rounded-2xl hover:bg-slate-100 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform shrink-0">
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
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:scale-105 active:scale-95 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
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

