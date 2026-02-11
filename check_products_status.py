#!/usr/bin/env python
"""
Vérifier l'état des produits en base de données
"""
import requests
import json

BASE_URL = "http://localhost:8000"

# Authentification
login = requests.post(
    f"{BASE_URL}/api/auth/login/",
    json={"username": "admin", "password": "admin123"}
)
token = login.json()['access']
headers = {"Authorization": f"Bearer {token}"}

# Récupérer les produits
resp = requests.get(f"{BASE_URL}/api/products/", headers=headers)
products = resp.json()['results'] if resp.status_code == 200 else []

print("=" * 100)
print("ÉTAT DES PRODUITS EN BASE DE DONNÉES")
print("=" * 100)

# Séparer les produits avec et sans photo
with_photo = []
without_photo = []

for product in products:
    if product.get('photo') or product.get('photo_url'):
        with_photo.append(product)
    else:
        without_photo.append(product)

print(f"\n✓ Produits AVEC photo: {len(with_photo)}")
for p in with_photo[:5]:
    print(f"  ID: {p['id']:2d} | {p['name']:40s} | photo: {p.get('photo', 'None')[:30]}")

print(f"\n✗ Produits SANS photo: {len(without_photo)}")
for p in without_photo:
    print(f"  ID: {p['id']:2d} | {p['name']:40s}")
    if p['id']:
        # Essayer de trouver une image pour ce produit
        print(f"       → Chercher: product_{p['id']}_*.jpg/png")

print("\n" + "=" * 100)
print("RÉSUMÉ")
print("=" * 100)
print(f"Total: {len(products)} produits")
print(f"Avec photos: {len(with_photo)}")
print(f"Sans photos: {len(without_photo)}")

if len(without_photo) > 0:
    print("\nℹ  Les produits sans photo ne s'afficheront pas correctement.")
    print("   Solution: Attacher les photos manquantes ou créer les produits avec photos.")
