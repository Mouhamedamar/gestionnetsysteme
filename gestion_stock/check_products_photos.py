import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product

# Écrire dans un fichier
output_file = "rapport_photos.txt"
f = open(output_file, 'w', encoding='utf-8')

def log(msg):
    print(msg)
    f.write(msg + '\n')

log("=" * 80)
log("ÉTAT DES PRODUITS ET LEURS PHOTOS")
log("=" * 80)
log("")

products = Product.objects.all()
log(f"Total de produits: {products.count()}")
log("")

for p in products:
    has_photo = "✅" if p.photo else "❌"
    photo_info = str(p.photo) if p.photo else "AUCUNE"
    log(f"{has_photo} ID:{p.id:3d} | {p.name:35s} | Photo: {photo_info}")
    
    # Si le produit a une photo, vérifier que le fichier existe
    if p.photo:
        try:
            full_path = p.photo.path
            if os.path.exists(full_path):
                size = os.path.getsize(full_path)
                log(f"       Fichier: ✅ Existe ({size:,} bytes)")
                log(f"       URL: {p.photo.url}")
            else:
                log(f"       Fichier: ❌ N'existe pas à {full_path}")
        except Exception as e:
            log(f"       Erreur: {e}")
    log("")

log("=" * 80)
log("FICHIERS DANS media/products/")
log("=" * 80)

from pathlib import Path
media_dir = Path(__file__).parent / 'media' / 'products'
if media_dir.exists():
    files = list(media_dir.glob("*"))
    log(f"\nFichiers trouvés: {len(files)}")
    for file in files:
        if file.is_file():
            size = file.stat().st_size
            log(f"  - {file.name} ({size:,} bytes)")
else:
    log("Le dossier n'existe pas")

log("")
log("=" * 80)
log("CONCLUSION")
log("=" * 80)

products_with_photo = Product.objects.exclude(photo='').exclude(photo__isnull=True).count()
products_without_photo = Product.objects.filter(photo='') | Product.objects.filter(photo__isnull=True)
products_without_photo = products_without_photo.count()

log(f"\n✅ Produits AVEC photo dans la DB: {products_with_photo}")
log(f"❌ Produits SANS photo dans la DB: {products_without_photo}")

if products_without_photo > 0 and media_dir.exists() and len(list(media_dir.glob("*"))) > 0:
    log("\n⚠️  PROBLÈME DÉTECTÉ:")
    log("   Des fichiers images existent mais ne sont pas liés aux produits!")
    log("\n💡 SOLUTION:")
    log("   Modifiez les produits via l'admin Django et associez-leur des images.")

f.close()
log(f"\nRapport généré: {output_file}")
