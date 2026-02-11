#!/usr/bin/env python
"""
Vérifier la réponse complète de l'API produits
"""
import requests
import json

BASE_URL = "http://localhost:8000"

# Authentification
login = requests.post(
    f"{BASE_URL}/api/auth/login/",
    json={"username": "admin", "password": "admin123"}
)

if login.status_code != 200:
    print("Erreur authentification")
    exit(1)

token = login.json()['access']
headers = {"Authorization": f"Bearer {token}"}

# Récupérer les produits
resp = requests.get(f"{BASE_URL}/api/products/", headers=headers)

if resp.status_code == 200:
    data = resp.json()
    products = data.get('results', data)
    
    # Afficher les 3 premiers produits avec leurs champs
    print("=" * 100)
    print("PREMIER PRODUIT AVEC PHOTO")
    print("=" * 100)
    
    for product in products[:5]:
        if product.get('photo_url') or product.get('photo'):
            print(f"\nProduit: {product['name']}")
            print(f"ID: {product['id']}")
            print(json.dumps(product, indent=2, default=str))
            break
else:
    print(f"Erreur API: {resp.status_code}")
