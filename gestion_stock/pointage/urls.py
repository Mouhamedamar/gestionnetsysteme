from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CheckInViewSet

router = DefaultRouter()
router.register(r'pointages', CheckInViewSet, basename='pointage')

urlpatterns = [
    path('', include(router.urls)),
]
