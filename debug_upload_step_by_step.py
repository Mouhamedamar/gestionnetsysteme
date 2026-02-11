#!/usr/bin/env python3
"""
Debug étape par étape de l'upload d'images
"""
import os
import sys
import django
import json
import urllib.request
import urllib.parse
from pathlib import Path

# Configuration Django
sys.path.append('gestion_stock')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product
from django.contrib.auth.models import User

def check_current_state():
    """Vérifie l'état actuel complet"""
    print("🔍 ÉTAT ACTUEL COMPLET")
    print("=" * 40)
    
    # Utilisateurs
    users = User.objects.all()
    print(f"👤 Utilisateurs: {users.count()}")
    for user in users:
        print(f"   - {user.username} (staff: {user.is_staff}, active: {user.is_active})")
    
    # Produits
    products = Product.objects.filter(deleted_at__isnull=True)
    print(f"\n📦 Produits actifs: {products.count()}")
    
    with_images = products.exclude(photo__isnull=True).exclude(photo='')
    without_images = products.filter(photo__isnull=True) | products.filter(photo='')
    
    print(f"   Avec images: {with_images.count()}")
    print(f"   Sans images: {without_images.count()}")
    
    # Images physiques
    media_path = Path('gestion_stock/media/products')
    if media_path.exists():
        images = list(media_path.glob('*.jpg')) + list(media_path.glob('*.png'))
        print(f"\n📁 Fichiers images: {len(images)}")
    else:
        print("\n❌ Dossier media/products introuvable")

def test_django_server_detailed():
    """Test détaillé du serveur Django"""
    print("\n🌐 TEST SERVEUR DJANGO DÉTAILLÉ")
    print("=" * 40)
    
    # Test 1: Page d'accueil
    try:
        response = urllib.request.urlopen('http://localhost:8000/', timeout=5)
        print(f"✅ Serveur accessible - Status: {response.getcode()}")
    except Exception as e:
        print(f"❌ Serveur inaccessible: {e}")
        return False
    
    # Test 2: API sans auth
    try:
        response = urllib.request.urlopen('http://localhost:8000/api/products/', timeout=5)
        print(f"❌ API sans auth accessible (problème de sécurité) - Status: {response.getcode()}")
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print("✅ API protégée correctement (401 Unauthorized)")
        else:
            print(f"⚠️  API erreur inattendue: {e.code}")
    except Exception as e:
        print(f"❌ Erreur API: {e}")
    
    # Test 3: Login endpoint
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
            print("✅ Login fonctionne")
            return token
        else:
            print(f"❌ Login échoue: {response.getcode()}")
            return None
    except Exception as e:
        print(f"❌ Erreur login: {e}")
        return None

def test_image_serving():
    """Test du service des images"""
    print("\n🖼️  TEST SERVICE DES IMAGES")
    print("=" * 40)
    
    media_path = Path('gestion_stock/media/products')
    if not media_path.exists():
        print("❌ Dossier media/products introuvable")
        return False
    
    images = list(media_path.glob('*.jpg'))[:3]
    
    for img in images:
        url = f"http://localhost:8000/media/products/{img.name}"
        print(f"\n🧪 Test: {img.name}")
        print(f"   URL: {url}")
        
        try:
            response = urllib.request.urlopen(url, timeout=5)
            if response.getcode() == 200:
                size = len(response.read())
                print(f"   ✅ Accessible ({size} bytes)")
            else:
                print(f"   ❌ Erreur {response.getcode()}")
        except Exception as e:
            print(f"   ❌ Erreur: {e}")

def test_api_with_auth(token):
    """Test de l'API avec authentification"""
    print("\n🔐 TEST API AVEC AUTHENTIFICATION")
    print("=" * 40)
    
    if not token:
        print("❌ Pas de token disponible")
        return False
    
    try:
        req = urllib.request.Request(
            'http://localhost:8000/api/products/',
            headers={'Authorization': f'Bearer {token}'}
        )
        response = urllib.request.urlopen(req, timeout=10)
        
        if response.getcode() == 200:
            data = json.loads(response.read().decode('utf-8'))
            print(f"✅ API accessible avec auth - {len(data)} produits")
            
            # Vérifier les photo_url
            products_with_images = [p for p in data if p.get('photo_url')]
            print(f"✅ Produits avec photo_url: {len(products_with_images)}")
            
            if products_with_images:
                print("\n📋 EXEMPLES D'URLS D'IMAGES:")
                for product in products_with_images[:3]:
                    print(f"   {product['name']}: {product['photo_url']}")
            
            return True
        else:
            print(f"❌ API erreur: {response.getcode()}")
            return False
    except Exception as e:
        print(f"❌ Erreur API avec auth: {e}")
        return False

def create_multipart_upload_test(token):
    """Test d'upload multipart"""
    print("\n📤 TEST UPLOAD MULTIPART")
    print("=" * 40)
    
    if not token:
        print("❌ Pas de token disponible")
        return False
    
    # Prendre une image existante
    media_path = Path('gestion_stock/media/products')
    images = list(media_path.glob('*.jpg'))
    
    if not images:
        print("❌ Aucune image de test disponible")
        return False
    
    test_image = images[0]
    print(f"📸 Image de test: {test_image.name}")
    
    try:
        # Lire l'image
        with open(test_image, 'rb') as f:
            image_data = f.read()
        
        # Créer les données multipart manuellement
        boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
        
        # Construire le body multipart
        body = []
        
        # Champs texte
        fields = {
            'name': 'Test Upload Multipart',
            'description': 'Test upload via script Python',
            'category': 'Test',
            'quantity': '5',
            'purchase_price': '25.00',
            'sale_price': '40.00',
            'alert_threshold': '2',
            'is_active': 'true'
        }
        
        for key, value in fields.items():
            body.append(f'--{boundary}'.encode())
            body.append(f'Content-Disposition: form-data; name="{key}"'.encode())
            body.append(b'')
            body.append(str(value).encode())
        
        # Fichier image
        body.append(f'--{boundary}'.encode())
        body.append(f'Content-Disposition: form-data; name="photo"; filename="{test_image.name}"'.encode())
        body.append(b'Content-Type: image/jpeg')
        body.append(b'')
        body.append(image_data)
        body.append(f'--{boundary}--'.encode())
        
        body_bytes = b'\r\n'.join(body)
        
        # Envoyer la requête
        req = urllib.request.Request(
            'http://localhost:8000/api/products/',
            data=body_bytes,
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': f'multipart/form-data; boundary={boundary}'
            }
        )
        
        response = urllib.request.urlopen(req, timeout=30)
        
        if response.getcode() == 201:
            result = json.loads(response.read().decode('utf-8'))
            print("✅ Upload multipart réussi!")
            print(f"   ID: {result['id']}")
            print(f"   Nom: {result['name']}")
            print(f"   Photo: {result.get('photo')}")
            print(f"   Photo URL: {result.get('photo_url')}")
            return True
        else:
            print(f"❌ Upload échoué: {response.getcode()}")
            print(response.read().decode('utf-8'))
            return False
            
    except Exception as e:
        print(f"❌ Erreur upload: {e}")
        return False

def main():
    """Fonction principale"""
    print("🔍 DIAGNOSTIC COMPLET - ÉTAPE PAR ÉTAPE")
    print("=" * 60)
    
    # 1. État actuel
    check_current_state()
    
    # 2. Test serveur Django
    token = test_django_server_detailed()
    
    # 3. Test service images
    test_image_serving()
    
    # 4. Test API avec auth
    if token:
        api_ok = test_api_with_auth(token)
        
        # 5. Test upload multipart
        if api_ok:
            upload_ok = create_multipart_upload_test(token)
        else:
            upload_ok = False
    else:
        api_ok = False
        upload_ok = False
    
    # Résumé final
    print("\n📊 DIAGNOSTIC FINAL")
    print("=" * 40)
    
    if token and api_ok and upload_ok:
        print("✅ TOUT FONCTIONNE PARFAITEMENT AU NIVEAU BACKEND")
        print("\n🔍 Le problème est donc dans le FRONTEND")
        print("\n💡 ACTIONS POUR LE FRONTEND:")
        print("1. Ouvrez F12 dans votre navigateur")
        print("2. Allez dans Console et Network")
        print("3. Tentez un upload et observez:")
        print("   - Les messages dans Console")
        print("   - Les requêtes dans Network")
        print("   - Le statut des requêtes (200, 401, 500, etc.)")
        print("\n4. Problèmes courants frontend:")
        print("   - Token expiré → Reconnectez-vous")
        print("   - CORS bloqué → Vérifiez les deux serveurs")
        print("   - Cache navigateur → Ctrl+Shift+R")
        print("   - JavaScript désactivé → Vérifiez les paramètres")
    else:
        print("❌ PROBLÈME BACKEND DÉTECTÉ")
        if not token:
            print("   - Problème d'authentification")
        if not api_ok:
            print("   - Problème d'accès API")
        if not upload_ok:
            print("   - Problème d'upload")
        print("\n🔧 Redémarrez le serveur Django")

if __name__ == "__main__":
    main()