import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';
import { Package, CheckCircle, XCircle, Loader, Settings, Database, User, Server } from 'lucide-react';

const Installation = () => {
  const navigate = useNavigate();
  const { apiCall, showNotification } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [checks, setChecks] = useState({
    database: { status: 'checking', message: 'Vérification de la base de données...' },
    migrations: { status: 'checking', message: 'Vérification des migrations...' },
    admin: { status: 'checking', message: 'Vérification de l\'utilisateur admin...' },
    server: { status: 'checking', message: 'Vérification du serveur...' }
  });

  const [adminData, setAdminData] = useState({
    username: 'admin',
    email: 'admin@example.com',
    password: '',
    confirmPassword: ''
  });

  // Vérifier l'état de l'installation au chargement
  useEffect(() => {
    checkInstallation();
  }, []);

  const checkInstallation = async () => {
    setChecking(true);
    const newChecks = { ...checks };

    try {
      // Utiliser l'endpoint de vérification d'installation
      const response = await fetch(`${API_BASE_URL}/api/auth/check-installation/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        newChecks.server = {
          status: data.checks.server ? 'success' : 'error',
          message: data.messages.server
        };
        
        newChecks.database = {
          status: data.checks.database ? 'success' : 'error',
          message: data.messages.database
        };
        
        newChecks.migrations = {
          status: data.checks.migrations ? 'success' : 'warning',
          message: data.messages.migrations
        };
        
        newChecks.admin = {
          status: data.checks.admin_exists ? 'success' : 'warning',
          message: data.messages.admin_exists || 'Vérification de l\'utilisateur admin...'
        };

        if (data.installed) {
          setIsInstalled(true);
        }
      } else {
        // Si l'endpoint n'est pas accessible, le serveur n'est pas démarré
        newChecks.server = {
          status: 'error',
          message: 'Serveur non accessible. Assurez-vous que le serveur Django est démarré.'
        };
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      newChecks.server = {
        status: 'error',
        message: 'Serveur non accessible. Assurez-vous que le serveur Django est démarré.'
      };
    } finally {
      setChecks(newChecks);
      setChecking(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    if (!adminData.username || !adminData.email || !adminData.password) {
      showNotification('Veuillez remplir tous les champs', 'error');
      return;
    }

    if (adminData.password !== adminData.confirmPassword) {
      showNotification('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    if (adminData.password.length < 8) {
      showNotification('Le mot de passe doit contenir au moins 8 caractères', 'error');
      return;
    }

    try {
      setLoading(true);

      // Créer l'utilisateur admin via l'endpoint setup-admin
      const response = await fetch(`${API_BASE_URL}/api/auth/setup-admin/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: adminData.username,
          email: adminData.email,
          password: adminData.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || 'Erreur lors de la création de l\'utilisateur');
      }

      const data = await response.json();
      showNotification(data.message || 'Utilisateur admin créé avec succès !', 'success');
      setIsInstalled(true);
      setStep(3);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      showNotification(error.message || 'Erreur lors de la création de l\'utilisateur admin', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    showNotification('Installation terminée ! Vous pouvez maintenant vous connecter.', 'success');
    navigate('/login');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <XCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md text-center">
          <Loader className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Vérification de l'installation...</h2>
          <p className="text-gray-600">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Installation Complète</h1>
            <p className="text-gray-600">L'application est déjà installée et configurée</p>
          </div>

          <div className="space-y-4 mb-8">
            {Object.entries(checks).map(([key, check]) => (
              <div
                key={key}
                className={`flex items-center gap-4 p-4 rounded-lg border ${getStatusColor(check.status)}`}
              >
                {getStatusIcon(check.status)}
                <div className="flex-1">
                  <p className="font-semibold">{check.message}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={checkInstallation}
              className="btn-secondary flex-1 py-3"
            >
              Vérifier à nouveau
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary flex-1 py-3"
            >
              Aller à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Settings className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Installation</h1>
          <p className="text-gray-600">Configuration initiale de l'application</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-20 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-20 h-1 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Vérifications */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Étape 1 : Vérifications</h2>
            
            <div className="space-y-4">
              {Object.entries(checks).map(([key, check]) => (
                <div
                  key={key}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${getStatusColor(check.status)}`}
                >
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <p className="font-semibold">{check.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {checks.server.status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-bold text-red-800 mb-2">⚠️ Serveur non accessible</h3>
                <p className="text-red-700 text-sm mb-4">
                  Le serveur Django doit être démarré avant de continuer l'installation.
                </p>
                <div className="bg-white rounded p-3 text-sm font-mono text-gray-800">
                  <p className="mb-1">Pour démarrer le serveur :</p>
                  <p className="mb-1">1. Ouvrez un terminal</p>
                  <p className="mb-1">2. Naviguez vers le dossier gestion_stock</p>
                  <p className="mb-1">3. Exécutez : <code className="bg-gray-100 px-2 py-1 rounded">python manage.py runserver</code></p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={checkInstallation}
                className="btn-secondary flex-1 py-3"
              >
                Vérifier à nouveau
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={checks.server.status === 'error'}
                className={`flex-1 py-3 ${
                  checks.server.status === 'error'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Création Admin */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Étape 2 : Création de l'utilisateur administrateur</h2>
            
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'utilisateur *
                </label>
                <input
                  type="text"
                  value={adminData.username}
                  onChange={(e) => setAdminData({...adminData, username: e.target.value})}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="admin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={adminData.email}
                  onChange={(e) => setAdminData({...adminData, email: e.target.value})}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  value={adminData.password}
                  onChange={(e) => setAdminData({...adminData, password: e.target.value})}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Minimum 8 caractères"
                />
                <p className="text-xs text-gray-500 mt-1">Le mot de passe doit contenir au moins 8 caractères</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe *
                </label>
                <input
                  type="password"
                  value={adminData.confirmPassword}
                  onChange={(e) => setAdminData({...adminData, confirmPassword: e.target.value})}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Répétez le mot de passe"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1 py-3"
                >
                  Précédent
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 py-3"
                >
                  {loading ? 'Création...' : 'Créer l\'administrateur'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Terminé */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Installation Terminée !</h2>
            <p className="text-gray-600 mb-6">
              L'application a été configurée avec succès. Vous pouvez maintenant vous connecter avec vos identifiants.
            </p>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-left">
              <h3 className="font-bold text-primary-800 mb-2">Informations de connexion :</h3>
              <p className="text-sm text-primary-700">
                <strong>Nom d'utilisateur :</strong> {adminData.username}
              </p>
              <p className="text-sm text-primary-700">
                <strong>Email :</strong> {adminData.email}
              </p>
            </div>

            <button
              onClick={handleComplete}
              className="btn-primary w-full py-3"
            >
              Aller à la page de connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Installation;
