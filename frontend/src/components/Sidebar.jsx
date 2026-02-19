import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  FileText,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Warehouse,
  Wrench,
  FileSearch,
  DollarSign,
  Settings,
  MapPin,
  Clock,
  MessageSquare,
  AlertTriangle,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';

const LG_BREAKPOINT = 1024;

function useIsMobileView() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < LG_BREAKPOINT : true);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${LG_BREAKPOINT - 1}px)`);
    const handler = () => setIsMobile(mql.matches);
    handler();
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

const Sidebar = ({ mobileMenuOpen = false, onCloseMobile, onCollapsedChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isMobileView = useIsMobileView();

  const handleToggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      onCollapsedChange?.(next);
      return next;
    });
  };
  const { user } = useApp();
  const location = useLocation();
  const role = user?.role || 'admin';

  // Fermer le menu mobile à chaque changement de route
  useEffect(() => {
    onCloseMobile?.();
  }, [location.pathname, onCloseMobile]);

  // Synchroniser l'état réduit avec le Layout (marge du contenu)
  useEffect(() => {
    onCollapsedChange?.(collapsed);
  }, [collapsed, onCollapsedChange]);

  const adminMenuItems = [
    { path: '/', label: 'Tableau de Bord', icon: LayoutDashboard },
    { path: '/products', label: 'Produits', icon: Package },
    { path: '/stock', label: 'Gestion Stock', icon: Warehouse },
    { path: '/stock-movements', label: 'Mouvements Stock', icon: TrendingUp },
    { path: '/stock-notifications', label: 'Notifications Stock', icon: MessageSquare },
    { path: '/stock-reminders', label: 'Rappels stock faible', icon: AlertTriangle },
    { path: '/interventions', label: 'Interventions', icon: Wrench },
    { path: '/installations', label: 'Installations', icon: Settings },
    { path: '/clients', label: 'Clients', icon: User },
    { path: '/quotes', label: 'Devis', icon: FileSearch },
    { path: '/invoices', label: 'Factures', icon: FileText },
    { path: '/proforma-invoices', label: 'Pro Forma', icon: FileCheck },
    { path: '/expenses', label: 'Dépenses', icon: DollarSign },
    { path: '/zone-de-travail', label: 'Zone de travail', icon: MapPin },
    { path: '/pointage', label: 'Pointage', icon: Clock },
    { path: '/users', label: 'Utilisateurs', icon: Users },
  ];

  const technicienMenuItems = [
    { path: '/', label: 'Tableau de Bord', icon: LayoutDashboard },
    { path: '/interventions', label: 'Interventions', icon: Wrench },
    { path: '/pointage', label: 'Pointage', icon: Clock },
  ];

  const commercialMenuItems = [
    { path: '/', label: 'Tableau de Bord', icon: LayoutDashboard },
    { path: '/clients', label: 'Clients', icon: User },
    { path: '/interventions', label: 'Interventions', icon: Wrench },
    { path: '/pointage', label: 'Pointage', icon: Clock },
  ];

  const getMenuItems = () => {
    const customPermissions = user?.profile?.page_permissions !== undefined
      ? user.profile.page_permissions
      : (user?.page_permissions !== undefined ? user.page_permissions : null);

    let defaultPermissions = [];
    let baseMenuItems = [];

    switch (role) {
      case 'admin':
        defaultPermissions = ['/', '/products', '/stock', '/stock-movements', '/stock-notifications', '/stock-reminders', '/interventions',
          '/installations', '/clients', '/quotes', '/invoices',
          '/proforma-invoices', '/expenses', '/zone-de-travail', '/pointage', '/users'];
        baseMenuItems = adminMenuItems;
        break;
      case 'technicien':
        defaultPermissions = ['/', '/interventions', '/pointage'];
        baseMenuItems = technicienMenuItems;
        break;
      case 'commercial':
        defaultPermissions = ['/', '/clients', '/interventions', '/pointage'];
        baseMenuItems = commercialMenuItems;
        break;
      default:
        defaultPermissions = ['/', '/products', '/stock', '/stock-movements', '/stock-notifications', '/stock-reminders', '/interventions',
          '/installations', '/clients', '/quotes', '/invoices',
          '/proforma-invoices', '/expenses', '/zone-de-travail', '/users'];
        baseMenuItems = adminMenuItems;
    }

    if (Array.isArray(customPermissions) && customPermissions.length > 0) {
      const allPermissions = [...new Set([...defaultPermissions, ...customPermissions])];
      const allMenuItems = [
        ...adminMenuItems,
        ...technicienMenuItems,
        ...commercialMenuItems
      ];
      const uniqueItems = allMenuItems.filter((item, index, self) =>
        index === self.findIndex(t => t.path === item.path)
      );
      return uniqueItems.filter(item => allPermissions.includes(item.path));
    }

    return baseMenuItems;
  };

  const menuItems = getMenuItems();
  const sidebarHidden = isMobileView && !mobileMenuOpen;

  return (
    <aside
      className={`
        sidebar-nav fixed z-40 lg:z-20 h-screen flex-shrink-0
        transition-[transform,width] duration-300 ease-out
        inset-y-0 left-0
        w-72 max-w-[min(85vw,320px)] lg:max-w-none min-w-0
        ${sidebarHidden ? '-translate-x-full' : 'translate-x-0'}
        ${collapsed ? 'lg:w-[4.5rem]' : 'lg:w-72'}
      `}
    >
      <div className="h-full flex flex-col bg-white/95 lg:bg-white/90 backdrop-blur-xl border-r border-slate-200/80 shadow-xl lg:shadow-lg shadow-slate-200/30 safe-area-inset-left">
        {/* Bande accent verticale */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-400 via-primary-500 to-primary-600 opacity-80 rounded-r-full pointer-events-none" aria-hidden />

        {/* Logo + bouton fermer mobile */}
        <div className={`flex-shrink-0 flex items-center justify-between border-b border-slate-100 min-h-[3.5rem] ${collapsed ? 'py-4 px-2' : 'py-4 px-4'} lg:justify-center`}>
          {!collapsed ? (
            <div className="flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-primary-50 to-white ring-1 ring-primary-100/80 shadow-inner flex-1 min-w-0">
              <img
                src="/logo-netsysteme.png"
                alt="NETSYSTEME"
                className="logo-app logo-app-animate h-14 sm:h-16 w-auto max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="hidden lg:flex items-center justify-center p-2 rounded-xl bg-primary-50/80 ring-1 ring-primary-100/80 flex-1">
              <img
                src="/logo-netsysteme.png"
                alt="NETSYSTEME"
                className="logo-app logo-app-pulse h-11 w-11 object-contain"
              />
            </div>
          )}
          {isMobileView && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-2.5 -mr-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 touch-manipulation"
              aria-label="Fermer le menu"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1 scrollbar-thin"
          style={{ scrollbarWidth: 'thin' }}
        >
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={isMobileView ? onCloseMobile : undefined}
                className={({ isActive }) =>
                  `nav-item group flex items-center gap-3 rounded-xl py-3.5 lg:py-3 transition-all duration-200 min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white touch-manipulation ${
                    collapsed ? 'justify-center px-2' : 'px-4'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'text-slate-600 hover:bg-primary-50/80 hover:text-primary-600 active:bg-primary-100/80'
                  }`
                }
                style={{ animationDelay: `${idx * 25}ms` }}
              >
                <Icon className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${collapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
                {!collapsed && (
                  <span className="font-medium text-sm tracking-wide truncate flex-1 min-w-0">
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Lien Administration Django (admins uniquement) */}
        {(role === 'admin' || user?.is_staff) && (
          <div className="flex-shrink-0 p-3 border-t border-slate-100">
            <a
              href={`${API_BASE_URL.replace(/\/$/, '')}/admin/`}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-item group flex items-center gap-3 rounded-xl py-3 px-4 text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-all"
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium text-sm">Administration (modifier sans code)</span>
              )}
            </a>
          </div>
        )}

        {/* Bouton réduction (desktop uniquement) */}
        <div className="hidden lg:block flex-shrink-0 p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleToggleCollapsed}
            className={`w-full flex items-center justify-center rounded-xl py-3 text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${collapsed ? 'px-0' : ''}`}
            aria-label={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
