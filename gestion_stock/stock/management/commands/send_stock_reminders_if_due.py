"""
Envoie les rappels stock faible si le délai configuré (reminder_interval_days) est atteint.
À exécuter par cron (ex. tous les jours à 8h) :
  python manage.py send_stock_reminders_if_due
"""
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from stock.models import StockAlertSettings
from stock.notifications import send_low_stock_reminders


class Command(BaseCommand):
    help = 'Envoie les rappels SMS/email stock faible si l\'intervalle configuré est atteint'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Forcer l\'envoi maintenant (ignore l\'intervalle)',
        )

    def handle(self, *args, **options):
        settings_obj = StockAlertSettings.get_settings()
        interval = settings_obj.reminder_interval_days
        if not interval or interval < 1:
            self.stdout.write('Rappel automatique désactivé (reminder_interval_days non configuré).')
            return
        now = timezone.now()
        last = settings_obj.last_reminder_sent_at
        due = last is None or (now - last) >= timedelta(days=interval)
        if not due and not options['force']:
            next_at = (last + timedelta(days=interval)) if last else now
            self.stdout.write(f'Prochain rappel prévu vers {next_at}. Utilisez --force pour envoyer maintenant.')
            return
        result = send_low_stock_reminders(products_queryset=None, dry_run=False)
        settings_obj.last_reminder_sent_at = now
        settings_obj.save(update_fields=['last_reminder_sent_at'])
        self.stdout.write(
            self.style.SUCCESS(
                f'Rappels envoyés: {result["sms_sent"]} SMS, {result["emails_sent"]} email(s), '
                f'{result["products_count"]} produit(s) en stock faible.'
            )
        )
