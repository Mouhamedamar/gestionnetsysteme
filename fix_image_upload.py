"""
Script pour corriger les problèmes d'upload d'images
"""
import os
import sys

# Configuration du chemin Django
sys.path.insert(0, os.path.join(os.getcwd(), 'gestion_stock'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')

import django
django.setup()

from django.conf import settings

print("=" * 70)
print("CORRECTION DES PROBLÈMES D'UPLOAD D'IMAGES")
print("=" * 70)

# 1. Vérifier et créer les dossiers media
print("\n1. VÉRIFICATION DES DOSSIERS...")
media_root = settings.MEDIA_ROOT
products_dir = os.path.join(media_root, 'products')

print(f"   MEDIA_ROOT: {media_root}")
print(f"   Products dir: {products_dir}")

if not os.path.exists(media_root):
    os.makedirs(media_root)
    print(f"   ✓ Created MEDIA_ROOT: {media_root}")
else:
    print(f"   ✓ MEDIA_ROOT exists")

if not os.path.exists(products_dir):
    os.makedirs(products_dir)
    print(f"   ✓ Created products directory: {products_dir}")
else:
    print(f"   ✓ Products directory exists")

# 2. Tester les permissions d'écriture
print("\n2. TEST DES PERMISSIONS...")
test_file_path = os.path.join(products_dir, '.test_write')
try:
    with open(test_file_path, 'w') as f:
        f.write('test')
    os.remove(test_file_path)
    print(f"   ✓ Write permissions OK")
except Exception as e:
    print(f"   ✗ Write permission ERROR: {e}")
    print(f"   Solution: Assurez-vous que le dossier {products_dir} a les droits d'écriture")

# 3. Vérifier la configuration Django
print("\n3. CONFIGURATION DJANGO...")
print(f"   MEDIA_URL: {settings.MEDIA_URL}")
print(f"   MEDIA_ROOT: {settings.MEDIA_ROOT}")
print(f"   DEBUG: {settings.DEBUG}")

# 4. Vérifier les fichiers existants
print("\n4. FICHIERS MEDIA EXISTANTS...")
if os.path.exists(products_dir):
    files = os.listdir(products_dir)
    print(f"   Total files in products/: {len(files)}")
    for f in files[:5]:
        print(f"   - {f}")
    if len(files) > 5:
        print(f"   ... et {len(files) - 5} autres")

print("\n" + "=" * 70)
print("FAIT! Les dossiers sont maintenant prêts pour l'upload.")
print("=" * 70)
