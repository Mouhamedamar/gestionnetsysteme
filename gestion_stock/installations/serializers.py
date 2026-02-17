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
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = InstallationProduct
        fields = [
            'id',
            'product',
            'product_detail',
            'product_name',
            'quantity',
            'unit_price',
            'subtotal',
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

    def get_subtotal(self, obj):
        return (obj.quantity or 0) * (getattr(obj, 'unit_price', 0) or 0)


class InstallationSerializer(serializers.ModelSerializer):
    """Serializer pour les installations"""
    client_detail = ClientSerializer(source='client', read_only=True, allow_null=True)
    technician_detail = UserSerializer(source='technician', read_only=True, allow_null=True)
    technician_name = serializers.SerializerMethodField()
    commercial_agent_detail = UserSerializer(source='commercial_agent', read_only=True, allow_null=True)
    commercial_agent_name = serializers.SerializerMethodField()
    technicians_list = UserSerializer(source='technicians', many=True, read_only=True)
    products_used = InstallationProductSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    installation_type_display = serializers.CharField(source='get_installation_type_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True, allow_null=True)
    contract_file_url = serializers.SerializerMethodField()

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
            'installation_date',
            'payment_method',
            'payment_method_display',
            'first_installment_due_date',
            'total_amount',
            'advance_amount',
            'remaining_amount',
            'commercial_agent',
            'commercial_agent_detail',
            'commercial_agent_name',
            'technician',
            'technician_detail',
            'technician_name',
            'technicians',
            'technicians_list',
            'invoice',
            'contract_file',
            'contract_file_url',
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

    def get_contract_file_url(self, obj):
        if obj.contract_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.contract_file.url)
            from django.conf import settings
            return f"{settings.MEDIA_URL.rstrip('/')}/{obj.contract_file.name}" if obj.contract_file.name else None
        return None

    def get_commercial_agent_name(self, obj):
        if obj.commercial_agent:
            if obj.commercial_agent.first_name or obj.commercial_agent.last_name:
                return f"{obj.commercial_agent.first_name or ''} {obj.commercial_agent.last_name or ''}".strip()
            return obj.commercial_agent.username
        return None

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
            'id',
            'title',
            'description',
            'installation_type',
            'client',
            'client_name',
            'client_phone',
            'client_address',
            'installation_date',
            'payment_method',
            'first_installment_due_date',
            'total_amount',
            'advance_amount',
            'remaining_amount',
            'commercial_agent',
            'technician',
            'technicians',
            'invoice',
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
        technicians = validated_data.pop('technicians', [])
        client = validated_data.get('client')
        if client and not validated_data.get('client_name'):
            validated_data['client_name'] = client.name
            if not validated_data.get('client_phone') and client.phone:
                validated_data['client_phone'] = client.phone
            if not validated_data.get('client_address') and client.address:
                validated_data['client_address'] = client.address
        installation = Installation.objects.create(**validated_data)
        if technicians:
            installation.technicians.set(technicians)
        for product_data in products_data:
            InstallationProduct.objects.create(
                installation=installation,
                product_id=product_data.get('product'),
                quantity=product_data.get('quantity', 1),
                unit_price=product_data.get('unit_price', 0),
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
            'id',
            'title',
            'description',
            'installation_type',
            'client',
            'client_name',
            'client_phone',
            'client_address',
            'installation_date',
            'payment_method',
            'first_installment_due_date',
            'total_amount',
            'advance_amount',
            'remaining_amount',
            'commercial_agent',
            'technician',
            'technicians',
            'invoice',
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
        technicians = validated_data.pop('technicians', None)
        client = validated_data.get('client') if 'client' in validated_data else instance.client
        if client and not validated_data.get('client_name'):
            validated_data['client_name'] = client.name
            if not validated_data.get('client_phone') and client.phone:
                validated_data['client_phone'] = validated_data.get('client_phone') or client.phone
            if not validated_data.get('client_address') and client.address:
                validated_data['client_address'] = validated_data.get('client_address') or client.address
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if technicians is not None:
            instance.technicians.set(technicians)
        if products_data is not None:
            instance.products_used.all().delete()
            for product_data in products_data:
                InstallationProduct.objects.create(
                    installation=instance,
                    product_id=product_data.get('product'),
                    quantity=product_data.get('quantity', 1),
                    unit_price=product_data.get('unit_price', 0),
                    serial_number=product_data.get('serial_number', ''),
                    notes=product_data.get('notes', '')
                )
        return instance
