"""
Script pour supprimer TOUS les produits de la base de données
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product

print("=" * 80)
print("SUPPRESSION DE TOUS LES PRODUITS")
print("=" * 80)
print()

# Compter les produits
count = Product.objects.all().count()

if count == 0:
    print("✅ La base de données est déjà vide.")
else:
    print(f"Produits trouvés: {count}")
    print()
    print("Liste des produits qui vont être supprimés:")
    for p in Product.objects.all():
        print(f"  - ID:{p.id} | {p.name}")
    
    print()
    print("🔄 Suppression en cours...")
    
    # Supprimer TOUS les produits
    Product.objects.all().delete()
    
    print()
    print(f"✅ {count} produit(s) supprimé(s)")

print()
print("=" * 80)
print("✅ BASE DE DONNÉES VIDE")
print("=" * 80)
print()
print("Vous pouvez maintenant créer de nouveaux produits !")
print()
