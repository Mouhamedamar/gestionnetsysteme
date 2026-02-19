from rest_framework import serializers
from .models import StockMovement, StockNotificationRecipient, StockAlertSettings
from products.serializers import ProductSerializer


class StockNotificationRecipientSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockNotificationRecipient
        fields = ['id', 'name', 'phone', 'email', 'is_active', 'created_at']

    def validate(self, data):
        phone = (data.get('phone') or '').strip()
        email = (data.get('email') or '').strip()
        if not phone and not email:
            raise serializers.ValidationError(
                'Indiquez au moins un numéro de téléphone ou une adresse email.'
            )
        return data


class StockAlertSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockAlertSettings
        fields = [
            'id', 'alert_threshold', 'updated_at',
            'reminder_interval_days', 'last_reminder_sent_at',
        ]

    def validate_reminder_interval_days(self, value):
        if value is not None and (value < 1 or value > 365):
            raise serializers.ValidationError("Entre 1 et 365 jours.")
        return value


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

