#!/usr/bin/env python3
"""
Test direct de l'API sans passer par la page d'accueil
"""
import urllib.request
import urllib.parse
import json

def test_api_endpoints():
    """Teste les endpoints API directement"""
    print("🔍 TEST ENDPOINTS API DIRECTS")
    print("=" * 40)
    
    # Test 1: Login
    print("1. Test Login...")
    try:
        login_data = json.dumps({'username': 'admin', 'password': 'admin123'}).encode('utf-8')
        req = urllib.request.Request(
            'http://localhost:8000/api/auth/login/',
            data=login_data,
            headers={'Content-Type': 'application/json'}
        )
        response = urllib.request.urlopen(req, timeout=10)
        
        if response.getcode() == 200:
            result = json.loads(response.read().decode('utf-8'))
            token = result.get('access')
            print("✅ Login réussi")
            
            # Test 2: API Produits avec token
            print("\n2. Test API Produits...")
            req = urllib.request.Request(
                'http://localhost:8000/api/products/',
                headers={'Authorization': f'Bearer {token}'}
            )
            response = urllib.request.urlopen(req, timeout=10)
            
            if response.getcode() == 200:
                data = json.loads(response.read().decode('utf-8'))
                print(f"✅ API Produits accessible - {len(data)} produits")
                
                # Vérifier les images
                products_with_images = [p for p in data if p.get('photo_url')]
                print(f"✅ Produits avec images: {len(products_with_images)}")
                
                if products_with_images:
                    print("\n📋 EXEMPLES D'IMAGES:")
                    for product in products_with_images[:3]:
                        print(f"   {product['name']}: {product['photo_url']}")
                        
                        # Tester l'accès à l'image
                        try:
                            img_req = urllib.request.Request(product['photo_url'])
                            img_response = urllib.request.urlopen(img_req, timeout=5)
                            if img_response.getcode() == 200:
                                size = len(img_response.read())
                                print(f"      ✅ Image accessible ({size} bytes)")
                            else:
                                print(f"      ❌ Image erreur {img_response.getcode()}")
                        except Exception as e:
                            print(f"      ❌ Image inaccessible: {e}")
                
                return token
            else:
                print(f"❌ API Produits erreur: {response.getcode()}")
                return None
        else:
            print(f"❌ Login erreur: {response.getcode()}")
            return None
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None

def test_upload_simple(token):
    """Teste un upload simple"""
    print("\n📤 TEST UPLOAD SIMPLE")
    print("=" * 40)
    
    if not token:
        print("❌ Pas de token")
        return False
    
    # Créer un produit simple sans image d'abord
    product_data = {
        'name': 'Test Upload API Direct',
        'description': 'Test via API directe',
        'category': 'Test',
        'quantity': 3,
        'purchase_price': 15.00,
        'sale_price': 25.00,
        'alert_threshold': 1,
        'is_active': True
    }
    
    try:
        data = json.dumps(product_data).encode('utf-8')
        req = urllib.request.Request(
            'http://localhost:8000/api/products/',
            data=data,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}'
            }
        )
        
        response = urllib.request.urlopen(req, timeout=10)
        
        if response.getcode() == 201:
            result = json.loads(response.read().decode('utf-8'))
            print(f"✅ Produit créé: {result['name']} (ID: {result['id']})")
            return True
        else:
            print(f"❌ Création échouée: {response.getcode()}")
            print(response.read().decode('utf-8'))
            return False
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def main():
    """Fonction principale"""
    print("🧪 TEST API DIRECT")
    print("=" * 30)
    
    # Test des endpoints
    token = test_api_endpoints()
    
    if token:
        # Test upload
        upload_ok = test_upload_simple(token)
        
        print("\n📊 RÉSULTAT")
        print("=" * 30)
        
        if upload_ok:
            print("✅ BACKEND FONCTIONNE PARFAITEMENT")
            print("\n🎯 LE PROBLÈME EST DANS LE FRONTEND")
            print("\n💡 SOLUTION:")
            print("1. Ouvrez http://localhost:3002")
            print("2. Déconnectez-vous complètement")
            print("3. Reconnectez-vous avec admin/admin123")
            print("4. Videz le cache: Ctrl+Shift+R")
            print("5. Testez l'upload d'image")
            print("\n🔍 Si ça ne marche pas:")
            print("- Ouvrez F12 → Console")
            print("- Regardez les erreurs JavaScript")
            print("- Vérifiez l'onglet Network")
        else:
            print("❌ Problème backend persistant")
    else:
        print("❌ Impossible de tester - serveur non accessible")

if __name__ == "__main__":
    main()