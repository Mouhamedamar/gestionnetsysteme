"""
Script pour supprimer TOUTES les photos (DB + fichiers)
"""
import os
import django
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product

output = []

def log(msg):
    print(msg)
    output.append(msg)

log("=" * 80)
log("SUPPRESSION COMPLÈTE DES PHOTOS")
log("=" * 80)
log("")

# 1. Supprimer les références dans la DB
products = Product.objects.all()
photos_count = 0

for product in products:
    if product.photo:
        photos_count += 1
        product.photo = None
        product.save()
        log(f"✅ Photo supprimée pour: {product.name}")

log("")
log(f"Total références supprimées: {photos_count}")
log("")

# 2. Supprimer les fichiers physiques
media_dir = Path(__file__).parent / 'media' / 'products'
files_deleted = 0

if media_dir.exists():
    files = list(media_dir.glob("*"))
    for f in files:
        if f.is_file():
            try:
                f.unlink()
                files_deleted += 1
                log(f"✅ Fichier supprimé: {f.name}")
            except Exception as e:
                log(f"❌ Erreur: {f.name} - {e}")

log("")
log(f"Total fichiers supprimés: {files_deleted}")
log("")
log("=" * 80)
log("✅ SUPPRESSION TERMINÉE")
log("=" * 80)

# Sauvegarder dans un fichier
with open("resultat_suppression.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(output))
    
print("\nRésultat sauvegardé dans: resultat_suppression.txt")
