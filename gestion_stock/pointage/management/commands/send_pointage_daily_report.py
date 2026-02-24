"""
Commande : rapport quotidien de pointage (entrées) du jour courant (00h00–10h00 GMT).
Envoie par email aux Responsables à notifier (StockNotificationRecipient avec email).
Usage :
  python manage.py send_pointage_daily_report
  python manage.py send_pointage_daily_report --date=2025-02-21   # pour tester une date
"""
from datetime import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from pointage.report_email import (
    send_pointage_report,
    build_report_text,
    get_daily_report_data,
)


class Command(BaseCommand):
    help = (
        "Génère et envoie le rapport quotidien de pointage d'entrée (00h00–10h00) "
        "aux Responsables à notifier (email uniquement, pas de PDF)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            default=None,
            help='Date du rapport (YYYY-MM-DD). Par défaut : jour courant (date du serveur en UTC/GMT).',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Affiche le rapport sans envoyer d\'email.',
        )

    def handle(self, *args, **options):
        date_str = options.get('date')
        dry_run = options.get('dry_run', False)

        if date_str:
            try:
                date_report = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                self.stderr.write(self.style.ERROR(f"Date invalide : {date_str}. Utilisez YYYY-MM-DD."))
                return
        else:
            # Jour courant (en UTC si USE_TZ=True)
            date_report = timezone.now().date()

        entries, present_ids, absent_users, _ = get_daily_report_data(date_report)

        if dry_run:
            text = build_report_text(date_report, entries, present_ids, absent_users)
            self.stdout.write(text)
            self.stdout.write(self.style.SUCCESS(f"\n[DRY-RUN] Rapport du {date_report} : {len(entries)} entrée(s), {len(present_ids)} présent(s), {len(absent_users)} absent(s). Aucun email envoyé."))
            return

        send_pointage_report(date_report, entries, present_ids, absent_users)
        self.stdout.write(
            self.style.SUCCESS(
                f"Rapport pointage du {date_report.strftime('%Y-%m-%d')} envoyé aux responsables "
                f"({len(entries)} entrée(s), {len(present_ids)} présent(s), {len(absent_users)} absent(s))."
            )
        )
