#!/usr/bin/env python
"""
Script de diagnostic pour vérifier l'accès aux images
"""
import os
import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8000"
MEDIA_ROOT = r"C:\Users\Mouha\OneDrive\Bureau\gestions\gestion_stock\media"

print("=" * 60)
print("DIAGNOSTIC DES IMAGES")
print("=" * 60)

# 1. Vérifier les fichiers locaux
print("\n1. FICHIERS LOCAUX")
print("-" * 60)
products_dir = Path(MEDIA_ROOT) / "products"
if products_dir.exists():
    images = list(products_dir.glob("*.jpg")) + list(products_dir.glob("*.png"))
    print(f"✓ Dossier trouvé: {products_dir}")
    print(f"✓ Nombre d'images: {len(images)}")
    for img in images[:3]:
        print(f"  - {img.name}")
else:
    print(f"✗ Dossier introuvable: {products_dir}")

# 2. Se connecter d'abord
print("\n2. AUTHENTIFICATION")
print("-" * 60)
token = None
try:
    login_response = requests.post(
        f"{BASE_URL}/api/auth/login/",
        json={"username": "admin", "password": "admin123"},
        timeout=5
    )
    if login_response.status_code == 200:
        token = login_response.json().get('access')
        print(f"✓ Authentification réussie")
    else:
        print(f"✗ Erreur auth: {login_response.status_code}")
except Exception as e:
    print(f"✗ Erreur: {e}")

# 3. Vérifier l'accès via l'API
print("\n3. ACCÈS API - PRODUITS")
print("-" * 60)
try:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    response = requests.get(f"{BASE_URL}/api/products/", headers=headers, timeout=5)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        products = data.get('results', data) if isinstance(data, dict) else data
        print(f"Nombre de produits: {len(products)}")
        
        # Vérifier tous les produits
        products_with_photo = [p for p in products if p.get('photo') or p.get('photo_url')]
        products_without_photo = [p for p in products if not p.get('photo') and not p.get('photo_url')]
        
        print(f"✓ Produits avec photo: {len(products_with_photo)}")
        print(f"✗ Produits SANS photo: {len(products_without_photo)}")
        
        if products_with_photo:
            print("\nProduits avec photos:")
            for p in products_with_photo[:3]:
                print(f"  - {p.get('name')}: {p.get('photo_url') or p.get('photo')}")
        
        if products_without_photo:
            print("\nProduits SANS photos:")
            for p in products_without_photo[:3]:
                print(f"  - {p.get('name')}")
        
        # Afficher le premier produit complètement
        if products:
            product = products[0]
            print(f"\nProduit exemple: {product.get('name')}")
            print(f"  photo: {product.get('photo')}")
            print(f"  photo_url: {product.get('photo_url')}")
            
            # 3. Tester l'accès à l'image directement
            print("\n4. ACCÈS DIRECT À L'IMAGE")
            print("-" * 60)
            photo_url = product.get('photo_url')
            if photo_url:
                try:
                    img_response = requests.get(photo_url, timeout=5)
                    print(f"URL: {photo_url}")
                    print(f"Status: {img_response.status_code}")
                    print(f"Content-Type: {img_response.headers.get('content-type')}")
                    print(f"Content-Length: {img_response.headers.get('content-length')} bytes")
                    if img_response.status_code == 200:
                        print("✓ Image accessible!")
                    else:
                        print(f"✗ Erreur: {img_response.status_code}")
                except Exception as e:
                    print(f"✗ Erreur: {e}")
    else:
        print(f"✗ Erreur API: {response.status_code}")
        print(response.text[:200])
except Exception as e:
    print(f"✗ Erreur connexion: {e}")

# 4. Vérifier les permissions et types de fichiers
print("\n5. PERMISSIONS ET TYPES")
print("-" * 60)
if products_dir.exists():
    for img in list(products_dir.glob("*.jpg"))[:1] + list(products_dir.glob("*.png"))[:1]:
        stat = img.stat()
        print(f"Fichier: {img.name}")
        print(f"  Taille: {stat.st_size} bytes")
        print(f"  Permissions: {oct(stat.st_mode)[-3:]}")
        print(f"  Accessible: {os.access(img, os.R_OK)}")

print("\n" + "=" * 60)
