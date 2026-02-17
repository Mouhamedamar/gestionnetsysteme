from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Quote, QuoteItem
from .serializers import (
    QuoteSerializer,
    QuoteCreateSerializer,
    QuoteUpdateSerializer,
    QuoteItemSerializer,
    QuoteItemCreateSerializer
)
from products.permissions import IsAdminUser
from .permissions import IsAdminOrCommercial


class QuoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des devis
    """
    queryset = Quote.objects.filter(deleted_at__isnull=True)
    permission_classes = [IsAdminOrCommercial]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['quote_number', 'client_name', 'client_email']
    ordering_fields = ['date', 'expiration_date', 'total_ttc', 'created_at']
    ordering = ['-date', '-created_at']

    def get_serializer_class(self):
        """Utilise un serializer différent selon l'action"""
        if self.action == 'create':
            return QuoteCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return QuoteUpdateSerializer
        return QuoteSerializer

    def create(self, request, *args, **kwargs):
        """Crée le devis puis retourne la représentation complète (quote_number, date, quote_items)."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quote = serializer.save()
        # Recharger avec les relations pour le sérialiseur complet
        quote = Quote.objects.prefetch_related('quote_items__product').select_related('client').get(pk=quote.pk)
        output_serializer = QuoteSerializer(quote)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        """Filtre les devis supprimés"""
        return Quote.objects.filter(deleted_at__isnull=True).prefetch_related(
            'quote_items__product'
        ).select_related('client', 'converted_invoice')

    @action(detail=True, methods=['post'])
    def convert_to_invoice(self, request, pk=None):
        """Convertit un devis en facture"""
        quote = self.get_object()
        
        if quote.converted_invoice_id:
            return Response(
                {'error': 'Ce devis a déjà été converti en facture'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from invoices.models import Invoice, InvoiceItem
            from stock.models import StockMovement
            
            # Créer la facture (société = celle du devis)
            invoice = Invoice.objects.create(
                client=quote.client,
                client_name=quote.client_name,
                company=quote.company,
                is_proforma=False
            )
            
            # Créer les items de facture et vérifier le stock
            for quote_item in quote.quote_items.filter(deleted_at__isnull=True):
                product = quote_item.product
                quantity = quote_item.quantity
                
                # Vérifier le stock
                if product.quantity < quantity:
                    invoice.delete()
                    return Response(
                        {
                            'error': f"Stock insuffisant pour le produit {product.name}. "
                                    f"Stock disponible: {product.quantity}, demandé: {quantity}"
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                InvoiceItem.objects.create(
                    invoice=invoice,
                    product=product,
                    quantity=quantity,
                    unit_price=quote_item.unit_price
                )
                
                StockMovement.objects.create(
                    product=product,
                    movement_type='SORTIE',
                    quantity=quantity,
                    comment=f"Sortie pour facture {invoice.invoice_number} (convertie depuis devis {quote.quote_number})"
                )
            
            invoice.calculate_totals()
            
            quote.converted_invoice = invoice
            quote.save(update_fields=['converted_invoice'])
            
            from invoices.serializers import InvoiceSerializer
            invoice_serializer = InvoiceSerializer(invoice)
            
            return Response({
                'message': 'Devis converti en facture avec succès',
                'invoice': invoice_serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        """Soft delete d'un devis"""
        quote = self.get_object()
        quote.soft_delete()
        return Response({'status': 'Devis supprimé'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get', 'post', 'delete'])
    def items(self, request, pk=None):
        """Gestion des items d'un devis"""
        quote = self.get_object()
        
        if request.method == 'GET':
            items = quote.quote_items.filter(deleted_at__isnull=True)
            serializer = QuoteItemSerializer(items, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = QuoteItemCreateSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(quote=quote)
                # Recalculer les totaux
                quote.calculate_totals()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            item_id = request.data.get('item_id')
            if item_id:
                try:
                    item = quote.quote_items.get(id=item_id, deleted_at__isnull=True)
                    item.soft_delete()
                    quote.calculate_totals()
                    return Response({'status': 'Item supprimé'}, status=status.HTTP_200_OK)
                except QuoteItem.DoesNotExist:
                    return Response(
                        {'error': 'Item non trouvé'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            return Response(
                {'error': 'item_id requis'},
                status=status.HTTP_400_BAD_REQUEST
            )


class QuoteItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des items de devis
    """
    queryset = QuoteItem.objects.filter(deleted_at__isnull=True)
    permission_classes = [IsAdminOrCommercial]
    serializer_class = QuoteItemSerializer

    def get_queryset(self):
        """Filtre les items supprimés"""
        queryset = QuoteItem.objects.filter(deleted_at__isnull=True)
        
        # Filtre par devis si fourni
        quote_id = self.request.query_params.get('quote', None)
        if quote_id:
            queryset = queryset.filter(quote_id=quote_id)
        
        return queryset

    def get_serializer_class(self):
        """Utilise un serializer différent pour la création"""
        if self.action == 'create':
            return QuoteItemCreateSerializer
        return QuoteItemSerializer

    def perform_create(self, serializer):
        """Crée un item et met à jour le devis"""
        quote_id = self.request.data.get('quote')
        if quote_id:
            quote = Quote.objects.get(id=quote_id)
            serializer.save(quote=quote)
            quote.calculate_totals()
