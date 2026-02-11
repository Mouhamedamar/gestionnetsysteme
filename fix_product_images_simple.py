"""
Script simple pour ajouter des images de couleur unie aux produits
Ne nécessite pas de connexion Internet
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

# Palette de couleurs pour les produits
COLORS = [
    '#8b5cf6',  # Violet
    '#3b82f6',  # Bleu
    '#10b981',  # Vert
    '#f59e0b',  # Orange
    '#ef4444',  # Rouge
    '#ec4899',  # Rose
    '#6366f1',  # Indigo
    '#14b8a6',  # Teal
]

def create_product_image(product_name, width=400, height=400, color_index=0):
    """
    Crée une image avec le nom du produit
    """
    try:
        # Choisir une couleur
        color_hex = COLORS[color_index % len(COLORS)]
        color_hex = color_hex.lstrip('#')
        bg_color = tuple(int(color_hex[i:i+2], 16) for i in (0, 2, 4))
        
        # Créer l'image
        img = Image.new('RGB', (width, height), bg_color)
        draw = ImageDraw.Draw(img)
        
        # Ajouter un dégradé simple (assombrir le bas)
        for y in range(height):
            darkness = int((y / height) * 50)
            dark_color = tuple(max(0, c - darkness) for c in bg_color)
            draw.rectangle([(0, y), (width, y+1)], fill=dark_color)
        
        # Ajouter le texte du nom du produit
        try:
            # Essayer d'utiliser une police système
            font_size = 40
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except:
                # Fallback sur la police par défaut
                font = ImageFont.load_default()
        except:
            font = ImageFont.load_default()
        
        # Limiter le texte pour qu'il rentre
        text = product_name[:30]
        
        # Calculer la position du texte (centré)
        try:
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
        except:
            # Fallback pour les anciennes versions de Pillow
            text_width = len(text) * 10
            text_height = 20
        
        x = (width - text_width) // 2
        y = (height - text_height) // 2
        
        # Ajouter une ombre au texte
        draw.text((x+2, y+2), text, fill=(0, 0, 0, 128), font=font)
        # Texte principal en blanc
        draw.text((x, y), text, fill=(255, 255, 255), font=font)
        
        # Sauvegarder dans un buffer
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        buffer.seek(0)
        
        return buffer.getvalue()
    except Exception as e:
        print(f"  ❌ Erreur lors de la création de l'image : {e}")
        return None

def main():
    print("=" * 80)
    print("🖼️  AJOUT D'IMAGES AUX PRODUITS (VERSION SIMPLE)")
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
    products_to_fix = products_without_images.distinct().count()
    
    print(f"📊 Statistiques :")
    print(f"   Total de produits actifs : {total_products}")
    print(f"   Produits sans image      : {products_to_fix}")
    print()
    
    if products_to_fix == 0:
        print("✅ Tous les produits ont déjà des images !")
        
        # Afficher les produits avec images
        products_with_images = Product.objects.filter(deleted_at__isnull=True).exclude(photo='').exclude(photo__isnull=True)
        print(f"\n📸 Produits avec images ({products_with_images.count()}) :")
        for p in products_with_images[:5]:
            print(f"   - {p.name}: {p.photo.name}")
        return
    
    print(f"🔧 Ajout d'images à {products_to_fix} produit(s)...")
    print()
    
    success_count = 0
    error_count = 0
    
    for i, product in enumerate(products_without_images.distinct(), 1):
        print(f"[{i}/{products_to_fix}] {product.name}...")
        
        # Créer une image avec le nom du produit
        image_data = create_product_image(product.name, color_index=i)
        
        if image_data:
            try:
                # Créer un nom de fichier unique et sûr
                safe_name = ''.join(c if c.isalnum() or c in (' ', '_', '-') else '_' for c in product.name)
                safe_name = safe_name[:50]  # Limiter la longueur
                filename = f"product_{product.id}_{safe_name}.jpg"
                
                # Créer un fichier uploadé
                uploaded_file = SimpleUploadedFile(
                    filename,
                    image_data,
                    content_type='image/jpeg'
                )
                
                # Assigner l'image au produit
                product.photo = uploaded_file
                product.save()
                
                print(f"  ✅ Image ajoutée : {product.photo.name}")
                print(f"     URL: /media/{product.photo.name}")
                success_count += 1
            except Exception as e:
                print(f"  ❌ Erreur lors de la sauvegarde : {e}")
                import traceback
                traceback.print_exc()
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
        print("📁 Les images ont été sauvegardées dans : gestion_stock/media/products/")
        print()
        print("🔄 Pour voir les images dans le frontend :")
        print("   1. Assurez-vous que le serveur Django tourne (python manage.py runserver)")
        print("   2. Rechargez la page frontend (http://localhost:3000/products)")
        print("   3. Vérifiez la console du navigateur pour les éventuelles erreurs")
        print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Script interrompu par l'utilisateur")
    except Exception as e:
        print(f"\n\n❌ Erreur fatale : {e}")
        import traceback
        traceback.print_exc()
