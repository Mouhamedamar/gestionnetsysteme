from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import WorkZone
from .serializers import WorkZoneSerializer
from .permissions import IsAuthenticatedForZones


class WorkZoneViewSet(viewsets.ModelViewSet):
    """ViewSet pour les zones de travail."""
    queryset = WorkZone.objects.all()
    serializer_class = WorkZoneSerializer
    permission_classes = [IsAuthenticatedForZones]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['zone_type']
    search_fields = ['name', 'address']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']
