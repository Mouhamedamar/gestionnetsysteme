from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Client, UserProfile


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'created_at']
    search_fields = ['name', 'phone', 'email']
    list_filter = ['created_at']
    readonly_fields = ['created_at', 'updated_at']


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profil'
    fields = ['role', 'phone']


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ['username', 'email', 'is_staff', 'get_role', 'date_joined']
    list_filter = ['is_staff', 'is_superuser', 'date_joined']
    
    def get_role(self, obj):
        """Affiche le rôle de l'utilisateur"""
        try:
            return obj.profile.get_role_display() if hasattr(obj, 'profile') and obj.profile else 'Non défini'
        except:
            return 'Non défini'
    get_role.short_description = 'Rôle'


# Désenregistrer l'admin par défaut et réenregistrer avec notre version personnalisée
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
