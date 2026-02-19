const Footer = () => {
  return (
    <footer className="shrink-0 border-t border-slate-200/80 bg-white/70 backdrop-blur-sm py-3 sm:py-3.5 px-3 sm:px-4 md:px-6 lg:px-8 pb-[calc(0.875rem+env(safe-area-inset-bottom))]">
      <div className="max-w-[1600px] w-full min-w-0 mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-2 text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} Gestion de Stock — Application de gestion d&apos;inventaire</p>
        <p className="text-slate-400 text-xs">NETSYSTEME</p>
      </div>
    </footer>
  );
};

export default Footer;
