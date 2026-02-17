from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .payment_reminder_views import payment_reminders_list, payment_reminders_send

router = DefaultRouter()
router.register(r'installations', views.InstallationViewSet, basename='installation')

urlpatterns = [
    path('', include(router.urls)),
    path('installations/payment-reminders/', payment_reminders_list),
    path('installations/payment-reminders/send/', payment_reminders_send),
]
