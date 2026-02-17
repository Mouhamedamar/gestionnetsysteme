from django.db import models
from django.contrib.auth.models import User
import json


class UserProfile(models.Model):
    """
    Modèle de profil utilisateur avec rôle
    """
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('technicien', 'Technicien'),
        ('commercial', 'Commercial'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name="Utilisateur"
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='commercial',
        verbose_name="Rôle"
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Téléphone"
    )
    # Permissions par page (liste des chemins autorisés)
    # Exemple: ['/', '/clients', '/interventions']
    # Si null ou vide, utilise les permissions par défaut du rôle
    page_permissions = models.JSONField(
        default=None,
        blank=True,
        null=True,
        verbose_name="Permissions par page",
        help_text="Liste des chemins de pages autorisés pour cet utilisateur"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de modification"
    )

    class Meta:
        verbose_name = "Profil utilisateur"
        verbose_name_plural = "Profils utilisateurs"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"
    
    def has_page_permission(self, page_path):
        """
        Vérifie si l'utilisateur a la permission d'accéder à une page
        Combine les permissions par défaut du rôle avec les permissions personnalisées
        - None = utiliser uniquement les permissions par défaut
        - [] = utiliser uniquement les permissions par défaut (pas de permissions supplémentaires)
        - [paths...] = permissions par défaut + permissions supplémentaires
        """
        # Les admins ont toujours accès à tout
        if self.role == 'admin' or self.user.is_staff:
            return True
        
        # Récupérer les permissions par défaut du rôle
        default_permissions = self.get_default_permissions()
        
        # Si page_permissions est None ou un tableau vide, utiliser uniquement les permissions par défaut
        if self.page_permissions is None or (isinstance(self.page_permissions, list) and len(self.page_permissions) == 0):
            return page_path in default_permissions
        
        # Si page_permissions contient des valeurs, combiner avec les permissions par défaut
        if isinstance(self.page_permissions, list) and len(self.page_permissions) > 0:
            # Combiner : permissions par défaut + permissions personnalisées (sans doublons)
            all_permissions = list(set(default_permissions + self.page_permissions))
            return page_path in all_permissions
        
        # Cas par défaut : utiliser les permissions par défaut
        return page_path in default_permissions
    
    def get_all_permissions(self):
        """
        Retourne toutes les permissions de l'utilisateur (par défaut + personnalisées)
        - None = permissions par défaut uniquement
        - [] = permissions par défaut uniquement (pas de permissions supplémentaires)
        - [paths...] = permissions par défaut + permissions supplémentaires
        """
        default_permissions = self.get_default_permissions()
        
        # Si page_permissions est None ou un tableau vide, retourner uniquement les permissions par défaut
        if self.page_permissions is None or (isinstance(self.page_permissions, list) and len(self.page_permissions) == 0):
            return default_permissions
        
        # Si page_permissions contient des valeurs, combiner avec les permissions par défaut
        if isinstance(self.page_permissions, list) and len(self.page_permissions) > 0:
            # Combiner : permissions par défaut + permissions personnalisées (sans doublons)
            return list(set(default_permissions + self.page_permissions))
        
        # Cas par défaut : permissions par défaut
        return default_permissions
    
    def get_default_permissions(self):
        """
        Retourne les permissions par défaut selon le rôle
        """
        if self.role == 'admin' or self.user.is_staff:
            return ['/', '/products', '/stock', '/stock-movements', '/interventions',
                   '/installations', '/installations/rappels-paiement', '/clients', '/quotes', '/invoices',
                   '/proforma-invoices', '/expenses', '/zone-de-travail', '/pointage', '/users']
        elif self.role == 'technicien':
            return ['/', '/interventions', '/pointage']
        elif self.role == 'commercial':
            return ['/clients', '/interventions', '/pointage']
        return []


class Client(models.Model):
    """
    Model for managing clients
    """
    name = models.CharField(max_length=200, verbose_name="Nom du client")
    first_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Prénom")
    last_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Nom")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    address = models.TextField(blank=True, null=True, verbose_name="Adresse")
    rccm_number = models.CharField(
        max_length=100, blank=True, null=True,
        verbose_name="Numéro RCCM",
        help_text="Registre du Commerce"
    )
    registration_number = models.CharField(
        max_length=100, blank=True, null=True,
        verbose_name="N° Immatriculation"
    )
    ninea_number = models.CharField(
        max_length=50, blank=True, null=True,
        verbose_name="Numéro NINEA",
        help_text="Identification fiscale"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Date de modification")

    class Meta:
        verbose_name = "Client"
        verbose_name_plural = "Clients"
        ordering = ['-created_at']

    def __str__(self):
        return self.name