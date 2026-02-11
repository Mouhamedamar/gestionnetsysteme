#!/usr/bin/env python
"""Script pour vérifier et créer les dossiers media nécessaires"""
import os
from pathlib import Path

# Déterminer le chemin du projet
BASE_DIR = Path(__file__).resolve().parent

# Dossiers media
MEDIA_ROOT = BASE_DIR / 'media'
PRODUCTS_DIR = MEDIA_ROOT / 'products'

print("=" * 60)
print("Vérification des dossiers media")
print("=" * 60)

# Créer MEDIA_ROOT
if not MEDIA_ROOT.exists():
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    print(f"✓ Créé: {MEDIA_ROOT}")
else:
    print(f"✓ Existe: {MEDIA_ROOT}")

# Créer products/
if not PRODUCTS_DIR.exists():
    PRODUCTS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"✓ Créé: {PRODUCTS_DIR}")
else:
    print(f"✓ Existe: {PRODUCTS_DIR}")

# Test d'écriture
test_file = PRODUCTS_DIR / '.test'
try:
    test_file.write_text('test')
    test_file.unlink()
    print(f"✓ Permissions d'écriture OK")
except Exception as e:
    print(f"✗ ERREUR permissions: {e}")

print("=" * 60)
print("Configuration des dossiers terminée!")
print("=" * 60)
