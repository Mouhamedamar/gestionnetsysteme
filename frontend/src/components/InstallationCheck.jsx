import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const InstallationCheck = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [needsInstallation, setNeedsInstallation] = useState(false);

  useEffect(() => {
    const checkInstallation = async () => {
      // Ne pas vérifier si on est déjà sur la page d'installation ou de login
      if (location.pathname === '/installation' || location.pathname === '/login') {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/auth/check-installation/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (!data.installed) {
            setNeedsInstallation(true);
            navigate('/installation');
          }
        }
      } catch (error) {
        // Si le serveur n'est pas accessible, on laisse passer (peut être en cours de démarrage)
        console.log('Serveur non accessible, vérification ignorée');
      } finally {
        setChecking(false);
      }
    };

    checkInstallation();
  }, [location.pathname, navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Vérification de l'installation...</p>
        </div>
      </div>
    );
  }

  if (needsInstallation && location.pathname !== '/installation') {
    return null; // La redirection est gérée par navigate
  }

  return children;
};

export default InstallationCheck;
