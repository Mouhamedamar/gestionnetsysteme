"""
Convertit les contacts de type PROSPECT en CLIENT.
Utile si vos contacts ont été créés avec l'ancien défaut (PROSPECT)
et n'apparaissent pas sur la page Gestion clientèle.

Usage:
  python manage.py convert_prospects_to_clients
  python manage.py convert_prospects_to_clients --dry-run
"""
from django.core.management.base import BaseCommand
from accounts.models import Client


class Command(BaseCommand):
    help = 'Convertit les prospects (modèle Client) en clients pour qu\'ils apparaissent dans Gestion clientèle'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Afficher ce qui serait modifié sans appliquer les changements',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        qs = Client.objects.filter(client_type=Client.TYPE_PROSPECT)
        count = qs.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS('Aucun prospect à convertir.'))
            return

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f'[DRY-RUN] {count} contact(s) seraient convertis en client(s):'
            ))
            for c in qs[:10]:
                self.stdout.write(f'  - {c.name} (id={c.id})')
            if count > 10:
                self.stdout.write(f'  ... et {count - 10} autre(s)')
            self.stdout.write('')
            self.stdout.write('Exécutez sans --dry-run pour appliquer.')
            return

        updated = qs.update(client_type=Client.TYPE_CLIENT)
        self.stdout.write(self.style.SUCCESS(
            f'{updated} contact(s) converti(s) en client(s). Ils apparaîtront sur la page Gestion clientèle.'
        ))
