import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product

products = Product.objects.all()
print(f"Total de produits: {products.count()}")
print()

if products.exists():
    print("Liste des produits:")
    for p in products:
        photo_status = "Avec photo" if p.photo else "Sans photo"
        print(f"  - ID: {p.id} | {p.name} | {photo_status} | Photo: {p.photo}")
else:
    print("Aucun produit dans la base de données")
