"""
Test complet du système d'images
Ce script va créer un produit avec une image et vérifier que tout fonctionne
"""
import os
import django
import sys
from pathlib import Path

# Configuration Django
BASE_DIR = Path(__file__).resolve().parent / "gestion_stock"
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io

def create_test_image(name="test"):
    """Crée une image de test"""
    img = Image.new('RGB', (400, 300), color=(255, 100, 100))
    try:
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        text = name.upper()
        bbox = draw.textbbox((0, 0), text)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        position = ((400 - text_width) // 2, (300 - text_height) // 2)
        draw.text(position, text, fill=(255, 255, 255))
    except:
        pass
    
    img_io = io.BytesIO()
    img.save(img_io, format='JPEG', quality=85)
    img_io.seek(0)
    return SimpleUploadedFile(f"{name}.jpg", img_io.read(), content_type="image/jpeg")

print("=" * 80)
print("TEST COMPLET DU SYSTÈME D'IMAGES")
print("=" * 80)
print()

# 1. Vérifier la configuration
print("1. VÉRIFICATION DE LA CONFIGURATION")
print("-" * 80)

from django.conf import settings
media_root = settings.MEDIA_ROOT
media_url = settings.MEDIA_URL
products_dir = Path(media_root) / "products"

print(f"MEDIA_ROOT: {media_root}")
print(f"MEDIA_URL: {media_url}")
print(f"Products dir: {products_dir}")
print(f"Products dir exists: {products_dir.exists()}")

if not products_dir.exists():
    print("Creating products directory...")
    products_dir.mkdir(parents=True, exist_ok=True)
    print("✅ Created")

print()

# 2. État actuel de la base de données
print("2. ÉTAT ACTUEL DES PRODUITS")
print("-" * 80)

all_products = Product.objects.all()
print(f"Total produits: {all_products.count()}")

for p in all_products:
    has_photo = "✅" if p.photo else "❌"
    print(f"{has_photo} ID:{p.id:3d} | {p.name:30s} | Photo: {p.photo or 'Aucune'}")

print()

# 3. Supprimer les anciens tests
print("3. NETTOYAGE DES TESTS PRÉCÉDENTS")
print("-" * 80)

test_products = Product.objects.filter(name__contains="Test")
if test_products.exists():
    count = test_products.count()
    test_products.delete()
    print(f"✅ {count} produit(s) de test supprimé(s)")
else:
    print("Aucun produit de test à supprimer")

print()

# 4. Créer des produits de test avec images
print("4. CRÉATION DE PRODUITS DE TEST")
print("-" * 80)

test_data = [
    {"name": "TEST Produit 1", "category": "Test", "price": 1000},
    {"name": "TEST Produit 2", "category": "Test", "price": 2000},
]

created_products = []

for data in test_data:
    try:
        print(f"Création de '{data['name']}'...")
        test_image = create_test_image(data['name'].split()[-1])
        
        product = Product.objects.create(
            name=data['name'],
            description=f"Produit de test créé automatiquement",
            category=data['category'],
            quantity=10,
            purchase_price=data['price'],
            sale_price=data['price'] * 1.5,
            alert_threshold=5,
            photo=test_image,
            is_active=True
        )
        
        print(f"✅ Créé: ID={product.id}")
        print(f"   Photo: {product.photo}")
        print(f"   Photo URL: {product.photo.url}")
        
        # Vérifier le fichier
        if product.photo:
            full_path = product.photo.path
            if os.path.exists(full_path):
                size = os.path.getsize(full_path)
                print(f"   ✅ Fichier créé: {size} bytes")
            else:
                print(f"   ❌ Fichier non trouvé: {full_path}")
        
        created_products.append(product)
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

print()

# 5. Vérifier les fichiers physiques
print("5. VÉRIFICATION DES FICHIERS PHYSIQUES")
print("-" * 80)

if products_dir.exists():
    files = list(products_dir.glob("*"))
    print(f"Fichiers dans {products_dir}:")
    if files:
        for f in files:
            size = f.stat().st_size if f.is_file() else 0
            print(f"  - {f.name} ({size:,} bytes)")
    else:
        print("  Aucun fichier")
else:
    print("❌ Le dossier n'existe pas")

print()

# 6. Test de l'API (simulation)
print("6. TEST DES URLs D'IMAGES")
print("-" * 80)

from products.serializers import ProductSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()
request = factory.get('/api/products/')

for product in created_products:
    serializer = ProductSerializer(product, context={'request': Request(request)})
    data = serializer.data
    print(f"\nProduit: {product.name}")
    print(f"  photo_url: {data.get('photo_url')}")
    print(f"  photo: {data.get('photo')}")

print()

# 7. Instructions finales
print("=" * 80)
print("✅ TEST TERMINÉ")
print("=" * 80)
print()
print("PROCHAINES ÉTAPES:")
print()
print("1. Redémarrez le serveur Django (Ctrl+C puis python manage.py runserver)")
print("2. Allez sur http://localhost:3000")
print("3. Vous devriez voir les 2 nouveaux produits TEST avec leurs images")
print()
print("Si les images ne s'affichent pas:")
print("  - Ouvrez la console (F12)")
print("  - Partagez les logs qui apparaissent")
print("  - Vérifiez l'onglet Network pour les requêtes /media/products/")
print()
print("Pour tester l'upload depuis le frontend:")
print("  - Cliquez sur 'Nouveau Produit'")
print("  - Remplissez le formulaire et sélectionnez une image")
print("  - Regardez les logs dans la console (avec les émojis 🔵 ✅ ❌)")
print()
