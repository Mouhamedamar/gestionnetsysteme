import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product

# Écrire dans un fichier
output_file = "products_report.txt"

with open(output_file, 'w', encoding='utf-8') as f:
    products = Product.objects.all()
    f.write(f"Total de produits: {products.count()}\n")
    f.write("\n")
    
    if products.exists():
        f.write("Liste des produits:\n")
        f.write("-" * 80 + "\n")
        for p in products:
            photo_status = "Avec photo" if p.photo else "Sans photo"
            f.write(f"ID: {p.id:3d} | {p.name:30s} | {photo_status:15s} | Photo: {p.photo}\n")
    else:
        f.write("Aucun produit dans la base de données\n")

print(f"Rapport généré: {output_file}")
