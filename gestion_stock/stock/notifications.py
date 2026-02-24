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


def _build_sms_low_stock_reminder(products_list):
    """Message SMS pour rappel produits en stock faible."""
    lines = ["RAPPEL STOCK FAIBLE", ""]
    for p in products_list[:15]:
        name = getattr(p, 'name', str(p))
        qty = getattr(p, 'quantity', 0)
        thresh = getattr(p, 'alert_threshold', 0)
        lines.append(f"- {name}: {qty} (seuil {thresh})")
    if len(products_list) > 15:
        lines.append(f"... et {len(products_list) - 15} autre(s)")
    lines.extend(["", "— Gestion Stock"])
    return "\n".join(lines)


def _build_email_low_stock_reminder(products_list):
    """Sujet et corps email pour rappel produits en stock faible."""
    subject = f"[Stock] Rappel : {len(products_list)} produit(s) en stock faible"
    lines = [
        "Rappel : produits en stock faible",
        "",
        "Les produits suivants sont en dessous du seuil d'alerte :",
        "",
    ]
    for p in products_list[:50]:
        name = getattr(p, 'name', str(p))
        qty = getattr(p, 'quantity', 0)
        thresh = getattr(p, 'alert_threshold', 0)
        lines.append(f"  - {name} : quantité {qty} (seuil {thresh})")
    if len(products_list) > 50:
        lines.append(f"  ... et {len(products_list) - 50} autre(s) produit(s)")
    lines.extend(["", "—", "Gestion Stock"])
    return subject, "\n".join(lines)


def send_low_stock_reminders(products_list):
    """
    Envoie SMS et email aux responsables (actifs avec téléphone/email) pour la liste des
    produits en stock faible. products_list : queryset ou liste d'objets avec name, quantity, alert_threshold.
    Retourne (nb_sms, nb_emails). Ne lève pas d'exception.
    """
    from .models import StockNotificationRecipient
    from django.db.models import F
    from products.models import Product

    if not products_list:
        return 0, 0

    # Normaliser en liste d'objets (si queryset Product)
    try:
        products_list = list(products_list)
    except Exception:
        products_list = list(products_list)

    if not products_list:
        return 0, 0

    recipients = list(StockNotificationRecipient.objects.filter(is_active=True))
    if not recipients:
        logger.warning("Rappels stock faible: aucun responsable actif.")
        return 0, 0

    nb_sms = 0
    nb_emails = 0

    # SMS
    body_sms = _build_sms_low_stock_reminder(products_list)
    client_id = getattr(settings, 'ORANGE_CLIENT_ID', '') or ''
    client_secret = getattr(settings, 'ORANGE_CLIENT_SECRET', '') or ''
    if client_id and client_secret:
        for r in recipients:
            if not (r.phone or '').strip():
                continue
            phone = _normalize_phone(r.phone)
            if phone and _send_sms(phone, body_sms):
                nb_sms += 1
    else:
        logger.debug("Rappels stock faible SMS: API Orange non configurée.")

    # Email
    subject, body_email = _build_email_low_stock_reminder(products_list)
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@gestion-stock.local')
    recipient_emails = [r.email.strip() for r in recipients if (r.email or '').strip()]
    if recipient_emails:
        try:
            send_mail(
                subject=subject,
                message=body_email,
                from_email=from_email,
                recipient_list=recipient_emails,
                fail_silently=True,
            )
            nb_emails = len(recipient_emails)
            logger.info("Rappels stock faible: email envoyé à %d destinataire(s)", nb_emails)
        except Exception as e:
            logger.exception("Erreur envoi email rappels stock faible: %s", e)
    else:
        logger.debug("Rappels stock faible: aucun destinataire email.")

    return nb_sms, nb_emails
