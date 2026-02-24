from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CheckInViewSet, RapportQuotidienAPIView

router = DefaultRouter()
router.register(r'pointages', CheckInViewSet, basename='pointage')

urlpatterns = [
    path('pointages/rapport-quotidien/', RapportQuotidienAPIView.as_view(), name='pointage-rapport-quotidien'),
    path('', include(router.urls)),
]
