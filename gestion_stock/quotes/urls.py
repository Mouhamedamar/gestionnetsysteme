from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuoteViewSet, QuoteItemViewSet

router = DefaultRouter()
router.register(r'quotes', QuoteViewSet, basename='quote')
router.register(r'quote-items', QuoteItemViewSet, basename='quote-item')

urlpatterns = [
    path('', include(router.urls)),
]
