/**
 * En-tête de page réutilisable avec design moderne (gradient, badge, icône). Responsive.
 */
const PageHeader = ({ title, subtitle, badge, icon: Icon, children, className = '' }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 p-4 sm:p-6 md:p-8 shadow-2xl shadow-primary-500/25 animate-slide-up min-w-0 max-w-full ${className}`}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2MkgyNHYtMmwxMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      {Icon && (
        <div className="absolute top-0 right-0 p-4 sm:p-8 md:p-12 opacity-20">
          <Icon className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 text-white" />
        </div>
      )}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="min-w-0 pr-20 sm:pr-28 md:pr-32">
          {badge && (
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white/90 text-xs font-bold uppercase tracking-wider mb-2 sm:mb-4">
              {badge}
            </span>
          )}
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-1 sm:mb-2 tracking-tight drop-shadow-sm break-words">
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/80 font-medium text-sm sm:text-base md:text-lg">{subtitle}</p>
          )}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">{children}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
