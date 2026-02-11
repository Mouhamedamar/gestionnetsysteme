#!/usr/bin/env python3
"""
Vérification complète de l'état du système
"""
import os
import sys
import django
import urllib.request
import json
from pathlib import Path

# Configuration Django
sys.path.append('gestion_stock')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product
from django.contrib.auth.models import User

def check_servers():
    """Vérifie que les serveurs tournent"""
    print("🌐 VÉRIFICATION DES SERVEURS")
    print("=" * 40)
    
    # Django
    try:
        response = urllib.request.urlopen('http://localhost:8000/api/auth/login/', timeout=5)
        print("✅ Django accessible sur port 8000")
        django_ok = True
    except Exception as e:
        print(f"❌ Django inaccessible: {e}")
        django_ok = False
    
    # React
    try:
        response = urllib.request.urlopen('http://localhost:3002/', timeout=5)
        print("✅ React accessible sur port 3002")
        react_ok = True
    except Exception as e:
        print(f"❌ React inaccessible: {e}")
        react_ok = False
    
    return django_ok, react_ok

def check_database():
    """Vérifie l'état de la base de données"""
    print("\n🗄️  VÉRIFICATION BASE DE DONNÉES")
    print("=" * 40)
    
    # Utilisateurs
    users = User.objects.filter(is_staff=True, is_active=True)
    print(f"👤 Utilisateurs admin actifs: {users.count()}")
    for user in users:
        print(f"   - {user.username}")
    
    # Produits
    products = Product.objects.filter(deleted_at__isnull=True)
    with_images = products.exclude(photo__isnull=True).exclude(photo='')
    without_images = products.filter(photo__isnull=True) | products.filter(photo='')
    
    print(f"\n📦 Produits:")
    print(f"   Total: {products.count()}")
    print(f"   Avec images: {with_images.count()}")
    print(f"   Sans images: {without_images.count()}")

def check_images():
    """Vérifie les fichiers images"""
    print("\n🖼️  VÉRIFICATION IMAGES")
    print("=" * 40)
    
    media_path = Path('gestion_stock/media/products')
    if media_path.exists():
        images = list(media_path.glob('*.jpg')) + list(media_path.glob('*.png'))
        print(f"📁 Fichiers images: {len(images)}")
        
        # Tester quelques images
        for img in images[:3]:
            url = f"http://localhost:8000/media/products/{img.name}"
            try:
                response = urllib.request.urlopen(url, timeout=5)
                if response.getcode() == 200:
                    print(f"   ✅ {img.name} - Accessible")
                else:
                    print(f"   ❌ {img.name} - Erreur {response.getcode()}")
            except Exception as e:
                print(f"   ❌ {img.name} - {e}")
    else:
        print("❌ Dossier media/products introuvable")

def test_api_complete():
    """Test complet de l'API"""
    print("\n🔐 TEST API COMPLET")
    print("=" * 40)
    
    try:
        # Login
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
            
            # Test API produits
            req = urllib.request.Request(
                'http://localhost:8000/api/products/',
                headers={'Authorization': f'Bearer {token}'}
            )
            response = urllib.request.urlopen(req, timeout=10)
            
            if response.getcode() == 200:
                data = json.loads(response.read().decode('utf-8'))
                print(f"✅ API Produits accessible - {len(data)} produits")
                
                # Vérifier photo_url
                products_with_images = [p for p in data if p.get('photo_url')]
                print(f"✅ Produits avec photo_url: {len(products_with_images)}")
                
                return True
            else:
                print(f"❌ API Produits erreur: {response.getcode()}")
                return False
        else:
            print(f"❌ Login erreur: {response.getcode()}")
            return False
    except Exception as e:
        print(f"❌ Erreur API: {e}")
        return False

def check_frontend_files():
    """Vérifie les fichiers frontend critiques"""
    print("\n📁 VÉRIFICATION FICHIERS FRONTEND")
    print("=" * 40)
    
    critical_files = [
        'frontend/src/components/ProductForm.jsx',
        'frontend/src/context/AppContext.jsx',
        'frontend/src/components/ProductCard.jsx'
    ]
    
    all_ok = True
    for file_path in critical_files:
        path = Path(file_path)
        if path.exists():
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - MANQUANT")
            all_ok = False
    
    return all_ok

def main():
    """Fonction principale"""
    print("🔍 VÉRIFICATION COMPLÈTE DU SYSTÈME")
    print("=" * 60)
    
    # 1. Serveurs
    django_ok, react_ok = check_servers()
    
    # 2. Base de données
    check_database()
    
    # 3. Images
    check_images()
    
    # 4. API
    api_ok = test_api_complete()
    
    # 5. Fichiers frontend
    frontend_ok = check_frontend_files()
    
    # Résumé
    print("\n📊 RÉSUMÉ FINAL")
    print("=" * 40)
    
    if django_ok:
        print("✅ Serveur Django: OK")
    else:
        print("❌ Serveur Django: PROBLÈME")
    
    if react_ok:
        print("✅ Serveur React: OK")
    else:
        print("❌ Serveur React: PROBLÈME")
    
    if api_ok:
        print("✅ API Backend: OK")
    else:
        print("❌ API Backend: PROBLÈME")
    
    if frontend_ok:
        print("✅ Fichiers Frontend: OK")
    else:
        print("❌ Fichiers Frontend: PROBLÈME")
    
    print("\n🎯 DIAGNOSTIC:")
    
    if django_ok and react_ok and api_ok and frontend_ok:
        print("✅ TOUT FONCTIONNE - Le problème est dans le navigateur/cache")
        print("\n💡 SOLUTION:")
        print("1. Ouvrez http://localhost:3002")
        print("2. Appuyez sur F12")
        print("3. Videz le cache: Ctrl+Shift+R")
        print("4. Déconnectez-vous et reconnectez-vous")
        print("5. Suivez INSTRUCTIONS_DEBUG_IMAGES.md")
    else:
        print("❌ PROBLÈMES DÉTECTÉS")
        if not django_ok:
            print("   → Démarrez Django: cd gestion_stock && py manage.py runserver")
        if not react_ok:
            print("   → Démarrez React: cd frontend && npm run dev")
        if not api_ok:
            print("   → Vérifiez les logs Django")
        if not frontend_ok:
            print("   → Vérifiez les fichiers frontend")

if __name__ == "__main__":
    main()