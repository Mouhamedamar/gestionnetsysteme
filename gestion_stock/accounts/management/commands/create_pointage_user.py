"""
Crée un utilisateur "Administration (pointage seul)" qui ne peut que se pointer.
Usage:
  python manage.py create_pointage_user
  python manage.py create_pointage_user --username dev_administration --password monmotdepasse
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import UserProfile


class Command(BaseCommand):
    help = 'Crée un utilisateur qui peut uniquement accéder au pointage (Tableau de bord + Pointage)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='dev_administration',
            help="Nom d'utilisateur (défaut: dev_administration)",
        )
        parser.add_argument(
            '--password',
            type=str,
            default='dev_pointage',
            help="Mot de passe (défaut: dev_pointage)",
        )
        parser.add_argument(
            '--email',
            type=str,
            default='dev_administration@example.com',
            help="Email (défaut: dev_administration@example.com)",
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help="Réinitialiser le mot de passe et le rôle si l'utilisateur existe déjà",
        )

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']
        email = options.get('email') or 'dev_administration@example.com'
        force = options['force']

        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
            if not force:
                self.stdout.write(
                    self.style.WARNING(
                        f'L\'utilisateur "{username}" existe déjà. '
                        'Utilisez --force pour réinitialiser le mot de passe et le rôle.'
                    )
                )
                return
            user.set_password(password)
            user.email = email or user.email
            user.is_active = True
            user.is_staff = False
            user.is_superuser = False
            user.save()
            profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'pointage_only'})
            profile.role = 'pointage_only'
            profile.page_permissions = None
            profile.save()
            self.stdout.write(self.style.SUCCESS(f'Utilisateur "{username}" mis à jour (rôle: pointage seul).'))
        else:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_staff=False,
                is_superuser=False,
                is_active=True,
            )
            profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'pointage_only'})
            profile.role = 'pointage_only'
            profile.page_permissions = None
            profile.save()
            self.stdout.write(self.style.SUCCESS(f'Utilisateur "{username}" créé avec succès (rôle: pointage seul).'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Connexion possible avec :'))
        self.stdout.write(self.style.SUCCESS(f'  Nom d\'utilisateur : {username}'))
        self.stdout.write(self.style.SUCCESS(f'  Mot de passe      : {password}'))
        self.stdout.write('')
        self.stdout.write(self.style.NOTICE('Cet utilisateur a accès uniquement au Tableau de bord et au Pointage.'))
