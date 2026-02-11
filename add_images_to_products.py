#!/usr/bin/env python3
"""
Script pour ajouter des images de test à tous les produits
"""
import os
import django
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product

def create_placeholder_image(product_name, color=(100, 150, 200)):
    """Crée une image placeholder pour un produit"""
    # Créer une image simple
    img = Image.new('RGB', (400, 300), color=color)
    draw = ImageDraw.Draw(img)
    
    # Ajouter du texte
    try:
        # Essayer d'utiliser une police système
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        # Utiliser la police par défaut si arial n'existe pas
        font = ImageFont.load_default()
    
    # Écrire le nom du produit
    text = product_name[:20]  # Limiter à 20 caractères
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (400 - text_width) // 2
    y = (300 - text_height) // 2
    draw.text((x, y), text, fill=(255, 255, 255), font=font)
    
    return img

def add_images_to_products():
    """Ajoute des images de test à tous les produits"""
    products = Product.objects.filter(photo='')
    
    colors = [
        (220, 80, 80),   # Rouge
        (80, 220, 80),   # Vert
        (80, 80, 220),   # Bleu
        (220, 220, 80),  # Jaune
        (220, 80, 220),  # Magenta
        (80, 220, 220),  # Cyan
        (200, 100, 50),  # Orange
        (150, 100, 150), # Violet
    ]
    
    for idx, product in enumerate(products):
        try:
            # Créer une image placeholder
            color = colors[idx % len(colors)]
            img = create_placeholder_image(product.name, color)
            
            # Sauvegarder l'image
            filename = f"product_{product.id}_{product.name.lower().replace(' ', '_')}.png"
            filepath = f"media/products/{filename}"
            
            # Créer le répertoire s'il n'existe pas
            os.makedirs("media/products", exist_ok=True)
            
            # Sauvegarder l'image
            img.save(filepath)
            
            # Mettre à jour le produit
            product.photo = f"products/{filename}"
            product.save()
            
            print(f"✓ Image ajoutée pour: {product.name} → {filepath}")
        except Exception as e:
            print(f"✗ Erreur pour {product.name}: {str(e)}")

if __name__ == '__main__':
    print("Ajout des images aux produits...")
    add_images_to_products()
    print("Terminé !")
