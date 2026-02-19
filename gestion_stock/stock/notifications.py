"""
Notifications SMS et email envoyées aux responsables lors des mouvements de stock (entrées/sorties).
- SMS : API Orange si configurée.
- Email : Django send_mail (EMAIL_BACKEND / SMTP selon configuration).
"""
import logging
from django.conf import settings
from django.core.mail import send_mail
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


def _build_email_subject(movement):
    """Sujet de l'email selon le type de mouvement."""
    if movement.movement_type == 'ENTREE':
        return f"[Stock] Entrée - {movement.product.name} (+{movement.quantity})"
    return f"[Stock] Sortie - {movement.product.name} (-{movement.quantity})"


def _build_email_body(movement):
    """Corps de l'email pour un mouvement de stock."""
    if movement.movement_type == 'ENTREE':
        lines = [
            "Entrée de stock",
            "",
            f"Article : {movement.product.name}",
            f"Quantité entrée : {movement.quantity}",
            f"Stock actuel : {movement.product.quantity}",
        ]
    else:
        lines = [
            "Sortie de stock",
            "",
            f"Article : {movement.product.name}",
            f"Quantité sortie : {movement.quantity}",
            f"Reste en stock : {movement.product.quantity}",
        ]
    if movement.comment:
        lines.extend(["", "Commentaire :", movement.comment])
    lines.extend(["", "—", "Gestion Stock"])
    return "\n".join(lines)


def _send_sms(to_phone, body):
    """Envoie un SMS via l'API Orange."""
    return send_sms(to_phone, body)


def send_stock_movement_sms(movement):
    """
    Envoie un SMS à tous les responsables configurés (avec numéro) pour un mouvement de stock.
    Ne lève pas d'exception: les erreurs sont loguées.
    """
    from .models import StockNotificationRecipient

    if movement.movement_type not in ('ENTREE', 'SORTIE'):
        return

    if movement.movement_type == 'ENTREE':
        body = _build_sms_entree(movement)
    else:
        body = _build_sms_sortie(movement)

    recipients = list(StockNotificationRecipient.objects.filter(is_active=True))
    if not recipients:
        logger.warning("SMS stock: aucun responsable configuré.")
        return

    client_id = getattr(settings, 'ORANGE_CLIENT_ID', '') or ''
    client_secret = getattr(settings, 'ORANGE_CLIENT_SECRET', '') or ''
    if not (client_id and client_secret):
        logger.warning(
            "SMS stock: API Orange non configurée (ORANGE_CLIENT_ID, ORANGE_CLIENT_SECRET)."
        )
        return

    sent = 0
    for r in recipients:
        if not (r.phone or '').strip():
            continue
        phone = _normalize_phone(r.phone)
        if phone:
            if _send_sms(phone, body):
                sent += 1
        else:
            logger.warning("SMS stock: numéro invalide pour %s: %s", r.name, r.phone)
    if sent > 0:
        logger.info("SMS stock: %d alerte(s) envoyée(s) pour mouvement %s", sent, movement.pk)


def send_stock_movement_emails(movement):
    """
    Envoie un email à tous les responsables configurés (avec adresse email) pour un mouvement de stock.
    Ne lève pas d'exception: les erreurs sont loguées.
    """
    from .models import StockNotificationRecipient

    if movement.movement_type not in ('ENTREE', 'SORTIE'):
        return

    subject = _build_email_subject(movement)
    body = _build_email_body(movement)
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@gestion-stock.local')

    recipients = list(
        StockNotificationRecipient.objects.filter(is_active=True).exclude(email__isnull=True).exclude(email='')
    )
    if not recipients:
        logger.debug("Email stock: aucun responsable avec email configuré.")
        return

    recipient_list = [r.email.strip() for r in recipients if (r.email or '').strip()]
    if not recipient_list:
        return

    backend = getattr(settings, 'EMAIL_BACKEND', '')
    is_console = 'console' in (backend or '')
    if is_console:
        logger.info(
            "Email stock: envoi à %s (backend CONSOLE → le contenu s'affiche dans le terminal runserver, pas en boîte mail)",
            recipient_list,
        )
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=recipient_list,
            fail_silently=True,
        )
        logger.info(
            "Email stock: alerte envoyée à %d destinataire(s) pour mouvement %s",
            len(recipient_list),
            movement.pk,
        )
    except Exception as e:
        logger.exception("Erreur envoi email stock: %s", e)


# --- Rappels stock faible (produits sous le seuil d'alerte) ---

def _build_low_stock_sms_body(products_list):
    """Message SMS pour rappel produits en stock faible (liste)."""
    lines = ["RAPPEL STOCK FAIBLE", ""]
    for p in products_list[:10]:  # max 10 pour SMS
        name = getattr(p, 'name', str(p))
        qty = getattr(p, 'quantity', None)
        threshold = getattr(p, 'alert_threshold', None)
        if qty is not None and threshold is not None:
            lines.append(f"- {name}: {qty} (seuil {threshold})")
        else:
            lines.append(f"- {name}")
    if len(products_list) > 10:
        lines.append(f"... +{len(products_list) - 10} autre(s)")
    lines.append("")
    lines.append("Gestion Stock")
    return "\n".join(lines)


def _build_low_stock_email_subject(count):
    """Sujet email rappel stock faible."""
    return f"[Stock] Rappel : {count} produit(s) en stock faible"


def _build_low_stock_email_body(products_list):
    """Corps email rappel stock faible."""
    lines = [
        "Rappel – Produits en stock faible",
        "",
        "Les produits suivants sont en dessous du seuil d'alerte :",
        "",
    ]
    for p in products_list:
        name = getattr(p, 'name', str(p))
        qty = getattr(p, 'quantity', None)
        threshold = getattr(p, 'alert_threshold', None)
        if qty is not None and threshold is not None:
            lines.append(f"  • {name} : quantité {qty} (seuil {threshold})")
        else:
            lines.append(f"  • {name}")
    lines.extend(["", "—", "Gestion Stock"])
    return "\n".join(lines)


def send_low_stock_reminders(products_queryset=None, dry_run=False):
    """
    Envoie un rappel SMS et email à tous les responsables (stock faible).
    products_queryset: queryset de Product (stock faible). Si None, on utilise Product.objects.filter(quantity__lte=F('alert_threshold')).
    Retourne: {'sms_sent': int, 'emails_sent': int, 'products_count': int}
    """
    from django.db.models import F
    from .models import StockNotificationRecipient
    from products.models import Product

    if products_queryset is None:
        products_queryset = Product.objects.filter(
            is_active=True
        ).filter(quantity__lte=F('alert_threshold')).order_by('quantity')[:50]
    products_list = list(products_queryset)
    if not products_list:
        return {'sms_sent': 0, 'emails_sent': 0, 'products_count': 0}

    result = {'sms_sent': 0, 'emails_sent': 0, 'products_count': len(products_list)}

    if dry_run:
        return result

    # SMS
    recipients = list(StockNotificationRecipient.objects.filter(is_active=True))
    client_id = getattr(settings, 'ORANGE_CLIENT_ID', '') or ''
    client_secret = getattr(settings, 'ORANGE_CLIENT_SECRET', '') or ''
    if recipients and (client_id and client_secret):
        body = _build_low_stock_sms_body(products_list)
        for r in recipients:
            if not (r.phone or '').strip():
                continue
            phone = _normalize_phone(r.phone)
            if phone and _send_sms(phone, body):
                result['sms_sent'] += 1
        if result['sms_sent'] > 0:
            logger.info("Rappel stock faible SMS: %d destinataire(s), %d produit(s)", result['sms_sent'], len(products_list))

    # Email
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@gestion-stock.local')
    email_recipients = list(
        StockNotificationRecipient.objects.filter(is_active=True).exclude(email__isnull=True).exclude(email='')
    )
    recipient_list = [r.email.strip() for r in email_recipients if (r.email or '').strip()]
    if recipient_list:
        subject = _build_low_stock_email_subject(len(products_list))
        body = _build_low_stock_email_body(products_list)
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=from_email,
                recipient_list=recipient_list,
                fail_silently=True,
            )
            result['emails_sent'] = len(recipient_list)
            logger.info(
                "Rappel stock faible email: %d destinataire(s), %d produit(s)",
                result['emails_sent'], len(products_list),
            )
        except Exception as e:
            logger.exception("Erreur envoi email rappel stock faible: %s", e)

    return result
