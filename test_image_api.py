"""
Script de test pour vérifier le fonctionnement des images via l'API
"""
import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
USERNAME = "admin"
PASSWORD = "admin123"

def test_image_api():
    print("=" * 60)
    print("TEST DE L'API DES IMAGES DE PRODUITS")
    print("=" * 60)
    
    # 1. Login
    print("\n1. Tentative de connexion...")
    login_url = f"{BASE_URL}/api/auth/login/"
    login_data = {"username": USERNAME, "password": PASSWORD}
    
    try:
        response = requests.post(login_url, json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get('access')
            print(f"   ✅ Connexion réussie")
            print(f"   Token: {access_token[:20]}...")
        else:
            print(f"   ❌ Échec de connexion: {response.status_code}")
            print(f"   Réponse: {response.text}")
            return
    except Exception as e:
        print(f"   ❌ Erreur de connexion: {e}")
        return
    
    # 2. Récupérer la liste des produits
    print("\n2. Récupération de la liste des produits...")
    products_url = f"{BASE_URL}/api/products/"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(products_url, headers=headers)
        if response.status_code == 200:
            products_data = response.json()
            products = products_data if isinstance(products_data, list) else products_data.get('results', [])
            print(f"   ✅ {len(products)} produits récupérés")
            
            # 3. Analyser les images
            print("\n3. Analyse des images des produits:")
            print("-" * 60)
            
            products_with_images = 0
            products_without_images = 0
            
            for product in products:
                has_photo = bool(product.get('photo'))
                has_photo_url = bool(product.get('photo_url'))
                
                if has_photo or has_photo_url:
                    products_with_images += 1
                    print(f"\n   📦 Produit: {product.get('name', 'Sans nom')}")
                    print(f"      ID: {product.get('id')}")
                    print(f"      photo: {product.get('photo', 'None')}")
                    print(f"      photo_url: {product.get('photo_url', 'None')}")
                    
                    # Tester si l'URL de l'image est accessible
                    if has_photo_url:
                        image_url = product.get('photo_url')
                        try:
                            img_response = requests.head(image_url, timeout=5)
                            if img_response.status_code == 200:
                                print(f"      ✅ Image accessible (Status: {img_response.status_code})")
                            else:
                                print(f"      ❌ Image non accessible (Status: {img_response.status_code})")
                        except Exception as e:
                            print(f"      ❌ Erreur lors du test de l'image: {e}")
                else:
                    products_without_images += 1
            
            print("\n" + "=" * 60)
            print(f"RÉSUMÉ:")
            print(f"   Produits avec images: {products_with_images}")
            print(f"   Produits sans images: {products_without_images}")
            print("=" * 60)
            
        else:
            print(f"   ❌ Échec de récupération: {response.status_code}")
            print(f"   Réponse: {response.text}")
    except Exception as e:
        print(f"   ❌ Erreur: {e}")

if __name__ == "__main__":
    test_image_api()
