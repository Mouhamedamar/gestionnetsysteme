"""
Gestionnaire d'exceptions DRF pour renvoyer le détail des erreurs 500 en DEBUG.
"""
from django.conf import settings
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """Appelle le handler par défaut puis enrichit la réponse 500 en DEBUG."""
    response = exception_handler(exc, context)
    if response is None and settings.DEBUG:
        # Exception non gérée par DRF (ex: 500) -> renvoyer le détail
        import traceback
        return Response(
            {
                'detail': str(exc),
                'error_type': type(exc).__name__,
                'traceback': traceback.format_exc(),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    return response
