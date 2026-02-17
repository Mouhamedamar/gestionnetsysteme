"""
Vues API pour les rappels de paiement SMS des installations.
"""
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Installation
from .permissions import IsAdminOrTechnicien
from .payment_reminders import build_reminders_list, send_reminders

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrTechnicien])
def payment_reminders_list(request):
    """
    Liste des rappels de paiement à envoyer (J-5, J-2, Jour J).
    GET /api/installations/payment-reminders/
    """
    try:
        queryset = Installation.objects.all()
        # Si technicien, filtrer par ses installations
        if request.user and not request.user.is_staff:
            try:
                if hasattr(request.user, 'profile') and request.user.profile and request.user.profile.role == 'technicien':
                    queryset = queryset.filter(technician_id=request.user.id)
            except Exception:
                pass
        data = build_reminders_list(queryset)
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.exception("Erreur liste rappels paiement: %s", e)
        return Response(
            {'error': 'Erreur lors du chargement des rappels', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrTechnicien])
def payment_reminders_send(request):
    """
    Envoie les SMS de rappel de paiement.
    POST /api/installations/payment-reminders/send/
    Body: { "installation_ids": [1, 2, ...], "dry_run": false }
    - installation_ids: optionnel, liste d'IDs (envoyer tous si absent)
    - dry_run: si true, simule sans envoyer
    """
    try:
        installation_ids = request.data.get('installation_ids')
        dry_run = request.data.get('dry_run', False)
        if installation_ids is not None and not isinstance(installation_ids, list):
            installation_ids = [installation_ids] if installation_ids else None
        result = send_reminders(installation_ids=installation_ids, dry_run=bool(dry_run))
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        logger.exception("Erreur envoi rappels paiement: %s", e)
        return Response(
            {'error': 'Erreur lors de l\'envoi des rappels', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
