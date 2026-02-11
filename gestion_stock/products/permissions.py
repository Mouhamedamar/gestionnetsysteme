from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Permission personnalisée pour vérifier que l'utilisateur est un admin
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff

