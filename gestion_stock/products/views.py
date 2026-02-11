import logging
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Product
from .serializers import ProductSerializer, ProductListSerializer
from .permissions import IsAdminUser

logger = logging.getLogger(__name__)


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des produits
    """
    queryset = Product.objects.filter(deleted_at__isnull=True)
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'category', 'description']
    ordering_fields = ['name', 'category', 'quantity', 'sale_price', 'created_at']
    ordering = ['-created_at']
    
    def create(self, request, *args, **kwargs):
        """
        Création d'un nouveau produit avec gestion des erreurs améliorée
        """
        try:
            # Log des données reçues
            logger.info("=" * 80)
            logger.info("CRÉATION PRODUIT - DONNÉES REÇUES")
            logger.info("=" * 80)
            logger.info(f"Method: {request.method}")
            logger.info(f"Content-Type: {request.content_type}")
            logger.info(f"User: {request.user}")
            logger.info(f"Token: {request.auth}")
            
            # Log des données POST
            logger.info(f"\nDATA KEYS: {list(request.data.keys())}")
            for key in request.data.keys():
                value = request.data.get(key)
                if isinstance(value, str):
                    logger.info(f"  {key}: {value}")
                else:
                    logger.info(f"  {key}: {type(value).__name__}")
            
            # Log des fichiers
            logger.info(f"\nFILES KEYS: {list(request.FILES.keys())}")
            for key in request.FILES.keys():
                file = request.FILES.get(key)
                logger.info(f"  {key}: {file.name} ({file.size} bytes, type: {file.content_type})")
            
            # Préparer les données
            # Utiliser copy() pour obtenir un QueryDict mutable qui conserve les fichiers
            data = request.data.copy()
            
            # Vérifier la photo dans FILES
            if 'photo' in request.FILES:
                logger.info(f"\n✓ Photo trouvée dans FILES: {request.FILES['photo'].name}, size: {request.FILES['photo'].size}")
                data['photo'] = request.FILES['photo']
            elif 'photo' in data:
                logger.info(f"\n✓ Photo trouvée dans data: {data['photo']}")
            else:
                logger.info("\nℹ Aucune photo reçue")
            
            # Définir les valeurs par défaut
            data.setdefault('quantity', 0)
            data.setdefault('alert_threshold', 10)
            data.setdefault('is_active', True)
            
            # Nettoyer les données
            for field in ['purchase_price', 'sale_price', 'quantity', 'alert_threshold']:
                if field in data and data[field] == '':
                    data[field] = 0 if field in ['quantity', 'alert_threshold'] else '0.00'
            
            # Vérifier les champs obligatoires
            required_fields = ['name', 'purchase_price', 'sale_price']
            missing_fields = [field for field in required_fields if not data.get(field) and data.get(field) != 0]
            
            if missing_fields:
                error_msg = f'Champs obligatoires manquants: {", ".join(missing_fields)}'
                logger.error(f"✗ {error_msg}")
                return Response(
                    {'error': error_msg},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Convertir les champs numériques
            try:
                data['purchase_price'] = float(str(data.get('purchase_price', 0)).replace(',', '.'))
                data['sale_price'] = float(str(data.get('sale_price', 0)).replace(',', '.'))
                data['quantity'] = int(float(str(data.get('quantity', 0)).replace(',', '.')))
                data['alert_threshold'] = int(float(str(data.get('alert_threshold', 10)).replace(',', '.')))
            except (ValueError, TypeError) as e:
                logger.error(f'Erreur de conversion des données: {str(e)}')
                return Response(
                    {
                        'error': 'Format de nombre invalide',
                        'details': f'Veuillez vérifier les champs numériques: {str(e)}'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Valider les valeurs numériques
            if data['purchase_price'] < 0 or data['sale_price'] < 0:
                return Response(
                    {'error': 'Les prix ne peuvent pas être négatifs'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if data['quantity'] < 0 or data['alert_threshold'] < 0:
                return Response(
                    {'error': 'Les quantités ne peuvent pas être négatives'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Créer le produit avec les données nettoyées
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            
            logger.info("\n✓ Validation réussie")
            logger.info(f"Données validées: {serializer.validated_data}")
            
            try:
                self.perform_create(serializer)
                logger.info(f"✓ Produit créé avec succès!")
                logger.info(f"  ID: {serializer.data.get('id')}")
                logger.info(f"  Nom: {serializer.data.get('name')}")
                logger.info(f"  Photo: {serializer.data.get('photo')}")
                logger.info(f"  Photo URL: {serializer.data.get('photo_url')}")
                logger.info("=" * 80)
                
                headers = self.get_success_headers(serializer.data)
                return Response(
                    serializer.data, 
                    status=status.HTTP_201_CREATED, 
                    headers=headers
                )
            except Exception as e:
                logger.error(f'✗ Erreur lors de la sauvegarde du produit: {str(e)}', exc_info=True)
                return Response(
                    {'error': 'Erreur lors de la sauvegarde du produit', 'details': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except ValidationError as e:
            logger.error(f'Erreur de validation: {str(e)}')
            details = e.detail if hasattr(e, 'detail') else str(e)
            return Response(
                {'error': 'Erreur de validation', 'details': details},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f'Erreur inattendue: {str(e)}', exc_info=True)
            return Response(
                {'error': 'Une erreur inattendue est survenue lors de la création du produit'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        """
        Mise à jour d'un produit avec gestion des erreurs améliorée
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        try:
            # Log des données reçues
            logger.info(f"=== MISE À JOUR PRODUIT {instance.id} ===")
            logger.info(f"Content-Type: {request.content_type}")
            logger.info(f"Data keys: {list(request.data.keys())}")
            logger.info(f"Files keys: {list(request.FILES.keys())}")
            
            # Préparer les données
            data = request.data.copy()
            
            # Vérifier la photo dans FILES
            if 'photo' in request.FILES:
                logger.info(f"Photo trouvée dans FILES: {request.FILES['photo'].name}, size: {request.FILES['photo'].size}")
                data['photo'] = request.FILES['photo']
            elif 'photo' in data:
                logger.info(f"Photo trouvée dans data: {data['photo']}")
            else:
                logger.info("Aucune nouvelle photo")
            
            # Ne pas écraser les valeurs existantes si non fournies dans PATCH
            if partial:
                for field in ['quantity', 'alert_threshold', 'is_active']:
                    if field not in data:
                        data[field] = getattr(instance, field)
            
            # Nettoyer les données
            for field in ['purchase_price', 'sale_price', 'quantity', 'alert_threshold']:
                if field in data and data[field] == '':
                    data[field] = getattr(instance, field) if partial else (0 if field in ['quantity', 'alert_threshold'] else '0.00')
            
            # Convertir les champs numériques si présents
            if 'purchase_price' in data:
                try:
                    data['purchase_price'] = float(str(data.get('purchase_price', 0)).replace(',', '.'))
                except (ValueError, TypeError):
                    pass
            
            if 'sale_price' in data:
                try:
                    data['sale_price'] = float(str(data.get('sale_price', 0)).replace(',', '.'))
                except (ValueError, TypeError):
                    pass
            
            if 'quantity' in data:
                try:
                    data['quantity'] = int(float(str(data.get('quantity', 0)).replace(',', '.')))
                except (ValueError, TypeError):
                    pass
            
            if 'alert_threshold' in data:
                try:
                    data['alert_threshold'] = int(float(str(data.get('alert_threshold', 10)).replace(',', '.')))
                except (ValueError, TypeError):
                    pass
            
            serializer = self.get_serializer(instance, data=data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            if getattr(instance, '_prefetched_objects_cache', None):
                instance._prefetched_objects_cache = {}
            
            return Response(serializer.data)
            
        except ValidationError as e:
            logger.error(f'Erreur de validation lors de la mise à jour: {str(e)}')
            details = e.detail if hasattr(e, 'detail') else str(e)
            return Response(
                {'error': 'Erreur de validation', 'details': details},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f'Erreur inattendue lors de la mise à jour: {str(e)}', exc_info=True)
            return Response(
                {'error': 'Une erreur inattendue est survenue lors de la mise à jour du produit'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def partial_update(self, request, *args, **kwargs):
        """Gère les mises à jour partielles (PATCH)"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def get_serializer_class(self):
        """Utilise ProductSerializer pour toutes les actions pour inclure photo_url"""
        return ProductSerializer

    def get_serializer_context(self):
        """Ajoute le contexte request au serializer pour photo_url"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        """Filtre les produits supprimés"""
        queryset = Product.objects.filter(deleted_at__isnull=True)
        
        # Filtre pour les produits en rupture de stock
        low_stock = self.request.query_params.get('low_stock', None)
        if low_stock == 'true':
            queryset = queryset.filter(quantity__lte=F('alert_threshold'))
        
        return queryset

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Retourne les produits en dessous du seuil d'alerte"""
        products = self.get_queryset().filter(
            quantity__lte=F('alert_threshold')
        )
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        """Soft delete d'un produit. Retourne 200 si déjà supprimé pour que le front puisse mettre à jour la liste."""
        product = Product.objects.filter(pk=pk).first()
        if not product:
            return Response(
                {'detail': 'Produit introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        if product.deleted_at:
            return Response(
                {'status': 'Produit déjà supprimé'},
                status=status.HTTP_200_OK
            )
        product.soft_delete()
        return Response({'status': 'Produit supprimé'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restaure un produit supprimé"""
        product = Product.objects.filter(deleted_at__isnull=False).get(pk=pk)
        product.restore()
        serializer = self.get_serializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)
