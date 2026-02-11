#!/usr/bin/env python3
"""
Script pour tester l'upload d'images dans l'application
"""
import os
import sys
import django
import requests
from pathlib import Path

# Configuration Django
sys.path.append('gestion_stock')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product
from django.contrib.auth.models import User

def test_django_server():
    """Teste si le serveur Django répond"""
    try:
        response = requests.get('http://localhost:8000/api/products/', timeout=5)
        return response.status_code == 200
    except:
        return False

def get_auth_token():
    """Récupère un token d'authentification"""
    try:
        response = requests.post('http://localhost:8000/api/auth/login/', 
                               json={'username': 'admin', 'password': 'admin123'},
                               timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('access')
        else:
            print(f"❌ Erreur login: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erreur lors de l'authentification: {e}")
        return None

def test_image_upload():
    """Teste l'upload d'une image via l'API"""
    print("🧪 TEST D'UPLOAD D'IMAGE")
    print("=" * 40)
    
    # 1. Vérifier le serveur
    if not test_django_server():
        print("❌ Serveur Django non accessible")
        print("   Démarrez le serveur: cd gestion_stock && py manage.py runserver")
        return False
    
    print("✅ Serveur Django accessible")
    
    # 2. Authentification
    token = get_auth_token()
    if not token:
        print("❌ Impossible de s'authentifier")
        return False
    
    print("✅ Authentification réussie")
    
    # 3. Préparer les données de test
    media_path = Path('gestion_stock/media/products')
    if not media_path.exists():
        print("❌ Dossier media/products introuvable")
        return False
    
    # Prendre la première image disponible
    image_files = list(media_path.glob('*.jpg'))
    if not image_files:
        print("❌ Aucune image de test disponible")
        return False
    
    test_image = image_files[0]
    print(f"📸 Image de test: {test_image.name}")
    
    # 4. Tester la création d'un produit avec image
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Données du produit
    product_data = {
        'name': 'Produit Test Upload',
        'description': 'Test d\'upload d\'image via API',
        'category': 'Test',
        'quantity': 10,
        'purchase_price': 50.00,
        'sale_price': 75.00,
        'alert_threshold': 5,
        'is_active': True
    }
    
    # Préparer le fichier
    with open(test_image, 'rb') as img_file:
        files = {'photo': (test_image.name, img_file, 'image/jpeg')}
        
        try:
            response = requests.post(
                'http://localhost:8000/api/products/',
                data=product_data,
                files=files,
                headers=headers,
                timeout=30
            )
            
            print(f"📤 Requête envoyée - Status: {response.status_code}")
            
            if response.status_code == 201:
                data = response.json()
                print("✅ Produit créé avec succès!")
                print(f"   ID: {data.get('id')}")
                print(f"   Nom: {data.get('name')}")
                print(f"   Photo: {data.get('photo')}")
                print(f"   Photo URL: {data.get('photo_url')}")
                
                # Tester l'accès à l'image
                if data.get('photo_url'):
                    img_response = requests.get(data['photo_url'], timeout=10)
                    if img_response.status_code == 200:
                        print("✅ Image accessible via URL")
                    else:
                        print(f"❌ Image non accessible: {img_response.status_code}")
                
                return True
            else:
                print(f"❌ Erreur création produit: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Erreur lors de l'upload: {e}")
            return False

def test_image_update():
    """Teste la modification d'image d'un produit existant"""
    print("\n🔄 TEST DE MODIFICATION D'IMAGE")
    print("=" * 40)
    
    # Récupérer un produit existant
    products = Product.objects.filter(deleted_at__isnull=True)[:1]
    if not products:
        print("❌ Aucun produit disponible pour le test")
        return False
    
    product = products[0]
    print(f"📦 Produit sélectionné: {product.name} (ID: {product.id})")
    
    # Authentification
    token = get_auth_token()
    if not token:
        print("❌ Impossible de s'authentifier")
        return False
    
    # Préparer une nouvelle image
    media_path = Path('gestion_stock/media/products')
    image_files = list(media_path.glob('*.jpg'))
    if len(image_files) < 2:
        print("❌ Pas assez d'images pour le test de modification")
        return False
    
    # Prendre une image différente de celle actuelle
    test_image = image_files[1] if image_files[0].name in str(product.photo) else image_files[0]
    print(f"📸 Nouvelle image: {test_image.name}")
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Modifier seulement l'image
    with open(test_image, 'rb') as img_file:
        files = {'photo': (test_image.name, img_file, 'image/jpeg')}
        
        try:
            response = requests.patch(
                f'http://localhost:8000/api/products/{product.id}/',
                files=files,
                headers=headers,
                timeout=30
            )
            
            print(f"📤 Requête de modification envoyée - Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Image modifiée avec succès!")
                print(f"   Nouvelle photo: {data.get('photo')}")
                print(f"   Nouvelle photo URL: {data.get('photo_url')}")
                return True
            else:
                print(f"❌ Erreur modification: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Erreur lors de la modification: {e}")
            return False

def check_permissions():
    """Vérifie les permissions des fichiers et dossiers"""
    print("\n🔐 VÉRIFICATION DES PERMISSIONS")
    print("=" * 40)
    
    media_root = Path('gestion_stock/media')
    products_dir = media_root / 'products'
    
    # Vérifier que les dossiers existent et sont accessibles
    if not media_root.exists():
        print("❌ Dossier media/ introuvable")
        return False
    
    if not products_dir.exists():
        print("❌ Dossier media/products/ introuvable")
        return False
    
    # Vérifier les permissions d'écriture
    try:
        test_file = products_dir / 'test_permissions.txt'
        test_file.write_text('test')
        test_file.unlink()
        print("✅ Permissions d'écriture OK")
    except Exception as e:
        print(f"❌ Pas de permission d'écriture: {e}")
        return False
    
    # Vérifier les images existantes
    images = list(products_dir.glob('*.jpg'))
    print(f"📁 {len(images)} images trouvées")
    
    for img in images[:3]:
        try:
            size = img.stat().st_size
            print(f"   ✅ {img.name} ({size} bytes)")
        except Exception as e:
            print(f"   ❌ {img.name} - Erreur: {e}")
    
    return True

def main():
    """Fonction principale"""
    print("🧪 TEST COMPLET D'UPLOAD D'IMAGES")
    print("=" * 60)
    
    # 1. Vérifier les permissions
    if not check_permissions():
        print("\n❌ Problème de permissions détecté")
        return
    
    # 2. Tester l'upload
    if test_image_upload():
        print("\n✅ Test d'upload réussi")
    else:
        print("\n❌ Test d'upload échoué")
    
    # 3. Tester la modification
    if test_image_update():
        print("\n✅ Test de modification réussi")
    else:
        print("\n❌ Test de modification échoué")
    
    print("\n📋 RÉSUMÉ DES TESTS TERMINÉ")
    print("\n💡 CONSEILS DE DÉPANNAGE:")
    print("   1. Vérifiez que le serveur Django tourne sur port 8000")
    print("   2. Vérifiez que l'utilisateur admin existe avec le bon mot de passe")
    print("   3. Vérifiez les permissions du dossier media/")
    print("   4. Consultez les logs Django pour plus de détails")

if __name__ == "__main__":
    main()