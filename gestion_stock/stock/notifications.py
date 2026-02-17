"""
Notifications SMS envoyées aux responsables lors des mouvements de stock (entrées/sorties).
Utilise l'API Orange si configurée.
"""
import logging
from gestion_stock.sms_backend import send_sms, normalize_phone as _normalize_phone

logger = logging.getLogger(__name__)


def _build_sms_entree(movement):
    """Message SMS pour entrée de stock."""
    lines = [
        "ENTREE DE STOCK",
        f"Article: {movement.product.name}",
        f"Qté entree: {movement.quantity}",
        f"Stock actuel: {movement.product.quantity}",
    ]
    if movement.comment:
        lines.append(f"Raison: {movement.comment[:50]}")
    return "\n".join(lines)


def _build_sms_sortie(movement):
    """Message SMS pour sortie de stock."""
    lines = [
        "SORTIE DE STOCK",
        f"Article: {movement.product.name}",
        f"Qté sortie: {movement.quantity}",
        f"Reste: {movement.product.quantity}",
    ]
    if movement.comment:
        lines.append(f"Raison: {movement.comment[:50]}")
    return "\n".join(lines)


def _send_sms(to_phone, body):
    """Envoie un SMS via l'API Orange."""
    return send_sms(to_phone, body)


def send_stock_movement_sms(movement):
    """
    Envoie un SMS à tous les responsables configurés pour un mouvement de stock.
    Ne lève pas d'exception: les erreurs sont loguées.
    """
    from .models import StockNotificationRecipient

    if movement.movement_type == 'ENTREE':
        body = _build_sms_entree(movement)
    elif movement.movement_type == 'SORTIE':
        body = _build_sms_sortie(movement)
    else:
        return

    recipients = list(StockNotificationRecipient.objects.filter(is_active=True))
    if not recipients:
        logger.warning("SMS stock: aucun responsable configuré. Allez dans Config SMS Stock pour ajouter des numéros.")
        return

    from django.conf import settings
    client_id = getattr(settings, 'ORANGE_CLIENT_ID', '') or ''
    client_secret = getattr(settings, 'ORANGE_CLIENT_SECRET', '') or ''
    if not (client_id and client_secret):
        logger.warning(
            "SMS stock: API Orange non configurée (ORANGE_CLIENT_ID, ORANGE_CLIENT_SECRET). "
            "Définissez ces variables d'environnement pour envoyer des SMS."
        )
        return

    sent = 0
    for r in recipients:
        phone = _normalize_phone(r.phone)
        if phone:
            if _send_sms(phone, body):
                sent += 1
        else:
            logger.warning("SMS stock: numéro invalide pour %s: %s", r.name, r.phone)
    if sent > 0:
        logger.info("SMS stock: %d alerte(s) envoyée(s) pour mouvement %s", sent, movement.pk)
