#!/usr/bin/env python
"""Script pour appliquer les migrations des installations"""
import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from django.core.management import call_command
from django.db import connection

print("=" * 60)
print("APPLICATION DES MIGRATIONS - INSTALLATIONS")
print("=" * 60)

# Vérifier si les tables existent
with connection.cursor() as cursor:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'installations_%'")
    tables = cursor.fetchall()
    print(f"\nTables installations existantes: {[t[0] for t in tables]}")

# Appliquer les migrations
print("\nApplication des migrations...")
try:
    call_command('migrate', 'installations', verbosity=2)
    print("✅ Migrations appliquées avec succès!")
except Exception as e:
    print(f"❌ Erreur lors de l'application des migrations: {e}")
    import traceback
    traceback.print_exc()

# Vérifier à nouveau
with connection.cursor() as cursor:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'installations_%'")
    tables = cursor.fetchall()
    print(f"\nTables installations après migration: {[t[0] for t in tables]}")

print("\n" + "=" * 60)
