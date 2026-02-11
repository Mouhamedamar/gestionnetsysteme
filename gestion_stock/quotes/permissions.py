from rest_framework import permissions


class IsAdminOrCommercial(permissions.BasePermission):
    """
    Permission personnalisée pour les devis et factures :
    - Les admins ont accès complet
    - Les commerciaux ont accès complet
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Les admins (staff) ont toujours accès complet
        if request.user.is_staff:
            return True
        
        # Vérifier si l'utilisateur a un profil avec le rôle commercial
        try:
            if hasattr(request.user, 'profile') and request.user.profile:
                role = request.user.profile.role
                if role == 'commercial':
                    return True
        except:
            pass
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """
        Vérifie si l'utilisateur peut accéder à un devis/facture spécifique.
        On applique la même logique que pour has_permission.
        """
        return self.has_permission(request, view)
