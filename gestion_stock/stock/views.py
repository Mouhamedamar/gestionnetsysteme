from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import StockMovement
from .serializers import StockMovementSerializer, StockMovementCreateSerializer
from products.permissions import IsAdminUser


class StockMovementViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des mouvements de stock
    """
    queryset = StockMovement.objects.filter(deleted_at__isnull=True)
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['product', 'movement_type']
    search_fields = ['product__name', 'comment']
    ordering_fields = ['date', 'created_at']
    ordering = ['-date', '-created_at']

    def get_serializer_class(self):
        """Utilise un serializer différent pour la création"""
        if self.action == 'create':
            return StockMovementCreateSerializer
        return StockMovementSerializer

    def get_queryset(self):
        """Filtre les mouvements supprimés"""
        queryset = StockMovement.objects.filter(deleted_at__isnull=True)
        
        # Filtre par produit si fourni
        product_id = self.request.query_params.get('product', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        return queryset

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        """Soft delete d'un mouvement (rollback du stock)"""
        movement = self.get_object()
        try:
            movement.soft_delete()
            return Response(
                {'status': 'Mouvement supprimé et stock restauré'},
                status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restaure un mouvement supprimé"""
        movement = StockMovement.objects.filter(deleted_at__isnull=False).get(pk=pk)
        try:
            movement.restore()
            serializer = self.get_serializer(movement)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
