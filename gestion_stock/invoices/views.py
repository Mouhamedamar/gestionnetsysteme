from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Invoice, InvoiceItem
from .serializers import (
    InvoiceSerializer,
    InvoiceCreateSerializer,
    InvoiceUpdateSerializer,
    InvoiceItemSerializer,
    InvoiceItemCreateSerializer
)
from products.permissions import IsAdminUser
from .permissions import IsAdminOrCommercial


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des factures
    """
    queryset = Invoice.objects.filter(deleted_at__isnull=True)
    permission_classes = [IsAdminOrCommercial]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_cancelled']
    search_fields = ['invoice_number', 'client_name']
    ordering_fields = ['date', 'total_ttc', 'created_at']
    ordering = ['-date', '-created_at']

    def get_serializer_class(self):
        """Utilise un serializer différent selon l'action"""
        if self.action == 'create':
            return InvoiceCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return InvoiceUpdateSerializer
        return InvoiceSerializer

    def get_queryset(self):
        """Filtre les factures supprimées"""
        queryset = Invoice.objects.filter(deleted_at__isnull=True)
        return queryset

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Annule une facture et restaure le stock"""
        invoice = self.get_object()
        try:
            invoice.cancel()
            serializer = self.get_serializer(invoice)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restaure une facture annulée"""
        invoice = Invoice.objects.filter(deleted_at__isnull=False).get(pk=pk)
        try:
            invoice.restore()
            serializer = self.get_serializer(invoice)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        """Soft delete d'une facture"""
        invoice = self.get_object()
        invoice.soft_delete()
        return Response({'status': 'Facture supprimée'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='record-payment')
    def record_payment(self, request, pk=None):
        """Enregistre un paiement (tranche) sur la facture. amount = montant à ajouter au total payé."""
        invoice = self.get_object()
        if invoice.is_cancelled:
            return Response(
                {'error': 'Impossible d\'enregistrer un paiement sur une facture annulée.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        amount = request.data.get('amount')
        if amount is None:
            return Response(
                {'error': 'Le champ "amount" (montant payé) est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            from decimal import Decimal
            amount = Decimal(str(amount))
            if amount < 0:
                return Response(
                    {'error': 'Le montant doit être positif.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (TypeError, ValueError):
            return Response(
                {'error': 'Montant invalide.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        invoice.amount_paid = (invoice.amount_paid or 0) + amount
        if invoice.amount_paid > invoice.total_ttc:
            invoice.amount_paid = invoice.total_ttc
        invoice.save()
        serializer = self.get_serializer(invoice)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def convert_to_invoice(self, request, pk=None):
        """Convertit une facture pro forma en facture définitive (nouvelle facture + sortie stock)."""
        from stock.models import StockMovement
        from .serializers import InvoiceSerializer

        proforma = self.get_object()
        if not proforma.is_proforma:
            return Response(
                {'error': 'Seules les factures pro forma peuvent être converties en facture.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        items = proforma.invoice_items.filter(deleted_at__isnull=True)
        if not items.exists():
            return Response(
                {'error': 'Cette facture pro forma ne contient aucun article. Ajoutez des lignes avant de convertir.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Vérifier le stock pour tous les articles
        for item in items:
            if item.product.quantity < item.quantity:
                return Response(
                    {
                        'error': (
                            f"Stock insuffisant pour le produit « {item.product.name} ». "
                            f"Disponible : {item.product.quantity}, demandé : {item.quantity}"
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        client_name = proforma.client_name or (proforma.client.name if proforma.client else '')
        new_invoice = Invoice.objects.create(
            client=proforma.client,
            client_name=client_name or 'Client',
            company=proforma.company,
            is_proforma=False,
        )
        for item in items:
            InvoiceItem.objects.create(
                invoice=new_invoice,
                product=item.product,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
        new_invoice.calculate_totals()
        for item in new_invoice.invoice_items.all():
            StockMovement.objects.create(
                product=item.product,
                movement_type='SORTIE',
                quantity=item.quantity,
                comment=f"Sortie pour facture {new_invoice.invoice_number} (conversion pro forma)"
            )
        serializer = InvoiceSerializer(new_invoice)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post', 'delete'])
    def items(self, request, pk=None):
        """Gestion des items d'une facture"""
        invoice = self.get_object()
        
        if request.method == 'GET':
            items = invoice.invoice_items.filter(deleted_at__isnull=True)
            serializer = InvoiceItemSerializer(items, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = InvoiceItemCreateSerializer(
                data=request.data,
                context={'invoice': invoice, 'request': request}
            )
            if serializer.is_valid():
                serializer.save(invoice=invoice)
                # Recalculer les totaux
                invoice.calculate_totals()
                # Créer le mouvement de sortie
                from stock.models import StockMovement
                item = serializer.instance
                StockMovement.objects.create(
                    product=item.product,
                    movement_type='SORTIE',
                    quantity=item.quantity,
                    comment=f"Sortie pour facture {invoice.invoice_number}"
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            item_id = request.data.get('item_id')
            if item_id:
                try:
                    item = invoice.invoice_items.get(id=item_id, deleted_at__isnull=True)
                    # Restaurer le stock avant de supprimer
                    item.product.quantity += item.quantity
                    item.product.save()
                    item.soft_delete()
                    invoice.calculate_totals()
                    return Response({'status': 'Item supprimé'}, status=status.HTTP_200_OK)
                except InvoiceItem.DoesNotExist:
                    return Response(
                        {'error': 'Item non trouvé'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            return Response(
                {'error': 'item_id requis'},
                status=status.HTTP_400_BAD_REQUEST
            )


class InvoiceItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des items de facture
    """
    queryset = InvoiceItem.objects.filter(deleted_at__isnull=True)
    permission_classes = [IsAdminOrCommercial]
    serializer_class = InvoiceItemSerializer

    def get_queryset(self):
        """Filtre les items supprimés"""
        queryset = InvoiceItem.objects.filter(deleted_at__isnull=True)
        
        # Filtre par facture si fourni
        invoice_id = self.request.query_params.get('invoice', None)
        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)
        
        return queryset

    def get_serializer_class(self):
        """Utilise un serializer différent pour la création"""
        if self.action == 'create':
            return InvoiceItemCreateSerializer
        return InvoiceItemSerializer

    def perform_create(self, serializer):
        """Crée un item et met à jour la facture"""
        invoice_id = self.request.data.get('invoice')
        if invoice_id:
            invoice = Invoice.objects.get(id=invoice_id)
            serializer.save(invoice=invoice)
            invoice.calculate_totals()
            # Créer le mouvement de sortie
            item = serializer.instance
            from stock.models import StockMovement
            StockMovement.objects.create(
                product=item.product,
                movement_type='SORTIE',
                quantity=item.quantity,
                comment=f"Sortie pour facture {invoice.invoice_number}"
            )
