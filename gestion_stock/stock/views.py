from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F
from products.models import Product
from .models import StockMovement, StockNotificationRecipient, StockAlertSettings
from .serializers import (
    StockMovementSerializer,
    StockMovementCreateSerializer,
    StockNotificationRecipientSerializer,
    StockAlertSettingsSerializer,
)
from .notifications import _normalize_phone, _send_sms, send_low_stock_reminders
from products.permissions import IsAdminUser as ProductsIsAdminUser


class StockMovementViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des mouvements de stock
    """
    queryset = StockMovement.objects.filter(deleted_at__isnull=True)
    permission_classes = [ProductsIsAdminUser]
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


class StockNotificationRecipientViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les responsables recevant les alertes SMS stock.
    """
    queryset = StockNotificationRecipient.objects.all()
    serializer_class = StockNotificationRecipientSerializer
    permission_classes = [ProductsIsAdminUser]

    @action(detail=True, methods=['post'])
    def send_test_sms(self, request, pk=None):
        """Envoie un SMS de test au responsable."""
        recipient = self.get_object()
        phone = _normalize_phone(recipient.phone or '')
        if not phone:
            return Response(
                {'error': 'Numéro de téléphone invalide ou manquant'},
                status=status.HTTP_400_BAD_REQUEST
            )
        body = f"Test SMS Stock - {recipient.name}. Configuration OK."
        ok = _send_sms(phone, body)
        return Response(
            {'status': 'SMS envoyé' if ok else 'API Orange non configurée (voir logs)'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def send_test_email(self, request, pk=None):
        """Envoie un email de test au responsable."""
        from django.core.mail import send_mail
        from django.conf import settings as django_settings

        recipient = self.get_object()
        email = (recipient.email or '').strip()
        if not email:
            return Response(
                {'error': 'Adresse email manquante ou invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
        subject = '[Stock] Test - Configuration notifications'
        body = f"Test email Stock - {recipient.name}.\n\nConfiguration OK.\n\n— Gestion Stock"
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=django_settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            return Response({'status': 'Email envoyé'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Erreur envoi email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET', 'PATCH'])
@permission_classes([ProductsIsAdminUser])
def stock_alert_settings(request):
    """Récupère ou met à jour les paramètres d'alerte stock."""
    import logging
    logger = logging.getLogger(__name__)
    try:
        settings_obj = StockAlertSettings.get_settings()
        if request.method == 'GET':
            serializer = StockAlertSettingsSerializer(settings_obj)
            return Response(serializer.data)
        # PATCH
        serializer = StockAlertSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.exception("Erreur stock_alert_settings: %s", e)
        from django.conf import settings as dj_settings
        if getattr(dj_settings, 'DEBUG', False):
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'detail': 'Erreur serveur'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([ProductsIsAdminUser])
def stock_low_stock_reminders_list(request):
    """Liste des produits en stock faible (pour la page Rappels stock faible)."""
    try:
        qs = Product.objects.filter(is_active=True).filter(
            quantity__lte=F('alert_threshold')
        ).order_by('quantity').values('id', 'name', 'quantity', 'alert_threshold', 'category')
        products = list(qs[:100])
        return Response({
            'products': products,
            'count': len(products),
        })
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("stock_low_stock_reminders_list: %s", e)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['POST'])
@permission_classes([ProductsIsAdminUser])
def stock_low_stock_reminders_send(request):
    """Envoie les rappels SMS et email pour les produits en stock faible."""
    dry_run = request.data.get('dry_run', False)
    try:
        result = send_low_stock_reminders(products_queryset=None, dry_run=dry_run)
        if not dry_run and result['products_count'] > 0:
            from django.utils import timezone
            settings_obj = StockAlertSettings.get_settings()
            settings_obj.last_reminder_sent_at = timezone.now()
            settings_obj.save(update_fields=['last_reminder_sent_at'])
        return Response({
            'sms_sent': result['sms_sent'],
            'emails_sent': result['emails_sent'],
            'products_count': result['products_count'],
            'dry_run': dry_run,
        })
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("stock_low_stock_reminders_send: %s", e)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
