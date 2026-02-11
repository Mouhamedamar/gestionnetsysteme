#!/usr/bin/env python3
import os
import sys
import django

# Ajouter le chemin du projet
sys.path.insert(0, r'C:\Users\Mouha\OneDrive\Bureau\gestions\gestion_stock')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product

print("=" * 80)
print("VÉRIFICATION DES CHAMPS PHOTO DANS LA BASE DE DONNÉES")
print("=" * 80)

products = Product.objects.all()[:10]

for p in products:
    print(f"\n📦 {p.name}")
    print(f"   ID: {p.id}")
    print(f"   photo: '{p.photo}'")
    print(f"   photo.name: '{p.photo.name if p.photo else 'None'}'")
    print(f"   photo.url: '{p.photo.url if p.photo else 'None'}'")

print("\n" + "=" * 80)
print(f"Total produits: {Product.objects.count()}")
print(f"Produits avec photo: {Product.objects.exclude(photo='').count()}")
print(f"Produits sans photo: {Product.objects.filter(photo='').count()}")
print("=" * 80)
