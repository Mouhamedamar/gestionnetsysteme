from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkZoneViewSet

router = DefaultRouter()
router.register(r'work-zones', WorkZoneViewSet, basename='workzone')

urlpatterns = [
    path('', include(router.urls)),
]
