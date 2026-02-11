#!/usr/bin/env python3
"""
Script pour diagnostiquer et corriger l'affichage des images dans l'application
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

def diagnose_images():
    """Diagnostique l'état des images"""
    print("🔍 DIAGNOSTIC DES IMAGES")
    print("=" * 50)
    
    # 1. Vérifier les fichiers physiques
    media_path = Path('gestion_stock/media/products')
    if media_path.exists():
        image_files = list(media_path.glob('*.jpg')) + list(media_path.glob('*.png'))
        print(f"📁 Fichiers images trouvés: {len(image_files)}")
        for img in image_files:
            print(f"   - {img.name} ({img.stat().st_size} bytes)")
    else:
        print("❌ Dossier media/products introuvable")
        return
    
    print()
    
    # 2. Vérifier les produits en base
    products = Product.objects.filter(deleted_at__isnull=True)
    print(f"📦 Produits actifs en base: {products.count()}")
    
    products_with_photo = products.exclude(photo__isnull=True).exclude(photo='')
    products_without_photo = products.filter(photo__isnull=True) | products.filter(photo='')
    
    print(f"✅ Produits avec photo: {products_with_photo.count()}")
    print(f"❌ Produits sans photo: {products_without_photo.count()}")
    
    print("\n📋 DÉTAIL DES PRODUITS:")
    for product in products:
        photo_status = "✅" if product.photo else "❌"
        print(f"{photo_status} ID:{product.id} - {product.name} - Photo: {product.photo or 'AUCUNE'}")
    
    return image_files, products_without_photo

def fix_images():
    """Associe automatiquement les images aux produits"""
    print("\n🔧 CORRECTION DES IMAGES")
    print("=" * 50)
    
    image_files, products_without_photo = diagnose_images()
    
    if not products_without_photo.exists():
        print("✅ Tous les produits ont déjà une image associée")
        return
    
    # Associer les images aux produits sans photo
    fixed_count = 0
    for i, product in enumerate(products_without_photo):
        if i < len(image_files):
            image_file = image_files[i]
            # Construire le chemin relatif pour Django
            relative_path = f"products/{image_file.name}"
            
            product.photo = relative_path
            product.save()
            
            print(f"✅ {product.name} -> {relative_path}")
            fixed_count += 1
        else:
            print(f"⚠️  Pas d'image disponible pour: {product.name}")
    
    print(f"\n🎉 {fixed_count} produits corrigés!")

def create_sample_products():
    """Crée des produits d'exemple avec de vraies données"""
    print("\n📦 CRÉATION DE PRODUITS D'EXEMPLE")
    print("=" * 50)
    
    # Données réelles de produits
    sample_products = [
        {
            'name': 'Écran 24 pouces',
            'description': 'Moniteur LED 24" Full HD 1920x1080',
            'category': 'Informatique',
            'quantity': 15,
            'purchase_price': 120.00,
            'sale_price': 180.00,
            'alert_threshold': 5,
        },
        {
            'name': 'Routeur WiFi',
            'description': 'Routeur sans fil AC1200 dual band',
            'category': 'Réseau',
            'quantity': 8,
            'purchase_price': 45.00,
            'sale_price': 75.00,
            'alert_threshold': 3,
        },
        {
            'name': 'Tableau blanc',
            'description': 'Tableau blanc magnétique 120x90cm',
            'category': 'Bureau',
            'quantity': 12,
            'purchase_price': 35.00,
            'sale_price': 55.00,
            'alert_threshold': 2,
        },
        {
            'name': 'Clavier mécanique',
            'description': 'Clavier gaming mécanique RGB',
            'category': 'Informatique',
            'quantity': 20,
            'purchase_price': 60.00,
            'sale_price': 95.00,
            'alert_threshold': 5,
        },
        {
            'name': 'Souris optique',
            'description': 'Souris optique sans fil ergonomique',
            'category': 'Informatique',
            'quantity': 25,
            'purchase_price': 15.00,
            'sale_price': 28.00,
            'alert_threshold': 8,
        }
    ]
    
    # Supprimer les anciens produits de test
    Product.objects.filter(name__icontains='Test').delete()
    
    created_count = 0
    for product_data in sample_products:
        product, created = Product.objects.get_or_create(
            name=product_data['name'],
            defaults=product_data
        )
        if created:
            print(f"✅ Créé: {product.name}")
            created_count += 1
        else:
            print(f"⚠️  Existe déjà: {product.name}")
    
    print(f"\n🎉 {created_count} nouveaux produits créés!")

def main():
    """Fonction principale"""
    print("🚀 CORRECTION DES IMAGES - GESTION DE STOCK")
    print("=" * 60)
    
    try:
        # 1. Diagnostic
        diagnose_images()
        
        # 2. Correction des images
        fix_images()
        
        # 3. Création de produits d'exemple
        create_sample_products()
        
        # 4. Diagnostic final
        print("\n📊 ÉTAT FINAL:")
        diagnose_images()
        
        print("\n✅ CORRECTION TERMINÉE!")
        print("🔄 Redémarrez le serveur Django et rafraîchissez votre navigateur")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()