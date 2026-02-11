import requests
import json

BASE_URL = 'http://localhost:8000'

# 1. Login
print("1. Connexion...")
login_response = requests.post(f'{BASE_URL}/api/auth/login/', json={
    'username': 'admin',
    'password': 'admin'
})

if login_response.status_code == 200:
    data = login_response.json()
    token = data['access']
    print(f"✅ Connecté avec le token: {token[:20]}...")
    
    # 2. Créer un produit
    print("\n2. Création d'un produit...")
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Utiliser JSON d'abord
    product_data = {
        'name': 'Test Produit',
        'category': 'Test',
        'quantity': 10,
        'purchase_price': 100,
        'sale_price': 200,
        'alert_threshold': 5,
        'is_active': True
    }
    
    create_response = requests.post(
        f'{BASE_URL}/api/products/',
        json=product_data,
        headers=headers
    )
    
    print(f"Status: {create_response.status_code}")
    print(f"Response: {create_response.json()}")
    
else:
    print(f"❌ Erreur de connexion: {login_response.status_code}")
    print(login_response.json())
