from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from accounts.models import Client
from products.models import Product


class Intervention(models.Model):
    """
    Modèle pour les interventions techniques
    """
    STATUS_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('EN_COURS', 'En cours'),
        ('TERMINE', 'Terminé'),
        ('ANNULE', 'Annulé'),
    ]

    PRIORITY_CHOICES = [
        ('BASSE', 'Basse'),
        ('NORMALE', 'Normale'),
        ('HAUTE', 'Haute'),
        ('URGENTE', 'Urgente'),
    ]

    intervention_number = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        verbose_name="Numéro d'intervention"
    )
    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    client = models.ForeignKey(
        Client,
        on_delete=models.PROTECT,
        verbose_name="Client",
        null=True,
        blank=True
    )
    client_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Nom du client"
    )
    client_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Téléphone client"
    )
    client_address = models.TextField(
        blank=True,
        null=True,
        verbose_name="Adresse d'intervention"
    )
    technician = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='interventions',
        verbose_name="Technicien assigné"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='EN_ATTENTE',
        verbose_name="Statut"
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='NORMALE',
        verbose_name="Priorité"
    )
    scheduled_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date prévue"
    )
    start_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de début"
    )
    end_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de fin"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notes techniques"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Date de modification")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de suppression")

    class Meta:
        verbose_name = "Intervention"
        verbose_name_plural = "Interventions"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['technician']),
            models.Index(fields=['scheduled_date']),
        ]

    def __str__(self):
        return f"{self.intervention_number} - {self.title}"

    def save(self, *args, **kwargs):
        if not self.intervention_number:
            # Générer un numéro unique
            date_str = timezone.now().strftime('%Y%m%d')
            last_intervention = Intervention.objects.filter(
                intervention_number__startswith=f'INT-{date_str}'
            ).order_by('-intervention_number').first()
            
            if last_intervention:
                try:
                    last_num = int(last_intervention.intervention_number.split('-')[-1])
                    new_num = last_num + 1
                except:
                    new_num = 1
            else:
                new_num = 1
            
            self.intervention_number = f'INT-{date_str}-{new_num:04d}'
        super().save(*args, **kwargs)

    def soft_delete(self):
        """Soft delete de l'intervention"""
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        """Restaure une intervention supprimée"""
        self.deleted_at = None
        self.save()


class InterventionProduct(models.Model):
    """
    Produits utilisés lors d'une intervention
    """
    intervention = models.ForeignKey(
        Intervention,
        on_delete=models.CASCADE,
        related_name='products_used',
        verbose_name="Intervention"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        verbose_name="Produit"
    )
    quantity = models.IntegerField(
        default=1,
        verbose_name="Quantité utilisée"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notes"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")

    class Meta:
        verbose_name = "Produit d'intervention"
        verbose_name_plural = "Produits d'intervention"
        unique_together = ['intervention', 'product']

    def __str__(self):
        return f"{self.intervention.intervention_number} - {self.product.name} x{self.quantity}"
