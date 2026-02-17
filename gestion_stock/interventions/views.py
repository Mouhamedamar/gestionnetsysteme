import logging
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Intervention, InterventionProduct
from .serializers import (
    InterventionSerializer,
    InterventionCreateSerializer,
    InterventionUpdateSerializer,
    InterventionProductSerializer
)
from products.permissions import IsAdminUser
from .permissions import IsAdminOrTechnicien

logger = logging.getLogger(__name__)


class InterventionViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des interventions
    """
    queryset = Intervention.objects.filter(deleted_at__isnull=True)
    permission_classes = [IsAdminOrTechnicien]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'technician', 'client']
    search_fields = ['title', 'description', 'intervention_number', 'client_name']
    ordering_fields = ['created_at', 'scheduled_date', 'priority']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Utilise un serializer différent selon l'action"""
        if self.action == 'create':
            return InterventionCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return InterventionUpdateSerializer
        return InterventionSerializer

    def get_queryset(self):
        """Filtre les interventions supprimées et optimise les requêtes"""
        queryset = Intervention.objects.filter(deleted_at__isnull=True)
        
        # Optimiser les requêtes avec select_related et prefetch_related
        queryset = queryset.select_related('client', 'technician')
        queryset = queryset.prefetch_related('products_used__product')
        
        # Si l'utilisateur est un technicien (pas admin ni commercial), filtrer par défaut ses interventions
        if self.request.user and self.request.user.is_authenticated:
            if not self.request.user.is_staff:
                # Vérifier le rôle de l'utilisateur
                try:
                    if hasattr(self.request.user, 'profile') and self.request.user.profile:
                        role = self.request.user.profile.role
                        # Les commerciaux voient toutes les interventions (comme les admins)
                        if role == 'commercial':
                            pass  # Pas de filtrage pour les commerciaux
                        elif role == 'technicien':
                            # Par défaut, un technicien ne voit que ses interventions
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
            # Les commerciaux et admins peuvent filtrer par n'importe quel technicien
            if self.request.user and not self.request.user.is_staff:
                try:
                    if hasattr(self.request.user, 'profile') and self.request.user.profile:
                        role = self.request.user.profile.role
                        # Les commerciaux peuvent filtrer par n'importe quel technicien
                        if role == 'commercial':
                            pass  # Pas de restriction pour les commerciaux
                        elif role == 'technicien':
                            if str(technician_id) != str(self.request.user.id):
                                # Un technicien ne peut pas voir les interventions d'autres techniciens
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
            logger.error(f'Erreur lors de la récupération des interventions: {str(e)}', exc_info=True)
            return Response(
                {'error': 'Erreur lors du chargement des interventions', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        """Après création : notifier le technicien assigné par email et SMS."""
        intervention = serializer.save()
        if intervention.technician_id:
            try:
                from .notifications import notify_technician_assignment
                notify_technician_assignment(intervention, intervention.technician)
            except Exception as e:
                logger.warning("Notification assignation (création) non envoyée: %s", e, exc_info=True)

    def perform_update(self, serializer):
        """Après mise à jour : si le technicien a changé, notifier le nouveau technicien par email et SMS."""
        old_technician_id = serializer.instance.technician_id if serializer.instance else None
        intervention = serializer.save()
        new_technician_id = intervention.technician_id
        if new_technician_id and new_technician_id != old_technician_id:
            try:
                from .notifications import notify_technician_assignment
                notify_technician_assignment(intervention, intervention.technician)
            except Exception as e:
                logger.warning("Notification assignation (mise à jour) non envoyée: %s", e, exc_info=True)

    @action(detail=True, methods=['post'])
    def assign_technician(self, request, pk=None):
        """Assigner un technicien à une intervention"""
        intervention = self.get_object()
        technician_id = request.data.get('technician_id')
        
        if not technician_id:
            return Response(
                {'error': 'technician_id est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.contrib.auth.models import User
        try:
            technician = User.objects.get(id=technician_id)
            intervention.technician = technician
            intervention.save()
            # Notifier le technicien par email et SMS
            try:
                from .notifications import notify_technician_assignment
                notify_technician_assignment(intervention, technician)
            except Exception as e:
                logger.warning("Notification assignation non envoyée: %s", e, exc_info=True)
            serializer = self.get_serializer(intervention)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {'error': 'Technicien introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Changer le statut d'une intervention"""
        intervention = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'status est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_statuses = [choice[0] for choice in Intervention.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Statut invalide. Statuts valides: {valid_statuses}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mettre à jour les dates selon le statut
        from django.utils import timezone
        if new_status == 'EN_COURS' and not intervention.start_date:
            intervention.start_date = timezone.now()
        elif new_status == 'TERMINE' and not intervention.end_date:
            intervention.end_date = timezone.now()
        
        intervention.status = new_status
        intervention.save()
        
        serializer = self.get_serializer(intervention)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        """Soft delete d'une intervention"""
        intervention = self.get_object()
        intervention.soft_delete()
        return Response(
            {'status': 'Intervention supprimée'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def add_product(self, request, pk=None):
        """Ajouter un produit à une intervention"""
        intervention = self.get_object()
        product_id = request.data.get('product')
        quantity = request.data.get('quantity', 1)
        notes = request.data.get('notes', '')
        
        if not product_id:
            return Response(
                {'error': 'product est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = InterventionProduct.objects.get(
                intervention=intervention,
                product_id=product_id
            )
            # Mettre à jour la quantité si le produit existe déjà
            product.quantity += quantity
            product.save()
        except InterventionProduct.DoesNotExist:
            # Créer un nouveau produit
            product = InterventionProduct.objects.create(
                intervention=intervention,
                product_id=product_id,
                quantity=quantity,
                notes=notes
            )
        
        serializer = InterventionProductSerializer(product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'])
    def remove_product(self, request, pk=None):
        """Retirer un produit d'une intervention"""
        intervention = self.get_object()
        product_id = request.data.get('product_id')
        
        if not product_id:
            return Response(
                {'error': 'product_id est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = InterventionProduct.objects.get(
                intervention=intervention,
                product_id=product_id
            )
            product.delete()
            return Response(
                {'status': 'Produit retiré'},
                status=status.HTTP_200_OK
            )
        except InterventionProduct.DoesNotExist:
            return Response(
                {'error': 'Produit introuvable dans cette intervention'},
                status=status.HTTP_404_NOT_FOUND
            )
