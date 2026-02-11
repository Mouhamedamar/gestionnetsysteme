import logging
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Installation, InstallationProduct
from .serializers import (
    InstallationSerializer,
    InstallationCreateSerializer,
    InstallationUpdateSerializer,
    InstallationProductSerializer
)
from products.permissions import IsAdminUser
from .permissions import IsAdminOrTechnicien

logger = logging.getLogger(__name__)


class InstallationViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des installations techniques
    """
    queryset = Installation.objects.filter(deleted_at__isnull=True)
    permission_classes = [IsAdminOrTechnicien]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'installation_type', 'technician', 'client']
    search_fields = ['title', 'description', 'installation_number', 'client_name']
    ordering_fields = ['created_at', 'scheduled_date']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Utilise un serializer différent selon l'action"""
        if self.action == 'create':
            return InstallationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return InstallationUpdateSerializer
        return InstallationSerializer

    def get_queryset(self):
        """Filtre les installations supprimées et optimise les requêtes"""
        queryset = Installation.objects.filter(deleted_at__isnull=True)
        
        # Optimiser les requêtes avec select_related et prefetch_related
        queryset = queryset.select_related('client', 'technician')
        queryset = queryset.prefetch_related('products_used__product')
        
        # Si l'utilisateur est un technicien (pas admin), filtrer par défaut ses installations
        if self.request.user and self.request.user.is_authenticated:
            if not self.request.user.is_staff:
                # Vérifier si c'est un technicien
                try:
                    if hasattr(self.request.user, 'profile') and self.request.user.profile:
                        if self.request.user.profile.role == 'technicien':
                            # Par défaut, un technicien ne voit que ses installations
                            # Sauf si un filtre technician explicite est fourni
                            technician_filter = self.request.query_params.get('technician', None)
                            if not technician_filter:
                                queryset = queryset.filter(technician_id=self.request.user.id)
                except:
                    pass
        
        # Filtre par statut si fourni
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filtre par technicien si fourni (peut être utilisé pour forcer un filtre)
        technician_id = self.request.query_params.get('technician', None)
        if technician_id:
            # Si l'utilisateur est technicien, il ne peut filtrer que par son propre ID
            if self.request.user and not self.request.user.is_staff:
                try:
                    if hasattr(self.request.user, 'profile') and self.request.user.profile:
                        if self.request.user.profile.role == 'technicien':
                            if str(technician_id) != str(self.request.user.id):
                                # Un technicien ne peut pas voir les installations d'autres techniciens
                                queryset = queryset.none()
                                return queryset
                except:
                    pass
            queryset = queryset.filter(technician_id=technician_id)
        
        return queryset

    def list(self, request, *args, **kwargs):
        """Override list pour gérer les erreurs"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f'Erreur lors de la récupération des installations: {str(e)}', exc_info=True)
            return Response(
                {'error': 'Erreur lors du chargement des installations', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def assign_technician(self, request, pk=None):
        """Assigner un technicien à une installation"""
        installation = self.get_object()
        technician_id = request.data.get('technician_id')
        
        if not technician_id:
            return Response(
                {'error': 'technician_id est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.contrib.auth.models import User
        try:
            technician = User.objects.get(id=technician_id)
            installation.technician = technician
            installation.save()
            serializer = self.get_serializer(installation)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {'error': 'Technicien introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Changer le statut d'une installation"""
        installation = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'status est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_statuses = [choice[0] for choice in Installation.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Statut invalide. Statuts valides: {valid_statuses}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mettre à jour les dates selon le statut
        from django.utils import timezone
        if new_status == 'EN_COURS' and not installation.start_date:
            installation.start_date = timezone.now()
        elif new_status == 'TERMINEE' and not installation.end_date:
            installation.end_date = timezone.now()
        
        installation.status = new_status
        installation.save()
        
        serializer = self.get_serializer(installation)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        """Soft delete d'une installation"""
        installation = self.get_object()
        installation.soft_delete()
        return Response(
            {'status': 'Installation supprimée'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def add_product(self, request, pk=None):
        """Ajouter un produit à une installation"""
        installation = self.get_object()
        product_id = request.data.get('product')
        quantity = request.data.get('quantity', 1)
        serial_number = request.data.get('serial_number', '')
        notes = request.data.get('notes', '')
        
        if not product_id:
            return Response(
                {'error': 'product est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = InstallationProduct.objects.get(
                installation=installation,
                product_id=product_id,
                serial_number=serial_number
            )
            # Mettre à jour la quantité si le produit existe déjà
            product.quantity += quantity
            product.save()
        except InstallationProduct.DoesNotExist:
            # Créer un nouveau produit
            product = InstallationProduct.objects.create(
                installation=installation,
                product_id=product_id,
                quantity=quantity,
                serial_number=serial_number,
                notes=notes
            )
        
        serializer = InstallationProductSerializer(product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'])
    def remove_product(self, request, pk=None):
        """Retirer un produit d'une installation"""
        installation = self.get_object()
        product_id = request.data.get('product_id')
        
        if not product_id:
            return Response(
                {'error': 'product_id est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = InstallationProduct.objects.get(
                installation=installation,
                product_id=product_id
            )
            product.delete()
            return Response(
                {'status': 'Produit retiré'},
                status=status.HTTP_200_OK
            )
        except InstallationProduct.DoesNotExist:
            return Response(
                {'error': 'Produit introuvable dans cette installation'},
                status=status.HTTP_404_NOT_FOUND
            )
