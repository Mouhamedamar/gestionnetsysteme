"""
Script pour restaurer les produits supprimés et ajouter des images à tous
"""

import os
import sys
import django
from pathlib import Path
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

# Configuration Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR / 'gestion_stock'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product
from django.core.files.uploadedfile import SimpleUploadedFile

COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6']

def create_product_image(product_name, width=400, height=400, color_index=0):
    """Crée une image avec le nom du produit"""
    try:
        color_hex = COLORS[color_index % len(COLORS)].lstrip('#')
        bg_color = tuple(int(color_hex[i:i+2], 16) for i in (0, 2, 4))
        
        img = Image.new('RGB', (width, height), bg_color)
        draw = ImageDraw.Draw(img)
        
        # Dégradé
        for y in range(height):
            darkness = int((y / height) * 50)
            dark_color = tuple(max(0, c - darkness) for c in bg_color)
            draw.rectangle([(0, y), (width, y+1)], fill=dark_color)
        
        # Texte
        try:
            font = ImageFont.truetype("arial.ttf", 40)
        except:
            font = ImageFont.load_default()
        
        text = product_name[:30]
        
        try:
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width, text_height = bbox[2] - bbox[0], bbox[3] - bbox[1]
        except:
            text_width, text_height = len(text) * 10, 20
        
        x, y = (width - text_width) // 2, (height - text_height) // 2
        
        draw.text((x+2, y+2), text, fill=(0, 0, 0, 128), font=font)
        draw.text((x, y), text, fill=(255, 255, 255), font=font)
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        buffer.seek(0)
        
        return buffer.getvalue()
    except Exception as e:
        print(f"  Erreur: {e}")
        return None

def main():
    print("\n" + "=" * 80)
    print("RESTAURATION ET REPARATION DE TOUS LES PRODUITS")
    print("=" * 80 + "\n")
    
    # Restaurer les produits supprimés
    deleted_products = Product.objects.exclude(deleted_at__isnull=True)
    deleted_count = deleted_products.count()
    
    print(f"Produits supprimes trouves: {deleted_count}\n")
    
    if deleted_count > 0:
        print("Restauration des produits supprimes...\n")
        for p in deleted_products:
            print(f"  Restauration: {p.name}")
            p.restore()
        print(f"\n{deleted_count} produit(s) restaure(s)\n")
    
    # Ajouter des images aux produits sans image
    print("=" * 80)
    print("AJOUT D'IMAGES AUX PRODUITS SANS IMAGE")
    print("=" * 80 + "\n")
    
    products_without_images = Product.objects.filter(
        deleted_at__isnull=True
    ).filter(
        photo__isnull=True
    ) | Product.objects.filter(
        deleted_at__isnull=True,
        photo=''
    )
    
    products_to_fix = products_without_images.distinct().count()
    
    print(f"Produits sans image: {products_to_fix}\n")
    
    if products_to_fix == 0:
        print("Tous les produits ont deja des images!\n")
    else:
        success_count = 0
        
        for i, product in enumerate(products_without_images.distinct(), 1):
            print(f"[{i}/{products_to_fix}] {product.name}...")
            
            image_data = create_product_image(product.name, color_index=i)
            
            if image_data:
                try:
                    safe_name = ''.join(c if c.isalnum() or c in (' ', '_', '-') else '_' for c in product.name)
                    safe_name = safe_name[:50]
                    filename = f"product_{product.id}_{safe_name}.jpg"
                    
                    uploaded_file = SimpleUploadedFile(filename, image_data, content_type='image/jpeg')
                    
                    product.photo = uploaded_file
                    product.save()
                    
                    print(f"  Image creee: {product.photo.name}\n")
                    success_count += 1
                except Exception as e:
                    print(f"  Erreur: {e}\n")
        
        print(f"{success_count} image(s) ajoutee(s)\n")
    
    # Résumé final
    print("=" * 80)
    print("RESUME FINAL")
    print("=" * 80 + "\n")
    
    all_products = Product.objects.filter(deleted_at__isnull=True)
    with_photo = all_products.exclude(photo='').exclude(photo__isnull=True).count()
    
    print(f"Total de produits actifs: {all_products.count()}")
    print(f"  Avec photo: {with_photo}")
    print(f"  Sans photo: {all_products.count() - with_photo}\n")
    
    if with_photo > 0:
        print("Produits avec images:")
        for p in all_products.exclude(photo='').exclude(photo__isnull=True):
            print(f"  - {p.name}: /media/{p.photo.name}")
    
    print("\n" + "=" * 80)
    print("TRAITEMENT TERMINE!")
    print("=" * 80 + "\n")
    print("Rechargez la page frontend pour voir les changements:")
    print("   http://localhost:3000/products\n")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrompu")
    except Exception as e:
        print(f"\n\nErreur: {e}")
        import traceback
        traceback.print_exc()
