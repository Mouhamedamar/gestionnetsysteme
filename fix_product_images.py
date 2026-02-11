"""
Script pour ajouter des images de test aux produits existants
Ce script télécharge des images de placeholder et les associe aux produits
"""

import os
import sys
import django
from pathlib import Path
import requests
from io import BytesIO
from PIL import Image

# Configuration Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR / 'gestion_stock'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product
from django.core.files.uploadedfile import SimpleUploadedFile

def download_placeholder_image(width=400, height=400, text='Product'):
    """
    Télécharge une image placeholder depuis picsum.photos
    """
    try:
        # Utiliser picsum.photos pour des images de test
        url = f'https://picsum.photos/{width}/{height}'
        print(f"  📥 Téléchargement de l'image depuis {url}...")
        
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            # Convertir en image PIL pour vérifier et redimensionner si nécessaire
            img = Image.open(BytesIO(response.content))
            
            # Convertir en RGB si nécessaire (pour éviter les problèmes avec RGBA)
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Sauvegarder dans un buffer
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            buffer.seek(0)
            
            return buffer.getvalue()
        else:
            print(f"  ❌ Erreur HTTP {response.status_code}")
            return None
    except Exception as e:
        print(f"  ❌ Erreur lors du téléchargement : {e}")
        return None

def create_solid_color_image(width=400, height=400, color='#8b5cf6'):
    """
    Crée une image de couleur unie comme fallback
    """
    try:
        # Convertir la couleur hex en RGB
        color = color.lstrip('#')
        rgb = tuple(int(color[i:i+2], 16) for i in (0, 2, 4))
        
        # Créer une image
        img = Image.new('RGB', (width, height), rgb)
        
        # Sauvegarder dans un buffer
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        buffer.seek(0)
        
        return buffer.getvalue()
    except Exception as e:
        print(f"  ❌ Erreur lors de la création de l'image : {e}")
        return None

def add_images_to_products():
    """
    Ajoute des images de test aux produits qui n'en ont pas
    """
    print("=" * 80)
    print("🖼️  AJOUT D'IMAGES AUX PRODUITS")
    print("=" * 80)
    print()
    
    # Récupérer tous les produits actifs sans image
    products_without_images = Product.objects.filter(
        deleted_at__isnull=True
    ).filter(
        photo__isnull=True
    ) | Product.objects.filter(
        deleted_at__isnull=True,
        photo=''
    )
    
    total_products = Product.objects.filter(deleted_at__isnull=True).count()
    products_to_fix = products_without_images.count()
    
    print(f"📊 Statistiques :")
    print(f"   Total de produits actifs : {total_products}")
    print(f"   Produits sans image      : {products_to_fix}")
    print()
    
    if products_to_fix == 0:
        print("✅ Tous les produits ont déjà des images !")
        return
    
    print(f"🔧 Ajout d'images à {products_to_fix} produit(s)...")
    print()
    
    success_count = 0
    error_count = 0
    
    for i, product in enumerate(products_without_images, 1):
        print(f"[{i}/{products_to_fix}] {product.name}...")
        
        # Essayer de télécharger une image de placeholder
        image_data = download_placeholder_image(400, 400, product.name)
        
        # Si le téléchargement échoue, créer une image de couleur unie
        if not image_data:
            print("  ⚠️  Téléchargement échoué, création d'une image de couleur...")
            image_data = create_solid_color_image(400, 400, '#8b5cf6')
        
        if image_data:
            try:
                # Créer un nom de fichier unique
                filename = f"product_{product.id}_{product.name[:20].replace(' ', '_')}.jpg"
                
                # Créer un fichier uploadé
                uploaded_file = SimpleUploadedFile(
                    filename,
                    image_data,
                    content_type='image/jpeg'
                )
                
                # Assigner l'image au produit
                product.photo = uploaded_file
                product.save()
                
                print(f"  ✅ Image ajoutée avec succès : {product.photo.name}")
                success_count += 1
            except Exception as e:
                print(f"  ❌ Erreur lors de la sauvegarde : {e}")
                error_count += 1
        else:
            print(f"  ❌ Impossible de créer une image")
            error_count += 1
        
        print()
    
    print("=" * 80)
    print("✅ TRAITEMENT TERMINÉ")
    print("=" * 80)
    print()
    print(f"📊 Résultats :")
    print(f"   ✅ Succès : {success_count}")
    print(f"   ❌ Erreurs : {error_count}")
    print()
    
    if success_count > 0:
        print("🔄 Rechargez la page frontend pour voir les images !")
        print()

if __name__ == '__main__':
    try:
        add_images_to_products()
    except KeyboardInterrupt:
        print("\n\n⚠️  Script interrompu par l'utilisateur")
    except Exception as e:
        print(f"\n\n❌ Erreur fatale : {e}")
        import traceback
        traceback.print_exc()
