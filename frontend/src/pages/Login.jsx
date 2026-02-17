import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  User, 
  Lock, 
  LogIn, 
  AlertCircle, 
  Loader2,
  Settings,
  Sparkles
} from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-primary-50/30 to-indigo-50/50 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-400/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500"></div>
      </div>

      {/* Main login card */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="glass-card border-white/40 shadow-2xl p-8 md:p-10">
          {/* Logo and header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-white/60 backdrop-blur-sm mb-4 ring-2 ring-primary-200/50">
              <img
                src="/logo-netsysteme.png"
                alt="NETSYSTEME"
                className="logo-app logo-app-animate mx-auto h-28 w-auto max-w-[260px] object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>
            <p className="text-slate-500 font-medium mt-2">Gestion de Stock & Interventions</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary-300"></div>
              <Sparkles className="w-4 h-4 text-primary-400" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary-300"></div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50/80 border border-red-200/50 rounded-xl flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all duration-200 placeholder:text-slate-400 font-medium"
                  placeholder="Entrez votre nom d'utilisateur"
                  autoComplete="username"
                  disabled={isLoading || loading}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-12 pr-12 py-3.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all duration-200 placeholder:text-slate-400 font-medium"
                  placeholder="Entrez votre mot de passe"
                  autoComplete="current-password"
                  disabled={isLoading || loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || loading || !username || !password}
              className="w-full mt-6 bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-6 py-4 rounded-xl hover:from-primary-700 hover:to-indigo-700 active:scale-[0.98] transition-all duration-200 font-bold shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isLoading || loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-8 pt-6 border-t border-slate-200/50">
            <div className="text-center space-y-3">
              <p className="text-xs text-slate-500 font-medium">
                Connexion sécurisée via JWT
              </p>
              <button
                onClick={() => navigate('/installation')}
                className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors group"
              >
                <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                <span>Configuration initiale</span>
              </button>
            </div>
          </div>
        </div>

        {/* Additional info card */}
        <div className="mt-6 glass-card border-white/40 shadow-xl p-4 text-center">
          <p className="text-xs text-slate-500">
            © 2024 - Système de gestion intégré
          </p>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .delay-500 {
          animation-delay: 0.5s;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default Login;

