"""
Script de test pour l'upload d'images via l'API
"""
import requests
import io
from PIL import Image

# Configuration
BASE_URL = "http://localhost:8000"
USERNAME = "admin"
PASSWORD = "admin"

print("=" * 60)
print("TEST API - UPLOAD D'IMAGES")
print("=" * 60)

# 1. Login
print("\n1. LOGIN...")
login_data = {
    "username": USERNAME,
    "password": PASSWORD
}
response = requests.post(f"{BASE_URL}/api/auth/login/", json=login_data)
if response.status_code == 200:
    tokens = response.json()
    access_token = tokens['access']
    print("   ✓ Login réussi")
else:
    print(f"   ✗ Login échoué: {response.status_code}")
    print(f"   {response.text}")
    exit(1)

# Headers avec authentification
headers = {
    "Authorization": f"Bearer {access_token}"
}

# 2. Créer une image de test
print("\n2. CRÉATION IMAGE DE TEST...")
img = Image.new('RGB', (200, 200), color='blue')
img_byte_arr = io.BytesIO()
img.save(img_byte_arr, format='PNG')
img_byte_arr.seek(0)
print("   ✓ Image créée (200x200 pixels, bleue)")

# 3. Créer un produit avec photo
print("\n3. CRÉATION PRODUIT AVEC PHOTO...")
files = {
    'photo': ('test_product.png', img_byte_arr, 'image/png')
}
data = {
    'name': 'Test Upload Image',
    'description': 'Test de upload',
    'category': 'Test',
    'quantity': '10',
    'purchase_price': '100',
    'sale_price': '150',
    'alert_threshold': '5',
    'is_active': 'true'
}

response = requests.post(
    f"{BASE_URL}/api/products/",
    headers=headers,
    files=files,
    data=data
)

print(f"   Status: {response.status_code}")
if response.status_code in [200, 201]:
    product = response.json()
    print(f"   ✓ Produit créé avec ID: {product['id']}")
    print(f"   Photo: {product.get('photo')}")
    print(f"   Photo URL: {product.get('photo_url')}")
    
    # 4. Vérifier l'accès à l'image
    if product.get('photo_url'):
        print("\n4. VÉRIFICATION ACCÈS IMAGE...")
        img_response = requests.get(product['photo_url'])
        print(f"   Status: {img_response.status_code}")
        if img_response.status_code == 200:
            print(f"   ✓ Image accessible ({len(img_response.content)} bytes)")
        else:
            print(f"   ✗ Image non accessible")
    
    # 5. Test de modification avec nouvelle photo
    print("\n5. MODIFICATION AVEC NOUVELLE PHOTO...")
    img2 = Image.new('RGB', (200, 200), color='red')
    img_byte_arr2 = io.BytesIO()
    img2.save(img_byte_arr2, format='PNG')
    img_byte_arr2.seek(0)
    
    files2 = {
        'photo': ('test_product_updated.png', img_byte_arr2, 'image/png')
    }
    data2 = {
        'name': 'Test Upload Image MODIFIÉ',
        'quantity': '15'
    }
    
    response = requests.patch(
        f"{BASE_URL}/api/products/{product['id']}/",
        headers=headers,
        files=files2,
        data=data2
    )
    
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        updated_product = response.json()
        print(f"   ✓ Produit modifié")
        print(f"   Nouveau nom: {updated_product['name']}")
        print(f"   Nouvelle photo: {updated_product.get('photo')}")
        print(f"   Nouvelle photo URL: {updated_product.get('photo_url')}")
    else:
        print(f"   ✗ Modification échouée")
        print(f"   {response.text}")
else:
    print(f"   ✗ Création échouée")
    print(f"   {response.text}")

print("\n" + "=" * 60)
