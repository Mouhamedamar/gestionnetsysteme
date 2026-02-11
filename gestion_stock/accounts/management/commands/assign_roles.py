"""
Script de gestion Django pour assigner des rôles aux utilisateurs
Usage: python manage.py assign_roles
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import UserProfile


class Command(BaseCommand):
    help = 'Assigner des rôles aux utilisateurs existants et créer les profils manquants'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            help='Nom d\'utilisateur spécifique à mettre à jour',
        )
        parser.add_argument(
            '--role',
            type=str,
            choices=['admin', 'technicien', 'commercial'],
            help='Rôle à assigner (admin, technicien, commercial)',
        )
        parser.add_argument(
            '--auto',
            action='store_true',
            help='Assigner automatiquement les rôles selon is_staff (admin si is_staff=True, commercial sinon)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=' * 70))
        self.stdout.write(self.style.SUCCESS('ASSIGNATION DES RÔLES AUX UTILISATEURS'))
        self.stdout.write(self.style.SUCCESS('=' * 70))

        # Si un utilisateur spécifique est fourni
        if options['username']:
            try:
                user = User.objects.get(username=options['username'])
                role = options.get('role', 'commercial')
                
                profile, created = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={'role': role}
                )
                
                if not created:
                    profile.role = role
                    profile.save()
                
                # Si admin, s'assurer que is_staff=True
                if role == 'admin':
                    user.is_staff = True
                    user.is_superuser = True
                    user.save()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Utilisateur "{user.username}" mis à jour avec le rôle "{role}"'
                    )
                )
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'❌ Utilisateur "{options["username"]}" non trouvé')
                )
            return

        # Mode automatique
        if options['auto']:
            self.stdout.write(self.style.WARNING('\n🔄 Mode automatique activé...'))
            
            # Créer des profils pour tous les utilisateurs
            users = User.objects.all()
            created_count = 0
            updated_count = 0
            
            for user in users:
                profile, created = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={'role': 'admin' if user.is_staff else 'commercial'}
                )
                
                if created:
                    created_count += 1
                    # Si admin, s'assurer que is_staff=True
                    if profile.role == 'admin' and not user.is_staff:
                        user.is_staff = True
                        user.is_superuser = True
                        user.save()
                else:
                    # Mettre à jour le rôle selon is_staff si le profil existe déjà
                    if user.is_staff and profile.role != 'admin':
                        profile.role = 'admin'
                        profile.save()
                        updated_count += 1
                    elif not user.is_staff and profile.role == 'admin':
                        profile.role = 'commercial'
                        profile.save()
                        updated_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✅ {created_count} profil(s) créé(s), {updated_count} profil(s) mis à jour'
                )
            )
            return

        # Mode interactif par défaut
        self.stdout.write(self.style.WARNING('\n📋 Liste des utilisateurs:'))
        users = User.objects.all()
        
        if not users.exists():
            self.stdout.write(self.style.ERROR('Aucun utilisateur trouvé'))
            return
        
        # Afficher les utilisateurs existants
        for user in users:
            profile = getattr(user, 'profile', None)
            role = profile.role if profile else 'Aucun profil'
            is_staff = '✓' if user.is_staff else '✗'
            
            self.stdout.write(
                f'  - {user.username} (is_staff: {is_staff}, rôle: {role})'
            )
        
        self.stdout.write(self.style.WARNING('\n💡 Pour assigner un rôle:'))
        self.stdout.write('  python manage.py assign_roles --username <username> --role <admin|technicien|commercial>')
        self.stdout.write('\n💡 Pour assigner automatiquement selon is_staff:')
        self.stdout.write('  python manage.py assign_roles --auto')
        
        self.stdout.write(self.style.SUCCESS('\n' + '=' * 70))
