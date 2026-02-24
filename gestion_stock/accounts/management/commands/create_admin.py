"""
Crée un compte administrateur pour se connecter à l'application.
Usage:
  python manage.py create_admin
  python manage.py create_admin --username admin --password monmotdepasse
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import UserProfile


class Command(BaseCommand):
    help = 'Crée un utilisateur administrateur pour la connexion (admin/admin par défaut)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help="Nom d'utilisateur (défaut: admin)",
        )
        parser.add_argument(
            '--password',
            type=str,
            default='admin',
            help="Mot de passe (défaut: admin)",
        )
        parser.add_argument(
            '--email',
            type=str,
            default='admin@example.com',
            help="Email (défaut: admin@example.com)",
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Réinitialiser le mot de passe si l\'utilisateur existe déjà',
        )

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']
        email = options.get('email') or 'admin@example.com'
        force = options['force']

        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
            if not force:
                self.stdout.write(
                    self.style.WARNING(
                        f'L\'utilisateur "{username}" existe déjà. '
                        'Utilisez --force pour réinitialiser le mot de passe.'
                    )
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Connectez-vous avec : {username} / (votre mot de passe actuel)'
                    )
                )
                return
            user.set_password(password)
            user.email = email or user.email
            user.is_active = True
            user.is_staff = True
            user.is_superuser = True
            user.save()
            profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'admin'})
            profile.role = 'admin'
            profile.save()
            self.stdout.write(self.style.SUCCESS(f'Mot de passe de "{username}" réinitialisé.'))
        else:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_staff=True,
                is_superuser=True,
                is_active=True,
            )
            profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'admin'})
            profile.role = 'admin'
            profile.save()
            self.stdout.write(self.style.SUCCESS(f'Compte "{username}" créé avec succès.'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Vous pouvez maintenant vous connecter avec :'))
        self.stdout.write(self.style.SUCCESS(f'  Nom d\'utilisateur : {username}'))
        self.stdout.write(self.style.SUCCESS(f'  Mot de passe      : {password}'))
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('Changez le mot de passe après la première connexion (Profil).'))
