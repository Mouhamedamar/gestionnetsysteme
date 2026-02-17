"""
Notifications SMS envoyées au technicien lors de l'assignation à une installation.
Utilise l'API Orange (gestion_stock.sms_backend) si configurée.
"""
import logging
from gestion_stock.sms_backend import send_sms, normalize_phone

logger = logging.getLogger(__name__)


def _format_scheduled_date(installation):
    """Date prévue au format court pour SMS."""
    if installation.scheduled_date:
        return installation.scheduled_date.strftime('%d/%m/%Y %H:%M')
    if installation.installation_date:
        return installation.installation_date.strftime('%d/%m/%Y')
    return 'Non planifiée'


def _get_company_for_installation(installation):
    """Retourne 'SSE' ou 'NETSYSTEME' selon la facture associée."""
    if installation.invoice_id and installation.invoice:
        company = getattr(installation.invoice, 'company', None)
        if company and str(company).upper() == 'SSE':
            return 'SSE'
    return 'NETSYSTEME'


def _build_installation_sms_text(installation):
    """Construit le texte SMS court pour une assignation d'installation (≤160 car. recommandé)."""
    addr = (installation.client_address or installation.client_name or "")[:35]
    if len((installation.client_address or installation.client_name or "")) > 35:
        addr = addr + "..."
    return (
        f"Installation {installation.installation_number}: {installation.title}. "
        f"Client: {installation.client_name or '-'}. "
        f"Date: {_format_scheduled_date(installation)}. "
        f"Adresse: {addr}"
    )


def send_installation_assignment_sms(installation, technician):
    """
    Envoie un SMS au technicien pour l'informer de son assignation à une installation.
    Utilise l'API Orange si configurée. Ne lève pas d'exception ; les erreurs sont loguées.
    """
    phone = None
    if technician and hasattr(technician, 'profile') and technician.profile:
        phone = getattr(technician.profile, 'phone', None)
    if not phone or not str(phone).strip():
        logger.warning(
            "Notification SMS installation: technicien sans numéro (id=%s)",
            getattr(technician, 'id', None),
        )
        return False

    phone = normalize_phone(phone)
    if not phone:
        logger.warning(
            "Notification SMS installation: numéro invalide (technicien id=%s)",
            getattr(technician, 'id', None),
        )
        return False

    message_body = _build_installation_sms_text(installation)
    company = _get_company_for_installation(installation)
    ok = send_sms(phone, message_body, company=company)
    if ok:
        logger.info(
            "SMS assignation installation envoyé à %s pour %s",
            phone,
            installation.installation_number,
        )
    else:
        logger.info(
            "SMS assignation installation (API Orange non configurée) – destinataire: %s, message: %s",
            phone,
            message_body[:80] + "..." if len(message_body) > 80 else message_body,
        )
    return ok


def notify_technician_installation_assignment(installation, technician):
    """
    Notifie le technicien par SMS qu'une tâche d'installation lui a été assignée.
    Les échecs d'envoi ne font pas échouer l'assignation (log uniquement).
    """
    if not technician:
        return
    send_installation_assignment_sms(installation, technician)
