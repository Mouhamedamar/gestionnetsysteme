from rest_framework import serializers
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle Expense
    """
    justification_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'description', 'category', 'amount',
            'date', 'status', 'supplier', 'receipt_number', 'justification_image',
            'justification_image_url', 'created_at', 'updated_at', 'deleted_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'deleted_at', 'justification_image_url']
    
    def get_justification_image_url(self, obj):
        """Retourne l'URL complète de l'image de justification"""
        if obj.justification_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.justification_image.url)
            return obj.justification_image.url
        return None

    def validate_amount(self, value):
        """
        Valide que le montant est positif
        """
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être supérieur à 0.")
        return value


class ExpenseCreateSerializer(serializers.ModelSerializer):
    """
    Serializer pour la création de dépenses
    """
    justification_image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Expense
        fields = [
            'title', 'description', 'category', 'amount',
            'date', 'status', 'supplier', 'receipt_number', 'justification_image'
        ]

    def validate_amount(self, value):
        """
        Valide que le montant est positif
        """
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être supérieur à 0.")
        return value
    
    def validate(self, data):
        """
        Validation globale
        """
        # Convertir le montant en Decimal si c'est une string
        if 'amount' in data:
            if isinstance(data['amount'], str):
                try:
                    data['amount'] = float(data['amount'])
                except ValueError:
                    raise serializers.ValidationError({"amount": "Le montant doit être un nombre valide."})
            # S'assurer que le montant est positif
            if data['amount'] <= 0:
                raise serializers.ValidationError({"amount": "Le montant doit être supérieur à 0."})
        
        # Gérer les champs vides pour supplier et receipt_number
        if 'supplier' in data and data['supplier'] == '':
            data['supplier'] = None
        if 'receipt_number' in data and data['receipt_number'] == '':
            data['receipt_number'] = None
        if 'description' in data and data['description'] == '':
            data['description'] = None
            
        return data
