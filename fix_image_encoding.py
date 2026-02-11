#!/usr/bin/env python3
"""
Correctif pour les problèmes d'encodage des images
"""
import os
import sys
import django
from pathlib import Path
import shutil

# Configuration Django
sys.path.append('gestion_stock')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product

def fix_image_filenames():
    """Corrige les noms de fichiers avec caractères spéciaux"""
    print("🔧 CORRECTION DES NOMS DE FICHIERS")
    print("=" * 40)
    
    media_path = Path('gestion_stock/media/products')
    if not media_path.exists():
        print("❌ Dossier media/products introuvable")
        return
    
    # Mapping des fichiers problématiques
    problematic_files = {
        'product_10_Mouhamadou_Mbacké_Amar.jpg': 'product_10_Mouhamadou_Mbacke_Amar.jpg',
        'product_8_Écran_24_.jpg': 'product_8_Ecran_24.jpg'
    }
    
    fixed_count = 0
    
    for old_name, new_name in problematic_files.items():
        old_path = media_path / old_name
        new_path = media_path / new_name
        
        if old_path.exists():
            print(f"🔄 Renommage: {old_name} → {new_name}")
            
            try:
                # Renommer le fichier
                shutil.move(str(old_path), str(new_path))
                
                # Mettre à jour la base de données
                products = Product.objects.filter(photo__icontains=old_name)
                for product in products:
                    old_photo_path = product.photo.name
                    new_photo_path = old_photo_path.replace(old_name, new_name)
                    product.photo.name = new_photo_path
                    product.save()
                    print(f"   ✅ Produit mis à jour: {product.name}")
                
                fixed_count += 1
                
            except Exception as e:
                print(f"   ❌ Erreur: {e}")
        else:
            print(f"⚠️  Fichier non trouvé: {old_name}")
    
    print(f"\n🎉 {fixed_count} fichiers corrigés")

def verify_all_images():
    """Vérifie que toutes les images sont accessibles"""
    print("\n✅ VÉRIFICATION DES IMAGES")
    print("=" * 40)
    
    products = Product.objects.filter(deleted_at__isnull=True).exclude(photo__isnull=True).exclude(photo='')
    
    print(f"Produits avec images: {products.count()}")
    
    for product in products:
        if product.photo:
            photo_path = Path(f'gestion_stock/media/{product.photo}')
            if photo_path.exists():
                size = photo_path.stat().st_size
                print(f"✅ {product.name}: {product.photo} ({size} bytes)")
            else:
                print(f"❌ {product.name}: {product.photo} - FICHIER MANQUANT")

def create_simple_test_images():
    """Crée des images de test simples sans caractères spéciaux"""
    print("\n🖼️  CRÉATION D'IMAGES DE TEST SIMPLES")
    print("=" * 40)
    
    try:
        from PIL import Image
        
        media_path = Path('gestion_stock/media/products')
        
        # Créer quelques images de test simples
        test_images = [
            ('test_simple_1.jpg', (100, 100), 'red'),
            ('test_simple_2.jpg', (100, 100), 'blue'),
            ('test_simple_3.jpg', (100, 100), 'green')
        ]
        
        created = 0
        for filename, size, color in test_images:
            img_path = media_path / filename
            if not img_path.exists():
                img = Image.new('RGB', size, color)
                img.save(img_path, 'JPEG')
                print(f"✅ Créé: {filename}")
                created += 1
            else:
                print(f"⚠️  Existe déjà: {filename}")
        
        print(f"\n🎉 {created} images de test créées")
        return True
        
    except ImportError:
        print("⚠️  PIL/Pillow non installé - impossible de créer des images de test")
        return False

def main():
    """Fonction principale"""
    print("🔧 CORRECTIF ENCODAGE DES IMAGES")
    print("=" * 50)
    
    # 1. Corriger les noms de fichiers
    fix_image_filenames()
    
    # 2. Vérifier toutes les images
    verify_all_images()
    
    # 3. Créer des images de test simples
    create_simple_test_images()
    
    print("\n✅ CORRECTIF TERMINÉ")
    print("\n🔄 Redémarrez le serveur Django maintenant")

if __name__ == "__main__":
    main()