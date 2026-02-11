#!/usr/bin/env python3
"""
Script simple pour vérifier l'état des images
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

def main():
    print("🔍 VÉRIFICATION DES IMAGES")
    print("=" * 40)
    
    # 1. Vérifier les fichiers physiques
    media_path = Path('gestion_stock/media/products')
    if media_path.exists():
        image_files = list(media_path.glob('*.jpg')) + list(media_path.glob('*.png'))
        print(f"📁 Fichiers images: {len(image_files)}")
        for img in image_files:
            size_kb = img.stat().st_size / 1024
            print(f"   - {img.name} ({size_kb:.1f} KB)")
    else:
        print("❌ Dossier media/products introuvable")
        return
    
    print()
    
    # 2. Vérifier les produits en base
    products = Product.objects.filter(deleted_at__isnull=True)
    print(f"📦 Produits en base: {products.count()}")
    
    products_with_photo = products.exclude(photo__isnull=True).exclude(photo='')
    print(f"✅ Produits avec photo: {products_with_photo.count()}")
    
    print("\n📋 DÉTAIL DES PRODUITS:")
    for product in products:
        photo_status = "✅" if product.photo else "❌"
        print(f"{photo_status} {product.name}")
        if product.photo:
            print(f"    📸 {product.photo}")
    
    # 3. Instructions pour tester
    print("\n🧪 POUR TESTER L'AFFICHAGE:")
    print("1. Démarrez le serveur Django:")
    print("   cd gestion_stock && py manage.py runserver")
    print()
    print("2. Démarrez le serveur Frontend:")
    print("   cd frontend && npm run dev")
    print()
    print("3. Ouvrez http://localhost:3000 dans votre navigateur")
    print("4. Connectez-vous avec admin/admin123")
    print("5. Allez dans la section Produits")
    print()
    print("🔗 URLs d'images à tester directement:")
    for product in products_with_photo[:3]:
        if product.photo:
            print(f"   http://localhost:8000/media/{product.photo}")

if __name__ == "__main__":
    main()