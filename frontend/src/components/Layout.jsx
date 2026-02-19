import { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 flex flex-col lg:flex-row min-w-0 max-w-full overflow-x-hidden">
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
        className={`flex-1 flex flex-col min-w-0 max-w-full overflow-x-clip border-l border-slate-200/50 w-full transition-[margin] duration-300 ease-out ${
          sidebarCollapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-72'
        }`}
      >
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-slate-50/50 overflow-x-clip min-w-0 max-w-full">
          <div className="page-container animate-page-enter w-full min-w-0" key={location.pathname}>
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
