#!/usr/bin/env python
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from django.core.management import execute_from_command_line
from django.db import connection

print("Vérification des tables installations...")
with connection.cursor() as cursor:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'installations_%'")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"Tables trouvées: {tables}")

if 'installations_installation' not in tables:
    print("\nApplication des migrations...")
    execute_from_command_line(['manage.py', 'migrate', 'installations', '--verbosity', '2'])
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'installations_%'")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"\nTables après migration: {tables}")
else:
    print("✅ Les tables existent déjà!")
