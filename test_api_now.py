import requests
import json

# Test l'API actuelle
response = requests.get('http://localhost:8000/api/products/')

if response.status_code == 200:
    products = response.json()
    # Afficher les 3 premiers produits avec photos
    for product in products[:3]:
        print(f"\nProduit: {product.get('name')}")
        print(f"  photo_url: {product.get('photo_url')}")
        print(f"  photo: {product.get('photo')}")
else:
    print(f"Erreur: {response.status_code}")
    print(response.text)
