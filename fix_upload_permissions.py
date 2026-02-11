#!/usr/bin/env python3
"""
Script pour corriger les problèmes d'upload d'images
"""
import os
import sys
import django
from pathlib import Path

# Configuration Django
sys.path.append('gestion_stock')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from django.conf import settings
from django.contrib.auth.models import User

def check_django_settings():
    """Vérifie la configuration Django pour les médias"""
    print("⚙️  VÉRIFICATION CONFIGURATION DJANGO")
    print("=" * 40)
    
    print(f"MEDIA_URL: {settings.MEDIA_URL}")
    print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
    
    # Vérifier que MEDIA_ROOT existe
    media_root = Path(settings.MEDIA_ROOT)
    if not media_root.exists():
        print(f"❌ MEDIA_ROOT n'existe pas: {media_root}")
        try:
            media_root.mkdir(parents=True, exist_ok=True)
            print(f"✅ MEDIA_ROOT créé: {media_root}")
        except Exception as e:
            print(f"❌ Impossible de créer MEDIA_ROOT: {e}")
            return False
    else:
        print(f"✅ MEDIA_ROOT existe: {media_root}")
    
    # Vérifier le dossier products
    products_dir = media_root / 'products'
    if not products_dir.exists():
        try:
            products_dir.mkdir(parents=True, exist_ok=True)
            print(f"✅ Dossier products créé: {products_dir}")
        except Exception as e:
            print(f"❌ Impossible de créer le dossier products: {e}")
            return False
    else:
        print(f"✅ Dossier products existe: {products_dir}")
    
    return True

def check_user_permissions():
    """Vérifie les permissions utilisateur"""
    print("\n👤 VÉRIFICATION UTILISATEUR ADMIN")
    print("=" * 40)
    
    try:
        admin_user = User.objects.get(username='admin')
        print(f"✅ Utilisateur admin trouvé: {admin_user.username}")
        print(f"   is_staff: {admin_user.is_staff}")
        print(f"   is_superuser: {admin_user.is_superuser}")
        print(f"   is_active: {admin_user.is_active}")
        
        if not admin_user.is_staff:
            admin_user.is_staff = True
            admin_user.save()
            print("✅ is_staff activé pour admin")
        
        if not admin_user.is_active:
            admin_user.is_active = True
            admin_user.save()
            print("✅ is_active activé pour admin")
        
        return True
    except User.DoesNotExist:
        print("❌ Utilisateur admin introuvable")
        try:
            admin_user = User.objects.create_user(
                username='admin',
                email='admin@example.com',
                password='admin123',
                is_staff=True,
                is_superuser=True,
                is_active=True
            )
            print("✅ Utilisateur admin créé")
            return True
        except Exception as e:
            print(f"❌ Impossible de créer l'utilisateur admin: {e}")
            return False

def test_file_operations():
    """Teste les opérations sur les fichiers"""
    print("\n📁 TEST OPÉRATIONS FICHIERS")
    print("=" * 40)
    
    products_dir = Path(settings.MEDIA_ROOT) / 'products'
    
    # Test d'écriture
    test_file = products_dir / 'test_write.txt'
    try:
        test_file.write_text('Test d\'écriture')
        print("✅ Écriture de fichier OK")
        
        # Test de lecture
        content = test_file.read_text()
        if content == 'Test d\'écriture':
            print("✅ Lecture de fichier OK")
        else:
            print("❌ Problème de lecture de fichier")
        
        # Test de suppression
        test_file.unlink()
        print("✅ Suppression de fichier OK")
        
        return True
    except Exception as e:
        print(f"❌ Erreur opérations fichiers: {e}")
        return False

def check_cors_settings():
    """Vérifie la configuration CORS"""
    print("\n🌐 VÉRIFICATION CORS")
    print("=" * 40)
    
    cors_settings = [
        'CORS_ALLOW_ALL_ORIGINS',
        'CORS_ALLOWED_ORIGINS',
        'CORS_ALLOW_CREDENTIALS'
    ]
    
    for setting in cors_settings:
        if hasattr(settings, setting):
            value = getattr(settings, setting)
            print(f"✅ {setting}: {value}")
        else:
            print(f"⚠️  {setting}: Non défini")
    
    return True

def check_installed_apps():
    """Vérifie les apps installées nécessaires"""
    print("\n📦 VÉRIFICATION APPS INSTALLÉES")
    print("=" * 40)
    
    required_apps = [
        'rest_framework',
        'corsheaders',
        'products',
        'django.contrib.staticfiles'
    ]
    
    for app in required_apps:
        if app in settings.INSTALLED_APPS:
            print(f"✅ {app}")
        else:
            print(f"❌ {app} - MANQUANT")
    
    return True

def create_test_image():
    """Crée une image de test simple"""
    print("\n🖼️  CRÉATION IMAGE DE TEST")
    print("=" * 40)
    
    try:
        from PIL import Image
        
        # Créer une image simple
        img = Image.new('RGB', (100, 100), color='red')
        test_path = Path(settings.MEDIA_ROOT) / 'products' / 'test_upload.jpg'
        img.save(test_path, 'JPEG')
        
        print(f"✅ Image de test créée: {test_path}")
        print(f"   Taille: {test_path.stat().st_size} bytes")
        
        return True
    except ImportError:
        print("⚠️  PIL/Pillow non installé - impossible de créer une image de test")
        return False
    except Exception as e:
        print(f"❌ Erreur création image de test: {e}")
        return False

def main():
    """Fonction principale"""
    print("🔧 CORRECTION DES PROBLÈMES D'UPLOAD")
    print("=" * 60)
    
    checks = []
    
    # 1. Configuration Django
    checks.append(check_django_settings())
    
    # 2. Permissions utilisateur
    checks.append(check_user_permissions())
    
    # 3. Opérations fichiers
    checks.append(test_file_operations())
    
    # 4. CORS
    checks.append(check_cors_settings())
    
    # 5. Apps installées
    checks.append(check_installed_apps())
    
    # 6. Image de test
    create_test_image()
    
    # Résumé
    print("\n📊 RÉSUMÉ")
    print("=" * 40)
    
    passed = sum(checks)
    total = len(checks)
    
    if passed == total:
        print("🎉 TOUTES LES VÉRIFICATIONS SONT PASSÉES!")
        print("\n🚀 PROCHAINES ÉTAPES:")
        print("   1. Redémarrez le serveur Django")
        print("   2. Testez l'upload via l'interface web")
        print("   3. Ou exécutez: py test_image_upload.py")
    else:
        print(f"⚠️  {passed}/{total} vérifications réussies")
        print("\n🔧 ACTIONS NÉCESSAIRES:")
        print("   1. Corrigez les erreurs ci-dessus")
        print("   2. Vérifiez les permissions du système de fichiers")
        print("   3. Redémarrez le serveur Django")
    
    print("\n💡 CONSEILS SUPPLÉMENTAIRES:")
    print("   - Vérifiez que Python a les droits d'écriture sur le dossier media/")
    print("   - Sur Windows, exécutez en tant qu'administrateur si nécessaire")
    print("   - Vérifiez l'espace disque disponible")

if __name__ == "__main__":
    main()