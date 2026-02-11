#!/usr/bin/env python
"""
Script pour attacher les photos orphelines aux produits
À exécuter avec: python manage.py shell < attach_photos_shell.py
"""
import os
from pathlib import Path
from django.conf import settings
from products.models import Product

MEDIA_ROOT = Path(settings.MEDIA_ROOT)
products_dir = MEDIA_ROOT / "products"

print("=" * 60)
print("RÉPARATION - ATTACHER LES PHOTOS AUX PRODUITS")
print("=" * 60)

# 1. Lister tous les fichiers image
image_files = list(products_dir.glob("*.jpg")) + list(products_dir.glob("*.png"))
print(f"\n✓ Trouvé {len(image_files)} fichiers images")

# 2. Lister tous les produits sans photo
products_without_photo = list(Product.objects.filter(photo__isnull=True)) + list(Product.objects.filter(photo=""))
print(f"✓ Trouvé {len(products_without_photo)} produits sans photo")

# 3. Essayer de matcher les images aux produits
for product in products_without_photo:
    print(f"\n  Produit: {product.name} (ID: {product.id})")
    
    # Chercher une image correspondante
    # Pattern: product_<id>_*.jpg ou product_<id>_*.png
    matching_images = []
    for img in image_files:
        if img.name.startswith(f"product_{product.id}_"):
            matching_images.append(img)
    
    if matching_images:
        # Utiliser la première image trouvée
        img = matching_images[0]
        relative_path = img.relative_to(MEDIA_ROOT)
        product.photo = str(relative_path)
        product.save()
        print(f"    ✓ Photo attachée: {img.name}")
    else:
        print(f"    ✗ Aucune image trouvée")

# 4. Afficher le résumé
print("\n" + "=" * 60)
updated_products = Product.objects.exclude(photo__isnull=True).exclude(photo="")
print(f"✓ Total produits avec photo: {updated_products.count()}")
print("=" * 60)
