from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal
from accounts.models import Client
from products.models import Product


class Installation(models.Model):
    """
    Modèle pour les installations techniques effectuées par les techniciens
    """
    STATUS_CHOICES = [
        ('PLANIFIEE', 'Planifiée'),
        ('EN_COURS', 'En cours'),
        ('TERMINEE', 'Terminée'),
        ('ANNULEE', 'Annulée'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('ESPECE', 'Espèce (Comptant)'),
        ('1_TRANCHE', '1 tranche'),
        ('2_TRANCHES', '2 tranches'),
        ('3_TRANCHES', '3 tranches'),
        ('4_TRANCHES', '4 tranches'),
    ]

    TYPE_CHOICES = [
        ('EQUIPEMENT', 'Équipement'),
        ('SYSTEME', 'Système'),
        ('RESEAU', 'Réseau'),
        ('LOGICIEL', 'Logiciel'),
        ('AUTRE', 'Autre'),
    ]

    installation_number = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        verbose_name="Numéro d'installation"
    )
    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    installation_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='EQUIPEMENT',
        verbose_name="Type d'installation"
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
    client_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Téléphone client"
    )
    client_address = models.TextField(
        blank=True,
        null=True,
        verbose_name="Adresse d'installation"
    )
    # Détails installation (nouveau formulaire)
    installation_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date d'installation"
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        blank=True,
        null=True,
        verbose_name="Méthode de paiement"
    )
    first_installment_due_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date d'échéance (1ère tranche)"
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(0)],
        verbose_name="Montant total (F)"
    )
    advance_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(0)],
        verbose_name="Avance - 1ère tranche (F)"
    )
    remaining_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(0)],
        blank=True,
        null=True,
        verbose_name="Restant à payer (F)"
    )
    commercial_agent = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='installations_as_commercial',
        verbose_name="Agent commercial"
    )
    technician = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='installations',
        verbose_name="Technicien assigné"
    )
    technicians = models.ManyToManyField(
        User,
        related_name='installations_as_technician',
        blank=True,
        verbose_name="Techniciens"
    )
    invoice = models.ForeignKey(
        'invoices.Invoice',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='installations',
        verbose_name="Facture associée"
    )
    contract_file = models.FileField(
        upload_to='installation_contracts/%Y/%m/',
        null=True,
        blank=True,
        verbose_name="Contrat (PDF ou image)"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PLANIFIEE',
        verbose_name="Statut"
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
    warranty_period = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Période de garantie (mois)"
    )
    warranty_end_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date de fin de garantie"
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
        verbose_name = "Installation"
        verbose_name_plural = "Installations"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['technician']),
            models.Index(fields=['scheduled_date']),
            models.Index(fields=['installation_type']),
        ]

    def __str__(self):
        return f"{self.installation_number} - {self.title}"

    def save(self, *args, **kwargs):
        if not self.installation_number:
            # Générer un numéro unique
            date_str = timezone.now().strftime('%Y%m%d')
            last_installation = Installation.objects.filter(
                installation_number__startswith=f'INST-{date_str}'
            ).order_by('-installation_number').first()
            
            if last_installation:
                try:
                    last_num = int(last_installation.installation_number.split('-')[-1])
                    new_num = last_num + 1
                except:
                    new_num = 1
            else:
                new_num = 1
            
            self.installation_number = f'INST-{date_str}-{new_num:04d}'
        
        # Calculer la date de fin de garantie si période de garantie et date de fin sont définies
        if self.warranty_period and self.end_date and not self.warranty_end_date:
            from datetime import timedelta
            # Approximation: 30 jours par mois
            days = self.warranty_period * 30
            self.warranty_end_date = self.end_date.date() + timedelta(days=days)
        
        super().save(*args, **kwargs)

    def soft_delete(self):
        """Soft delete de l'installation"""
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        """Restaure une installation supprimée"""
        self.deleted_at = None
        self.save()


class InstallationProduct(models.Model):
    """
    Produits utilisés lors d'une installation
    """
    installation = models.ForeignKey(
        Installation,
        on_delete=models.CASCADE,
        related_name='products_used',
        verbose_name="Installation"
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
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(0)],
        verbose_name="Prix unitaire (F)"
    )
    serial_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Numéro de série"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notes"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")

    class Meta:
        verbose_name = "Produit d'installation"
        verbose_name_plural = "Produits d'installation"

    @property
    def subtotal(self):
        return (self.quantity or 0) * (self.unit_price or 0)

    def __str__(self):
        return f"{self.installation.installation_number} - {self.product.name} x{self.quantity}"


class InstallationPaymentReminderLog(models.Model):
    """
    Historique des rappels de paiement SMS envoyés aux clients.
    """
    REMINDER_TYPE_CHOICES = [
        ('J5', 'J-5 (5 jours avant)'),
        ('J2', 'J-2 (2 jours avant)'),
        ('J0', 'Jour J'),
    ]
    installation = models.ForeignKey(
        Installation,
        on_delete=models.CASCADE,
        related_name='payment_reminder_logs',
        verbose_name="Installation"
    )
    due_date = models.DateField(verbose_name="Date d'échéance")
    reminder_type = models.CharField(
        max_length=5,
        choices=REMINDER_TYPE_CHOICES,
        default='J0',
        verbose_name="Type de rappel"
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Montant (F)"
    )
    sent_at = models.DateTimeField(auto_now_add=True, verbose_name="Envoyé le")

    class Meta:
        verbose_name = "Rappel de paiement envoyé"
        verbose_name_plural = "Rappels de paiement envoyés"
        ordering = ['-sent_at']

    def __str__(self):
        return f"{self.installation.installation_number} - {self.reminder_type} - {self.due_date}"
