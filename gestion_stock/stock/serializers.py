from rest_framework import serializers
from .models import StockMovement
from products.serializers import ProductSerializer


class StockMovementSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle StockMovement
    """
    product_detail = ProductSerializer(source='product', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id',
            'product',
            'product_detail',
            'product_name',
            'movement_type',
            'quantity',
            'date',
            'comment',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        """Validation personnalisée"""
        product = data.get('product')
        movement_type = data.get('movement_type')
        quantity = data.get('quantity')

        if product and movement_type == 'SORTIE' and quantity:
            # Vérifier le stock disponible (sans compter les soft deletes)
            available_stock = product.quantity
            if available_stock < quantity:
                raise serializers.ValidationError(
                    {
                        'quantity': f"Stock insuffisant. Stock disponible: {available_stock}, "
                                   f"demandé: {quantity}"
                    }
                )
        return data


class StockMovementCreateSerializer(serializers.ModelSerializer):
    """
    Serializer pour la création de mouvements de stock
    """
    class Meta:
        model = StockMovement
        fields = [
            'product',
            'movement_type',
            'quantity',
            'date',
            'comment',
        ]

    def validate(self, data):
        """Validation personnalisée"""
        product = data.get('product')
        movement_type = data.get('movement_type')
        quantity = data.get('quantity')

        if product and movement_type == 'SORTIE' and quantity:
            available_stock = product.quantity
            if available_stock < quantity:
                raise serializers.ValidationError(
                    {
                        'quantity': f"Stock insuffisant. Stock disponible: {available_stock}, "
                                   f"demandé: {quantity}"
                    }
                )
        return data

