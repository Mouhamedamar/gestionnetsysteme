from rest_framework import permissions


class IsAdminOrTechnicien(permissions.BasePermission):
    """
    Permission personnalisée pour les interventions :
    - Les admins ont accès complet
    - Les commerciaux ont accès complet
    - Les techniciens ont accès à leurs propres interventions
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Les admins ont toujours accès
        if request.user.is_staff:
            return True
        
        # Vérifier si l'utilisateur a un profil avec un rôle autorisé
        try:
            if hasattr(request.user, 'profile') and request.user.profile:
                role = request.user.profile.role
                # Les commerciaux et techniciens peuvent accéder aux interventions
                if role in ['technicien', 'commercial']:
                    return True
        except:
            pass
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """
        Vérifier si l'utilisateur peut accéder à une intervention spécifique
        """
        # Les admins ont toujours accès
        if request.user.is_staff:
            return True
        
        # Les commerciaux ont accès complet à toutes les interventions
        if hasattr(request.user, 'profile') and request.user.profile:
            role = request.user.profile.role
            if role == 'commercial':
                return True
            
            # Les techniciens peuvent accéder à leurs propres interventions
            if role == 'technicien':
                # Un technicien peut accéder si c'est son intervention
                if obj.technician and obj.technician.id == request.user.id:
                    return True
        
        return False
