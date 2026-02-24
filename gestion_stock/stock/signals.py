"""
Signaux pour les notifications SMS et email lors des mouvements de stock.
"""
import logging
from django.db.models.signals import post_save
from django.db.utils import OperationalError
from django.dispatch import receiver

from .models import StockMovement
from .notifications import send_stock_movement_sms, send_stock_movement_emails

logger = logging.getLogger(__name__)


@receiver(post_save, sender=StockMovement)
def on_stock_movement_created(sender, instance, created, **kwargs):
    """Envoie SMS et emails aux responsables après création d'un mouvement de stock."""
    if created and not instance.deleted_at:
        try:
            send_stock_movement_sms(instance)
            send_stock_movement_emails(instance)
        except OperationalError as e:
            logger.warning(
                "Notifications stock ignorées (tables manquantes): %s. Exécutez: python manage.py migrate stock",
                e,
            )
