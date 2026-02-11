#!/usr/bin/env python3
"""
Script de diagnostic en temps réel pour l'upload d'images
"""
import os
import sys
import django
import json
from pathlib import Path

# Configuration Django
sys.path.append('gestion_stock')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product
from django.contrib.auth.models import User
from django.test import Client
from django.core.files.uploadedfile import SimpleUploadedFile

def test_api_login():
    """Teste la connexion API"""
    print("🔐 TEST CONNEXION API")
    print("=" * 30)
    
    client = Client()
    
    # Tester la connexion
    response = client.post('/api/auth/login/', {
        'username': 'admin',
        'password': 'admin123'
    }, content_type='application/json')
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Connexion réussie")
        print(f"Access token: {data.get('access', 'N/A')[:20]}...")
        return data.get('access')
    else:
        print("❌ Échec de connexion")
        print(f"Response: {response.content.decode()}")
        return None

def test_api_upload():
    """Teste l'upload via l'API Django Test Client"""
    print("\n📤 TEST UPLOAD VIA API")
    print("=" * 30)
    
    # Connexion
    token = test_api_login()
    if not token:
        return False
    
    client = Client()
    
    # Préparer une image de test
    media_path = Path('gestion_stock/media/products')
    image_files = list(media_path.glob('*.jpg'))
    
    if not image_files:
        print("❌ Aucune image de test disponible")
        return False
    
    test_image = image_files[0]
    print(f"📸 Image de test: {test_image.name}")
    
    # Lire l'image
    with open(test_image, 'rb') as img_file:
        image_content = img_file.read()
    
    # Créer un fichier uploadé
    uploaded_file = SimpleUploadedFile(
        name=f"api_test_{test_image.name}",
        content=image_content,
        content_type='image/jpeg'
    )
    
    # Données du produit
    data = {
        'name': 'Test API Upload',
        'description': 'Test upload via API Django',
        'category': 'Test',
        'quantity': 10,
        'purchase_price': 50.00,
        'sale_price': 75.00,
        'alert_threshold': 5,
        'is_active': True,
        'photo': uploaded_file
    }
    
    # Headers avec token
    headers = {
        'HTTP_AUTHORIZATION': f'Bearer {token}'
    }
    
    # Envoyer la requête
    response = client.post('/api/products/', data, **headers)
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 201:
        data = response.json()
        print("✅ Upload réussi via API")
        print(f"ID: {data.get('id')}")
        print(f"Nom: {data.get('name')}")
        print(f"Photo: {data.get('photo')}")
        print(f"Photo URL: {data.get('photo_url')}")
        return True
    else:
        print("❌ Échec upload")
        print(f"Response: {response.content.decode()}")
        return False

def check_frontend_files():
    """Vérifie les fichiers frontend critiques"""
    print("\n🔍 VÉRIFICATION FICHIERS FRONTEND")
    print("=" * 30)
    
    critical_files = [
        'frontend/src/components/ProductForm.jsx',
        'frontend/src/context/AppContext.jsx',
        'frontend/src/components/ProductCard.jsx'
    ]
    
    for file_path in critical_files:
        path = Path(file_path)
        if path.exists():
            print(f"✅ {file_path}")
            
            # Vérifier les fonctions critiques
            content = path.read_text(encoding='utf-8')
            
            if 'ProductForm.jsx' in file_path:
                if 'handleFileChange' in content:
                    print("   ✅ handleFileChange trouvé")
                else:
                    print("   ❌ handleFileChange manquant")
                
                if 'FormData' in content:
                    print("   ✅ FormData utilisé")
                else:
                    print("   ❌ FormData manquant")
            
            elif 'AppContext.jsx' in file_path:
                if 'addProduct' in content:
                    print("   ✅ addProduct trouvé")
                else:
                    print("   ❌ addProduct manquant")
                
                if 'updateProduct' in content:
                    print("   ✅ updateProduct trouvé")
                else:
                    print("   ❌ updateProduct manquant")
        else:
            print(f"❌ {file_path} - MANQUANT")

def check_current_products():
    """Vérifie l'état actuel des produits"""
    print("\n📦 ÉTAT ACTUEL DES PRODUITS")
    print("=" * 30)
    
    products = Product.objects.filter(deleted_at__isnull=True)
    print(f"Total produits: {products.count()}")
    
    with_images = products.exclude(photo__isnull=True).exclude(photo='')
    without_images = products.filter(photo__isnull=True) | products.filter(photo='')
    
    print(f"Avec images: {with_images.count()}")
    print(f"Sans images: {without_images.count()}")
    
    print("\n📋 DÉTAIL (5 premiers):")
    for product in products[:5]:
        status = "✅" if product.photo else "❌"
        print(f"{status} {product.name}")
        if product.photo:
            print(f"    📸 {product.photo}")

def create_debug_frontend_fix():
    """Crée un correctif pour le frontend"""
    print("\n🔧 CRÉATION CORRECTIF FRONTEND")
    print("=" * 30)
    
    # Correctif pour ProductForm.jsx
    fix_content = '''
// CORRECTIF TEMPORAIRE - Ajoutez ceci dans handleSubmit après la ligne "console.log('🔵 Envoi de la requête...');"

console.log('🔍 DEBUG - Contenu FormData:');
for (let [key, value] of formDataToSend.entries()) {
  if (value instanceof File) {
    console.log(`📁 ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
  } else {
    console.log(`📝 ${key}: ${value}`);
  }
}

console.log('🔍 DEBUG - Headers de la requête:');
console.log('Authorization:', localStorage.getItem('accessToken') ? 'Bearer [TOKEN]' : 'AUCUN TOKEN');

// Ajoutez aussi ceci dans handleFileChange après "console.log('🔵 Fichier détecté:', file);"
if (file) {
  console.log('🔍 DEBUG - Détails du fichier:');
  console.log('  Nom:', file.name);
  console.log('  Taille:', file.size, 'bytes');
  console.log('  Type:', file.type);
  console.log('  Dernière modification:', new Date(file.lastModified));
}
'''
    
    with open('CORRECTIF_FRONTEND.txt', 'w', encoding='utf-8') as f:
        f.write(fix_content)
    
    print("✅ Correctif créé: CORRECTIF_FRONTEND.txt")

def main():
    """Fonction principale"""
    print("🚨 DIAGNOSTIC UPLOAD IMAGES - TEMPS RÉEL")
    print("=" * 50)
    
    # 1. Vérifier l'état des produits
    check_current_products()
    
    # 2. Tester l'API
    api_works = test_api_upload()
    
    # 3. Vérifier les fichiers frontend
    check_frontend_files()
    
    # 4. Créer un correctif
    create_debug_frontend_fix()
    
    print("\n📊 RÉSUMÉ DU DIAGNOSTIC")
    print("=" * 30)
    
    if api_works:
        print("✅ API Backend: FONCTIONNE")
        print("🔍 Problème probable: FRONTEND")
        print("\n💡 ACTIONS À FAIRE:")
        print("1. Ouvrez votre navigateur sur http://localhost:3000")
        print("2. Appuyez sur F12 (outils développeur)")
        print("3. Allez dans l'onglet Console")
        print("4. Tentez d'ajouter/modifier une image")
        print("5. Copiez TOUS les messages de la console")
        print("6. Regardez l'onglet Network pour voir les requêtes HTTP")
        
        print("\n🔧 CORRECTIFS POSSIBLES:")
        print("- Token d'authentification expiré → Reconnectez-vous")
        print("- Cache navigateur → Ctrl+Shift+R")
        print("- Serveur frontend non démarré → npm run dev")
        print("- CORS bloqué → Vérifiez les deux serveurs")
    else:
        print("❌ API Backend: PROBLÈME")
        print("🔧 Redémarrez le serveur Django")
    
    print(f"\n📁 Fichiers créés:")
    print("- CORRECTIF_FRONTEND.txt (code de debug)")

if __name__ == "__main__":
    main()