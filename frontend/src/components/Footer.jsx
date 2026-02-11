const Footer = () => {
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white/80 backdrop-blur-sm py-4 px-4 sm:px-6">
      <div className="page-container text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} Gestion de Stock — Application de gestion d&apos;inventaire</p>
      </div>
    </footer>
  );
};

export default Footer;

