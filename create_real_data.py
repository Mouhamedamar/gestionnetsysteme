#!/usr/bin/env python3
"""
Script pour créer de vraies données dans l'application de gestion de stock
"""
import os
import sys
import django
from decimal import Decimal

# Configuration Django
sys.path.append('gestion_stock')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product
from django.contrib.auth.models import User
from stock.models import StockMovement
from accounts.models import Client
from invoices.models import Invoice, InvoiceItem

def create_admin_user():
    """Crée un utilisateur admin si nécessaire"""
    print("👤 CRÉATION UTILISATEUR ADMIN")
    print("=" * 40)
    
    if not User.objects.filter(username='admin').exists():
        admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='admin123',
            is_staff=True,
            is_superuser=True
        )
        print("✅ Utilisateur admin créé (admin/admin123)")
    else:
        print("⚠️  Utilisateur admin existe déjà")

def create_products():
    """Crée des produits réalistes"""
    print("\n📦 CRÉATION DES PRODUITS")
    print("=" * 40)
    
    # Supprimer les anciens produits
    Product.objects.all().delete()
    
    products_data = [
        {
            'name': 'Écran Dell 24" Full HD',
            'description': 'Moniteur LED 24 pouces, résolution 1920x1080, connecteurs HDMI/VGA',
            'category': 'Informatique',
            'quantity': 15,
            'purchase_price': Decimal('120.00'),
            'sale_price': Decimal('180.00'),
            'alert_threshold': 5,
            'photo': 'products/product_8_Écran_24_.jpg'
        },
        {
            'name': 'Routeur WiFi TP-Link AC1200',
            'description': 'Routeur sans fil dual band, 4 ports Ethernet, vitesse jusqu\'à 1200 Mbps',
            'category': 'Réseau',
            'quantity': 8,
            'purchase_price': Decimal('45.00'),
            'sale_price': Decimal('75.00'),
            'alert_threshold': 3,
            'photo': 'products/product_1_wifi.jpg'
        },
        {
            'name': 'Tableau blanc magnétique 120x90',
            'description': 'Tableau blanc effaçable à sec, surface magnétique, cadre aluminium',
            'category': 'Bureau',
            'quantity': 12,
            'purchase_price': Decimal('35.00'),
            'sale_price': Decimal('55.00'),
            'alert_threshold': 2,
            'photo': 'products/product_6_tableau.jpg'
        },
        {
            'name': 'Clavier mécanique Logitech',
            'description': 'Clavier gaming mécanique avec rétroéclairage RGB, switches tactiles',
            'category': 'Informatique',
            'quantity': 20,
            'purchase_price': Decimal('60.00'),
            'sale_price': Decimal('95.00'),
            'alert_threshold': 5,
            'photo': 'products/product_2_Produit_Test.jpg'
        },
        {
            'name': 'Souris optique sans fil',
            'description': 'Souris ergonomique sans fil, 3 boutons, récepteur USB nano',
            'category': 'Informatique',
            'quantity': 25,
            'purchase_price': Decimal('15.00'),
            'sale_price': Decimal('28.00'),
            'alert_threshold': 8,
            'photo': 'products/product_3_Test_Product.jpg'
        },
        {
            'name': 'Imprimante laser HP LaserJet',
            'description': 'Imprimante laser monochrome, 20 ppm, connectivité USB/WiFi',
            'category': 'Informatique',
            'quantity': 6,
            'purchase_price': Decimal('150.00'),
            'sale_price': Decimal('220.00'),
            'alert_threshold': 2,
            'photo': 'products/product_4_Test_Product_2.jpg'
        },
        {
            'name': 'Webcam HD 1080p',
            'description': 'Caméra web Full HD avec microphone intégré, compatible Windows/Mac',
            'category': 'Informatique',
            'quantity': 18,
            'purchase_price': Decimal('25.00'),
            'sale_price': Decimal('45.00'),
            'alert_threshold': 5,
            'photo': 'products/product_5_Test_Product_with_Photo.jpg'
        },
        {
            'name': 'Disque dur externe 1TB',
            'description': 'Disque dur portable USB 3.0, capacité 1 To, compatible PC/Mac',
            'category': 'Stockage',
            'quantity': 14,
            'purchase_price': Decimal('55.00'),
            'sale_price': Decimal('85.00'),
            'alert_threshold': 4,
            'photo': 'products/product_9_wifi.jpg'
        },
        {
            'name': 'Casque audio Bluetooth',
            'description': 'Casque sans fil avec réduction de bruit, autonomie 30h',
            'category': 'Audio',
            'quantity': 10,
            'purchase_price': Decimal('40.00'),
            'sale_price': Decimal('70.00'),
            'alert_threshold': 3,
            'photo': 'products/product_10_Mouhamadou_Mbacké_Amar.jpg'
        },
        {
            'name': 'Chargeur USB-C 65W',
            'description': 'Adaptateur secteur USB-C Power Delivery 65W, compatible laptops',
            'category': 'Accessoires',
            'quantity': 22,
            'purchase_price': Decimal('20.00'),
            'sale_price': Decimal('35.00'),
            'alert_threshold': 6,
            'photo': 'products/product_11_amar.jpg'
        }
    ]
    
    created_products = []
    for product_data in products_data:
        product = Product.objects.create(**product_data)
        created_products.append(product)
        print(f"✅ {product.name} - Stock: {product.quantity} - Prix: {product.sale_price}€")
    
    print(f"\n🎉 {len(created_products)} produits créés!")
    return created_products

def create_clients():
    """Crée des clients réalistes"""
    print("\n👥 CRÉATION DES CLIENTS")
    print("=" * 40)
    
    # Supprimer les anciens clients
    Client.objects.all().delete()
    
    clients_data = [
        {
            'name': 'Entreprise TechSolutions SARL',
            'email': 'contact@techsolutions.sn',
            'phone': '+221 33 123 45 67',
            'address': '15 Avenue Bourguiba, Dakar, Sénégal'
        },
        {
            'name': 'Cabinet Médical Dr. Diop',
            'email': 'cabinet.diop@gmail.com',
            'phone': '+221 77 234 56 78',
            'address': 'Rue 10 x Rue 15, Médina, Dakar'
        },
        {
            'name': 'École Primaire Almadies',
            'email': 'direction@ecole-almadies.edu.sn',
            'phone': '+221 33 345 67 89',
            'address': 'Cité Almadies, Ngor, Dakar'
        },
        {
            'name': 'Restaurant Le Baobab',
            'email': 'info@restaurant-baobab.sn',
            'phone': '+221 70 456 78 90',
            'address': 'Corniche Ouest, Fann, Dakar'
        },
        {
            'name': 'Boutique Informatique Ndèye',
            'email': 'ndeye.info@gmail.com',
            'phone': '+221 76 567 89 01',
            'address': 'Marché Sandaga, Plateau, Dakar'
        }
    ]
    
    created_clients = []
    for client_data in clients_data:
        client = Client.objects.create(**client_data)
        created_clients.append(client)
        print(f"✅ {client.name} - {client.email}")
    
    print(f"\n🎉 {len(created_clients)} clients créés!")
    return created_clients

def create_stock_movements(products):
    """Crée des mouvements de stock réalistes"""
    print("\n📊 CRÉATION DES MOUVEMENTS DE STOCK")
    print("=" * 40)
    
    # Supprimer les anciens mouvements
    StockMovement.objects.all().delete()
    
    import random
    from datetime import datetime, timedelta
    
    movements_created = 0
    
    for product in products:
        # Entrées de stock (approvisionnement)
        for _ in range(random.randint(2, 4)):
            quantity = random.randint(5, 15)
            date = datetime.now() - timedelta(days=random.randint(1, 30))
            
            StockMovement.objects.create(
                product=product,
                movement_type='ENTREE',
                quantity=quantity,
                comment='Approvisionnement fournisseur',
                date=date
            )
            movements_created += 1
        
        # Sorties de stock (ventes)
        for _ in range(random.randint(1, 3)):
            quantity = random.randint(1, 5)
            date = datetime.now() - timedelta(days=random.randint(1, 15))
            
            StockMovement.objects.create(
                product=product,
                movement_type='SORTIE',
                quantity=quantity,
                comment='Vente client',
                date=date
            )
            movements_created += 1
    
    print(f"✅ {movements_created} mouvements de stock créés!")

def create_invoices(clients, products):
    """Crée des factures réalistes"""
    print("\n🧾 CRÉATION DES FACTURES")
    print("=" * 40)
    
    # Supprimer les anciennes factures
    Invoice.objects.all().delete()
    
    import random
    from datetime import datetime, timedelta
    
    invoices_created = 0
    
    for client in clients:
        # Créer 2-3 factures par client
        for i in range(random.randint(2, 3)):
            invoice_date = datetime.now() - timedelta(days=random.randint(1, 60))
            
            invoice = Invoice.objects.create(
                client=client,
                date=invoice_date,
                status=random.choice(['PAYE', 'NON_PAYE'])
            )
            
            # Ajouter 2-4 articles par facture
            for _ in range(random.randint(2, 4)):
                product = random.choice(products)
                quantity = random.randint(1, 3)
                unit_price = product.sale_price
                
                InvoiceItem.objects.create(
                    invoice=invoice,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price
                )
            
            # Les totaux sont calculés automatiquement
            invoice.calculate_totals()
            
            invoices_created += 1
            print(f"✅ Facture #{invoice.invoice_number} - {client.name} - {invoice.total_ttc}€")
    
    print(f"\n🎉 {invoices_created} factures créées!")

def main():
    """Fonction principale"""
    print("🚀 CRÉATION DE VRAIES DONNÉES - GESTION DE STOCK")
    print("=" * 60)
    
    try:
        # 1. Créer utilisateur admin
        create_admin_user()
        
        # 2. Créer les produits avec images
        products = create_products()
        
        # 3. Créer les clients
        clients = create_clients()
        
        # 4. Créer les mouvements de stock
        create_stock_movements(products)
        
        # 5. Créer les factures
        create_invoices(clients, products)
        
        print("\n✅ TOUTES LES DONNÉES ONT ÉTÉ CRÉÉES!")
        print("\n📋 RÉSUMÉ:")
        print(f"   👤 Utilisateurs: {User.objects.count()}")
        print(f"   📦 Produits: {Product.objects.count()}")
        print(f"   👥 Clients: {Client.objects.count()}")
        print(f"   📊 Mouvements: {StockMovement.objects.count()}")
        print(f"   🧾 Factures: {Invoice.objects.count()}")
        
        print("\n🔐 CONNEXION:")
        print("   Username: admin")
        print("   Password: admin123")
        
        print("\n🔄 Redémarrez le serveur et rafraîchissez votre navigateur!")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()