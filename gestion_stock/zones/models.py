from django.db import models


class WorkZone(models.Model):
    """
    Zone de travail : bureau ou chantier, avec position et rayon.
    """
    ZONE_TYPE_CHOICES = [
        ('bureau', 'Bureau'),
        ('chantier', 'Chantier'),
    ]

    name = models.CharField(max_length=200, verbose_name="Nom")
    radius_m = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Rayon (m)",
        help_text="Rayon de la zone en mètres"
    )
    zone_type = models.CharField(
        max_length=20,
        choices=ZONE_TYPE_CHOICES,
        default='bureau',
        verbose_name="Type de zone"
    )
    address = models.TextField(blank=True, null=True, verbose_name="Adresse")
    latitude = models.DecimalField(
        max_digits=12,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name="Latitude"
    )
    longitude = models.DecimalField(
        max_digits=12,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name="Longitude"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Date de modification")

    class Meta:
        verbose_name = "Zone de travail"
        verbose_name_plural = "Zones de travail"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_zone_type_display()})"
