from rest_framework import permissions


class IsAdminOrTechnicienOrCommercial(permissions.BasePermission):
    """
    Permission personnalisée pour les clients :
    - Les admins ont accès complet (lecture / écriture)
    - Les commerciaux ont accès complet (lecture / écriture)
    - Les techniciens n'ont **aucun accès** aux clients
    """

    def _get_role(self, user):
        """
        Récupère le rôle du profil utilisateur si disponible.
        """
        try:
            if hasattr(user, "profile") and user.profile:
                return user.profile.role
        except Exception:
            return None
        return None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Les admins (staff) ont toujours accès complet
        if request.user.is_staff:
            return True

        role = self._get_role(request.user)

        # Les techniciens n'ont aucun accès aux clients
        if role == "technicien":
            return False

        # Seuls les commerciaux peuvent accéder aux clients (lecture et écriture)
        return role == "commercial"

    def has_object_permission(self, request, view, obj):
        """
        Vérifie si l'utilisateur peut accéder / modifier un client spécifique.
        On applique la même logique que pour has_permission.
        """
        return self.has_permission(request, view)
