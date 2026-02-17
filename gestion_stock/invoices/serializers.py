from rest_framework import serializers
from .models import Invoice, InvoiceItem
from products.serializers import ProductSerializer
from accounts.models import Client


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'name', 'phone', 'email', 'address', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class InvoiceItemSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle InvoiceItem
    """
    product_detail = ProductSerializer(source='product', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = InvoiceItem
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

    def validate(self, data):
        """Validation personnalisée"""
        product = data.get('product')
        quantity = data.get('quantity')
        invoice = self.context.get('invoice')

        if product and quantity:
            # Vérifier le stock disponible
            available_stock = product.quantity
            
            # Si c'est une mise à jour, ajouter la quantité actuelle de l'item
            if self.instance and invoice:
                existing_items = invoice.invoice_items.filter(
                    product=product,
                    deleted_at__isnull=True
                ).exclude(id=self.instance.id if self.instance else None)
                total_requested = sum(item.quantity for item in existing_items) + quantity
            else:
                total_requested = quantity

            if available_stock < total_requested:
                raise serializers.ValidationError(
                    {
                        'quantity': f"Stock insuffisant pour le produit {product.name}. "
                                   f"Stock disponible: {available_stock}, demandé: {total_requested}"
                    }
                )
        return data


class InvoiceItemCreateSerializer(serializers.ModelSerializer):
    """
    Serializer pour la création d'items de facture
    """
    class Meta:
        model = InvoiceItem
        fields = [
            'product',
            'quantity',
            'unit_price',
        ]

    def validate(self, data):
        """Validation personnalisée"""
        product = data.get('product')
        quantity = data.get('quantity')
        invoice = self.context.get('invoice')

        if product and quantity and invoice:
            # Vérifier le stock disponible
            available_stock = product.quantity
            
            # Compter les quantités déjà dans la facture
            existing_items = invoice.invoice_items.filter(
                product=product,
                deleted_at__isnull=True
            ).exclude(id=self.instance.id if self.instance else None)
            total_requested = sum(item.quantity for item in existing_items) + quantity

            if available_stock < total_requested:
                raise serializers.ValidationError(
                    {
                        'quantity': f"Stock insuffisant pour le produit {product.name}. "
                                   f"Stock disponible: {available_stock}, demandé: {total_requested}"
                    }
                )
        return data


class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle Invoice
    """
    invoice_items = InvoiceItemSerializer(many=True, read_only=True)
    items_count = serializers.IntegerField(source='invoice_items.count', read_only=True)
    client = ClientSerializer(read_only=True)
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        source='client',
        write_only=True,
        required=False,
        allow_null=True
    )
    payment_status = serializers.CharField(source='get_payment_status', read_only=True)
    remaining_amount = serializers.SerializerMethodField()

    def get_remaining_amount(self, obj):
        return obj.remaining_amount

    class Meta:
        model = Invoice
        fields = [
            'id',
            'invoice_number',
            'date',
            'company',
            'client',
            'client_id',
            'client_name',
            'total_ht',
            'total_ttc',
            'amount_paid',
            'remaining_amount',
            'payment_status',
            'is_cancelled',
            'is_proforma',
            'invoice_items',
            'items_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'invoice_number',
            'total_ht',
            'total_ttc',
            'remaining_amount',
            'payment_status',
            'created_at',
            'updated_at',
        ]

    def to_representation(self, instance):
        """Custom representation to ensure unit_price is included in invoice_items"""
        representation = super().to_representation(instance)
        
        # Ensure invoice_items include unit_price
        if 'invoice_items' in representation:
            for item in representation['invoice_items']:
                if 'unit_price' not in item:
                    item['unit_price'] = item.get('product_detail', {}).get('sale_price', 0)
        
        return representation


class InvoiceCreateSerializer(serializers.ModelSerializer):
    """
    Serializer pour la création de facture avec items
    """
    items = InvoiceItemCreateSerializer(many=True, write_only=True)
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        source='client',
        write_only=True,
        required=False
    )

    class Meta:
        model = Invoice
        fields = [
            'client_id',
            'client_name',
            'company',
            'is_proforma',
            'items',
        ]

    def create(self, validated_data):
        """Création de la facture avec ses items. Pro forma : pas de vérification stock ni sortie stock."""
        items_data = validated_data.pop('items')
        is_proforma = validated_data.get('is_proforma', False)

        # Extraire le client pour le définir dans client_name aussi
        client = validated_data.get('client')
        if client and 'client_name' not in validated_data:
            validated_data['client_name'] = client.name

        invoice = Invoice.objects.create(**validated_data)

        # Créer les items
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']

            # Vérifier le stock uniquement pour les factures définitives (pas les pro forma)
            if not is_proforma and product.quantity < quantity:
                invoice.delete()
                raise serializers.ValidationError(
                    {
                        'items': f"Stock insuffisant pour le produit {product.name}. "
                                f"Stock disponible: {product.quantity}, demandé: {quantity}"
                    }
                )

            InvoiceItem.objects.create(invoice=invoice, **item_data)

        # Calculer les totaux
        invoice.calculate_totals()

        # Sortie de stock uniquement pour les factures définitives (pas pour les pro forma)
        if not is_proforma:
            from stock.models import StockMovement
            for item in invoice.invoice_items.all():
                StockMovement.objects.create(
                    product=item.product,
                    movement_type='SORTIE',
                    quantity=item.quantity,
                    comment=f"Sortie pour facture {invoice.invoice_number}"
                )

        return invoice


class InvoiceUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer pour la mise à jour de facture
    """
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        source='client',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Invoice
        fields = [
            'date',
            'client_id',
            'client_name',
            'company',
            'amount_paid',
        ]
