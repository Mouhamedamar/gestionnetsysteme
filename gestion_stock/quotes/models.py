from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from products.models import Product
from accounts.models import Client
from decimal import Decimal
import uuid


class Quote(models.Model):
    """
    Modèle pour les devis
    """
    COMPANY_CHOICES = [
        ('NETSYSTEME', 'NETSYSTEME'),
        ('SSE', 'SSE'),
    ]

    quote_number = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        verbose_name="Numéro de devis"
    )
    date = models.DateTimeField(default=timezone.now, verbose_name="Date")
    expiration_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date d'expiration"
    )
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
    client_email = models.EmailField(
        blank=True,
        null=True,
        verbose_name="Email du client"
    )
    client_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Téléphone du client"
    )
    client_address = models.TextField(
        blank=True,
        null=True,
        verbose_name="Adresse du client"
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
    company = models.CharField(
        max_length=20,
        choices=COMPANY_CHOICES,
        default='NETSYSTEME',
        verbose_name="Société"
    )
    converted_invoice = models.ForeignKey(
        'invoices.Invoice',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='source_quote',
        verbose_name="Facture issue du devis"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Date de modification")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de suppression")

    class Meta:
        verbose_name = "Devis"
        verbose_name_plural = "Devis"
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['quote_number']),
            models.Index(fields=['date']),
            models.Index(fields=['expiration_date']),
        ]

    def __str__(self):
        client_display = self.client.name if self.client else (self.client_name or 'Client inconnu')
        return f"Devis {self.quote_number} - {client_display}"

    def generate_quote_number(self):
        """Génère un numéro de devis unique"""
        if not self.quote_number:
            # Format: DEV-YYYYMMDD-UUID
            date_str = timezone.now().strftime('%Y%m%d')
            unique_id = str(uuid.uuid4())[:8].upper()
            self.quote_number = f"DEV-{date_str}-{unique_id}"
        return self.quote_number

    def calculate_totals(self):
        """Calcule les totaux HT et TTC à partir des items"""
        items = self.quote_items.filter(deleted_at__isnull=True)
        self.total_ht = sum(item.subtotal for item in items)
        # TTC = HT + TVA (18%)
        self.total_ttc = self.total_ht * Decimal('1.18')
        self.save()

    def is_expired(self):
        """Vérifie si le devis est expiré (selon la date d'expiration)"""
        if self.expiration_date:
            return timezone.now() > self.expiration_date
        return False

    def soft_delete(self):
        """Soft delete du devis"""
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        """Restaure un devis supprimé"""
        self.deleted_at = None
        self.save()

    def save(self, *args, **kwargs):
        """Génère le numéro de devis si nécessaire"""
        if not self.quote_number:
            self.generate_quote_number()
        super().save(*args, **kwargs)


class QuoteItem(models.Model):
    """
    Modèle pour les lignes de devis
    """
    quote = models.ForeignKey(
        Quote,
        on_delete=models.CASCADE,
        related_name='quote_items',
        verbose_name="Devis"
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
        verbose_name = "Ligne de devis"
        verbose_name_plural = "Lignes de devis"
        ordering = ['created_at']

    def __str__(self):
        return f"{self.quote.quote_number} - {self.product.name}"

    def save(self, *args, **kwargs):
        """Calcule le sous-total automatiquement"""
        self.subtotal = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        # Recalculer les totaux du devis
        if self.quote:
            self.quote.calculate_totals()

    def soft_delete(self):
        """Soft delete de l'item"""
        self.deleted_at = timezone.now()
        self.save()
        if self.quote:
            self.quote.calculate_totals()

    def restore(self):
        """Restaure un item supprimé"""
        self.deleted_at = None
        self.save()
