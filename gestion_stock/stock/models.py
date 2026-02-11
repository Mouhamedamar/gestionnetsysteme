from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from products.models import Product


class StockMovement(models.Model):
    """
    Modèle pour les mouvements de stock (ENTRÉE/SORTIE)
    """
    MOVEMENT_TYPE_CHOICES = [
        ('ENTREE', 'Entrée'),
        ('SORTIE', 'Sortie'),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='stock_movements',
        verbose_name="Produit"
    )
    movement_type = models.CharField(
        max_length=10,
        choices=MOVEMENT_TYPE_CHOICES,
        verbose_name="Type de mouvement"
    )
    quantity = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name="Quantité"
    )
    date = models.DateTimeField(default=timezone.now, verbose_name="Date")
    comment = models.TextField(blank=True, null=True, verbose_name="Commentaire")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de suppression")

    class Meta:
        verbose_name = "Mouvement de stock"
        verbose_name_plural = "Mouvements de stock"
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['movement_type']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"{self.movement_type} - {self.product.name} - {self.quantity}"

    def save(self, *args, **kwargs):
        """
        Met à jour automatiquement la quantité du produit lors de la sauvegarde
        """
        if not self.pk:  # Nouveau mouvement
            if self.movement_type == 'ENTREE':
                self.product.quantity += self.quantity
            elif self.movement_type == 'SORTIE':
                if self.product.quantity < self.quantity:
                    raise ValueError(
                        f"Stock insuffisant. Stock disponible: {self.product.quantity}, "
                        f"demandé: {self.quantity}"
                    )
                self.product.quantity -= self.quantity
            self.product.save()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """
        Soft delete avec rollback de la quantité
        """
        if not self.deleted_at:
            # Rollback de la quantité
            if self.movement_type == 'ENTREE':
                self.product.quantity -= self.quantity
            elif self.movement_type == 'SORTIE':
                self.product.quantity += self.quantity
            self.product.save()
            self.deleted_at = timezone.now()
            self.save()

    def soft_delete(self):
        """Soft delete du mouvement"""
        self.delete()

    def restore(self):
        """Restaure un mouvement supprimé"""
        if self.deleted_at:
            # Re-appliquer le mouvement
            if self.movement_type == 'ENTREE':
                self.product.quantity += self.quantity
            elif self.movement_type == 'SORTIE':
                if self.product.quantity < self.quantity:
                    raise ValueError("Stock insuffisant pour restaurer ce mouvement")
                self.product.quantity -= self.quantity
            self.product.save()
            self.deleted_at = None
            self.save()
