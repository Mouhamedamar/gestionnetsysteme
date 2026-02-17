"""
Signaux pour les notifications SMS lors des mouvements de stock.
"""
import logging
from django.db.models.signals import post_save
from django.db.utils import OperationalError
from django.dispatch import receiver

from .models import StockMovement
from .notifications import send_stock_movement_sms

logger = logging.getLogger(__name__)


@receiver(post_save, sender=StockMovement)
def on_stock_movement_created(sender, instance, created, **kwargs):
    """Envoie un SMS aux responsables après création d'un mouvement de stock."""
    if created and not instance.deleted_at:
        try:
            send_stock_movement_sms(instance)
        except OperationalError as e:
            # Tables non créées (migrations non exécutées)
            logger.warning("SMS stock ignoré (tables manquantes): %s. Exécutez: python manage.py migrate stock", e)
