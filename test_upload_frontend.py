#!/usr/bin/env python3
"""
Test spécifique pour l'upload frontend
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

def test_api_access():
    """Teste l'accès à l'API"""
    print("🔍 TEST ACCÈS API")
    print("=" * 30)
    
    try:
        # Test API produits
        response = urllib.request.urlopen('http://localhost:8000/api/products/', timeout=10)
        if response.getcode() == 200:
            data = json.loads(response.read().decode('utf-8'))
            print(f"✅ API accessible - {len(data)} produits")
            
            # Vérifier les URLs d'images
            products_with_images = [p for p in data if p.get('photo_url')]
            print(f"✅ Produits avec photo_url: {len(products_with_images)}")
            
            # Tester quelques URLs d'images
            for product in products_with_images[:3]:
                img_url = product['photo_url']
                print(f"\n🧪 Test image: {product['name']}")
                print(f"   URL: {img_url}")
                
                try:
                    img_response = urllib.request.urlopen(img_url, timeout=5)
                    if img_response.getcode() == 200:
                        print(f"   ✅ Image accessible ({len(img_response.read())} bytes)")
                    else:
                        print(f"   ❌ Erreur {img_response.getcode()}")
                except Exception as e:
                    print(f"   ❌ Erreur accès image: {e}")
            
            return True
        else:
            print(f"❌ API erreur: {response.getcode()}")
            return False
    except Exception as e:
        print(f"❌ Erreur API: {e}")
        return False

def test_login_and_upload():
    """Teste la connexion et l'upload"""
    print("\n🔐 TEST CONNEXION ET UPLOAD")
    print("=" * 30)
    
    try:
        # 1. Connexion
        login_data = json.dumps({'username': 'admin', 'password': 'admin123'}).encode('utf-8')
        req = urllib.request.Request(
            'http://localhost:8000/api/auth/login/',
            data=login_data,
            headers={'Content-Type': 'application/json'}
        )
        response = urllib.request.urlopen(req, timeout=10)
        
        if response.getcode() != 200:
            print(f"❌ Échec connexion: {response.getcode()}")
            return False
        
        result = json.loads(response.read().decode('utf-8'))
        token = result.get('access')
        print("✅ Connexion réussie")
        
        # 2. Test création produit simple (sans image)
        product_data = {
            'name': 'Test API Direct',
            'description': 'Test via API directe',
            'category': 'Test',
            'quantity': 5,
            'purchase_price': 10.00,
            'sale_price': 15.00,
            'alert_threshold': 2,
            'is_active': True
        }
        
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
            print(f"❌ Échec création produit: {response.getcode()}")
            print(response.read().decode('utf-8'))
            return False
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def create_frontend_debug_guide():
    """Crée un guide de debug pour le frontend"""
    print("\n📝 CRÉATION GUIDE DEBUG FRONTEND")
    print("=" * 30)
    
    guide = """
# 🔍 GUIDE DEBUG FRONTEND - UPLOAD IMAGES

## 🚨 PROBLÈME IDENTIFIÉ

Les images ne s'affichent pas correctement dans l'interface (couleurs unies au lieu des vraies images).

## 🔧 ÉTAPES DE DEBUG

### 1. Ouvrir les outils de développement

1. **Appuyez sur F12** dans votre navigateur
2. **Allez dans l'onglet Console**
3. **Allez dans l'onglet Network**

### 2. Tenter un upload d'image

1. **Allez dans Produits > Ajouter**
2. **Remplissez le formulaire**
3. **Sélectionnez une image**
4. **Observez la console** pendant l'upload

### 3. Messages à chercher dans la Console

**Messages normaux (succès) :**
```
🔵 handleFileChange appelé
✅ Fichier sélectionné: image.jpg image/jpeg 12345
✅ Preview généré
🔵 handleSubmit appelé, mode: create
✅ Ajout de la photo au FormData
🔵 Envoi de la requête...
✅ Requête terminée avec succès
```

**Messages d'erreur :**
```
❌ Session expirée
❌ Type de fichier invalide
❌ Fichier trop grand
❌ Network Error
❌ 401 Unauthorized
❌ 500 Internal Server Error
```

### 4. Vérifier l'onglet Network

1. **Filtrez par "XHR" ou "Fetch"**
2. **Cherchez la requête** vers `/api/products/`
3. **Vérifiez le statut** : doit être `201 Created`
4. **Vérifiez la réponse** : doit contenir `photo_url`

### 5. Tester les URLs d'images directement

Ouvrez ces URLs dans votre navigateur :
- http://localhost:8000/media/products/product_1_wifi.jpg
- http://localhost:8000/media/products/product_8_Écran_24_.jpg

Si elles ne s'ouvrent pas, le problème est côté serveur.

## 🔧 SOLUTIONS RAPIDES

### Solution 1 : Vider le cache
- **Ctrl+Shift+R** (Windows) ou **Cmd+Shift+R** (Mac)

### Solution 2 : Reconnecter
- Déconnectez-vous et reconnectez-vous avec admin/admin123

### Solution 3 : Redémarrer les serveurs
- Fermez les terminaux et redémarrez Django et React

### Solution 4 : Tester avec l'admin Django
- Allez sur http://localhost:8000/admin/
- Connectez-vous avec admin/admin123
- Allez dans Products
- Essayez d'ajouter une image via l'interface admin

## 📋 CHECKLIST

- [ ] Serveur Django tourne sur port 8000
- [ ] Serveur React tourne sur port 3002
- [ ] Connexion admin/admin123 fonctionne
- [ ] Console F12 ouverte
- [ ] Image < 5MB au format JPG/PNG
- [ ] Cache navigateur vidé

## 🆘 SI RIEN NE MARCHE

1. **Copiez TOUS les messages** de la console (F12)
2. **Copiez les erreurs** de l'onglet Network
3. **Testez les URLs d'images** directement dans le navigateur
4. **Vérifiez les logs Django** dans le terminal

---

**💡 Le problème vient probablement d'un token expiré ou d'un problème de CORS. Reconnectez-vous d'abord !**
"""
    
    with open('DEBUG_FRONTEND_IMAGES.md', 'w', encoding='utf-8') as f:
        f.write(guide)
    
    print("✅ Guide créé: DEBUG_FRONTEND_IMAGES.md")

def main():
    """Fonction principale"""
    print("🧪 TEST UPLOAD FRONTEND - DIAGNOSTIC COMPLET")
    print("=" * 50)
    
    # 1. Tester l'accès API
    api_ok = test_api_access()
    
    # 2. Tester connexion et upload
    upload_ok = test_login_and_upload()
    
    # 3. Créer le guide de debug
    create_frontend_debug_guide()
    
    print("\n📊 RÉSUMÉ")
    print("=" * 30)
    
    if api_ok and upload_ok:
        print("✅ Backend: FONCTIONNE PARFAITEMENT")
        print("🔍 Problème: FRONTEND ou NAVIGATEUR")
        print("\n💡 ACTIONS:")
        print("1. Suivez le guide DEBUG_FRONTEND_IMAGES.md")
        print("2. Ouvrez F12 et regardez la console")
        print("3. Testez l'upload et observez les erreurs")
        print("4. Reconnectez-vous si token expiré")
    else:
        print("❌ Backend: PROBLÈME DÉTECTÉ")
        print("🔧 Redémarrez le serveur Django")
    
    print(f"\n🌐 URLs à tester:")
    print("- Interface: http://localhost:3002")
    print("- API: http://localhost:8000/api/products/")
    print("- Admin: http://localhost:8000/admin/")

if __name__ == "__main__":
    main()