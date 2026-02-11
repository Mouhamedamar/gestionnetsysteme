from rest_framework import permissions


def user_is_admin(user):
    """True si l'utilisateur est admin (rôle ou is_staff). Gère l'absence de UserProfile."""
    if not user or not user.is_authenticated:
        return False
    if getattr(user, 'is_staff', False):
        return True
    try:
        profile = user.profile
        return getattr(profile, 'role', None) == 'admin'
    except Exception:
        # UserProfile.DoesNotExist si le profil n'existe pas
        return False


class PointagePermission(permissions.BasePermission):
    """
    - GET : tout utilisateur connecté (admin voit tous les pointages, les autres les leurs).
    - POST : uniquement les non-admin (pour pointer entrée/sortie).
    """

    def has_permission(self, request, view):
        if not request.user or not getattr(request.user, 'is_authenticated', True) is True:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        if request.method == 'POST':
            try:
                return not user_is_admin(request.user)
            except Exception:
                return True  # autoriser le pointage si on ne peut pas déterminer le rôle
        return False

    def has_object_permission(self, request, view, obj):
        try:
            if user_is_admin(request.user):
                return True
            return getattr(obj, 'user_id', None) == getattr(request.user, 'id', None)
        except Exception:
            return False
