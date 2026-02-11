#!/usr/bin/env python3
"""
Script simple pour corriger uniquement les images des produits
"""
import os
import sys
import django

# Configuration Django
sys.path.append('gestion_stock')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product

def main():
    print("🖼️  CORRECTION DES IMAGES DES PRODUITS")
    print("=" * 50)
    
    # Récupérer tous les produits
    products = Product.objects.filter(deleted_at__isnull=True)
    print(f"📦 Produits trouvés: {products.count()}")
    
    # Associer les images aux produits
    image_mappings = {
        'Écran Dell 24" Full HD': 'products/product_8_Écran_24_.jpg',
        'Routeur WiFi TP-Link AC1200': 'products/product_1_wifi.jpg',
        'Tableau blanc magnétique 120x90': 'products/product_6_tableau.jpg',
        'Clavier mécanique Logitech': 'products/product_2_Produit_Test.jpg',
        'Souris optique sans fil': 'products/product_3_Test_Product.jpg',
        'Imprimante laser HP LaserJet': 'products/product_4_Test_Product_2.jpg',
        'Webcam HD 1080p': 'products/product_5_Test_Product_with_Photo.jpg',
        'Disque dur externe 1TB': 'products/product_9_wifi.jpg',
        'Casque audio Bluetooth': 'products/product_10_Mouhamadou_Mbacké_Amar.jpg',
        'Chargeur USB-C 65W': 'products/product_11_amar.jpg'
    }
    
    fixed_count = 0
    for product in products:
        if product.name in image_mappings:
            product.photo = image_mappings[product.name]
            product.save()
            print(f"✅ {product.name} -> {product.photo}")
            fixed_count += 1
        else:
            print(f"⚠️  Pas d'image pour: {product.name}")
    
    print(f"\n🎉 {fixed_count} produits mis à jour avec des images!")
    
    # Vérification finale
    print("\n📋 VÉRIFICATION FINALE:")
    for product in products:
        status = "✅" if product.photo else "❌"
        print(f"{status} {product.name} - {product.photo or 'AUCUNE IMAGE'}")
    
    print("\n✅ CORRECTION TERMINÉE!")
    print("🔄 Redémarrez le serveur Django et rafraîchissez votre navigateur")

if __name__ == "__main__":
    main()