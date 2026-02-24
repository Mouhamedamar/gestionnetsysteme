"""
Commande : rapport hebdomadaire de pointage (lundi à dimanche).
Envoie par email aux Responsables à notifier (StockNotificationRecipient avec email). Pas de PDF.
Usage :
  python manage.py send_pointage_weekly_report
  python manage.py send_pointage_weekly_report --week=2026-W08
  python manage.py send_pointage_weekly_report --dry-run
"""
from datetime import datetime, time
from datetime import timezone as dt_timezone

from django.core.management.base import BaseCommand
from django.utils import timezone

from pointage.models import CheckIn
from pointage.report_email import (
    _week_start_end,
    _compute_weekly_rows,
    build_weekly_report_text,
    send_pointage_weekly_report,
)


def get_checkins_for_week(week_start, week_end):
    """Tous les pointages (entrée + sortie) entre le lundi 00:00 et le dimanche 23:59:59 (UTC)."""
    start = timezone.make_aware(datetime.combine(week_start, time.min), dt_timezone.utc)
    end = timezone.make_aware(datetime.combine(week_end, time(23, 59, 59)), dt_timezone.utc)
    return (
        CheckIn.objects.filter(timestamp__gte=start, timestamp__lte=end)
        .select_related('user', 'work_zone')
        .order_by('timestamp')
    )


class Command(BaseCommand):
    help = (
        "Génère et envoie le rapport hebdomadaire de pointage (lundi–dimanche) "
        "aux Responsables à notifier (email uniquement, pas de PDF)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--week',
            type=str,
            default=None,
            help='Semaine au format ISO AAAA-Wnn (ex: 2026-W08). Par défaut : semaine courante.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Affiche le rapport sans envoyer d\'email.',
        )

    def handle(self, *args, **options):
        week_arg = options.get('week')
        dry_run = options.get('dry_run', False)

        if week_arg:
            try:
                # Format 2026-W08 (ISO semaine)
                year, w = week_arg.strip().split('-W')
                year = int(year)
                w = int(w)
                from datetime import timedelta
                # Lundi de la semaine ISO (Python 3.8+)
                week_start = datetime.fromisocalendar(year, w, 1).date()
                week_end = week_start + timedelta(days=6)
            except (ValueError, AttributeError, TypeError):
                self.stderr.write(self.style.ERROR(f"Semaine invalide : {week_arg}. Utilisez AAAA-Wnn (ex: 2026-W08)."))
                return
        else:
            today = timezone.now().date()
            week_start, week_end = _week_start_end(today)

        checkins = list(get_checkins_for_week(week_start, week_end))
        weekly_rows = _compute_weekly_rows(checkins)

        if dry_run:
            text = build_weekly_report_text(week_start, week_end, weekly_rows)
            self.stdout.write(text)
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n[DRY-RUN] Rapport hebdo {week_start} → {week_end} : {len(weekly_rows)} ligne(s). Aucun email envoyé."
                )
            )
            return

        send_pointage_weekly_report(week_start, week_end, weekly_rows)
        self.stdout.write(
            self.style.SUCCESS(
                f"Rapport hebdomadaire {week_start} → {week_end} envoyé aux responsables ({len(weekly_rows)} ligne(s))."
            )
        )
