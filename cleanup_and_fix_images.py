"""
Script complet pour nettoyer et corriger les images de produits
1. Supprime les références aux images manquantes
2. Ajoute des images aux produits qui n'en ont pas
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
from django.conf import settings

# Palette de couleurs
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
    """Crée une image avec le nom du produit"""
    try:
        # Choisir une couleur
        color_hex = COLORS[color_index % len(COLORS)]
        color_hex = color_hex.lstrip('#')
        bg_color = tuple(int(color_hex[i:i+2], 16) for i in (0, 2, 4))
        
        # Créer l'image
        img = Image.new('RGB', (width, height), bg_color)
        draw = ImageDraw.Draw(img)
        
        # Ajouter un dégradé
        for y in range(height):
            darkness = int((y / height) * 50)
            dark_color = tuple(max(0, c - darkness) for c in bg_color)
            draw.rectangle([(0, y), (width, y+1)], fill=dark_color)
        
        # Ajouter le texte
        try:
            font_size = 40
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
        except:
            font = ImageFont.load_default()
        
        text = product_name[:30]
        
        try:
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
        except:
            text_width = len(text) * 10
            text_height = 20
        
        x = (width - text_width) // 2
        y = (height - text_height) // 2
        
        # Ombre
        draw.text((x+2, y+2), text, fill=(0, 0, 0, 128), font=font)
        # Texte
        draw.text((x, y), text, fill=(255, 255, 255), font=font)
        
        # Sauvegarder
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        buffer.seek(0)
        
        return buffer.getvalue()
    except Exception as e:
        print(f"  ❌ Erreur : {e}")
        return None

def cleanup_missing_images():
    """Nettoie les références aux images qui n'existent pas"""
    print("=" * 80)
    print("🧹 NETTOYAGE DES RÉFÉRENCES D'IMAGES MANQUANTES")
    print("=" * 80)
    print()
    
    media_root = Path(settings.MEDIA_ROOT)
    products_with_photo = Product.objects.exclude(photo='').exclude(photo__isnull=True)
    
    print(f"📊 Vérification de {products_with_photo.count()} produit(s) avec photo...")
    print()
    
    cleaned_count = 0
    
    for product in products_with_photo:
        photo_path = media_root / str(product.photo)
        
        if not photo_path.exists():
            print(f"❌ Fichier manquant pour '{product.name}'")
            print(f"   DB: {product.photo}")
            print(f"   Chemin: {photo_path}")
            print(f"   → Nettoyage de la référence...")
            
            product.photo = None
            product.save()
            cleaned_count += 1
            print(f"   ✅ Référence supprimée\n")
    
    if cleaned_count == 0:
        print("✅ Toutes les références d'images sont valides !")
    else:
        print(f"✅ {cleaned_count} référence(s) nettoyée(s)")
    
    print()
    return cleaned_count

def add_images_to_products():
    """Ajoute des images aux produits sans image"""
    print("=" * 80)
    print("🖼️  AJOUT D'IMAGES AUX PRODUITS")
    print("=" * 80)
    print()
    
    # Récupérer les produits sans image
    products_without_images = Product.objects.filter(
        deleted_at__isnull=True
    ).filter(
        photo__isnull=True
    ) | Product.objects.filter(
        deleted_at__isnull=True,
        photo=''
    )
    
    products_to_fix = products_without_images.distinct().count()
    
    print(f"📊 {products_to_fix} produit(s) sans image trouvé(s)")
    print()
    
    if products_to_fix == 0:
        print("✅ Tous les produits ont des images !")
        return 0
    
    success_count = 0
    
    for i, product in enumerate(products_without_images.distinct(), 1):
        print(f"[{i}/{products_to_fix}] {product.name}...")
        
        image_data = create_product_image(product.name, color_index=i)
        
        if image_data:
            try:
                # Nom de fichier sécurisé
                safe_name = ''.join(c if c.isalnum() or c in (' ', '_', '-') else '_' for c in product.name)
                safe_name = safe_name[:50]
                filename = f"product_{product.id}_{safe_name}.jpg"
                
                uploaded_file = SimpleUploadedFile(
                    filename,
                    image_data,
                    content_type='image/jpeg'
                )
                
                product.photo = uploaded_file
                product.save()
                
                print(f"  ✅ Image créée: {product.photo.name}\n")
                success_count += 1
            except Exception as e:
                print(f"  ❌ Erreur: {e}\n")
    
    print(f"✅ {success_count} image(s) ajoutée(s)")
    print()
    return success_count

def display_summary():
    """Affiche un résumé final"""
    print("=" * 80)
    print("📊 RÉSUMÉ FINAL")
    print("=" * 80)
    print()
    
    total = Product.objects.filter(deleted_at__isnull=True).count()
    with_photo = Product.objects.filter(deleted_at__isnull=True).exclude(photo='').exclude(photo__isnull=True).count()
    without_photo = total - with_photo
    
    print(f"Total de produits actifs : {total}")
    print(f"  ✅ Avec photo          : {with_photo}")
    print(f"  ❌ Sans photo          : {without_photo}")
    print()
    
    if without_photo == 0:
        print("🎉 Tous les produits ont maintenant des images !")
    
    # Afficher les produits avec images
    if with_photo > 0:
        print("📸 Produits avec images :")
        products = Product.objects.filter(deleted_at__isnull=True).exclude(photo='').exclude(photo__isnull=True)[:10]
        for p in products:
            print(f"  - {p.name}: /media/{p.photo.name}")
        if with_photo > 10:
            print(f"  ... et {with_photo - 10} autre(s)")
    
    print()

def main():
    print()
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 15 + "🔧 RÉPARATION DES IMAGES DE PRODUITS" + " " * 27 + "║")
    print("╚" + "=" * 78 + "╝")
    print()
    
    try:
        # Étape 1: Nettoyage
        cleaned = cleanup_missing_images()
        
        # Étape 2: Ajout d'images
        added = add_images_to_products()
        
        # Étape 3: Résumé
        display_summary()
        
        print("=" * 80)
        print("✅ TRAITEMENT TERMINÉ AVEC SUCCÈS")
        print("=" * 80)
        print()
        print(f"📈 Résultats :")
        print(f"  - {cleaned} référence(s) nettoyée(s)")
        print(f"  - {added} image(s) ajoutée(s)")
        print()
        print("🔄 Prochaines étapes :")
        print("  1. Démarrez le serveur Django : cd gestion_stock && python manage.py runserver")
        print("  2. Démarrez le frontend : cd frontend && npm run dev")
        print("  3. Ouvrez http://localhost:3000/products")
        print("  4. Les images devraient maintenant s'afficher ! 🎉")
        print()
        
    except Exception as e:
        print(f"\n❌ Erreur fatale : {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Script interrompu")
