import os
import django
import sys
from pathlib import Path

# Configuration Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
django.setup()

from products.models import Product
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io

def create_test_image():
    """Crée une image de test en mémoire"""
    img = Image.new('RGB', (400, 300), color=(73, 109, 137))  # Couleur bleu-gris
    # Ajouter du texte si possible
    try:
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)
        # Utiliser une police par défaut
        font_size = 30
        text = "TEST IMAGE"
        # Dessiner le texte au centre
        bbox = draw.textbbox((0, 0), text)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        position = ((400 - text_width) // 2, (300 - text_height) // 2)
        draw.text(position, text, fill=(255, 255, 255))
    except:
        pass  # Si ImageDraw n'est pas disponible, on continue sans texte
    
    img_io = io.BytesIO()
    img.save(img_io, format='JPEG', quality=85)
    img_io.seek(0)
    return SimpleUploadedFile("test_image.jpg", img_io.read(), content_type="image/jpeg")

def main():
    print("=" * 60)
    print("🔄 TEST D'UPLOAD D'IMAGE POUR LES PRODUITS")
    print("=" * 60)
    print()
    
    # Vérifier que le dossier media existe
    media_root = BASE_DIR / 'media' / 'products'
    print(f"📁 Vérification du dossier media...")
    print(f"   Chemin : {media_root}")
    
    if not media_root.exists():
        print("⚠️  Le dossier n'existe pas, création...")
        media_root.mkdir(parents=True, exist_ok=True)
        print("✅ Dossier créé")
    else:
        print("✅ Dossier existe")
    
    print()
    
    # Lister les produits existants
    print("📋 Produits existants dans la base de données :")
    existing_products = Product.objects.all()
    if existing_products.exists():
        for p in existing_products:
            has_photo = "✅" if p.photo else "❌"
            print(f"   {has_photo} ID:{p.id} - {p.name} - Photo: {p.photo or 'Aucune'}")
    else:
        print("   Aucun produit trouvé")
    
    print()
    
    # Test de création d'un produit avec image
    print("🔄 Création d'un produit de test avec image...")
    try:
        test_image = create_test_image()
        product = Product.objects.create(
            name="Produit Test Image",
            description="Ceci est un produit de test pour vérifier l'upload d'images",
            category="Test",
            quantity=10,
            purchase_price=1000.00,
            sale_price=1500.00,
            alert_threshold=5,
            photo=test_image,
            is_active=True
        )
        
        print("✅ Produit créé avec succès !")
        print()
        print("📊 Informations du produit créé :")
        print(f"   ID           : {product.id}")
        print(f"   Nom          : {product.name}")
        print(f"   Photo path   : {product.photo}")
        print(f"   Photo URL    : {product.photo.url if product.photo else 'None'}")
        print()
        
        # Vérifier que le fichier existe physiquement
        if product.photo:
            full_path = product.photo.path
            print("📂 Vérification du fichier physique :")
            print(f"   Chemin complet : {full_path}")
            
            if os.path.exists(full_path):
                file_size = os.path.getsize(full_path)
                print(f"   ✅ Fichier créé avec succès")
                print(f"   📏 Taille : {file_size:,} bytes ({file_size / 1024:.2f} KB)")
            else:
                print(f"   ❌ ERREUR : Fichier non trouvé !")
        else:
            print("   ❌ ERREUR : Aucune photo enregistrée")
        
        print()
        print("🌐 Pour accéder à l'image dans le navigateur :")
        print(f"   http://localhost:8000{product.photo.url if product.photo else ''}")
        
    except Exception as e:
        print(f"❌ ERREUR lors de la création du produit :")
        print(f"   {str(e)}")
        import traceback
        print()
        print("📋 Traceback complet :")
        traceback.print_exc()
    
    print()
    print("=" * 60)
    print("✅ Test terminé")
    print("=" * 60)

if __name__ == '__main__':
    main()
