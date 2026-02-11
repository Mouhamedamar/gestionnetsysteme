#!/usr/bin/env python
"""Script pour reproduire l'erreur 500 sur /api/pointages/"""
import os
import sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from pointage.views import CheckInViewSet
from pointage.models import CheckIn

User = get_user_model()
u = User.objects.filter(is_staff=True).first()
if not u:
    u = User.objects.first()

with open('pointage_debug_output.txt', 'w', encoding='utf-8') as f:
    f.write(f'User: id={getattr(u, "id", None)} username={getattr(u, "username", None)}\n')
    
    factory = APIRequestFactory()
    request = factory.get('/api/pointages/')
    request.user = u
    
    view = CheckInViewSet.as_view({'get': 'list'})
    try:
        response = view(request)
        f.write(f'GET status: {response.status_code}\n')
    except Exception as e:
        import traceback
        f.write(f'GET error: {type(e).__name__}: {e}\n')
        f.write(traceback.format_exc())

print('Done - check pointage_debug_output.txt')
