"""
Script pour créer des factures de test avec des données réalistes
"""

import os
import sys
import django
from pathlib import Path
from decimal import Decimal
from datetime import datetime, timedelta
import random

# Configuration Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR / 'gestion_stock'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from invoices.models import Invoice, InvoiceItem
from products.models import Product
from accounts.models import Client
from django.utils import timezone

# Noms de clients fictifs
SAMPLE_CLIENTS = [
    "Jean Dupont",
    "Marie Martin",
    "Ahmed Diallo",
    "Fatou Sall",
    "Pierre Durand",
    "Aminata Ba",
    "Moussa Ndiaye",
    "Sophie Bernard",
    "Ibrahima Fall",
    "Aissatou Sy"
]

def create_sample_invoices(count=10):
    """Crée des factures de test"""
    print("\n" + "=" * 80)
    print("CREATION DE FACTURES DE TEST")
    print("=" * 80 + "\n")
    
    # Vérifier qu'il y a des produits
    products = Product.objects.filter(deleted_at__isnull=True, is_active=True)
    if products.count() == 0:
        print("ERREUR: Aucun produit actif trouve!")
        print("Veuillez d'abord creer des produits.\n")
        return
    
    print(f"Produits disponibles: {products.count()}")
    print(f"Factures a creer: {count}\n")
    
    created_count = 0
    error_count = 0
    
    for i in range(count):
        try:
            # Choisir un client aléatoire
            client_name = random.choice(SAMPLE_CLIENTS)
            
            # Créer une date dans les 30 derniers jours
            days_ago = random.randint(0, 30)
            invoice_date = timezone.now() - timedelta(days=days_ago)
            
            # Statut aléatoire (70% payé, 30% non payé)
            status = 'PAYE' if random.random() < 0.7 else 'NON_PAYE'
            
            # Créer la facture
            invoice = Invoice.objects.create(
                client_name=client_name,
                status=status,
                date=invoice_date
            )
            
            print(f"[{i+1}/{count}] Facture {invoice.invoice_number}")
            print(f"  Client: {client_name}")
            print(f"  Date: {invoice_date.strftime('%d/%m/%Y')}")
            print(f"  Statut: {status}")
            
            # Ajouter 1 à 5 produits aléatoires
            num_items = random.randint(1, min(5, products.count()))
            selected_products = random.sample(list(products), num_items)
            
            items_created = 0
            for product in selected_products:
                # Quantité aléatoire (1 à 5)
                max_qty = min(5, product.quantity)
                if max_qty == 0:
                    continue
                    
                quantity = random.randint(1, max_qty)
                
                # Prix = prix de vente du produit
                unit_price = product.sale_price
                
                # Créer l'item
                item = InvoiceItem.objects.create(
                    invoice=invoice,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price
                )
                
                # Déduire du stock
                product.quantity -= quantity
                product.save()
                
                print(f"    + {product.name}: {quantity} x {unit_price} FCFA = {item.subtotal} FCFA")
                items_created += 1
            
            # Recalculer les totaux
            invoice.calculate_totals()
            
            print(f"  Total HT: {invoice.total_ht} FCFA")
            print(f"  Total TTC: {invoice.total_ttc} FCFA")
            print(f"  Items: {items_created}")
            print()
            
            created_count += 1
            
        except Exception as e:
            print(f"  ERREUR: {e}\n")
            error_count += 1
    
    print("=" * 80)
    print("RESUME")
    print("=" * 80 + "\n")
    
    print(f"Factures creees: {created_count}")
    print(f"Erreurs: {error_count}\n")
    
    # Statistiques
    all_invoices = Invoice.objects.filter(deleted_at__isnull=True, is_cancelled=False)
    paid = all_invoices.filter(status='PAYE').count()
    unpaid = all_invoices.filter(status='NON_PAYE').count()
    total_revenue = sum(inv.total_ttc for inv in all_invoices.filter(status='PAYE'))
    
    print("STATISTIQUES GLOBALES:")
    print(f"  Total factures: {all_invoices.count()}")
    print(f"  Payees: {paid}")
    print(f"  Non payees: {unpaid}")
    print(f"  Chiffre d'affaires: {total_revenue} FCFA\n")
    
    if created_count > 0:
        print("PROCHAINES ETAPES:")
        print("  1. Demarrez le frontend: cd frontend && npm run dev")
        print("  2. Ouvrez http://localhost:3000/invoices")
        print("  3. Les factures devraient s'afficher!\n")

def main():
    print("\n" + "╔" + "=" * 78 + "╗")
    print("║" + " " * 20 + "GENERATION DE FACTURES DE TEST" + " " * 29 + "║")
    print("╚" + "=" * 78 + "╝")
    
    try:
        # Demander le nombre de factures à créer
        print("\nCombien de factures voulez-vous creer? (par defaut: 10)")
        print("Tapez un nombre ou appuyez sur Entree pour 10 factures:\n")
        
        # Utiliser 10 par défaut pour éviter l'input interactif
        count = 10
        
        create_sample_invoices(count)
        
        print("=" * 80)
        print("TERMINE!")
        print("=" * 80 + "\n")
        
    except Exception as e:
        print(f"\n\nERREUR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrompu")
