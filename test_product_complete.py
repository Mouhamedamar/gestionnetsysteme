#!/usr/bin/env python
"""
Test complet d'envoi d'un produit avec photo
"""
import requests
import io
from PIL import Image

BASE_URL = "http://localhost:8000"

print("=" * 80)
print("TEST COMPLET - ENVOI D'UN PRODUIT AVEC PHOTO")
print("=" * 80)

# 1. Authentification
print("\n1. AUTHENTIFICATION")
print("-" * 80)
login_resp = requests.post(
    f"{BASE_URL}/api/auth/login/",
    json={"username": "admin", "password": "admin123"}
)

if login_resp.status_code != 200:
    print(f"✗ Erreur authentification: {login_resp.status_code}")
    print(login_resp.text)
    exit(1)

token = login_resp.json()['access']
print(f"✓ Authentification réussie")
print(f"  Token: {token[:40]}...")

headers = {"Authorization": f"Bearer {token}"}

# 2. Créer une image de test
print("\n2. CRÉATION D'UNE IMAGE DE TEST")
print("-" * 80)
img = Image.new('RGB', (200, 200), color='blue')
img_bytes = io.BytesIO()
img.save(img_bytes, format='PNG')
img_bytes.seek(0)
print(f"✓ Image créée: PNG 200x200 ({img_bytes.getbuffer().nbytes} bytes)")

# 3. Préparer les données
print("\n3. PRÉPARATION DES DONNÉES")
print("-" * 80)
data = {
    'name': 'Produit Test API Python',
    'description': 'Produit créé via test API Python',
    'category': 'Test',
    'quantity': 10,
    'purchase_price': 500.00,
    'sale_price': 750.00,
    'alert_threshold': 3,
    'is_active': True
}

files = {
    'photo': ('test_api_python.png', img_bytes, 'image/png')
}

print("Données:")
for key, value in data.items():
    print(f"  {key}: {value}")
print(f"Photo: {files['photo'][0]} ({len(files['photo'][1].getvalue())} bytes)")

# 4. Envoyer la requête
print("\n4. ENVOI DE LA REQUÊTE")
print("-" * 80)
response = requests.post(
    f"{BASE_URL}/api/products/",
    headers=headers,
    data=data,
    files=files
)

print(f"Status: {response.status_code}")
print(f"Content-Type: {response.headers.get('content-type')}")

# 5. Analyser la réponse
print("\n5. RÉPONSE DU SERVEUR")
print("-" * 80)

if response.status_code in [200, 201]:
    product = response.json()
    print("✓ Produit créé avec succès!")
    print(f"  ID: {product.get('id')}")
    print(f"  Nom: {product.get('name')}")
    print(f"  photo: {product.get('photo')}")
    print(f"  photo_url: {product.get('photo_url')}")
    
    # Tester l'accès à l'image
    if product.get('photo_url'):
        print("\n6. TEST D'ACCÈS À L'IMAGE")
        print("-" * 80)
        img_resp = requests.head(product['photo_url'])
        print(f"  URL: {product['photo_url']}")
        print(f"  Status: {img_resp.status_code}")
        if img_resp.status_code == 200:
            print("  ✓ Image ACCESSIBLE")
        else:
            print(f"  ✗ Erreur accès image: {img_resp.status_code}")
else:
    print(f"✗ Erreur création produit: {response.status_code}")
    print(response.text)

print("\n" + "=" * 80)
