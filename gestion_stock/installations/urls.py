from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'installations', views.InstallationViewSet, basename='installation')

urlpatterns = [
    path('', include(router.urls)),
]
