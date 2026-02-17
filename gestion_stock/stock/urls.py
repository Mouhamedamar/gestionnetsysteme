from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StockMovementViewSet,
    StockNotificationRecipientViewSet,
    stock_alert_settings,
)

router = DefaultRouter()
router.register(r'stock-movements', StockMovementViewSet, basename='stockmovement')
router.register(r'stock-notification-recipients', StockNotificationRecipientViewSet, basename='stocknotificationrecipient')

urlpatterns = [
    path('', include(router.urls)),
    path('stock-alert-settings/', stock_alert_settings),
]

