from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F
from .models import StockMovement, StockNotificationRecipient, StockAlertSettings
from .serializers import (
    StockMovementSerializer,
    StockMovementCreateSerializer,
    StockNotificationRecipientSerializer,
    StockAlertSettingsSerializer,
)
from .notifications import _normalize_phone, _send_sms, send_low_stock_reminders
from products.permissions import IsAdminUser as ProductsIsAdminUser
from products.models import Product


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


@api_view(['GET'])
@permission_classes([ProductsIsAdminUser])
def stock_low_stock_reminders_list(request):
    """Liste des produits en stock faible (quantity <= alert_threshold)."""
    qs = Product.objects.filter(
        deleted_at__isnull=True,
        is_active=True,
        quantity__lte=F('alert_threshold')
    ).order_by('quantity')
    data = []
    for p in qs:
        item = {
            'id': p.id,
            'name': p.name,
            'quantity': p.quantity,
            'alert_threshold': p.alert_threshold,
        }
        if p.photo:
            try:
                item['image_url'] = request.build_absolute_uri(p.photo.url)
            except Exception:
                item['image_url'] = None
        else:
            item['image_url'] = None
        data.append(item)
    return Response(data)


@api_view(['POST'])
@permission_classes([ProductsIsAdminUser])
def stock_low_stock_reminders_send(request):
    """Envoie les rappels (SMS + email) aux responsables pour les produits en stock faible."""
    from datetime import timedelta
    from django.utils import timezone

    settings_obj = StockAlertSettings.get_settings()
    interval = getattr(settings_obj, 'reminder_interval_days', 0) or 0
    last_sent = getattr(settings_obj, 'last_reminder_sent_at', None)
    if interval > 0 and last_sent:
        next_due = (last_sent + timedelta(days=interval)).date()
        today = timezone.now().date()
        if today < next_due:
            return Response(
                {
                    'detail': f"Prochain envoi de rappel possible le {next_due.strftime('%d/%m/%Y')} (jour J).",
                    'next_due': next_due.isoformat(),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    qs = Product.objects.filter(
        deleted_at__isnull=True,
        is_active=True,
        quantity__lte=F('alert_threshold')
    )
    nb_sms, nb_emails = send_low_stock_reminders(qs)
    # Mettre à jour la date du dernier rappel (pour rappel automatique)
    settings_obj.last_reminder_sent_at = timezone.now()
    settings_obj.save(update_fields=['last_reminder_sent_at'])
    return Response({
        'status': 'ok',
        'nb_sms': nb_sms,
        'nb_emails': nb_emails,
        'message': f'Rappels envoyés : {nb_sms} SMS, {nb_emails} email(s).',
    })


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
