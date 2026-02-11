from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, update_session_auth_hash
from django.contrib.auth.models import User
from django.db import connection
from .models import UserProfile
from .permissions import IsAdminOrTechnicienOrCommercial


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Endpoint de connexion pour obtenir un token JWT
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Username et password requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response(
            {'error': 'Identifiants invalides'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Récupérer ou créer le profil utilisateur
    profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults={'role': 'commercial'}
    )
    
    # Déterminer le rôle
    role = profile.role if profile else 'commercial'
    
    # Pour les admins, vérifier is_staff
    if role == 'admin' and not user.is_staff:
        # Si le profil dit admin mais l'utilisateur n'est pas staff, mettre à jour
        user.is_staff = True
        user.save()
    
    refresh = RefreshToken.for_user(user)
    
    # Récupérer les permissions personnalisées
    page_permissions = profile.page_permissions if profile and profile.page_permissions else None
    
    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': role,
            'page_permissions': page_permissions,
            'profile': {
                'role': role,
                'phone': profile.phone if profile else None,
                'page_permissions': page_permissions
            }
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    """
    Endpoint de déconnexion (blacklist du token)
    """
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'message': 'Déconnexion réussie'},
                status=status.HTTP_200_OK
            )
        return Response(
            {'error': 'Token de rafraîchissement requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': 'Token invalide'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    """
    Endpoint pour récupérer et mettre à jour le profil utilisateur
    """
    user = request.user

    if request.method == 'GET':
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
        }, status=status.HTTP_200_OK)

    elif request.method == 'PATCH':
        username = request.data.get('username')
        email = request.data.get('email')

        if not username or not email:
            return Response(
                {'error': 'Username et email sont requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier si le username est déjà pris
        if User.objects.filter(username=username).exclude(id=user.id).exists():
            return Response(
                {'error': 'Ce nom d\'utilisateur est déjà pris'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier si l'email est déjà pris
        if User.objects.filter(email=email).exclude(id=user.id).exists():
            return Response(
                {'error': 'Cet email est déjà utilisé'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.username = username
        user.email = email
        user.save()

        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Endpoint pour changer le mot de passe
    """
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')

    if not current_password or not new_password or not confirm_password:
        return Response(
            {'error': 'Tous les champs sont requis'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not user.check_password(current_password):
        return Response(
            {'error': 'Mot de passe actuel incorrect'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if new_password != confirm_password:
        return Response(
            {'error': 'Les nouveaux mots de passe ne correspondent pas'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(new_password) < 8:
        return Response(
            {'error': 'Le nouveau mot de passe doit contenir au moins 8 caractères'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(new_password)
    user.save()
    update_session_auth_hash(request, user)

    return Response(
        {'message': 'Mot de passe changé avec succès'},
        status=status.HTTP_200_OK
    )


from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .models import Client
from .serializers import ClientSerializer, UserSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def check_installation(request):
    """
    Vérifie l'état de l'installation de l'application
    """
    checks = {
        'database': False,
        'migrations': False,
        'admin_exists': False,
        'server': True
    }
    
    messages = {
        'database': 'Base de données non accessible',
        'migrations': 'Migrations non vérifiées',
        'admin_exists': 'Aucun utilisateur admin trouvé',
        'server': 'Serveur accessible'
    }
    
    try:
        # Vérifier la base de données
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            checks['database'] = True
            messages['database'] = 'Base de données accessible'
        except Exception as e:
            messages['database'] = f'Erreur de connexion: {str(e)}'
        
        # Vérifier si un admin existe
        try:
            admin_count = User.objects.filter(is_staff=True).count()
            checks['admin_exists'] = admin_count > 0
            messages['admin_exists'] = f'{admin_count} utilisateur(s) admin trouvé(s)' if admin_count > 0 else 'Aucun utilisateur admin trouvé'
        except Exception as e:
            messages['admin_exists'] = f'Erreur: {str(e)}'
        
        # Vérifier les migrations (simplifié - on vérifie juste si les tables existent)
        try:
            table_names = connection.introspection.table_names()
            if table_names:
                checks['migrations'] = True
                messages['migrations'] = f'{len(table_names)} table(s) trouvée(s)'
            else:
                messages['migrations'] = 'Aucune table trouvée - migrations nécessaires'
        except Exception as e:
            messages['migrations'] = f'Erreur: {str(e)}'
        
    except Exception as e:
        messages['database'] = f'Erreur générale: {str(e)}'
    
    return Response({
        'installed': checks['admin_exists'],
        'checks': checks,
        'messages': messages
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def setup_admin(request):
    """
    Crée le premier utilisateur administrateur (uniquement si aucun admin n'existe)
    """
    # Vérifier si un admin existe déjà
    if User.objects.filter(is_staff=True).exists():
        return Response(
            {'error': 'Un utilisateur administrateur existe déjà. Utilisez la page de connexion.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not username or not email or not password:
        return Response(
            {'error': 'Username, email et password sont requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(password) < 8:
        return Response(
            {'error': 'Le mot de passe doit contenir au moins 8 caractères'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Vérifier si le username existe déjà
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Ce nom d\'utilisateur existe déjà'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Créer l'utilisateur admin
    try:
        admin = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_staff=True,
            is_superuser=True,
            is_active=True
        )
        
        return Response({
            'message': 'Utilisateur administrateur créé avec succès',
            'user': {
                'id': admin.id,
                'username': admin.username,
                'email': admin.email
            }
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {'error': f'Erreur lors de la création: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des clients
    """
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAdminOrTechnicienOrCommercial]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'phone']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des utilisateurs
    """
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email']
    ordering_fields = ['username', 'email', 'date_joined', 'is_staff']
    ordering = ['-date_joined']
    
    def get_queryset(self):
        """Optimiser les requêtes en préchargeant le profil"""
        try:
            return User.objects.select_related('profile').all().order_by('-date_joined')
        except Exception as e:
            # Si erreur avec select_related, utiliser le queryset de base
            return User.objects.all().order_by('-date_joined')

