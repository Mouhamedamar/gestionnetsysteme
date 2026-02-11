#!/usr/bin/env python
"""Script pour forcer l'application des migrations installations"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')

try:
    django.setup()
    from django.core.management import call_command
    from django.db import connection
    
    print("=" * 70)
    print("APPLICATION DES MIGRATIONS - INSTALLATIONS")
    print("=" * 70)
    
    # Vérifier l'état actuel
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'installations_%'")
        existing_tables = [row[0] for row in cursor.fetchall()]
        print(f"\n📊 Tables existantes: {existing_tables if existing_tables else 'Aucune'}")
    
    # Appliquer les migrations
    print("\n🔄 Application des migrations...")
    try:
        call_command('migrate', 'installations', verbosity=2, interactive=False)
        print("\n✅ Migrations appliquées!")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
    
    # Vérifier après migration
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'installations_%'")
        new_tables = [row[0] for row in cursor.fetchall()]
        print(f"\n📊 Tables après migration: {new_tables if new_tables else 'Aucune'}")
    
    if 'installations_installation' in new_tables:
        print("\n✅ SUCCÈS: La table installations_installation a été créée!")
    else:
        print("\n⚠️  ATTENTION: La table installations_installation n'existe toujours pas.")
    
    print("=" * 70)
    
except Exception as e:
    print(f"❌ Erreur lors de l'initialisation: {e}")
    import traceback
    traceback.print_exc()
