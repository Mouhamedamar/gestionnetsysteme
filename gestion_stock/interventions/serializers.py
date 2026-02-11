from rest_framework import serializers
from .models import Intervention, InterventionProduct
from accounts.serializers import ClientSerializer
from products.serializers import ProductSerializer
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer pour les utilisateurs (techniciens)"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']
        read_only_fields = ['id']


class InterventionProductSerializer(serializers.ModelSerializer):
    """Serializer pour les produits utilisés dans une intervention"""
    product_detail = ProductSerializer(source='product', read_only=True, allow_null=True)
    product_name = serializers.SerializerMethodField()

    class Meta:
        model = InterventionProduct
        fields = [
            'id',
            'product',
            'product_detail',
            'product_name',
            'quantity',
            'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_product_name(self, obj):
        """Retourne le nom du produit de manière sécurisée"""
        if obj.product:
            return obj.product.name
        return None


class InterventionSerializer(serializers.ModelSerializer):
    """Serializer pour les interventions"""
    client_detail = ClientSerializer(source='client', read_only=True, allow_null=True)
    technician_detail = UserSerializer(source='technician', read_only=True, allow_null=True)
    technician_name = serializers.SerializerMethodField()
    products_used = InterventionProductSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = Intervention
        fields = [
            'id',
            'intervention_number',
            'title',
            'description',
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
            'priority',
            'priority_display',
            'scheduled_date',
            'start_date',
            'end_date',
            'notes',
            'products_used',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'intervention_number', 'created_at', 'updated_at']

    def get_technician_name(self, obj):
        if obj.technician:
            if obj.technician.first_name or obj.technician.last_name:
                return f"{obj.technician.first_name} {obj.technician.last_name}".strip()
            return obj.technician.username
        return None


class InterventionCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création d'interventions"""
    products = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = Intervention
        fields = [
            'title',
            'description',
            'client',
            'client_name',
            'client_phone',
            'client_address',
            'technician',
            'status',
            'priority',
            'scheduled_date',
            'start_date',
            'end_date',
            'notes',
            'products',
        ]

    def create(self, validated_data):
        products_data = validated_data.pop('products', [])
        intervention = Intervention.objects.create(**validated_data)
        
        # Créer les produits utilisés
        for product_data in products_data:
            InterventionProduct.objects.create(
                intervention=intervention,
                product_id=product_data.get('product'),
                quantity=product_data.get('quantity', 1),
                notes=product_data.get('notes', '')
            )
        
        return intervention


class InterventionUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour d'interventions"""
    products = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = Intervention
        fields = [
            'title',
            'description',
            'client',
            'client_name',
            'client_phone',
            'client_address',
            'technician',
            'status',
            'priority',
            'scheduled_date',
            'start_date',
            'end_date',
            'notes',
            'products',
        ]

    def update(self, instance, validated_data):
        products_data = validated_data.pop('products', None)
        
        # Mettre à jour les champs de l'intervention
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Mettre à jour les produits si fournis
        if products_data is not None:
            # Supprimer les anciens produits
            instance.products_used.all().delete()
            # Créer les nouveaux produits
            for product_data in products_data:
                InterventionProduct.objects.create(
                    intervention=instance,
                    product_id=product_data.get('product'),
                    quantity=product_data.get('quantity', 1),
                    notes=product_data.get('notes', '')
                )
        
        return instance
