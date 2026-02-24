import { useState, useCallback, useMemo } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

/** Retourne true si l'utilisateur a le droit d'accéder à ce path (admin/is_staff = tout, sinon permissions du rôle). */
function getAllowedPaths(user) {
  if (!user) return [];
  if (user.role === 'admin' || user.is_staff) return null; // null = tout autorisé
  const customPermissions = user?.profile?.page_permissions ?? user?.page_permissions ?? null;
  let defaultPermissions = [];
  switch (user.role) {
    case 'technicien':
      defaultPermissions = ['/', '/interventions', '/pointage'];
      break;
    case 'commercial':
      defaultPermissions = ['/', '/clients', '/agrement', '/interventions', '/pointage'];
      break;
    case 'pointage_only':
      defaultPermissions = ['/', '/pointage'];
      break;
    default:
      defaultPermissions = ['/', '/products', '/stock', '/stock-movements', '/stock-notifications', '/stock-reminders', '/interventions',
        '/installations', '/installations/rappels-paiement', '/installations/add', '/clients', '/agrement', '/quotes', '/invoices',
        '/proforma-invoices', '/expenses', '/zone-de-travail', '/pointage', '/users'];
  }
  if (Array.isArray(customPermissions) && customPermissions.length > 0) {
    return [...new Set([...defaultPermissions, ...customPermissions])];
  }
  return defaultPermissions;
}

function hasPathPermission(pathname, allowedPaths) {
  if (allowedPaths === null) return true;
  if (!Array.isArray(allowedPaths)) return false;
  if (allowedPaths.includes(pathname)) return true;
  return allowedPaths.some((p) => p !== '/' && pathname.startsWith(p + '/'));
}

const Layout = () => {
  const location = useLocation();
  const { user } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const allowedPaths = useMemo(() => getAllowedPaths(user), [user]);
  const pathname = location.pathname;
  const canAccess = hasPathPermission(pathname, allowedPaths);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 flex flex-col lg:flex-row">
      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobile={closeMobileMenu}
        onCollapsedChange={setSidebarCollapsed}
      />
      {/* Backdrop mobile : clic ferme le menu */}
      {mobileMenuOpen && (
        <button
          type="button"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          aria-label="Fermer le menu"
        />
      )}
      <div
        className={`flex-1 flex flex-col min-w-0 border-l border-slate-200/50 w-full transition-[margin] duration-300 ease-out ${
          sidebarCollapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-72'
        }`}
      >
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-slate-50/50 min-w-0 max-w-full overflow-x-clip">
          <div className="page-container animate-page-enter w-full min-w-0 max-w-full" key={location.pathname}>
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
