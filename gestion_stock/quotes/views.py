from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
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
    filterset_fields = ['status']
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

    def get_queryset(self):
        """Filtre les devis supprimés et vérifie les expirations"""
        queryset = Quote.objects.filter(deleted_at__isnull=True).prefetch_related(
            'quote_items__product'
        ).select_related('client')
        
        # Marquer automatiquement les devis expirés
        expired_quotes = queryset.filter(
            expiration_date__lt=timezone.now(),
            status__in=['BROUILLON', 'ENVOYE']
        )
        for quote in expired_quotes:
            quote.mark_as_expired()
        
        return queryset

    @action(detail=True, methods=['post'])
    def convert_to_invoice(self, request, pk=None):
        """Convertit un devis en facture"""
        quote = self.get_object()
        
        if quote.status == 'CONVERTI':
            return Response(
                {'error': 'Ce devis a déjà été converti en facture'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if quote.status not in ['ACCEPTE', 'ENVOYE']:
            return Response(
                {'error': 'Seuls les devis acceptés ou envoyés peuvent être convertis en facture'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from invoices.models import Invoice, InvoiceItem
            from stock.models import StockMovement
            
            # Créer la facture
            invoice = Invoice.objects.create(
                client=quote.client,
                client_name=quote.client_name,
                status='NON_PAYE',
                is_proforma=False
            )
            
            # Créer les items de facture et vérifier le stock
            for quote_item in quote.quote_items.filter(deleted_at__isnull=True):
                product = quote_item.product
                quantity = quote_item.quantity
                
                # Vérifier le stock
                if product.quantity < quantity:
                    invoice.delete()  # Annuler la création de la facture
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
                
                # Créer le mouvement de sortie de stock
                StockMovement.objects.create(
                    product=product,
                    movement_type='SORTIE',
                    quantity=quantity,
                    comment=f"Sortie pour facture {invoice.invoice_number} (convertie depuis devis {quote.quote_number})"
                )
            
            # Calculer les totaux
            invoice.calculate_totals()
            
            # Marquer le devis comme converti
            quote.status = 'CONVERTI'
            quote.save()
            
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
    def mark_as_sent(self, request, pk=None):
        """Marque un devis comme envoyé"""
        quote = self.get_object()
        if quote.status == 'BROUILLON':
            quote.status = 'ENVOYE'
            quote.save()
            serializer = self.get_serializer(quote)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(
            {'error': 'Seuls les devis en brouillon peuvent être marqués comme envoyés'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def mark_as_accepted(self, request, pk=None):
        """Marque un devis comme accepté"""
        quote = self.get_object()
        if quote.status in ['ENVOYE', 'BROUILLON']:
            quote.status = 'ACCEPTE'
            quote.save()
            serializer = self.get_serializer(quote)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(
            {'error': 'Seuls les devis envoyés ou en brouillon peuvent être acceptés'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def mark_as_refused(self, request, pk=None):
        """Marque un devis comme refusé"""
        quote = self.get_object()
        if quote.status in ['ENVOYE', 'BROUILLON']:
            quote.status = 'REFUSE'
            quote.save()
            serializer = self.get_serializer(quote)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(
            {'error': 'Seuls les devis envoyés ou en brouillon peuvent être refusés'},
            status=status.HTTP_400_BAD_REQUEST
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
