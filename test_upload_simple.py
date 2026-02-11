#!/usr/bin/env python3
"""
Script simple pour tester l'upload d'images sans dépendances externes
"""
import os
import sys
import django
from pathlib import Path

# Configuration Django
sys.path.append('gestion_stock')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth.models import User

def test_direct_upload():
    """Teste l'upload direct via le modèle Django"""
    print("🧪 TEST D'UPLOAD DIRECT")
    print("=" * 40)
    
    # Prendre une image existante
    media_path = Path('gestion_stock/media/products')
    image_files = list(media_path.glob('*.jpg'))
    
    if not image_files:
        print("❌ Aucune image de test disponible")
        return False
    
    test_image = image_files[0]
    print(f"📸 Image de test: {test_image.name}")
    
    try:
        # Lire le fichier image
        with open(test_image, 'rb') as img_file:
            image_content = img_file.read()
        
        # Créer un fichier uploadé simulé
        uploaded_file = SimpleUploadedFile(
            name=f"test_upload_{test_image.name}",
            content=image_content,
            content_type='image/jpeg'
        )
        
        # Créer un produit avec l'image
        product = Product.objects.create(
            name='Test Upload Direct',
            description='Test d\'upload d\'image direct',
            category='Test',
            quantity=10,
            purchase_price=50.00,
            sale_price=75.00,
            alert_threshold=5,
            photo=uploaded_file
        )
        
        print("✅ Produit créé avec succès!")
        print(f"   ID: {product.id}")
        print(f"   Nom: {product.name}")
        print(f"   Photo: {product.photo}")
        
        # Vérifier que le fichier existe
        if product.photo and product.photo.name:
            photo_path = Path(product.photo.path)
            if photo_path.exists():
                print(f"✅ Fichier image créé: {photo_path}")
                print(f"   Taille: {photo_path.stat().st_size} bytes")
            else:
                print(f"❌ Fichier image non trouvé: {photo_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de l'upload: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_product_update():
    """Teste la modification d'image d'un produit"""
    print("\n🔄 TEST DE MODIFICATION D'IMAGE")
    print("=" * 40)
    
    # Récupérer un produit existant
    products = Product.objects.filter(deleted_at__isnull=True)
    if not products.exists():
        print("❌ Aucun produit disponible")
        return False
    
    product = products.first()
    print(f"📦 Produit: {product.name} (ID: {product.id})")
    print(f"   Image actuelle: {product.photo}")
    
    # Prendre une autre image
    media_path = Path('gestion_stock/media/products')
    image_files = list(media_path.glob('*.jpg'))
    
    if len(image_files) < 2:
        print("❌ Pas assez d'images pour le test")
        return False
    
    # Choisir une image différente
    new_image = image_files[1] if image_files[0].name in str(product.photo) else image_files[0]
    print(f"📸 Nouvelle image: {new_image.name}")
    
    try:
        # Lire la nouvelle image
        with open(new_image, 'rb') as img_file:
            image_content = img_file.read()
        
        # Créer un fichier uploadé
        uploaded_file = SimpleUploadedFile(
            name=f"updated_{new_image.name}",
            content=image_content,
            content_type='image/jpeg'
        )
        
        # Modifier l'image
        old_photo = product.photo
        product.photo = uploaded_file
        product.save()
        
        print("✅ Image modifiée avec succès!")
        print(f"   Ancienne photo: {old_photo}")
        print(f"   Nouvelle photo: {product.photo}")
        
        # Vérifier le nouveau fichier
        if product.photo and product.photo.name:
            photo_path = Path(product.photo.path)
            if photo_path.exists():
                print(f"✅ Nouveau fichier créé: {photo_path}")
                print(f"   Taille: {photo_path.stat().st_size} bytes")
            else:
                print(f"❌ Nouveau fichier non trouvé: {photo_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la modification: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_serializer():
    """Teste le serializer avec photo_url"""
    print("\n🔗 TEST SERIALIZER PHOTO_URL")
    print("=" * 40)
    
    from products.serializers import ProductSerializer
    from django.test import RequestFactory
    
    # Créer une fausse requête
    factory = RequestFactory()
    request = factory.get('/')
    request.META['HTTP_HOST'] = 'localhost:8000'
    request.META['wsgi.url_scheme'] = 'http'
    
    # Récupérer un produit avec image
    products_with_photo = Product.objects.filter(
        deleted_at__isnull=True,
        photo__isnull=False
    ).exclude(photo='')
    
    if not products_with_photo.exists():
        print("❌ Aucun produit avec image trouvé")
        return False
    
    product = products_with_photo.first()
    print(f"📦 Produit testé: {product.name}")
    print(f"   Photo: {product.photo}")
    
    # Sérialiser avec contexte
    serializer = ProductSerializer(product, context={'request': request})
    data = serializer.data
    
    print(f"✅ Sérialisation réussie")
    print(f"   photo: {data.get('photo')}")
    print(f"   photo_url: {data.get('photo_url')}")
    
    return True

def main():
    """Fonction principale"""
    print("🧪 TEST COMPLET D'UPLOAD D'IMAGES (DIRECT)")
    print("=" * 60)
    
    tests = []
    
    # 1. Test upload direct
    tests.append(test_direct_upload())
    
    # 2. Test modification
    tests.append(test_product_update())
    
    # 3. Test serializer
    tests.append(check_serializer())
    
    # Résumé
    print("\n📊 RÉSUMÉ DES TESTS")
    print("=" * 40)
    
    passed = sum(tests)
    total = len(tests)
    
    if passed == total:
        print("🎉 TOUS LES TESTS SONT PASSÉS!")
        print("\n✅ L'upload d'images fonctionne correctement au niveau Django")
        print("\n🔍 SI LE PROBLÈME PERSISTE DANS L'INTERFACE WEB:")
        print("   1. Vérifiez la console du navigateur (F12)")
        print("   2. Vérifiez l'onglet Network pour les requêtes API")
        print("   3. Redémarrez le serveur Django")
        print("   4. Videz le cache du navigateur")
    else:
        print(f"⚠️  {passed}/{total} tests réussis")
        print("\n❌ Il y a des problèmes au niveau Django")
    
    # Afficher les produits avec images
    print("\n📋 PRODUITS AVEC IMAGES:")
    products_with_images = Product.objects.filter(
        deleted_at__isnull=True,
        photo__isnull=False
    ).exclude(photo='')
    
    for product in products_with_images:
        print(f"   ✅ {product.name} - {product.photo}")

if __name__ == "__main__":
    main()