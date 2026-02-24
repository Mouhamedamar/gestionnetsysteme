from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StockMovementViewSet,
    StockNotificationRecipientViewSet,
    stock_alert_settings,
    stock_low_stock_reminders_list,
    stock_low_stock_reminders_send,
)

router = DefaultRouter()
router.register(r'stock-movements', StockMovementViewSet, basename='stockmovement')
router.register(r'stock-notification-recipients', StockNotificationRecipientViewSet, basename='stocknotificationrecipient')

urlpatterns = [
    path('', include(router.urls)),
    path('stock-alert-settings/', stock_alert_settings),
    path('stock-low-stock-reminders/', stock_low_stock_reminders_list),
    path('stock-low-stock-reminders/send/', stock_low_stock_reminders_send),
]

