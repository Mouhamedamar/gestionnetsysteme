"""
Script pour supprimer toutes les photos des produits
"""
import os
import django
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product

print("=" * 80)
print("SUPPRESSION DES PHOTOS")
print("=" * 80)
print()

# 1. Compter les produits avec photos
products_with_photos = Product.objects.exclude(photo='').exclude(photo__isnull=True)
count = products_with_photos.count()

print(f"Produits avec photos trouvés: {count}")
print()

if count == 0:
    print("✅ Aucun produit n'a de photo dans la base de données.")
else:
    print("Liste des produits avec photos:")
    for p in products_with_photos:
        print(f"  - ID:{p.id} | {p.name} | Photo: {p.photo}")
    print()
    
    # Supprimer les références dans la DB
    print("🔄 Suppression des références de photos dans la base de données...")
    
    for product in products_with_photos:
        # Sauvegarder le chemin avant de supprimer
        photo_path = product.photo.path if product.photo else None
        
        # Supprimer la référence
        product.photo = None
        product.save()
        
        print(f"  ✅ Photo supprimée pour: {product.name}")
    
    print()
    print(f"✅ {count} référence(s) de photo supprimée(s) de la base de données")

print()

# 2. Supprimer les fichiers physiques
media_dir = Path(__file__).parent / 'media' / 'products'

if media_dir.exists():
    files = list(media_dir.glob("*"))
    if files:
        print("=" * 80)
        print("FICHIERS PHYSIQUES DANS media/products/")
        print("=" * 80)
        print()
        print(f"Fichiers trouvés: {len(files)}")
        for f in files:
            if f.is_file():
                size = f.stat().st_size
                print(f"  - {f.name} ({size:,} bytes)")
        
        print()
        response = input("Voulez-vous SUPPRIMER ces fichiers physiques ? (oui/non): ").lower()
        
        if response == 'oui':
            print()
            print("🔄 Suppression des fichiers physiques...")
            for f in files:
                if f.is_file():
                    f.unlink()
                    print(f"  ✅ Supprimé: {f.name}")
            print()
            print(f"✅ {len(files)} fichier(s) supprimé(s)")
        else:
            print()
            print("⏭️  Fichiers physiques conservés")
    else:
        print("ℹ️  Aucun fichier dans media/products/")
else:
    print("ℹ️  Le dossier media/products/ n'existe pas")

print()
print("=" * 80)
print("✅ TERMINÉ")
print("=" * 80)
print()
print("Tous les produits n'ont maintenant PLUS de photos dans la base de données.")
print("Vous pouvez repartir de zéro et ajouter de nouvelles images !")
print()
