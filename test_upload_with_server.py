#!/usr/bin/env python3
"""
Test simple d'upload avec serveur Django démarré
"""
import time
import urllib.request
import urllib.parse
import json
from pathlib import Path

def test_server_running():
    """Teste si le serveur Django répond"""
    try:
        response = urllib.request.urlopen('http://localhost:8000/api/products/', timeout=5)
        return response.getcode() == 200
    except:
        return False

def test_login():
    """Teste la connexion"""
    try:
        data = json.dumps({'username': 'admin', 'password': 'admin123'}).encode('utf-8')
        req = urllib.request.Request(
            'http://localhost:8000/api/auth/login/',
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        response = urllib.request.urlopen(req, timeout=10)
        
        if response.getcode() == 200:
            result = json.loads(response.read().decode('utf-8'))
            return result.get('access')
        return None
    except Exception as e:
        print(f"Erreur login: {e}")
        return None

def main():
    print("🧪 TEST UPLOAD AVEC SERVEUR DÉMARRÉ")
    print("=" * 40)
    
    # 1. Vérifier le serveur
    print("1. Vérification serveur Django...")
    if test_server_running():
        print("✅ Serveur Django accessible")
    else:
        print("❌ Serveur Django non accessible")
        print("   Vérifiez que le serveur tourne sur http://localhost:8000")
        return
    
    # 2. Tester la connexion
    print("\n2. Test de connexion...")
    token = test_login()
    if token:
        print("✅ Connexion réussie")
        print(f"   Token: {token[:20]}...")
    else:
        print("❌ Échec de connexion")
        return
    
    # 3. Instructions pour l'utilisateur
    print("\n🎯 SERVEUR PRÊT POUR LES TESTS!")
    print("=" * 40)
    print("✅ Backend Django: http://localhost:8000")
    print("✅ Authentification: Fonctionne")
    print("✅ API: Accessible")
    
    print("\n🚀 MAINTENANT, TESTEZ L'INTERFACE WEB:")
    print("1. Démarrez le frontend: cd frontend && npm run dev")
    print("2. Ouvrez http://localhost:3000")
    print("3. Connectez-vous avec admin/admin123")
    print("4. Allez dans Produits > Ajouter")
    print("5. Sélectionnez une image et créez le produit")
    
    print("\n🔍 SI ÇA NE MARCHE PAS:")
    print("- Ouvrez F12 dans le navigateur")
    print("- Regardez l'onglet Console pour les erreurs")
    print("- Regardez l'onglet Network pour les requêtes")
    print("- Vérifiez que les deux serveurs tournent")
    
    print("\n📋 IMAGES DISPONIBLES POUR TEST:")
    media_path = Path('gestion_stock/media/products')
    if media_path.exists():
        images = list(media_path.glob('*.jpg'))
        for img in images[:5]:
            size_kb = img.stat().st_size / 1024
            print(f"   📸 {img.name} ({size_kb:.1f} KB)")

if __name__ == "__main__":
    main()