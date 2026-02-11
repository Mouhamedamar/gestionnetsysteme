from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal


class Expense(models.Model):
    """
    Modèle pour les dépenses
    """
    CATEGORY_CHOICES = [
        ('FOURNITURE', 'Fourniture'),
        ('TRANSPORT', 'Transport'),
        ('SALAIRE', 'Salaire'),
        ('LOYER', 'Loyer'),
        ('UTILITAIRE', 'Utilitaires'),
        ('MARKETING', 'Marketing'),
        ('MAINTENANCE', 'Maintenance'),
        ('AUTRE', 'Autre'),
    ]

    STATUS_CHOICES = [
        ('PAYE', 'Payé'),
        ('NON_PAYE', 'Non payé'),
    ]

    title = models.CharField(max_length=200, verbose_name="Titre de la dépense")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='AUTRE',
        verbose_name="Catégorie"
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Montant"
    )
    date = models.DateTimeField(default=timezone.now, verbose_name="Date")
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='NON_PAYE',
        verbose_name="Statut"
    )
    supplier = models.CharField(max_length=200, blank=True, null=True, verbose_name="Fournisseur")
    receipt_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Numéro de reçu")
    justification_image = models.ImageField(
        upload_to='expenses/',
        blank=True,
        null=True,
        verbose_name="Image de justification"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Date de modification")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de suppression")

    class Meta:
        verbose_name = "Dépense"
        verbose_name_plural = "Dépenses"
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['status']),
            models.Index(fields=['date']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.amount} FCFA"

    def soft_delete(self):
        """Soft delete de la dépense"""
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        """Restaure une dépense supprimée"""
        self.deleted_at = None
        self.save()

    def hard_delete(self):
        """Suppression définitive"""
        super().delete()
