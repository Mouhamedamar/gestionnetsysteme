#!/usr/bin/env python3
"""
Script de vérification rapide de l'application
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

def check_database():
    """Vérifie l'état de la base de données"""
    print("🗄️  VÉRIFICATION BASE DE DONNÉES")
    print("=" * 40)
    
    try:
        users = User.objects.count()
        products = Product.objects.count()
        products_with_images = Product.objects.exclude(photo__isnull=True).exclude(photo='').count()
        
        print(f"✅ Utilisateurs: {users}")
        print(f"✅ Produits: {products}")
        print(f"✅ Produits avec images: {products_with_images}")
        
        if products > 0:
            print("\n📦 EXEMPLES DE PRODUITS:")
            for product in Product.objects.all()[:3]:
                print(f"   - {product.name} (Stock: {product.quantity}) - Image: {product.photo or 'AUCUNE'}")
        
        return True
    except Exception as e:
        print(f"❌ Erreur base de données: {e}")
        return False

def check_media_files():
    """Vérifie les fichiers média"""
    print("\n📁 VÉRIFICATION FICHIERS MÉDIA")
    print("=" * 40)
    
    media_path = Path('gestion_stock/media/products')
    if media_path.exists():
        images = list(media_path.glob('*.jpg')) + list(media_path.glob('*.png'))
        print(f"✅ Images disponibles: {len(images)}")
        
        for img in images[:5]:  # Afficher les 5 premières
            size_kb = img.stat().st_size / 1024
            print(f"   - {img.name} ({size_kb:.1f} KB)")
        
        if len(images) > 5:
            print(f"   ... et {len(images) - 5} autres")
        
        return len(images) > 0
    else:
        print("❌ Dossier media/products introuvable")
        return False

def check_django_server():
    """Vérifie si le serveur Django répond"""
    print("\n🌐 VÉRIFICATION SERVEUR DJANGO")
    print("=" * 40)
    
    try:
        response = requests.get('http://localhost:8000/api/products/', timeout=5)
        if response.status_code == 200:
            products = response.json()
            print(f"✅ Serveur Django actif")
            print(f"✅ API produits: {len(products)} produits")
            
            # Vérifier les URLs d'images
            products_with_images = [p for p in products if p.get('photo_url')]
            print(f"✅ Produits avec photo_url: {len(products_with_images)}")
            
            if products_with_images:
                print("\n🖼️  EXEMPLES D'URLS D'IMAGES:")
                for product in products_with_images[:3]:
                    print(f"   - {product['name']}: {product['photo_url']}")
            
            return True
        else:
            print(f"❌ Serveur Django répond avec code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Serveur Django non accessible (pas démarré?)")
        return False
    except Exception as e:
        print(f"❌ Erreur serveur Django: {e}")
        return False

def check_frontend_server():
    """Vérifie si le serveur frontend répond"""
    print("\n⚛️  VÉRIFICATION SERVEUR FRONTEND")
    print("=" * 40)
    
    # Tester les ports communs de Vite
    ports = [3000, 5173, 4173]
    
    for port in ports:
        try:
            response = requests.get(f'http://localhost:{port}', timeout=3)
            if response.status_code == 200:
                print(f"✅ Serveur Frontend actif sur port {port}")
                return True
        except:
            continue
    
    print("❌ Serveur Frontend non accessible")
    print("   Démarrez avec: cd frontend && npm run dev")
    return False

def test_image_access():
    """Teste l'accès direct aux images"""
    print("\n🖼️  TEST ACCÈS IMAGES")
    print("=" * 40)
    
    media_path = Path('gestion_stock/media/products')
    if media_path.exists():
        images = list(media_path.glob('*.jpg'))[:3]  # Tester 3 images
        
        for img in images:
            url = f"http://localhost:8000/media/products/{img.name}"
            try:
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    print(f"✅ {img.name} - Accessible")
                else:
                    print(f"❌ {img.name} - Code: {response.status_code}")
            except Exception as e:
                print(f"❌ {img.name} - Erreur: {e}")
    else:
        print("❌ Aucune image à tester")

def main():
    """Fonction principale"""
    print("🔍 VÉRIFICATION COMPLÈTE DE L'APPLICATION")
    print("=" * 60)
    
    checks = []
    
    # 1. Base de données
    checks.append(check_database())
    
    # 2. Fichiers média
    checks.append(check_media_files())
    
    # 3. Serveur Django
    checks.append(check_django_server())
    
    # 4. Serveur Frontend
    checks.append(check_frontend_server())
    
    # 5. Test accès images
    test_image_access()
    
    # Résumé
    print("\n📊 RÉSUMÉ")
    print("=" * 40)
    
    passed = sum(checks)
    total = len(checks)
    
    if passed == total:
        print("🎉 TOUT FONCTIONNE PARFAITEMENT!")
        print("\n🚀 PROCHAINES ÉTAPES:")
        print("   1. Ouvrez http://localhost:3000 dans votre navigateur")
        print("   2. Connectez-vous avec admin/admin123")
        print("   3. Naviguez vers la section Produits")
        print("   4. Les images devraient s'afficher correctement")
    else:
        print(f"⚠️  {passed}/{total} vérifications réussies")
        print("\n🔧 ACTIONS NÉCESSAIRES:")
        
        if not checks[0]:
            print("   - Exécutez: python create_real_data.py")
        if not checks[2]:
            print("   - Démarrez Django: cd gestion_stock && python manage.py runserver")
        if not checks[3]:
            print("   - Démarrez Frontend: cd frontend && npm run dev")
        
        print("\n   Ou utilisez: START_SERVERS.bat")

if __name__ == "__main__":
    main()