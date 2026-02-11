import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.gestion_stock.settings')
sys.path.insert(0, os.path.join(os.getcwd(), 'gestion_stock'))

django.setup()

from products.models import Product
from django.conf import settings

print("=" * 60)
print("TEST D'UPLOAD D'IMAGES - DIAGNOSTIC")
print("=" * 60)

# Vérifier les settings
print("\n1. CONFIGURATION MEDIA:")
print(f"   MEDIA_URL: {settings.MEDIA_URL}")
print(f"   MEDIA_ROOT: {settings.MEDIA_ROOT}")
print(f"   MEDIA_ROOT exists: {os.path.exists(settings.MEDIA_ROOT)}")

# Créer le dossier media si nécessaire
products_media_dir = os.path.join(settings.MEDIA_ROOT, 'products')
print(f"   Products folder: {products_media_dir}")
print(f"   Products folder exists: {os.path.exists(products_media_dir)}")

if not os.path.exists(products_media_dir):
    os.makedirs(products_media_dir)
    print(f"   ✓ Created products folder")

# Vérifier les permissions
try:
    test_file = os.path.join(products_media_dir, 'test.txt')
    with open(test_file, 'w') as f:
        f.write('test')
    os.remove(test_file)
    print(f"   ✓ Write permissions OK")
except Exception as e:
    print(f"   ✗ Write permission ERROR: {e}")

# Lister les produits et leurs photos
print("\n2. PRODUITS EXISTANTS:")
products = Product.objects.filter(deleted_at__isnull=True).order_by('-created_at')[:5]
print(f"   Total products: {Product.objects.filter(deleted_at__isnull=True).count()}")

for p in products:
    photo_status = "✓ HAS PHOTO" if p.photo else "✗ NO PHOTO"
    print(f"   - {p.name[:30]:30s} {photo_status}")
    if p.photo:
        print(f"     Path: {p.photo}")
        print(f"     URL: {p.photo.url}")
        full_path = os.path.join(settings.MEDIA_ROOT, str(p.photo))
        print(f"     File exists: {os.path.exists(full_path)}")

print("\n" + "=" * 60)
