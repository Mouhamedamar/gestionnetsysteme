from rest_framework import serializers
from .models import Quote, QuoteItem
from products.serializers import ProductSerializer
from accounts.models import Client


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'name', 'phone', 'email', 'address', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class QuoteItemSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle QuoteItem
    """
    product_detail = ProductSerializer(source='product', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = QuoteItem
        fields = [
            'id',
            'product',
            'product_detail',
            'product_name',
            'quantity',
            'unit_price',
            'subtotal',
            'created_at',
        ]
        read_only_fields = ['id', 'subtotal', 'created_at']


class QuoteItemCreateSerializer(serializers.ModelSerializer):
    """
    Serializer pour la création d'items de devis
    """
    class Meta:
        model = QuoteItem
        fields = [
            'product',
            'quantity',
            'unit_price',
        ]


class QuoteSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle Quote
    """
    quote_items = QuoteItemSerializer(many=True, read_only=True)
    items_count = serializers.IntegerField(source='quote_items.count', read_only=True)
    client = ClientSerializer(read_only=True)
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        source='client',
        write_only=True,
        required=False,
        allow_null=True
    )
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = Quote
        fields = [
            'id',
            'quote_number',
            'date',
            'expiration_date',
            'client',
            'client_id',
            'client_name',
            'client_email',
            'client_phone',
            'client_address',
            'total_ht',
            'total_ttc',
            'status',
            'notes',
            'quote_items',
            'items_count',
            'is_expired',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'quote_number',
            'total_ht',
            'total_ttc',
            'created_at',
            'updated_at',
        ]

    def get_is_expired(self, obj):
        """Vérifie si le devis est expiré"""
        return obj.is_expired()

    def to_representation(self, instance):
        """Custom representation to ensure unit_price is included in quote_items"""
        representation = super().to_representation(instance)
        
        # Ensure quote_items include unit_price
        if 'quote_items' in representation:
            for item in representation['quote_items']:
                if 'unit_price' not in item:
                    item['unit_price'] = item.get('product_detail', {}).get('sale_price', 0)
        
        return representation


class QuoteCreateSerializer(serializers.ModelSerializer):
    """
    Serializer pour la création de devis avec items
    """
    items = QuoteItemCreateSerializer(many=True, write_only=True, required=False)
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        source='client',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Quote
        fields = [
            'client_id',
            'client_name',
            'client_email',
            'client_phone',
            'client_address',
            'expiration_date',
            'status',
            'notes',
            'items',
        ]

    def validate(self, data):
        """Validation personnalisée"""
        # S'assurer qu'au moins client_id ou client_name est fourni
        if not data.get('client') and not data.get('client_name'):
            raise serializers.ValidationError({
                'client_id': 'Un client doit être sélectionné ou un nom de client doit être fourni.',
                'client_name': 'Un client doit être sélectionné ou un nom de client doit être fourni.'
            })
        return data

    def create(self, validated_data):
        """Création du devis avec ses items"""
        items_data = validated_data.pop('items', [])
        
        # Extraire le client pour le définir dans client_name aussi
        client = validated_data.get('client')
        if client:
            if 'client_name' not in validated_data or not validated_data.get('client_name'):
                validated_data['client_name'] = client.name
            if not validated_data.get('client_email'):
                validated_data['client_email'] = client.email or ''
            if not validated_data.get('client_phone'):
                validated_data['client_phone'] = client.phone or ''
            if not validated_data.get('client_address'):
                validated_data['client_address'] = client.address or ''
        
        quote = Quote.objects.create(**validated_data)
        
        # Créer les items (pas de vérification de stock pour les devis)
        for item_data in items_data:
            QuoteItem.objects.create(quote=quote, **item_data)
        
        # Calculer les totaux
        quote.calculate_totals()
        
        return quote


class QuoteUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer pour la mise à jour de devis
    """
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        source='client',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Quote
        fields = [
            'date',
            'expiration_date',
            'client_id',
            'client_name',
            'client_email',
            'client_phone',
            'client_address',
            'status',
            'notes',
        ]
