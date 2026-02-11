from rest_framework import serializers
from .models import Installation, InstallationProduct
from accounts.serializers import ClientSerializer
from products.serializers import ProductSerializer
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer pour les utilisateurs (techniciens)"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']
        read_only_fields = ['id']


class InstallationProductSerializer(serializers.ModelSerializer):
    """Serializer pour les produits utilisés dans une installation"""
    product_detail = ProductSerializer(source='product', read_only=True, allow_null=True)
    product_name = serializers.SerializerMethodField()

    class Meta:
        model = InstallationProduct
        fields = [
            'id',
            'product',
            'product_detail',
            'product_name',
            'quantity',
            'serial_number',
            'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_product_name(self, obj):
        """Retourne le nom du produit de manière sécurisée"""
        if obj.product:
            return obj.product.name
        return None


class InstallationSerializer(serializers.ModelSerializer):
    """Serializer pour les installations"""
    client_detail = ClientSerializer(source='client', read_only=True, allow_null=True)
    technician_detail = UserSerializer(source='technician', read_only=True, allow_null=True)
    technician_name = serializers.SerializerMethodField()
    products_used = InstallationProductSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    installation_type_display = serializers.CharField(source='get_installation_type_display', read_only=True)

    class Meta:
        model = Installation
        fields = [
            'id',
            'installation_number',
            'title',
            'description',
            'installation_type',
            'installation_type_display',
            'client',
            'client_detail',
            'client_name',
            'client_phone',
            'client_address',
            'technician',
            'technician_detail',
            'technician_name',
            'status',
            'status_display',
            'scheduled_date',
            'start_date',
            'end_date',
            'warranty_period',
            'warranty_end_date',
            'notes',
            'products_used',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'installation_number', 'created_at', 'updated_at']

    def get_technician_name(self, obj):
        if obj.technician:
            if obj.technician.first_name or obj.technician.last_name:
                return f"{obj.technician.first_name} {obj.technician.last_name}".strip()
            return obj.technician.username
        return None


class InstallationCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création d'installations"""
    products = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = Installation
        fields = [
            'title',
            'description',
            'installation_type',
            'client',
            'client_name',
            'client_phone',
            'client_address',
            'technician',
            'status',
            'scheduled_date',
            'start_date',
            'end_date',
            'warranty_period',
            'warranty_end_date',
            'notes',
            'products',
        ]

    def create(self, validated_data):
        products_data = validated_data.pop('products', [])
        client = validated_data.get('client')
        if client and not validated_data.get('client_name'):
            validated_data['client_name'] = client.name
            if not validated_data.get('client_phone') and client.phone:
                validated_data['client_phone'] = client.phone
            if not validated_data.get('client_address') and client.address:
                validated_data['client_address'] = client.address
        installation = Installation.objects.create(**validated_data)
        
        # Créer les produits utilisés
        for product_data in products_data:
            InstallationProduct.objects.create(
                installation=installation,
                product_id=product_data.get('product'),
                quantity=product_data.get('quantity', 1),
                serial_number=product_data.get('serial_number', ''),
                notes=product_data.get('notes', '')
            )
        
        return installation


class InstallationUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour d'installations"""
    products = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = Installation
        fields = [
            'title',
            'description',
            'installation_type',
            'client',
            'client_name',
            'client_phone',
            'client_address',
            'technician',
            'status',
            'scheduled_date',
            'start_date',
            'end_date',
            'warranty_period',
            'warranty_end_date',
            'notes',
            'products',
        ]

    def update(self, instance, validated_data):
        products_data = validated_data.pop('products', None)
        client = validated_data.get('client') if 'client' in validated_data else instance.client
        if client and not validated_data.get('client_name'):
            validated_data['client_name'] = client.name
            if not validated_data.get('client_phone') and client.phone:
                validated_data['client_phone'] = validated_data.get('client_phone') or client.phone
            if not validated_data.get('client_address') and client.address:
                validated_data['client_address'] = validated_data.get('client_address') or client.address
        # Mettre à jour les champs de l'installation
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Mettre à jour les produits si fournis
        if products_data is not None:
            # Supprimer les anciens produits
            instance.products_used.all().delete()
            # Créer les nouveaux produits
            for product_data in products_data:
                InstallationProduct.objects.create(
                    installation=instance,
                    product_id=product_data.get('product'),
                    quantity=product_data.get('quantity', 1),
                    serial_number=product_data.get('serial_number', ''),
                    notes=product_data.get('notes', '')
                )
        
        return instance
