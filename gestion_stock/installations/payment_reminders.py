"""
Rappels de paiement SMS pour les installations.
Construit la liste des rappels (J-5, J-2, Jour J) et envoie les SMS via l'API Orange.
"""
import logging
from datetime import date, timedelta
from decimal import Decimal

from gestion_stock.sms_backend import send_sms, normalize_phone as _normalize_phone

logger = logging.getLogger(__name__)

REMINDER_J5 = 'J5'
REMINDER_J2 = 'J2'
REMINDER_J0 = 'J0'




def _build_sms_reminder(client_name, amount, due_date_str, tranche_label='Reliquat'):
    """Construit le message SMS de rappel de paiement."""
    lines = [
        f"Rappel {tranche_label}",
        f"Client: {client_name or 'Client'}",
        f"Montant: {amount} F",
        f"Echeance: {due_date_str}",
        "NETSYSTEME"
    ]
    return "\n".join(lines)


def get_client_phone(installation):
    """Retourne le téléphone client (installation.client_phone ou client.phone)."""
    if installation.client_phone and str(installation.client_phone).strip():
        return str(installation.client_phone).strip()
    if installation.client and installation.client.phone:
        return str(installation.client.phone).strip()
    return None


def build_reminders_list(installations_queryset):
    """
    Construit la liste des rappels à envoyer pour aujourd'hui.
    J-5: échéance dans 5 jours, J-2: dans 2 jours, Jour J: aujourd'hui.
    Inclut aussi les rappels en retard (échéance passée) comme "Jour J".
    Retourne: { 'J5': [...], 'J2': [...], 'J0': [...], 'reminders': [...], counts, ... }
    """
    from .models import Installation, InstallationPaymentReminderLog

    today = date.today()
    j5_date = today + timedelta(days=5)
    j2_date = today + timedelta(days=2)

    reminders_j5 = []
    reminders_j2 = []
    reminders_j0 = []
    all_reminders = []

    installations = installations_queryset.filter(
        deleted_at__isnull=True,
        remaining_amount__gt=0,
        first_installment_due_date__isnull=False
    ).select_related('client', 'invoice')

    for inst in installations:
        due = inst.first_installment_due_date
        if isinstance(due, str):
            try:
                due = date.fromisoformat(due.split('T')[0] if 'T' in str(due) else str(due))
            except (ValueError, TypeError):
                continue
        if not due:
            continue

        phone = get_client_phone(inst)
        if not phone:
            continue

        amount = inst.remaining_amount or Decimal('0')
        amount_str = f"{int(amount):,}".replace(',', ' ')
        due_str = due.strftime('%d/%m/%Y')
        tranche_label = 'Reliquat'
        if inst.payment_method:
            labels = {'1_TRANCHE': '1ère tranche', '2_TRANCHES': '2e tranche', '3_TRANCHES': '3e tranche', '4_TRANCHES': '4e tranche'}
            tranche_label = labels.get(inst.payment_method, 'Reliquat')

        client_name = inst.client_name or (inst.client.name if inst.client else 'Client')
        company = (inst.invoice.company if inst.invoice else None)
        company = 'SSE' if company and str(company).upper() == 'SSE' else 'NETSYSTEME'

        reminder_data = {
            'installation_id': inst.id,
            'installation_number': inst.installation_number,
            'client_name': client_name,
            'client_phone': phone,
            'tranche_label': tranche_label,
            'due_date': due.isoformat(),
            'due_date_str': due_str,
            'amount': str(amount),
            'amount_str': amount_str,
            'company': company,
        }

        # Déjà envoyé aujourd'hui ?
        already_sent = InstallationPaymentReminderLog.objects.filter(
            installation=inst,
            due_date=due,
            sent_at__date=today
        ).exists()

        if already_sent:
            reminder_data['status'] = 'sent'
            reminder_data['status_label'] = 'Envoyé'
            reminder_data['reminder_type'] = REMINDER_J0
            all_reminders.append(reminder_data)
            continue

        reminder_data['status'] = 'pending'
        reminder_data['status_label'] = 'À envoyer'

        if due == j5_date:
            reminder_data['reminder_type'] = REMINDER_J5
            reminders_j5.append(reminder_data)
            all_reminders.append(reminder_data)
        elif due == j2_date:
            reminder_data['reminder_type'] = REMINDER_J2
            reminders_j2.append(reminder_data)
            all_reminders.append(reminder_data)
        elif due == today or due < today:
            reminder_data['reminder_type'] = REMINDER_J0
            reminders_j0.append(reminder_data)
            all_reminders.append(reminder_data)

    sent_today = InstallationPaymentReminderLog.objects.filter(sent_at__date=today).count()

    return {
        'J5': reminders_j5,
        'J2': reminders_j2,
        'J0': reminders_j0,
        'reminders': all_reminders,
        'count_j5': len(reminders_j5),
        'count_j2': len(reminders_j2),
        'count_j0': len(reminders_j0),
        'count_sent_today': sent_today,
        'today': today.isoformat(),
    }


def send_reminders(installation_ids=None, dry_run=False):
    """
    Envoie les SMS de rappel.
    installation_ids: liste d'IDs d'installations à traiter, ou None pour tous les en attente.
    dry_run: si True, simule sans envoyer.
    Retourne: { 'sent': n, 'errors': [], 'dry_run': bool }
    """
    from .models import Installation, InstallationPaymentReminderLog
    from django.utils import timezone

    data = build_reminders_list(Installation.objects.all())
    to_send = []
    for r in data['reminders']:
        if r.get('status') == 'sent':
            continue
        if installation_ids is not None and len(installation_ids) > 0:
            if r['installation_id'] not in installation_ids:
                continue
        to_send.append(r)

    sent = 0
    errors = []

    for r in to_send:
        inst = Installation.objects.filter(id=r['installation_id']).select_related('client').first()
        if not inst:
            errors.append(f"Installation {r['installation_id']} introuvable")
            continue
        due = r['due_date']
        if isinstance(due, str):
            due = date.fromisoformat(due)
        reminder_type = r.get('reminder_type', REMINDER_J0)

        if dry_run:
            sent += 1
            continue

        phone = _normalize_phone(r['client_phone'])
        if not phone:
            errors.append(f"Numéro invalide pour {r['client_name']}")
            continue

        body = _build_sms_reminder(
            r['client_name'],
            r['amount_str'],
            r['due_date_str'],
            r.get('tranche_label', 'Reliquat')
        )
        company = r.get('company', 'NETSYSTEME')
        ok = send_sms(phone, body, company=company)
        if ok:
            InstallationPaymentReminderLog.objects.create(
                installation=inst,
                due_date=due,
                reminder_type=reminder_type,
                amount=r.get('amount'),
                sent_at=timezone.now()
            )
            sent += 1
        else:
            errors.append(f"Échec envoi à {r['client_name']}")

    return {'sent': sent, 'errors': errors, 'dry_run': dry_run, 'count_pending': len(to_send)}
