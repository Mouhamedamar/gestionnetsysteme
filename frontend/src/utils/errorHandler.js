/**
 * Gère et formate les erreurs de l'API de manière cohérente
 * @param {Error|Response} error - L'erreur à traiter
 * @param {string} defaultMessage - Message par défaut si l'erreur ne peut pas être parsée
 * @returns {string} Message d'erreur formaté pour l'utilisateur
 */
export const handleApiError = async (error, defaultMessage = 'Une erreur est survenue') => {
  // Si c'est une Response (erreur HTTP)
  if (error instanceof Response) {
    try {
      const errorData = await error.json().catch(() => ({}));
      
      // Gérer les différents codes de statut
      switch (error.status) {
        case 400:
          return errorData.detail || 
                 errorData.error || 
                 (typeof errorData === 'object' && errorData !== null
                   ? Object.values(errorData).flat()[0]
                   : null) || 
                 'Données invalides';
        case 401:
          return 'Session expirée. Veuillez vous reconnecter.';
        case 403:
          return 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
        case 404:
          return 'Ressource non trouvée';
        case 422:
          // Erreur de validation
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              return errorData.detail.map(err => err.msg || err).join(', ');
            }
            return errorData.detail;
          }
          return 'Données invalides';
        case 500:
          return 'Erreur serveur. Veuillez réessayer plus tard.';
        default:
          return errorData.detail || 
                 errorData.error || 
                 `Erreur ${error.status}: ${error.statusText}`;
      }
    } catch (parseError) {
      return `Erreur HTTP ${error.status}: ${error.statusText || defaultMessage}`;
    }
  }
  
  // Si c'est une Error
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  
  // Si c'est une chaîne
  if (typeof error === 'string') {
    return error;
  }
  
  // Par défaut
  return defaultMessage;
};

/**
 * Extrait la première erreur d'un objet d'erreur de l'API
 * @param {Object} errorData - Données d'erreur de l'API
 * @returns {string|null} Première erreur trouvée
 */
export const extractFirstError = (errorData) => {
  if (!errorData || typeof errorData !== 'object') {
    return null;
  }
  
  if (errorData.detail) {
    return Array.isArray(errorData.detail) 
      ? errorData.detail[0]?.msg || errorData.detail[0]
      : errorData.detail;
  }
  
  if (errorData.error) {
    return errorData.error;
  }
  
  // Chercher dans les valeurs de l'objet
  const values = Object.values(errorData).flat();
  if (values.length > 0) {
    return Array.isArray(values[0]) ? values[0][0] : values[0];
  }
  
  return null;
};
