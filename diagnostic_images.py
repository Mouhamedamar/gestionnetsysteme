"""
Script de diagnostic pour le problème d'affichage des images
Exécutez ce script pour obtenir un rapport complet sur l'état du système
"""

import os
import sys
from pathlib import Path

print("=" * 80)
print("🔍 DIAGNOSTIC DES IMAGES - SYSTÈME DE GESTION DE STOCK")
print("=" * 80)
print()

# Vérifier la structure des dossiers
print("📁 VÉRIFICATION DES DOSSIERS")
print("-" * 80)

base_dir = Path(__file__).resolve().parent
gestion_stock_dir = base_dir / "gestion_stock"
media_dir = gestion_stock_dir / "media"
products_media_dir = media_dir / "products"

folders_to_check = [
    ("Dossier racine", base_dir),
    ("Dossier gestion_stock", gestion_stock_dir),
    ("Dossier media", media_dir),
    ("Dossier media/products", products_media_dir),
]

for name, folder in folders_to_check:
    status = "✅ Existe" if folder.exists() else "❌ N'existe pas"
    print(f"{status} - {name}")
    print(f"             {folder}")

print()

# Vérifier les fichiers dans media/products
print("📂 CONTENU DU DOSSIER MEDIA/PRODUCTS")
print("-" * 80)

if products_media_dir.exists():
    files = list(products_media_dir.glob("*"))
    if files:
        print(f"✅ {len(files)} fichier(s) trouvé(s) :")
        for file in files:
            size = file.stat().st_size if file.is_file() else 0
            file_type = "📄 Fichier" if file.is_file() else "📁 Dossier"
            print(f"   {file_type} : {file.name} ({size:,} bytes)")
    else:
        print("⚠️  Aucun fichier trouvé - C'est probablement la cause du problème !")
        print("   Les produits n'ont pas d'images téléchargées.")
else:
    print("❌ Le dossier media/products n'existe pas !")
    print("   Solution : Le dossier sera créé automatiquement au premier upload.")

print()

# Vérifier la configuration Django
print("⚙️  VÉRIFICATION DE LA CONFIGURATION DJANGO")
print("-" * 80)

settings_file = gestion_stock_dir / "gestion_stock" / "settings.py"
if settings_file.exists():
    print("✅ Fichier settings.py trouvé")
    
    with open(settings_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
        # Vérifier MEDIA_URL
        if "MEDIA_URL" in content:
            print("✅ MEDIA_URL configuré")
            # Extraire la valeur
            for line in content.split('\n'):
                if 'MEDIA_URL' in line and '=' in line and not line.strip().startswith('#'):
                    print(f"   {line.strip()}")
        else:
            print("❌ MEDIA_URL non trouvé dans settings.py")
        
        # Vérifier MEDIA_ROOT
        if "MEDIA_ROOT" in content:
            print("✅ MEDIA_ROOT configuré")
            for line in content.split('\n'):
                if 'MEDIA_ROOT' in line and '=' in line and not line.strip().startswith('#'):
                    print(f"   {line.strip()}")
        else:
            print("❌ MEDIA_ROOT non trouvé dans settings.py")
        
        # Vérifier Pillow
        if "Pillow" in content or "PIL" in content:
            print("✅ Référence à Pillow trouvée")
        else:
            print("⚠️  Pas de référence explicite à Pillow (normal)")
else:
    print("❌ Fichier settings.py non trouvé")

print()

# Vérifier la base de données Django
print("🗄️  VÉRIFICATION DE LA BASE DE DONNÉES")
print("-" * 80)

try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_stock.settings')
    sys.path.append(str(gestion_stock_dir))
    
    import django
    django.setup()
    
    from products.models import Product
    
    print("✅ Connexion à la base de données réussie")
    print()
    
    # Compter les produits
    total_products = Product.objects.all().count()
    products_with_photo = Product.objects.exclude(photo='').exclude(photo__isnull=True).count()
    products_without_photo = total_products - products_with_photo
    
    print(f"📊 Statistiques :")
    print(f"   Total de produits      : {total_products}")
    print(f"   Produits avec photo    : {products_with_photo}")
    print(f"   Produits sans photo    : {products_without_photo}")
    print()
    
    if products_with_photo > 0:
        print("📋 Produits avec photos enregistrées :")
        products = Product.objects.exclude(photo='').exclude(photo__isnull=True)[:5]
        for p in products:
            photo_path = gestion_stock_dir / "media" / str(p.photo)
            file_exists = "✅" if photo_path.exists() else "❌ FICHIER MANQUANT"
            print(f"   {file_exists} ID:{p.id} - {p.name}")
            print(f"                Photo DB: {p.photo}")
            if not photo_path.exists():
                print(f"                Chemin attendu: {photo_path}")
        
        if products_with_photo > 5:
            print(f"   ... et {products_with_photo - 5} autre(s)")
    else:
        print("⚠️  Aucun produit n'a de photo enregistrée dans la base de données")
        print("   C'est la cause du problème : les produits ont été créés sans images")
    
    print()
    
    # Vérifier les produits récents
    recent_products = Product.objects.all().order_by('-created_at')[:3]
    if recent_products:
        print("📅 3 derniers produits créés :")
        for p in recent_products:
            has_photo = "✅ Avec photo" if p.photo else "❌ Sans photo"
            print(f"   {has_photo} - {p.name} (créé le {p.created_at.strftime('%Y-%m-%d %H:%M')})")
    
except ImportError as e:
    print(f"❌ Erreur d'importation Django : {e}")
    print("   Assurez-vous que Django est installé : pip install django")
except Exception as e:
    print(f"❌ Erreur lors de la connexion à la base de données : {e}")
    import traceback
    traceback.print_exc()

print()

# Vérifications frontend
print("🌐 VÉRIFICATION DU FRONTEND")
print("-" * 80)

frontend_dir = base_dir / "frontend"
if frontend_dir.exists():
    print("✅ Dossier frontend trouvé")
    
    # Vérifier ProductCard.jsx
    product_card = frontend_dir / "src" / "components" / "ProductCard.jsx"
    if product_card.exists():
        print("✅ ProductCard.jsx trouvé")
        with open(product_card, 'r', encoding='utf-8') as f:
            content = f.read()
            if "BASE_URL = 'http://localhost:8000'" in content:
                print("✅ BASE_URL correctement configuré pour le développement")
            elif "BASE_URL" in content:
                print("⚠️  BASE_URL trouvé mais vérifiez la valeur")
            else:
                print("❌ BASE_URL non trouvé dans ProductCard.jsx")
    else:
        print("❌ ProductCard.jsx non trouvé")
    
    # Vérifier ProductForm.jsx
    product_form = frontend_dir / "src" / "components" / "ProductForm.jsx"
    if product_form.exists():
        print("✅ ProductForm.jsx trouvé")
    else:
        print("❌ ProductForm.jsx non trouvé")
else:
    print("❌ Dossier frontend non trouvé")

print()

# Recommandations
print("💡 RECOMMANDATIONS")
print("-" * 80)

recommendations = []

if not products_media_dir.exists():
    recommendations.append("Créer le dossier media/products : il sera créé automatiquement au premier upload")

if products_media_dir.exists() and not list(products_media_dir.glob("*")):
    recommendations.append("Le dossier media/products est vide. Les produits n'ont pas d'images.")
    recommendations.append("Solution : Ajoutez des images aux produits via l'interface web")

try:
    from products.models import Product
    if Product.objects.all().count() > 0:
        if Product.objects.exclude(photo='').exclude(photo__isnull=True).count() == 0:
            recommendations.append("Aucun produit n'a de photo dans la base de données")
            recommendations.append("Solution 1 : Éditez les produits existants et ajoutez des images")
            recommendations.append("Solution 2 : Créez de nouveaux produits avec des images")
            recommendations.append("Solution 3 : Exécutez le script de test : python gestion_stock/test_upload_image.py")
except:
    pass

if not recommendations:
    recommendations.append("✅ La configuration semble correcte")
    recommendations.append("Si les images ne s'affichent pas, vérifiez que :")
    recommendations.append("  1. Le serveur Django est démarré (python manage.py runserver)")
    recommendations.append("  2. Le serveur frontend est démarré (npm run dev)")
    recommendations.append("  3. Les deux serveurs tournent sur les bons ports")

for i, rec in enumerate(recommendations, 1):
    print(f"{i}. {rec}")

print()
print("=" * 80)
print("✅ DIAGNOSTIC TERMINÉ")
print("=" * 80)
print()
print("📖 Pour plus de détails, consultez : GUIDE_RESOLUTION_IMAGES.md")
print("🧪 Pour tester l'upload : python gestion_stock/test_upload_image.py")
print()
