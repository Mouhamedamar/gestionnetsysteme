from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle Product
    """
    is_low_stock = serializers.BooleanField(read_only=True)
    
    # Définition des champs obligatoires avec messages d'erreur personnalisés
    name = serializers.CharField(
        required=True,
        error_messages={
            'blank': 'Le nom du produit est obligatoire',
            'null': 'Le nom du produit est obligatoire'
        }
    )
    purchase_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0,
        required=True,
        error_messages={
            'required': 'Le prix d\'achat est obligatoire',
            'min_value': 'Le prix doit être supérieur ou égal à 0',
            'invalid': 'Veuillez entrer un prix valide'
        }
    )
    sale_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0,
        required=True,
        error_messages={
            'required': 'Le prix de vente est obligatoire',
            'min_value': 'Le prix doit être supérieur ou égal à 0',
            'invalid': 'Veuillez entrer un prix valide'
        }
    )
    quantity = serializers.IntegerField(
        min_value=0,
        default=0,
        error_messages={
            'min_value': 'La quantité ne peut pas être négative',
            'invalid': 'Veuillez entrer un nombre valide'
        }
    )

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'description',
            'category',
            'quantity',
            'purchase_price',
            'sale_price',
            'alert_threshold',
            'photo',
            'is_active',
            'is_low_stock',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_low_stock']

    def validate(self, data):
        """Validation personnalisée"""
        # Vérifier que le prix de vente est supérieur au prix d'achat
        purchase_price = data.get('purchase_price', self.instance.purchase_price if self.instance else None)
        sale_price = data.get('sale_price', self.instance.sale_price if self.instance else None)
        
        if purchase_price and sale_price and sale_price < purchase_price:
            raise serializers.ValidationError(
                "Le prix de vente doit être supérieur ou égal au prix d'achat"
            )
        
        return data


class ProductListSerializer(serializers.ModelSerializer):
    """
    Serializer simplifié pour la liste des produits
    """
    is_low_stock = serializers.BooleanField(read_only=True)
    total_sold = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'category',
            'quantity',
            'purchase_price',
            'sale_price',
            'alert_threshold',
            'photo',
            'is_low_stock',
            'total_sold',
            'is_active',
        ]
