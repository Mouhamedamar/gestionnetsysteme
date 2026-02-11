import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product
from invoices.models import Invoice
from stock.models import StockMovement

# Supprimer tous les produits
products_count = Product.objects.count()
Product.objects.all().delete()
print(f"✅ {products_count} produits supprimés")

# Supprimer toutes les factures
invoices_count = Invoice.objects.count()
Invoice.objects.all().delete()
print(f"✅ {invoices_count} factures supprimées")

# Supprimer tous les mouvements de stock
movements_count = StockMovement.objects.count()
StockMovement.objects.all().delete()
print(f"✅ {movements_count} mouvements de stock supprimés")

print("\n✅ Base de données nettoyée avec succès !")
