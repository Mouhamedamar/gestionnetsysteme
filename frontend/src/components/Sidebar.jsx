import { NavLink } from 'react-router-dom';
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
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useApp();
  const role = user?.role || 'admin';

  // Menu pour Admin (accès complet)
  const adminMenuItems = [
    { path: '/', label: 'Tableau de Bord', icon: LayoutDashboard },
    { path: '/products', label: 'Produits', icon: Package },
    { path: '/stock', label: 'Gestion Stock', icon: Warehouse },
    { path: '/stock-movements', label: 'Mouvements Stock', icon: TrendingUp },
    { path: '/stock-notifications', label: 'Config SMS Stock', icon: MessageSquare },
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

  // Menu pour Technicien (tableau de bord, interventions, pointage)
  const technicienMenuItems = [
    { path: '/', label: 'Tableau de Bord', icon: LayoutDashboard },
    { path: '/interventions', label: 'Interventions', icon: Wrench },
    { path: '/pointage', label: 'Pointage', icon: Clock },
  ];

  // Menu pour Commercial (tableau de bord, clients, interventions, pointage)
  const commercialMenuItems = [
    { path: '/', label: 'Tableau de Bord', icon: LayoutDashboard },
    { path: '/clients', label: 'Clients', icon: User },
    { path: '/interventions', label: 'Interventions', icon: Wrench },
    { path: '/pointage', label: 'Pointage', icon: Clock },
  ];

  // Sélectionner le menu selon le rôle et les permissions personnalisées
  const getMenuItems = () => {
    // Récupérer les permissions personnalisées de l'utilisateur
    const customPermissions = user?.profile?.page_permissions !== undefined 
      ? user.profile.page_permissions 
      : (user?.page_permissions !== undefined ? user.page_permissions : null);
    
    // Obtenir les permissions par défaut selon le rôle
    let defaultPermissions = [];
    let baseMenuItems = [];
    
    switch (role) {
      case 'admin':
        defaultPermissions = ['/', '/products', '/stock', '/stock-movements', '/stock-notifications', '/interventions',
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
        defaultPermissions = ['/', '/products', '/stock', '/stock-movements', '/stock-notifications', '/interventions', 
                             '/installations', '/clients', '/quotes', '/invoices', 
                             '/proforma-invoices', '/expenses', '/zone-de-travail', '/users'];
        baseMenuItems = adminMenuItems;
    }
    
    // Si customPermissions est un tableau avec des valeurs, combiner avec les permissions par défaut
    // null/undefined = utiliser uniquement les permissions par défaut
    // [] = utiliser uniquement les permissions par défaut (pas de permissions supplémentaires)
    // [paths...] = permissions par défaut + permissions supplémentaires
    if (Array.isArray(customPermissions) && customPermissions.length > 0) {
      // Combiner : permissions par défaut + permissions personnalisées (sans doublons)
      const allPermissions = [...new Set([...defaultPermissions, ...customPermissions])];
      
      // Récupérer tous les items de menu possibles
      const allMenuItems = [
        ...adminMenuItems,
        ...technicienMenuItems,
        ...commercialMenuItems
      ];
      
      // Retirer les doublons et filtrer par permissions combinées
      const uniqueItems = allMenuItems.filter((item, index, self) =>
        index === self.findIndex(t => t.path === item.path)
      );
      
      return uniqueItems.filter(item => allPermissions.includes(item.path));
    }
    
    // Si customPermissions est null/undefined ou un tableau vide, utiliser uniquement les permissions par défaut
    return baseMenuItems;
  };

  const menuItems = getMenuItems();

  return (
    <aside className={`relative z-20 h-screen transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? 'w-24' : 'w-96'} p-6`}>
      <div className="h-full glass-card flex flex-col border-white/40 shadow-2xl">
        {/* Logo Section */}
        <div className="p-6 mb-6 flex items-center justify-center flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center justify-center p-4 rounded-xl bg-primary-50/50 ring-1 ring-primary-200/30">
              <img
                src="/logo-netsysteme.png"
                alt="NETSYSTEME"
                className="logo-app logo-app-animate h-20 w-auto max-w-full object-contain transition-transform duration-300 hover:scale-110"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center p-2.5 rounded-xl bg-primary-50/50 ring-1 ring-primary-200/30">
              <img
                src="/logo-netsysteme.png"
                alt="NETSYSTEME"
                className="logo-app logo-app-pulse h-14 w-14 object-contain object-center transition-transform duration-300 hover:scale-110"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-3 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin' }}>
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-4 p-4 sm:p-5 rounded-2xl transition-all duration-300 min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/40 translate-x-1 scale-[1.02]'
                    : 'text-slate-600 hover:bg-primary-50 hover:text-primary-600 hover:translate-x-1'
                  }`
                }
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <Icon className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 flex-shrink-0" />
                {!collapsed && <span className="font-semibold tracking-wide truncate flex-1 min-w-0">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <div className="p-6 border-t border-slate-100/50 flex-shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-4 rounded-xl bg-slate-50 text-slate-500 hover:bg-primary-50 hover:text-primary-600 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

