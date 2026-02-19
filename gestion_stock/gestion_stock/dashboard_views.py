from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from products.models import Product
from invoices.models import Invoice
from stock.models import StockMovement
from products.permissions import IsAdminUser
from django.db.models import Sum, Count, Q, F, Value, DecimalField
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from installations.models import Installation
from interventions.models import Intervention


@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_stats(request):
    """
    Retourne les statistiques du tableau de bord
    """
    try:
        # Nombre total de produits actifs
        total_products = Product.objects.filter(
            deleted_at__isnull=True,
            is_active=True
        ).count()

        # Produits en rupture de stock
        low_stock_products = Product.objects.filter(
            deleted_at__isnull=True,
            is_active=True,
            quantity__lte=F('alert_threshold')
        ).count()

        # Valeur totale du stock (quantité * prix d'achat)
        stock_value = Product.objects.filter(
            deleted_at__isnull=True,
            is_active=True
        ).aggregate(
            total_value=Sum(F('quantity') * F('purchase_price'))
        )['total_value'] or 0

        # Nombre de factures
        total_invoices = Invoice.objects.filter(
            deleted_at__isnull=True
        ).count()

        # Chiffre d'affaires (total TTC des factures)
        revenue = Invoice.objects.filter(
            deleted_at__isnull=True,
            is_cancelled=False
        ).aggregate(
            total=Sum('total_ttc')
        )['total'] or 0

        # Dernières factures (5 dernières)
        recent_invoices = Invoice.objects.filter(
            deleted_at__isnull=True
        ).order_by('-date')[:5]

        from invoices.serializers import InvoiceSerializer
        invoices_serializer = InvoiceSerializer(recent_invoices, many=True)

        # Classement des techniciens (rôle=technicien) par nombre d'installations terminées
        # Compte : technicien assigné (FK) + techniciens (M2M) pour chaque installation terminée
        filter_terminée = Q(
            installations__status='TERMINEE',
            installations__deleted_at__isnull=True,
        )
        filter_terminée_m2m = Q(
            installations_as_technician__status='TERMINEE',
            installations_as_technician__deleted_at__isnull=True,
        )
        top_technicians_qs = (
            User.objects.filter(profile__role='technicien')
            .annotate(
                _count_fk=Count('installations', filter=filter_terminée, distinct=True),
                _count_m2m=Count('installations_as_technician', filter=filter_terminée_m2m, distinct=True),
            )
            .annotate(
                total_installations=F('_count_fk') + F('_count_m2m'),
            )
            .order_by('-total_installations', 'username')[:5]
        )

        top_technicians = []
        for rank, tech in enumerate(top_technicians_qs, start=1):
            full_name = f"{tech.first_name or ''} {tech.last_name or ''}".strip() or tech.username
            total = getattr(tech, 'total_installations', None)
            try:
                total = int(total) if total is not None else 0
            except (TypeError, ValueError):
                total = 0
            top_technicians.append(
                {
                    'id': tech.id,
                    'username': tech.username,
                    'full_name': full_name,
                    'total_installations': total,
                    'rank': rank,
                }
            )

        # Classement des techniciens par nombre d'interventions terminées
        top_technicians_interventions_qs = (
            User.objects.filter(profile__role='technicien')
            .annotate(
                total_interventions=Count(
                    'interventions',
                    filter=Q(
                        interventions__status='TERMINE',
                        interventions__deleted_at__isnull=True,
                    ),
                )
            )
            .order_by('-total_interventions', 'username')[:5]
        )
        top_technicians_interventions = []
        for rank, tech in enumerate(top_technicians_interventions_qs, start=1):
            full_name = f"{tech.first_name or ''} {tech.last_name or ''}".strip() or tech.username
            total = getattr(tech, 'total_interventions', None)
            try:
                total = int(total) if total is not None else 0
            except (TypeError, ValueError):
                total = 0
            top_technicians_interventions.append({
                'id': tech.id,
                'username': tech.username,
                'full_name': full_name,
                'total_interventions': total,
                'rank': rank,
            })

        return Response({
            'total_products': total_products,
            'low_stock_products': low_stock_products,
            'stock_value': float(stock_value),
            'total_invoices': total_invoices,
            'revenue': float(revenue),
            'recent_invoices': invoices_serializer.data,
            'top_technicians_installations': top_technicians,
            'top_technicians_interventions': top_technicians_interventions,
        })
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception('dashboard_stats error: %s', e)
        return Response(
            {'detail': str(e), 'error': 'dashboard_stats_failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_charts(request):
    """
    Retourne les données pour les graphiques
    """
    # Chiffre d'affaires par mois (6 derniers mois)
    six_months_ago = timezone.now() - timedelta(days=180)
    monthly_revenue = Invoice.objects.filter(
        deleted_at__isnull=True,
        is_cancelled=False,
        date__gte=six_months_ago
    ).annotate(
        month=TruncMonth('date')
    ).values('month').annotate(
        total=Coalesce(Sum('total_ttc'), Value(0, output_field=DecimalField()))
    ).order_by('month')
    
    # Convertir les dates en chaînes YYYY-MM pour le frontend
    monthly_revenue_list = []
    for entry in monthly_revenue:
        if entry['month']:
            monthly_revenue_list.append({
                'month': entry['month'].strftime('%Y-%m'),
                'total': float(entry['total'])
            })
    
    top_products = Product.objects.filter(
        deleted_at__isnull=True,
        is_active=True
    ).annotate(
        total_sold=Coalesce(Sum(
            'stock_movements__quantity',
            filter=Q(stock_movements__movement_type='SORTIE', stock_movements__deleted_at__isnull=True)
        ), 0)
    ).order_by('-total_sold')[:5]
    
    from products.serializers import ProductListSerializer
    products_serializer = ProductListSerializer(top_products, many=True, context={'request': request})
    
    return Response({
        'monthly_revenue': monthly_revenue_list,
        'top_products': products_serializer.data,
    })

