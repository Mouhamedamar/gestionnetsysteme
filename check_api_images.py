#!/usr/bin/env python3
import requests
import json
import sys

BASE_URL = "http://localhost:8000"

try:
    print("1. Tentative d'authentification...")
    # Récupérer le token
    auth_response = requests.post(
        f"{BASE_URL}/api/auth/token/",
        json={"username": "admin", "password": "admin"},
        timeout=5
    )
    
    print(f"   Status: {auth_response.status_code}")
    
    if auth_response.status_code != 200:
        print("   Erreur d'authentification:")
        print(f"   {auth_response.text}")
        sys.exit(1)

    token = auth_response.json()['access']
    print(f"   ✓ Token reçu: {token[:20]}...")

    print("\n2. Récupération des produits...")
    # Récupérer les produits
    headers = {"Authorization": f"Bearer {token}"}
    products_response = requests.get(f"{BASE_URL}/api/products/", headers=headers, timeout=5)

    print(f"   Status: {products_response.status_code}")
    
    if products_response.status_code == 200:
        products = products_response.json()
        print(f"   ✓ {len(products)} produits reçus")
        print("\n" + "=" * 80)
        print("VÉRIFICATION DES URLs D'IMAGES")
        print("=" * 80)
        
        for product in products[:5]:  # Afficher les 5 premiers
            print(f"\n📦 Produit: {product.get('name')}")
            print(f"   ID: {product.get('id')}")
            print(f"   photo: {product.get('photo')}")
            print(f"   photo_url: {product.get('photo_url')}")
            
            # Tester si l'URL existe
            if product.get('photo_url'):
                try:
                    test_response = requests.head(product['photo_url'], timeout=2)
                    status = "✓ OK" if test_response.status_code == 200 else f"✗ {test_response.status_code}"
                    print(f"   Test accès: {status}")
                except Exception as e:
                    print(f"   Test accès: ✗ {str(e)}")
        
        print("\n" + "=" * 80)
    else:
        print(f"   Erreur API: {products_response.status_code}")
        print(f"   {products_response.text}")

except requests.exceptions.ConnectionError as e:
    print(f"Erreur de connexion: {e}")
    print("Vérifiez que Django est en cours d'exécution sur le port 8000")
except Exception as e:
    print(f"Erreur: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
