from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.core.exceptions import ValidationError


class Product(models.Model):
    """
    Modèle pour les produits avec gestion du stock et des prix
    """
    name = models.CharField(max_length=200, verbose_name="Nom du produit")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    category = models.CharField(max_length=100, blank=True, null=True, verbose_name="Catégorie")
    quantity = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="Quantité en stock"
    )
    purchase_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Prix d'achat"
    )
    sale_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Prix de vente"
    )
    alert_threshold = models.IntegerField(
        default=10,
        validators=[MinValueValidator(0)],
        verbose_name="Seuil d'alerte"
    )
    photo = models.ImageField(
        upload_to='products/',
        blank=True,
        null=True,
        verbose_name="Photo du produit"
    )
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Date de modification")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de suppression")

    def __str__(self):
        return f"{self.name} - {self.quantity} en stock"
        
    def clean(self):
        """Validation personnalisée"""
        # Vérifier que les prix ne sont pas None avant de les comparer
        if self.sale_price is not None and self.purchase_price is not None:
            if self.sale_price < self.purchase_price:
                raise ValidationError({
                    'sale_price': "Le prix de vente doit être supérieur ou égal au prix d'achat"
                })
            
    def save(self, *args, **kwargs):
        """Sauvegarde avec validation"""
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Produit"
        verbose_name_plural = "Produits"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name

    def is_low_stock(self):
        """Vérifie si le stock est en dessous du seuil d'alerte"""
        return self.quantity <= self.alert_threshold

    def soft_delete(self):
        """Soft delete du produit"""
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save()

    def restore(self):
        """Restaure un produit supprimé"""
        self.deleted_at = None
        self.is_active = True
        self.save()
