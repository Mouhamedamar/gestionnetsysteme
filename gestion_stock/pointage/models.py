from django.db import models
from django.conf import settings


class CheckIn(models.Model):
    """
    Pointage (entrée/sortie) pour les utilisateurs non-admin.
    Lié à une zone de travail (bureau ou chantier) pour savoir où l'utilisateur a pointé.
    """
    TYPE_CHOICES = [
        ('entree', 'Entrée'),
        ('sortie', 'Sortie'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pointages',
        verbose_name='Utilisateur',
    )
    work_zone = models.ForeignKey(
        'zones.WorkZone',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pointages',
        verbose_name='Zone de travail',
    )
    check_type = models.CharField(
        max_length=10,
        choices=TYPE_CHOICES,
        verbose_name='Type',
    )
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='Date et heure')
    note = models.CharField(max_length=255, blank=True, null=True, verbose_name='Note')
    latitude = models.FloatField(blank=True, null=True, verbose_name='Latitude au pointage')
    longitude = models.FloatField(blank=True, null=True, verbose_name='Longitude au pointage')

    class Meta:
        verbose_name = 'Pointage'
        verbose_name_plural = 'Pointages'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username} - {self.get_check_type_display()} - {self.timestamp}"
