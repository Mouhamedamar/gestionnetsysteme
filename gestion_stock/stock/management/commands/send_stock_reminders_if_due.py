"""
Commande : envoie les rappels stock faible si l'intervalle configuré est écoulé (pour cron).
Usage :
  python manage.py send_stock_reminders_if_due
  python manage.py send_stock_reminders_if_due --force   # force l'envoi même si pas dû
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from stock.models import StockAlertSettings
from stock.notifications import send_low_stock_reminders
from products.models import Product
from django.db.models import F


class Command(BaseCommand):
    help = (
        "Envoie les rappels (SMS + email) pour les produits en stock faible "
        "si le rappel automatique est configuré et que l'intervalle est écoulé. "
        "Option --force pour forcer l'envoi."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Forcer l\'envoi même si le dernier rappel a été envoyé récemment.',
        )

    def handle(self, *args, **options):
        force = options.get('force', False)
        settings_obj = StockAlertSettings.get_settings()
        interval_days = getattr(settings_obj, 'reminder_interval_days', 0) or 0

        if interval_days <= 0 and not force:
            self.stdout.write('Rappel automatique désactivé (reminder_interval_days = 0). Rien à faire.')
            return

        last_sent = getattr(settings_obj, 'last_reminder_sent_at', None)
        if not force and last_sent:
            next_due = last_sent + timedelta(days=interval_days)
            if timezone.now() < next_due:
                self.stdout.write(
                    f'Prochain rappel prévu après {next_due.isoformat()}. Rien à faire.'
                )
                return

        qs = Product.objects.filter(
            deleted_at__isnull=True,
            is_active=True,
            quantity__lte=F('alert_threshold'),
        )
        count = qs.count()
        if count == 0:
            self.stdout.write('Aucun produit en stock faible. Aucun rappel envoyé.')
            return

        nb_sms, nb_emails = send_low_stock_reminders(qs)
        settings_obj.last_reminder_sent_at = timezone.now()
        settings_obj.save(update_fields=['last_reminder_sent_at'])
        self.stdout.write(
            self.style.SUCCESS(
                f'Rappels envoyés : {nb_sms} SMS, {nb_emails} email(s) pour {count} produit(s) en stock faible.'
            )
        )
