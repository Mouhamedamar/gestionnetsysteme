from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from products.models import Product
from accounts.models import Client
from decimal import Decimal
import uuid


class Invoice(models.Model):
    """
    Modèle pour les factures
    """
    STATUS_CHOICES = [
        ('PAYE', 'Payé'),
        ('NON_PAYE', 'Non payé'),
    ]

    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        verbose_name="Numéro de facture"
    )
    date = models.DateTimeField(default=timezone.now, verbose_name="Date")
    client = models.ForeignKey(
        Client,
        on_delete=models.PROTECT,
        verbose_name="Client",
        null=True,
        blank=True  # Temporarily allow null for migration
    )
    client_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Nom du client"
    )
    total_ht = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Total HT"
    )
    total_ttc = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Total TTC"
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='NON_PAYE',
        verbose_name="Statut"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Date de modification")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de suppression")
    is_cancelled = models.BooleanField(default=False, verbose_name="Annulée")
    is_proforma = models.BooleanField(default=False, verbose_name="Facture Pro Forma")

    class Meta:
        verbose_name = "Facture"
        verbose_name_plural = "Factures"
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['invoice_number']),
            models.Index(fields=['status']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        client_display = self.client.name if self.client else (self.client_name or 'Client inconnu')
        return f"Facture {self.invoice_number} - {client_display}"

    def generate_invoice_number(self):
        """Génère un numéro de facture unique"""
        if not self.invoice_number:
            # Format: INV-YYYYMMDD-UUID
            date_str = timezone.now().strftime('%Y%m%d')
            unique_id = str(uuid.uuid4())[:8].upper()
            self.invoice_number = f"INV-{date_str}-{unique_id}"
        return self.invoice_number

    def calculate_totals(self):
        """Calcule les totaux HT et TTC à partir des items"""
        items = self.invoice_items.filter(deleted_at__isnull=True)
        self.total_ht = sum(item.subtotal for item in items)
        # TTC = HT + TVA (18%)
        self.total_ttc = self.total_ht * Decimal('1.18')
        self.save()

    def cancel(self):
        """
        Annule la facture et restaure le stock
        """
        if not self.is_cancelled:
            # Restaurer le stock pour chaque item
            for item in self.invoice_items.filter(deleted_at__isnull=True):
                item.product.quantity += item.quantity
                item.product.save()
            self.is_cancelled = True
            self.status = 'NON_PAYE'
            self.save()

    def soft_delete(self):
        """Soft delete de la facture"""
        if not self.is_cancelled:
            self.cancel()
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        """Restaure une facture annulée"""
        if self.is_cancelled:
            # Vérifier le stock avant de restaurer
            for item in self.invoice_items.filter(deleted_at__isnull=True):
                if item.product.quantity < item.quantity:
                    raise ValueError(
                        f"Stock insuffisant pour restaurer la facture. "
                        f"Produit: {item.product.name}, Stock disponible: {item.product.quantity}"
                    )
            # Réappliquer les sorties de stock
            for item in self.invoice_items.filter(deleted_at__isnull=True):
                item.product.quantity -= item.quantity
                item.product.save()
            self.is_cancelled = False
            self.save()
        self.deleted_at = None
        self.save()

    def save(self, *args, **kwargs):
        """Génère le numéro de facture si nécessaire"""
        if not self.invoice_number:
            self.generate_invoice_number()
        super().save(*args, **kwargs)


class InvoiceItem(models.Model):
    """
    Modèle pour les lignes de facture
    """
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='invoice_items',
        verbose_name="Facture"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        verbose_name="Produit"
    )
    quantity = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name="Quantité"
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Prix unitaire"
    )
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Sous-total"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de suppression")

    class Meta:
        verbose_name = "Ligne de facture"
        verbose_name_plural = "Lignes de facture"
        ordering = ['created_at']

    def __str__(self):
        return f"{self.invoice.invoice_number} - {self.product.name}"

    def save(self, *args, **kwargs):
        """Calcule le sous-total automatiquement"""
        self.subtotal = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        # Recalculer les totaux de la facture
        if self.invoice:
            self.invoice.calculate_totals()

    def soft_delete(self):
        """Soft delete de l'item"""
        self.deleted_at = timezone.now()
        self.save()
        if self.invoice:
            self.invoice.calculate_totals()

    def restore(self):
        """Restaure un item supprimé"""
        self.deleted_at = None
        self.save()
