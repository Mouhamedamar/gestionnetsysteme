import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.utils import timezone
from .models import Expense
from .serializers import ExpenseSerializer, ExpenseCreateSerializer
from products.permissions import IsAdminUser as IsAdminUserPermission

logger = logging.getLogger(__name__)


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des dépenses
    """
    queryset = Expense.objects.filter(deleted_at__isnull=True).order_by('-date', '-created_at')
    permission_classes = [IsAdminUserPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'supplier', 'receipt_number']
    filterset_fields = ['category', 'status']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']
    
    def get_serializer_context(self):
        """Ajoute la requête au contexte du serializer pour les URLs d'images"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_serializer_class(self):
        """
        Utilise ExpenseCreateSerializer pour la création
        """
        if self.action == 'create':
            return ExpenseCreateSerializer
        return ExpenseSerializer

    def create(self, request, *args, **kwargs):
        """
        Création d'une dépense avec gestion d'erreurs améliorée
        """
        try:
            logger.info("=" * 80)
            logger.info("CRÉATION DÉPENSE - DONNÉES REÇUES")
            logger.info("=" * 80)
            logger.info(f"Method: {request.method}")
            logger.info(f"Content-Type: {request.content_type}")
            logger.info(f"User: {request.user}")
            
            # Log des données
            logger.info(f"\nDATA KEYS: {list(request.data.keys())}")
            for key in request.data.keys():
                value = request.data.get(key)
                if isinstance(value, str):
                    logger.info(f"  {key}: {value}")
                else:
                    logger.info(f"  {key}: {type(value).__name__}")
            
            # Log des fichiers
            logger.info(f"\nFILES KEYS: {list(request.FILES.keys())}")
            for key in request.FILES.keys():
                file = request.FILES.get(key)
                logger.info(f"  {key}: {file.name} ({file.size} bytes, type: {file.content_type})")
            
            # Préparer les données
            data = request.data.copy()
            
            # Valider avec le serializer
            serializer = self.get_serializer(data=data)
            if not serializer.is_valid():
                logger.error(f"✗ Erreurs de validation: {serializer.errors}")
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info("\n✓ Validation réussie")
            logger.info(f"Données validées: {serializer.validated_data}")
            
            # Créer la dépense
            try:
                self.perform_create(serializer)
            except Exception as create_error:
                logger.error(f'✗ Erreur lors de perform_create: {str(create_error)}', exc_info=True)
                return Response(
                    {'error': 'Erreur lors de la sauvegarde de la dépense', 'details': str(create_error)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            logger.info(f"✓ Dépense créée avec succès!")
            logger.info(f"  ID: {serializer.data.get('id')}")
            logger.info(f"  Titre: {serializer.data.get('title')}")
            logger.info("=" * 80)
            
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
                headers=headers
            )
        except Exception as e:
            logger.error(f'✗ Erreur lors de la création de la dépense: {str(e)}', exc_info=True)
            return Response(
                {'error': 'Erreur lors de la création de la dépense', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get_queryset(self):
        """
        Filtre les dépenses selon le paramètre 'trash'
        """
        queryset = Expense.objects.all()
        
        # Si on demande la corbeille, retourner uniquement les dépenses supprimées
        if self.request.query_params.get('trash') == 'true':
            queryset = queryset.filter(deleted_at__isnull=False)
        else:
            # Sinon, retourner uniquement les dépenses non supprimées
            queryset = queryset.filter(deleted_at__isnull=True)
        
        return queryset.order_by('-date', '-created_at')

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Restaure une dépense supprimée
        """
        expense = self.get_object()
        if expense.deleted_at is None:
            return Response(
                {'error': 'Cette dépense n\'est pas dans la corbeille'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expense.restore()
        serializer = self.get_serializer(expense)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        """
        Supprime une dépense (soft delete)
        """
        expense = self.get_object()
        if expense.deleted_at is not None:
            return Response(
                {'error': 'Cette dépense est déjà supprimée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expense.soft_delete()
        serializer = self.get_serializer(expense)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'])
    def hard_delete(self, request, pk=None):
        """
        Suppression définitive d'une dépense
        """
        expense = self.get_object()
        if expense.deleted_at is None:
            return Response(
                {'error': 'Cette dépense doit être dans la corbeille avant suppression définitive'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expense.hard_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def destroy(self, request, *args, **kwargs):
        """
        Override destroy pour utiliser soft_delete au lieu de hard_delete
        """
        instance = self.get_object()
        if instance.deleted_at is not None:
            return Response(
                {'error': 'Cette dépense est déjà supprimée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
