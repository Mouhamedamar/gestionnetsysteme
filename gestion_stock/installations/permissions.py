from rest_framework import permissions


class IsAdminOrTechnicien(permissions.BasePermission):
    """
    Permission personnalisée pour les installations :
    - Les admins ont accès complet
    - Les techniciens ont accès à leurs propres installations
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Les admins ont toujours accès
        if request.user.is_staff:
            return True
        
        # Vérifier si l'utilisateur a un profil avec le rôle technicien
        try:
            if hasattr(request.user, 'profile') and request.user.profile:
                role = request.user.profile.role
                if role == 'technicien':
                    return True
        except:
            pass
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """
        Vérifier si l'utilisateur peut accéder à une installation spécifique
        """
        # Les admins ont toujours accès
        if request.user.is_staff:
            return True
        
        # Les techniciens peuvent accéder à leurs propres installations
        if hasattr(request.user, 'profile') and request.user.profile:
            if request.user.profile.role == 'technicien':
                # Un technicien peut accéder si c'est son installation
                if obj.technician and obj.technician.id == request.user.id:
                    return True
        
        return False
