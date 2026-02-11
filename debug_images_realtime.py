#!/usr/bin/env python3
"""
Diagnostic en temps réel des images
"""
import os
import sys
import django
from pathlib import Path

# Configuration Django
sys.path.append('gestion_stock')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product
from products.serializers import ProductSerializer
from django.test import RequestFactory

def check_products_and_images():
    """Vérifie l'état des produits et leurs images"""
    print("📦 ÉTAT DES PRODUITS ET IMAGES")
    print("=" * 40)
    
    products = Product.objects.filter(deleted_at__isnull=True)
    print(f"Total produits: {products.count()}")
    
    # Créer une fausse requête pour le serializer
    factory = RequestFactory()
    request = factory.get('/')
    request.META['HTTP_HOST'] = 'localhost:8000'
    request.META['wsgi.url_scheme'] = 'http'
    
    print("\n📋 DÉTAIL DES PRODUITS:")
    for product in products:
        print(f"\n🔍 {product.name} (ID: {product.id})")
        print(f"   Photo DB: {product.photo}")
        
        # Vérifier le fichier physique
        if product.photo:
            photo_path = Path(f'gestion_stock/media/{product.photo}')
            if photo_path.exists():
                size = photo_path.stat().st_size
                print(f"   ✅ Fichier existe: {size} bytes")
            else:
                print(f"   ❌ Fichier manquant: {photo_path}")
        else:
            print(f"   ❌ Pas de photo en DB")
        
        # Tester le serializer
        serializer = ProductSerializer(product, context={'request': request})
        data = serializer.data
        print(f"   API photo: {data.get('photo')}")
        print(f"   API photo_url: {data.get('photo_url')}")

def test_media_serving():
    """Teste le service des fichiers média"""
    print("\n🌐 TEST SERVICE MÉDIA")
    print("=" * 40)
    
    from django.conf import settings
    from django.test import Client
    
    client = Client()
    
    # Tester quelques images
    media_path = Path('gestion_stock/media/products')
    images = list(media_path.glob('*.jpg'))[:3]
    
    for img in images:
        url = f'/media/products/{img.name}'
        print(f"\n🧪 Test: {url}")
        
        response = client.get(url)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"   ✅ Image servie correctement")
            print(f"   Content-Type: {response.get('Content-Type', 'N/A')}")
        else:
            print(f"   ❌ Erreur service image")

def check_urls_config():
    """Vérifie la configuration des URLs"""
    print("\n🔗 VÉRIFICATION CONFIGURATION URLs")
    print("=" * 40)
    
    from django.conf import settings
    from django.urls import reverse
    
    print(f"MEDIA_URL: {settings.MEDIA_URL}")
    print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
    print(f"DEBUG: {settings.DEBUG}")
    
    # Vérifier que le dossier media existe
    media_root = Path(settings.MEDIA_ROOT)
    products_dir = media_root / 'products'
    
    print(f"MEDIA_ROOT existe: {media_root.exists()}")
    print(f"products/ existe: {products_dir.exists()}")
    
    if products_dir.exists():
        images = list(products_dir.glob('*.jpg'))
        print(f"Images trouvées: {len(images)}")

def create_test_urls():
    """Crée des URLs de test"""
    print("\n🔗 URLs DE TEST")
    print("=" * 40)
    
    print("Testez ces URLs dans votre navigateur:")
    print("1. API Produits: http://localhost:8000/api/products/")
    print("2. Images directes:")
    
    media_path = Path('gestion_stock/media/products')
    images = list(media_path.glob('*.jpg'))[:5]
    
    for img in images:
        print(f"   http://localhost:8000/media/products/{img.name}")

def main():
    """Fonction principale"""
    print("🔍 DIAGNOSTIC IMAGES EN TEMPS RÉEL")
    print("=" * 50)
    
    # 1. Vérifier les produits et images
    check_products_and_images()
    
    # 2. Tester le service média
    test_media_serving()
    
    # 3. Vérifier la configuration
    check_urls_config()
    
    # 4. Créer des URLs de test
    create_test_urls()
    
    print("\n💡 ACTIONS À FAIRE:")
    print("1. Testez les URLs ci-dessus dans votre navigateur")
    print("2. Ouvrez F12 dans votre interface web")
    print("3. Regardez l'onglet Network pour voir les requêtes d'images")
    print("4. Vérifiez les erreurs 404 ou autres")

if __name__ == "__main__":
    main()