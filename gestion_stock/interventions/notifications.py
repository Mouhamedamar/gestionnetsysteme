"""
Notifications envoyées au technicien lors de l'assignation à une intervention :
- email
- SMS (Twilio si configuré, sinon log en dev)
"""
import logging
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def _technician_display_name(technician):
    if technician.first_name or technician.last_name:
        return f"{technician.first_name or ''} {technician.last_name or ''}".strip()
    return technician.username or str(technician)


def _format_scheduled_date(intervention):
    if intervention.scheduled_date:
        return intervention.scheduled_date.strftime('%d/%m/%Y %H:%M')
    return 'Non planifiée'


def _build_email_body(intervention):
    lines = [
        f"Intervention : {intervention.intervention_number}",
        f"Titre : {intervention.title}",
        "",
        f"Client : {intervention.client_name or 'Non renseigné'}",
        f"Téléphone client : {intervention.client_phone or '-'}",
        f"Adresse : {intervention.client_address or '-'}",
        "",
        f"Date prévue : {_format_scheduled_date(intervention)}",
        f"Priorité : {intervention.get_priority_display() if hasattr(intervention, 'get_priority_display') else intervention.priority}",
        f"Statut : {intervention.get_status_display() if hasattr(intervention, 'get_status_display') else intervention.status}",
    ]
    if intervention.description:
        lines.extend(["", "Description :", intervention.description])
    return "\n".join(lines)


def _build_sms_text(intervention):
    # SMS court (160 caractères recommandés pour 1 segment)
    addr = (intervention.client_address or "")[:40]
    if len((intervention.client_address or "")) > 40:
        addr = addr + "..."
    return (
        f"Assignation intervention {intervention.intervention_number}: {intervention.title}. "
        f"Client: {intervention.client_name or '-'}. "
        f"Date: {_format_scheduled_date(intervention)}. "
        f"Adresse: {addr}"
    )


def send_assignment_email(intervention, technician):
    """
    Envoie un email au technicien pour l'informer de son assignation à une intervention.
    Ne lève pas d'exception : les erreurs sont loguées.
    """
    if not technician or not getattr(technician, 'email', None) or not technician.email.strip():
        logger.warning("Notification email assignation: technicien sans email (id=%s)", getattr(technician, 'id', None))
        return False
    subject = f"[Gestion] Assignation intervention {intervention.intervention_number} - {intervention.title}"
    body = (
        f"Bonjour {_technician_display_name(technician)},\n\n"
        "Vous avez été assigné(e) à l'intervention suivante.\n\n"
        f"{_build_email_body(intervention)}\n\n"
        "Cordialement,\nL'équipe Gestion"
    )
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[technician.email],
            fail_silently=False,
        )
        logger.info("Email assignation envoyé à %s pour intervention %s", technician.email, intervention.intervention_number)
        return True
    except Exception as e:
        logger.exception("Erreur envoi email assignation à %s: %s", technician.email, e)
        return False


def send_assignment_sms(intervention, technician):
    """
    Envoie un SMS au technicien pour l'informer de son assignation.
    Utilise Twilio si TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_FROM_NUMBER sont définis.
    Sinon, log le message (utile en dev).
    Ne lève pas d'exception : les erreurs sont loguées.
    """
    phone = None
    if technician and hasattr(technician, 'profile') and technician.profile:
        phone = getattr(technician.profile, 'phone', None)
    if not phone or not str(phone).strip():
        logger.warning("Notification SMS assignation: technicien sans numéro (id=%s)", getattr(technician, 'id', None))
        return False

    # Normaliser le numéro pour Twilio (E.164). Ex: 0612345678 -> +33612345678
    phone = str(phone).strip().replace(' ', '')
    if not phone.startswith('+'):
        if phone.startswith('0') and len(phone) == 10:
            phone = '+33' + phone[1:]
        elif len(phone) == 9 and phone[0] in ('6', '7'):
            phone = '+33' + phone
        else:
            phone = '+' + phone

    message_body = _build_sms_text(intervention)

    sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '') or ''
    token = getattr(settings, 'TWILIO_AUTH_TOKEN', '') or ''
    from_number = getattr(settings, 'TWILIO_FROM_NUMBER', '') or ''

    if sid and token and from_number:
        try:
            from twilio.rest import Client
            client = Client(sid, token)
            client.messages.create(body=message_body, from_=from_number, to=phone)
            logger.info("SMS assignation envoyé à %s pour intervention %s", phone, intervention.intervention_number)
            return True
        except Exception as e:
            logger.exception("Erreur envoi SMS assignation à %s: %s", phone, e)
            return False
    else:
        logger.info(
            "SMS assignation (Twilio non configuré) – destinataire: %s, message: %s",
            phone, message_body[:80] + "..." if len(message_body) > 80 else message_body
        )
        return False


def notify_technician_assignment(intervention, technician):
    """
    Envoie email + SMS au technicien pour une nouvelle assignation.
    Les échecs d'envoi ne font pas échouer l'assignation (log uniquement).
    """
    send_assignment_email(intervention, technician)
    send_assignment_sms(intervention, technician)
