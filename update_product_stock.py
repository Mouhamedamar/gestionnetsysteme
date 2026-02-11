"""
Script pour mettre à jour le stock des produits
"""

import os
import sys
import django
from pathlib import Path
import random

# Configuration Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR / 'gestion_stock'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product

def update_product_stock():
    """Ajoute du stock aux produits"""
    print("\n" + "=" * 80)
    print("MISE A JOUR DU STOCK DES PRODUITS")
    print("=" * 80 + "\n")
    
    products = Product.objects.filter(deleted_at__isnull=True, is_active=True)
    
    if products.count() == 0:
        print("Aucun produit trouve!\n")
        return
    
    print(f"Produits a mettre a jour: {products.count()}\n")
    
    updated_count = 0
    
    for product in products:
        old_qty = product.quantity
        
        # Ajouter entre 50 et 200 unités
        new_qty = random.randint(50, 200)
        product.quantity = new_qty
        product.save()
        
        print(f"  {product.name}:")
        print(f"    Ancien stock: {old_qty}")
        print(f"    Nouveau stock: {new_qty}")
        print()
        
        updated_count += 1
    
    print("=" * 80)
    print(f"Stock mis a jour pour {updated_count} produit(s)")
    print("=" * 80 + "\n")
    
    print("Vous pouvez maintenant:")
    print("  1. Relancer create_sample_invoices.py pour creer plus de factures")
    print("  2. Creer des factures via l'interface web\n")

if __name__ == '__main__':
    try:
        update_product_stock()
    except Exception as e:
        print(f"\nERREUR: {e}")
        import traceback
        traceback.print_exc()
